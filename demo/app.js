'use strict';
let token = '', records = [], activeId = null;
const $ = s => document.querySelector(s);
const money = n => '₹' + Number(n).toLocaleString('en-IN', {maximumFractionDigits:0});
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notice(text, error=false) { $('#notice').textContent=text; $('#notice').classList.toggle('error',error); }
async function api(path, data) {
  if(window.DemoAPI) return window.DemoAPI.request(path,data);
  const response=await fetch(path, data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-Session-Token':token},body:JSON.stringify(data)});
  const body=await response.json(); if(!response.ok) throw Error(body.error||'Request failed'); return body;
}
async function load() {
  const data=await api('/api/dashboard?as_of='+encodeURIComponent($('#as-of').value)); records=data.records;
  const m=data.metrics;
  $('#metrics').innerHTML=[['Open pipeline',money(m.open_pipeline)],['90-day weighted forecast',money(m.weighted_forecast)],['Won bookings · all demo deals',money(m.won_bookings)],['Closed-deal win rate',m.win_rate===null?'No closed deals':m.win_rate+'%']].map(([label,n])=>`<div class="metric"><div class="label">${label}</div><div class="number">${n}</div></div>`).join('');
  renderAccounts();
}
function renderAccounts(){
 const search=$('#search').value.toLowerCase(),region=$('#region-filter').value,focus=$('#focus-filter').value;
 const rows=records.filter(r=>(!search||[r.name,r.industry,r.pain].join(' ').toLowerCase().includes(search))&&(!region||r.region===region)&&(!focus||focus==='open'&&!['Won','Lost'].includes(r.stage)||focus==='renewal'&&r.renewal_due||focus==='overdue'&&r.overdue||focus==='existing'&&r.existing_customer)).sort((a,b)=>b.score-a.score||a.id-b.id);
 $('#accounts').innerHTML=rows.length?rows.map(r=>`<article class="account"><div class="account-top"><div><span class="pill ${['Won','Lost'].includes(r.stage)?'neutral':''}">${escapeHTML(r.stage)}</span><h3>${escapeHTML(r.name)}</h3><div class="meta">${escapeHTML(r.industry)} · ${escapeHTML(r.region)}</div></div><div class="score"><strong>${r.score}</strong>fit / 100</div></div><div class="deal-line"><div><div class="meta">${escapeHTML(r.product)}</div><strong>${money(r.value)}</strong></div><div><div class="meta">BANT ${r.bant_count}/4</div><span>Close ${escapeHTML(r.close_date||'not set')}</span></div></div><div class="health">${r.existing_customer?'<span class="pill neutral">Existing customer</span>':''}${r.renewal_due?'<span class="flag">Renewal due within 90 days</span>':''}${r.overdue?'<span class="flag">Close date overdue</span>':''}</div><p>${escapeHTML(r.pain||'Business pain not yet documented.')}</p><details><summary>Why this fit score?</summary>${Object.entries(r.score_reasons).map(([label,value])=>`<div>${escapeHTML(label)}: ${value}</div>`).join('')}</details><button data-edit="${r.id}">Open account & next step</button></article>`).join(''):'<div class="empty">No accounts match these filters. Clear search or choose another focus.</div>';
 document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openAccount(Number(b.dataset.edit)).catch(e=>notice(e.message,true))));
}
const formFields=['name','industry','region','product','employees','value','stage','close_date','decision_maker','renewal_date','pain','next_step','loss_reason','id','version'];
const checkFields=['budget','authority','need','timeline','existing_customer'];
async function openAccount(id=null){
 activeId=id;$('#account-form').reset();$('#form-error').textContent='';$('#account-extra').hidden=!id;
 const data=id?await api('/api/accounts/'+id):{record:{name:'',industry:'',region:'India',product:'ERP transformation',employees:0,value:0,stage:'Research'}};
 const r=data.record; for(const key of formFields)$('#account-form').elements[key].value=r[key]??'';
 for(const key of checkFields)$('#account-form').elements[key].checked=!!r[key];
 $('#dialog-title').textContent=id?r.name:'New demo opportunity';
 if(id)renderExtra(data);
 if(!$('#account-dialog').open)$('#account-dialog').showModal();
}
function renderExtra(data){
 const b=data.brief;
 $('#brief').innerHTML=`<h3>Discovery & expansion brief</h3><p class="brief-label">${escapeHTML(b.label)}</p><p>${escapeHTML(b.hypothesis)}</p><ul>${b.questions.map(q=>'<li>'+escapeHTML(q)+'</li>').join('')}</ul><p><strong>Missing BANT:</strong> ${escapeHTML(b.missing_qualification.join(', ')||'All four captured in scenario')}</p><p><strong>Next action:</strong> ${escapeHTML(b.next_action)}</p><p>${escapeHTML(b.expansion)}</p>`;
 $('#activities').innerHTML=data.activities.length?data.activities.map(a=>`<div class="activity"><time>${escapeHTML(new Date(a.created_at).toLocaleString())}</time>${escapeHTML(a.note)}</div>`).join(''):'<p class="caption">No activity recorded. Add a fictional discovery or delivery note.</p>';
}
$('#account-form').addEventListener('submit',async e=>{
 e.preventDefault();const body={};for(const key of formFields)body[key]=e.target.elements[key].value;
 body.value=Number(body.value);body.employees=Number(body.employees);body.version=Number(body.version);for(const key of checkFields)body[key]=e.target.elements[key].checked;
 const button=e.target.querySelector('button[type=submit],button.primary');button.disabled=true;
 try{const result=await api('/api/accounts'+(activeId?'/'+activeId:''),body);await load();await openAccount(result.id);notice('Demo opportunity saved in this browser only.');}
 catch(err){$('#form-error').textContent=err.message;}finally{button.disabled=false;}
});
$('#activity-form').addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/accounts/'+activeId+'/activities',{note:$('#activity-note').value});$('#activity-note').value='';renderExtra(await api('/api/accounts/'+activeId));notice('Activity saved.');}catch(err){notice(err.message,true);}});
$('#new-account').addEventListener('click',()=>openAccount().catch(e=>notice(e.message,true)));
$('#close-dialog').addEventListener('click',()=>$('#account-dialog').close());
$('#as-of').addEventListener('change',()=>load().catch(e=>notice(e.message,true)));
for(const id of ['search','region-filter','focus-filter'])$('#'+id).addEventListener(id==='search'?'input':'change',renderAccounts);
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>{document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-current',x===b?'page':'false');});for(const v of ['pipeline','case','guide'])$('#'+v+'-view').hidden=v!==b.dataset.view;});
$('#export').addEventListener('click',()=>{window.DemoAPI.download('csv',$('#as-of').value);});
$('#backup').addEventListener('click',()=>{window.DemoAPI.download('json',$('#as-of').value);});
async function calculate(){const body=Object.fromEntries(new FormData($('#roi-form')));for(const k in body)body[k]=Number(body[k]);const r=await api('/api/roi',body);$('#roi-result').innerHTML='<h3>Illustrative first-year economics</h3>'+[['Annual capacity value',money(r.annual_benefit)],['Year-one total cost',money(r.year_one_cost)],['Year-one net value',money(r.year_one_net)],['Year-one ROI',r.roi_percent===null?'Not defined (zero cost)':r.roi_percent+'%'],['Simple payback',r.payback_months===null?'No payback at this run rate':r.payback_months+' months']].map(([l,v])=>`<div class="result-row"><span>${l}</span><strong>${v}</strong></div>`).join('')+'<p class="caption">Simple, undiscounted estimate. Excludes taxes, financing, risk and benefits ramp. Payback = implementation cost ÷ monthly benefit after recurring cost.</p>';}
$('#roi-form').addEventListener('submit',e=>{e.preventDefault();calculate().catch(err=>notice(err.message,true));});
(async()=>{try{const s=await api('/api/session');token=s.token;await load();await calculate();}catch(e){notice('Could not load local app: '+e.message,true);}})();

$('#reset-demo').addEventListener('click',()=>{if(confirm('Reset only this browser to the fictional starter data? Your edits and notes will be removed.')) {window.DemoAPI.reset(); location.reload();}});
