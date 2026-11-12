'use strict';
/* Browser demo adapter. No shared server, external API, or credentials. */
(function(root){
const KEY='enterprise-growth-desk-demo-v1';
const STAGES={Research:.05,Qualified:.2,Discovery:.4,Proposal:.65,Negotiation:.8,Won:1,Lost:0};
const PRODUCTS=['ERP transformation','HCM transformation','Cloud migration','AI workflow pilot'];
const REGIONS=['India','Middle East','Africa','Europe','Southeast Asia'];
const CHECKS=['budget','authority','need','timeline','existing_customer'];
let questions={},memory=null,storageAvailable=true;
const clone=x=>JSON.parse(JSON.stringify(x));
const round=(n,d=2)=>Math.round((n+Number.EPSILON)*10**d)/10**d;
function day(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Date must be YYYY-MM-DD');const n=Date.parse(s+'T00:00:00Z');if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==s)throw Error('Date must be YYYY-MM-DD');return n/86400000;}
function validate(record){
 const r={...record};
 for(const k of ['name','industry','region','product','stage','decision_maker','pain','next_step','close_date','renewal_date','loss_reason']){r[k]=String(r[k]??'').trim();if(r[k].length>1000)throw Error(k+' is too long');}
 if(!r.name||r.name.length>100)throw Error('Account name is required (maximum 100 characters)');
 if(!Object.hasOwn(STAGES,r.stage)||!PRODUCTS.includes(r.product)||!REGIONS.includes(r.region))throw Error('Choose a valid stage, product and region');
 for(const k of ['value','employees']){if(typeof r[k]==='boolean')throw Error(k+' must be numeric');r[k]=Number(r[k]??0);if(!Number.isFinite(r[k])||r[k]<0||r[k]>1e9)throw Error(k+' must be between 0 and 1 billion');if(k==='employees'&&!Number.isInteger(r[k]))throw Error('Employees must be a whole number');r[k]=round(r[k]);}
 for(const k of CHECKS){if(r[k]===undefined)r[k]=false;if(typeof r[k]!=='boolean')throw Error(k+' must be true or false');}
 for(const k of ['close_date','renewal_date'])if(r[k])day(r[k]);
 const bant=CHECKS.slice(0,4).filter(k=>r[k]).length;
 if(!['Research','Lost'].includes(r.stage)&&(bant<3||!r.decision_maker||!r.next_step||!r.close_date||r.value<=0))throw Error('Qualified or later requires 3/4 BANT, decision maker, next step, close date and positive value');
 if(r.stage==='Lost'&&!r.loss_reason)throw Error('Record a reason before marking Lost');return r;
}
function enrich(record,asOf){const r={...record},at=day(asOf),bant=CHECKS.slice(0,4).filter(k=>r[k]).length;
 const reasons={'Enterprise size (500+ staff)':r.employees>=500?25:10,'Business pain documented':r.pain?25:0,'Decision maker identified':r.decision_maker?20:0,'BANT completeness':round(30*bant/4,1)};
 return {...r,score:round(Object.values(reasons).reduce((a,b)=>a+b,0),1),score_reasons:reasons,bant_count:bant,probability:STAGES[r.stage],weighted_value:round(r.value*STAGES[r.stage]),overdue:!!(r.close_date&&day(r.close_date)<at&&!['Won','Lost'].includes(r.stage)),renewal_due:!!(r.existing_customer&&r.renewal_date&&day(r.renewal_date)-at>=0&&day(r.renewal_date)-at<=90)};
}
function dashboard(records,asOf){const at=day(asOf),rows=records.map(r=>enrich(r,asOf)),open=rows.filter(r=>!['Won','Lost'].includes(r.stage)),closed=rows.filter(r=>['Won','Lost'].includes(r.stage));const sum=(a,k)=>round(a.reduce((s,r)=>s+r[k],0));return {records:rows,as_of:asOf,horizon_days:90,metrics:{open_pipeline:sum(open,'value'),weighted_forecast:sum(open.filter(r=>r.close_date&&day(r.close_date)>=at&&day(r.close_date)<=at+90),'weighted_value'),won_bookings:sum(rows.filter(r=>r.stage==='Won'),'value'),win_rate:closed.length?round(100*closed.filter(r=>r.stage==='Won').length/closed.length,1):null,overdue:rows.filter(r=>r.overdue).length,renewals_due:rows.filter(r=>r.renewal_due).length}};}
function roi(r){const vals=['hours','hourly_cost','adoption','annual_cost','implementation_cost'].map(k=>Number(r[k]));if(vals.some(x=>!Number.isFinite(x)||x<0||x>1e9)||vals[2]>100)throw Error('Use finite non-negative inputs; adoption must be 0-100%');const [hours,cost,adoption,annual,initial]=vals,benefit=hours*cost*12*adoption/100,total=annual+initial,net=benefit-total,monthly=(benefit-annual)/12;return {annual_benefit:round(benefit),year_one_cost:round(total),year_one_net:round(net),roi_percent:total?round(net/total*100,1):null,payback_months:monthly>0?round(initial/monthly,1):null};}
function playbook(r){return {label:'Rule-based discovery brief. No AI model or external research.',hypothesis:'Explore '+r.product.toLowerCase()+' for the documented pain: '+(r.pain||'Not yet captured. Validate this first.'),questions:questions[r.product],missing_qualification:CHECKS.slice(0,4).filter(k=>!r[k]),next_action:r.next_step||'Confirm business pain and the decision process before qualifying.',expansion:r.existing_customer?'Review delivery outcomes and renewal risk before proposing a new use case.':'Validate a narrow first use case before proposing account expansion.'};}
function read(){if(!storageAvailable)return clone(memory);let raw;try{raw=localStorage.getItem(KEY);}catch(e){storageAvailable=false;return clone(memory);}if(!raw)return clone(memory);let parsed;try{parsed=JSON.parse(raw);}catch(e){throw Error('Saved demo data is damaged. Use Reset my demo to start clean.');}if(!Array.isArray(parsed.records)||!parsed.activities)throw Error('Saved demo data is damaged. Use Reset my demo to start clean.');return parsed;}
function save(state){if(storageAvailable){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){throw Error('Browser storage is unavailable or full. Your change was not saved. Export or reset your demo.');}}else throw Error('Browser storage is blocked. Enable site storage to save changes.');memory=clone(state);}
const ready=async()=>{const [a,b]=await Promise.all([fetch('./seed.json'),fetch('./playbooks.json')]);if(!a.ok||!b.ok)throw Error('Demo assets failed to load');memory={records:await a.json(),activities:{}};questions=await b.json();try{localStorage.getItem(KEY);}catch(e){storageAvailable=false;}};
let initialized;
async function request(path,data){if(!initialized)initialized=ready();await initialized;const u=new URL(path,'https://demo.invalid'),p=u.pathname,state=read();
 if(p==='/api/session')return {token:'browser-local',demo_date:'2026-11-13'};
 if(p==='/api/dashboard')return dashboard(state.records,u.searchParams.get('as_of')||'2026-11-13');
 if(p==='/api/roi')return roi(data);
 if(p==='/api/accounts'&&data){const r=validate(data),id=Math.max(0,...state.records.map(r=>r.id))+1;state.records.push({...r,id,version:1});save(state);return {id};}
 const m=p.match(/^\/api\/accounts\/(\d+)(\/activities)?$/);if(m){const id=Number(m[1]),i=state.records.findIndex(r=>r.id===id);if(i<0)throw Error('Account not found');const r=state.records[i];
 if(m[2]&&data){const note=String(data.note??'').trim();if(!note||note.length>2000)throw Error('Activity must be 1-2000 characters');(state.activities[id]??=[]).unshift({id:Date.now(),note,created_at:new Date().toISOString()});save(state);return {ok:true};}
 if(data){if(Number(data.version)!==r.version)throw Error('Account changed or no longer exists. Refresh before saving.');state.records[i]={...validate(data),id,version:r.version+1};save(state);return {id};}
 return {record:clone(r),brief:playbook(r),activities:clone(state.activities[id]||[])};}
 throw Error('Unknown demo action');
}
function safeCSV(v){let s=String(v??'');if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
async function download(kind,asOf){try{const data=await request('/api/dashboard?as_of='+encodeURIComponent(asOf)),state=read();data.activities=state.activities;const fields=['name','industry','region','product','stage','value','probability','weighted_value','score','bant_count','close_date','renewal_date','overdue','next_step'];const text=kind==='json'?JSON.stringify(data,null,2):[fields.join(','),...data.records.map(r=>fields.map(k=>safeCSV(r[k])).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:kind==='json'?'application/json':'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=kind==='json'?'growth-desk-snapshot.json':'demo-pipeline-INR.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){document.querySelector('#notice').textContent=e.message;}}
function reset(){try{localStorage.removeItem(KEY);}catch(e){}memory=null;}
root.DemoAPI={request,download,reset,validate,enrich,dashboard,roi,playbook,STAGES};
})(typeof window!=='undefined'?window:globalThis);
