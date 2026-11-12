// Browser-model parity and guardrails. Node built-ins only.
const assert=require('node:assert/strict'),fs=require('node:fs');
require('../demo/demo-api.js');const api=globalThis.DemoAPI;
const seed=JSON.parse(fs.readFileSync(__dirname+'/../demo/seed.json'));
const expected=JSON.parse(fs.readFileSync(__dirname+'/demo_expected.json'));
assert.deepEqual(api.dashboard(seed,'2026-11-13'),expected.dashboard);
assert.deepEqual(api.roi(expected.roi_inputs),expected.roi);
assert.throws(()=>api.validate({...seed[0],budget:false,authority:false}),/BANT/);
assert.throws(()=>api.validate({...seed[0],stage:'Lost',loss_reason:''}),/reason/);
assert.throws(()=>api.validate({...seed[0],close_date:'2026-02-30'}),/Date/);
assert.throws(()=>api.validate({...seed[0],value:Infinity}),/between/);
assert.throws(()=>api.validate({...seed[0],employees:1.5}),/whole/);
assert.throws(()=>api.roi({...expected.roi_inputs,adoption:101}),/0-100/);
assert.equal(api.roi({...expected.roi_inputs,adoption:0}).payback_months,null);
assert.equal(api.dashboard([],'2026-11-13').metrics.win_rate,null);
console.log('Browser model: Python parity + qualification, date, numeric, loss and ROI guardrails passed.');
