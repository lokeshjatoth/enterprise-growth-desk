import copy
from datetime import date
from http.client import HTTPConnection
import json
from pathlib import Path
import sys
import tempfile
import threading
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from logic import validate, dashboard, roi, enrich, playbook
from seed import demo_records
from app import Store, Handler, safe_csv, ThreadingHTTPServer

class LogicTests(unittest.TestCase):
    def setUp(self):self.rows=demo_records()
    def test_all_seed_records_valid(self):
        for r in self.rows:validate(r)
    def test_dashboard_known_totals(self):
        m=dashboard(self.rows,date(2026,11,13))['metrics']
        self.assertEqual(m['open_pipeline'],16500000)
        self.assertEqual(m['weighted_forecast'],8690000)
        self.assertEqual(m['won_bookings'],2400000)
        self.assertEqual(m['win_rate'],50)
        self.assertEqual(m['overdue'],1)
        self.assertEqual(m['renewals_due'],2)
    def test_empty_dashboard(self):
        m=dashboard([],date(2026,11,13))['metrics']
        self.assertIsNone(m['win_rate']);self.assertEqual(m['weighted_forecast'],0)
    def test_qualification_guard(self):
        r=self.rows[3];r['stage']='Qualified'
        with self.assertRaisesRegex(ValueError,'BANT'):validate(r)
    def test_lost_requires_reason(self):
        r=self.rows[0];r['stage']='Lost'
        with self.assertRaisesRegex(ValueError,'reason'):validate(r)
    def test_nan_negative_and_invalid_date(self):
        for field,value in [('value',float('nan')),('value',-1),('employees',1.5),('close_date','2026-02-30'),('stage','Made up'),('budget','yes')]:
            r=copy.deepcopy(self.rows[0]);r[field]=value
            with self.subTest(field=field,value=value):
                with self.assertRaises(ValueError):validate(r)
    def test_score_reasons_add_up(self):
        for row in self.rows:
            r=enrich(row,date(2026,11,13));self.assertEqual(r['score'],sum(r['score_reasons'].values()))
    def test_renewal_boundary(self):
        r=self.rows[1];r['renewal_date']='2026-11-13'
        self.assertTrue(enrich(r,date(2026,11,13))['renewal_due'])
        self.assertFalse(enrich(r,date(2026,11,14))['renewal_due'])
    def test_roi_known_case(self):
        r=roi(800,600,50,600000,900000)
        self.assertEqual(r,{'annual_benefit':2880000,'year_one_cost':1500000,'year_one_net':1380000,'roi_percent':92,'payback_months':4.7})
    def test_roi_zero_and_no_payback(self):
        self.assertIsNone(roi(0,0,0,0,0)['roi_percent'])
        self.assertIsNone(roi(0,0,0,1,1)['payback_months'])
        with self.assertRaises(ValueError):roi(1,1,101,1,1)
    def test_brief_is_not_ai_claim(self):
        self.assertIn('No AI model',playbook(self.rows[0])['label'])
    def test_csv_formula_protection(self):
        self.assertEqual(safe_csv('=1+1'),"'=1+1")
        self.assertEqual(safe_csv('  @test'),"'  @test")
        self.assertEqual(safe_csv('Normal'),'Normal')

class StoreTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.path=Path(self.tmp.name)/'test.sqlite3';self.store=Store(self.path)
    def tearDown(self):self.tmp.cleanup()
    def test_seed_once_and_persistence(self):
        self.assertEqual(len(Store(self.path).records()),8)
        r=self.store.records()[0];r['next_step']='Updated demo step';self.store.save(r,r['id'])
        self.assertEqual(Store(self.path).records()[0]['next_step'],'Updated demo step')
    def test_stale_write_rejected(self):
        r=self.store.records()[0];self.store.save(r,r['id'])
        with self.assertRaisesRegex(ValueError,'Refresh'):self.store.save(r,r['id'])
    def test_activity_persistence(self):
        self.store.add_activity(1,'Demo workshop completed')
        self.assertEqual(Store(self.path).activities(1)[0]['note'],'Demo workshop completed')
        with self.assertRaises(ValueError):self.store.add_activity(999,'No account')
    def test_insert(self):
        id=self.store.save(demo_records()[3]);self.assertEqual(id,9)
        self.assertEqual(len(self.store.records()),9)

class APITests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory();cls.server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        cls.server.store=Store(Path(cls.tmp.name)/'api.sqlite3');cls.server.token='test-token'
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.thread.join();cls.tmp.cleanup()
    def request(self,path,body=None,token='test-token',origin=None):
        c=HTTPConnection('127.0.0.1',self.server.server_port)
        headers={'Content-Type':'application/json','X-Session-Token':token}
        if origin:headers['Origin']=origin
        c.request('GET' if body is None else 'POST',path,None if body is None else json.dumps(body),headers)
        r=c.getresponse();data=r.read();c.close();return r.status,data
    def test_dashboard_endpoint(self):
        status,data=self.request('/api/dashboard?as_of=2026-11-13');self.assertEqual(status,200);self.assertEqual(len(json.loads(data)['records']),8)
    def test_bad_date_rejected(self):self.assertEqual(self.request('/api/dashboard?as_of=bad')[0],400)
    def test_missing_token_and_cross_origin_blocked(self):
        self.assertEqual(self.request('/api/roi',{},token='')[0],403)
        self.assertEqual(self.request('/api/roi',{},origin='https://example.invalid')[0],403)
    def test_malformed_and_unknown_requests(self):
        self.assertEqual(self.request('/api/roi',{'unexpected':1})[0],400)
        self.assertEqual(self.request('/missing')[0],404)
        self.assertEqual(self.request('/api/accounts/999')[0],404)
    def test_unexpected_host_rejected(self):
        c=HTTPConnection('127.0.0.1',self.server.server_port)
        c.request('GET','/api/session',headers={'Host':'rebound.invalid'})
        r=c.getresponse();self.assertEqual(r.status,403);r.read();c.close()
    def test_exports(self):
        self.assertIn(b'weighted_value',self.request('/api/export.csv')[1])
        self.assertIn('activities',json.loads(self.request('/api/backup.json')[1]))

if __name__=='__main__':unittest.main(verbosity=2)
