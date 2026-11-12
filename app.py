#!/usr/bin/env python3
"""Local-only portfolio app. Python 3.10+, no dependencies, no external calls."""
import argparse
import csv
from datetime import date, datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import io
import json
from pathlib import Path
import secrets
import sqlite3
from urllib.parse import urlparse, parse_qs
from logic import validate, dashboard, playbook, roi
from seed import demo_records, DEMO_DATE

ROOT = Path(__file__).resolve().parent

class Store:
    def __init__(self, path):
        self.path = str(path)
        with self.connect() as c:
            c.execute('CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY, data TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1)')
            c.execute('CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL REFERENCES accounts(id), note TEXT NOT NULL, created_at TEXT NOT NULL)')
            c.execute('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
            if not c.execute("SELECT 1 FROM meta WHERE key='initialized'").fetchone():
                for r in demo_records():
                    c.execute('INSERT INTO accounts(data) VALUES(?)', (json.dumps(validate(r)),))
                c.execute("INSERT INTO meta VALUES('initialized','yes')")
    def connect(self):
        c = sqlite3.connect(self.path)
        c.execute('PRAGMA foreign_keys=ON')
        return c
    def records(self):
        with self.connect() as c:
            return [dict(json.loads(data), id=id, version=version) for id,data,version in c.execute('SELECT id,data,version FROM accounts ORDER BY id')]
    def save(self, r, id=None):
        clean = validate(r)
        with self.connect() as c:
            if id is None:
                cursor=c.execute('INSERT INTO accounts(data) VALUES(?)', (json.dumps(clean),))
                return cursor.lastrowid
            cursor=c.execute('UPDATE accounts SET data=?, version=version+1 WHERE id=? AND version=?', (json.dumps(clean),id,r.get('version')))
            if cursor.rowcount != 1:
                raise ValueError('Account changed or no longer exists. Refresh before saving.')
            return id
    def activities(self, id):
        with self.connect() as c:
            return [dict(id=i,note=n,created_at=t) for i,n,t in c.execute('SELECT id,note,created_at FROM activities WHERE account_id=? ORDER BY id DESC',(id,))]
    def add_activity(self,id,note):
        note=str(note).strip()
        if not note or len(note)>2000:
            raise ValueError('Activity must be 1-2000 characters')
        with self.connect() as c:
            if not c.execute('SELECT 1 FROM accounts WHERE id=?',(id,)).fetchone():
                raise ValueError('Account not found')
            c.execute('INSERT INTO activities(account_id,note,created_at) VALUES(?,?,?)',(id,note,datetime.now(timezone.utc).isoformat()))

def safe_csv(value):
    s=str(value)
    return "'"+s if s.lstrip().startswith(('=','+','-','@','\t','\r')) else s

class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args):
        pass
    def send(self,code,body,content_type='application/json',extra=None):
        if not isinstance(body,bytes):
            body=json.dumps(body,allow_nan=False).encode()
        self.send_response(code)
        self.send_header('Content-Type',content_type)
        self.send_header('Content-Length',str(len(body)))
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        self.send_header('Cache-Control','no-store')
        for k,v in (extra or {}).items(): self.send_header(k,v)
        self.end_headers(); self.wfile.write(body)
    def valid_host(self):
        return self.headers.get('Host') in [f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}']
    def do_GET(self):
        if not self.valid_host():
            return self.send(403,{'error':'Local host only'})
        try:
            u=urlparse(self.path); q=parse_qs(u.query); p=u.path
            if p=='/api/session':
                return self.send(200,dict(token=self.server.token,demo_date=DEMO_DATE))
            if p in ['/api/dashboard','/api/export.csv','/api/backup.json']:
                as_of=date.fromisoformat(q.get('as_of',[DEMO_DATE])[0])
                data=dashboard(self.server.store.records(),as_of)
                if p=='/api/dashboard': return self.send(200,data)
                if p=='/api/backup.json':
                    # Export only, no import capability is implied.
                    data['activities']={str(r['id']): self.server.store.activities(r['id']) for r in data['records']}
                    return self.send(200,data,extra={'Content-Disposition':'attachment; filename="growth-desk-snapshot.json"'})
                out=io.StringIO(); writer=csv.writer(out)
                fields=['name','industry','region','product','stage','value','probability','weighted_value','score','bant_count','close_date','renewal_date','overdue','next_step']
                writer.writerow(fields)
                for r in data['records']:writer.writerow([safe_csv(r[k]) for k in fields])
                return self.send(200,out.getvalue().encode(),'text/csv; charset=utf-8',{'Content-Disposition':'attachment; filename="demo-pipeline-INR.csv"'})
            if p.startswith('/api/accounts/'):
                id=int(p.split('/')[3]); records=self.server.store.records()
                r=next((r for r in records if r['id']==id),None)
                if not r:return self.send(404,{'error':'Account not found'})
                return self.send(200,{'record':r,'brief':playbook(r),'activities':self.server.store.activities(id)})
            static={'/':'index.html','/app.js':'app.js','/style.css':'style.css'}
            if p not in static:return self.send(404,{'error':'Not found'})
            f=ROOT/'web'/static[p]
            return self.send(200,f.read_bytes(),{'html':'text/html; charset=utf-8','js':'text/javascript; charset=utf-8','css':'text/css; charset=utf-8'}[f.suffix[1:]])
        except (ValueError,KeyError,TypeError) as e:self.send(400,{'error':str(e)})
    def do_POST(self):
        if not self.valid_host():
            return self.send(403,{'error':'Local host only'})
        # Local session token + same-origin checks block drive-by browser writes.
        origin=self.headers.get('Origin')
        expected='http://'+self.headers.get('Host','')
        if self.headers.get('X-Session-Token')!=self.server.token or (origin and origin!=expected):
            return self.send(403,{'error':'Session check failed; refresh the page'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=32000: raise ValueError('Request size must be 1-32000 bytes')
            if self.headers.get('Content-Type','').split(';')[0]!='application/json':raise ValueError('JSON required')
            body=json.loads(self.rfile.read(length)); p=urlparse(self.path).path
            if not isinstance(body,dict):raise ValueError('JSON object required')
            if p=='/api/roi':return self.send(200,roi(**body))
            if p=='/api/accounts':return self.send(201,{'id':self.server.store.save(body)})
            parts=p.split('/')
            if len(parts)>=4 and parts[1:3]==['api','accounts']:
                id=int(parts[3])
                if len(parts)==5 and parts[4]=='activities':
                    self.server.store.add_activity(id,body.get('note',''))
                    return self.send(201,{'saved':True})
                if len(parts)==4:return self.send(200,{'id':self.server.store.save(body,id)})
            return self.send(404,{'error':'Not found'})
        except (ValueError,TypeError,KeyError,OverflowError) as e:self.send(400,{'error':str(e)})

def serve(port=8765,db=None):
    server=ThreadingHTTPServer(('127.0.0.1',port),Handler)
    server.token=secrets.token_urlsafe(32)
    server.store=Store(db or ROOT/'growth-desk.sqlite3')
    print(f'Enterprise Growth Desk: http://127.0.0.1:{server.server_port}',flush=True)
    print('Demo records only. Local machine only. Ctrl+C stops the server.',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8765);parser.add_argument('--db')
    args=parser.parse_args();serve(args.port,args.db)
