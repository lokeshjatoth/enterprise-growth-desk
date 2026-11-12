// Browser-demo regression checks. Run against a static server hosting demo/.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const shots=process.env.SCREENSHOT_DIR||path.join(process.cwd(),'artifacts');fs.mkdirSync(shots,{recursive:true});
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:1000}});const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:8766');await page.waitForSelector('.account');
 assert.equal(await page.locator('.account').count(),8);
 await page.locator('#search').fill('no such account');assert.equal(await page.locator('.account').count(),0);assert.match(await page.locator('.empty').textContent(),/No accounts/);
 await page.locator('#search').fill('');await page.locator('#region-filter').selectOption('India');assert.equal(await page.locator('.account').count(),4);
 await page.locator('#region-filter').selectOption('');await page.locator('#focus-filter').selectOption('overdue');assert.equal(await page.locator('.account').count(),1);
 await page.locator('#focus-filter').selectOption('renewal');assert.equal(await page.locator('.account').count(),2);
 await page.locator('#focus-filter').selectOption('');
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:1000});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Pipeline overflow '+width);
  await page.screenshot({path:path.join(shots,'egd-pipeline-'+width+'.png'),fullPage:true});
  await page.locator('[data-view=case]').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Business case overflow '+width);
  await page.screenshot({path:path.join(shots,'egd-case-'+width+'.png'),fullPage:true});
  await page.locator('[data-view=guide]').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Guide overflow '+width);
  await page.screenshot({path:path.join(shots,'egd-guide-'+width+'.png'),fullPage:true});
  await page.locator('[data-view=pipeline]').click();
 }
 await page.setViewportSize({width:1280,height:1000});
 await page.locator('[data-edit="1"]').click();await page.waitForSelector('dialog[open]');
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:1000});
  await page.locator('dialog').evaluate(el=>el.scrollTop=0);
  assert.equal(await page.locator('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth),true,'Dialog overflow '+width);
  await page.screenshot({path:path.join(shots,'egd-dialog-top-'+width+'.png')});
  await page.locator('dialog').evaluate(el=>el.scrollTop=el.scrollHeight);
  await page.screenshot({path:path.join(shots,'egd-dialog-bottom-'+width+'.png')});
 }
 await page.setViewportSize({width:1280,height:1000});
 await page.locator('[name="next_step"]').fill('Demo: validate baseline with finance on 18 November.');
 await page.locator('#account-form .primary').click();await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('saved'));
 await page.locator('#activity-note').fill('Fictional workshop: data access and baseline still need validation.');
 await page.locator('#activity-form button').click();await page.waitForSelector('.activity');
 assert.match(await page.locator('.activity').textContent(),/Fictional workshop/);
 await page.screenshot({path:path.join(shots,'egd-account-1280.png'),fullPage:true});
 await page.locator('#close-dialog').click();await page.reload();await page.waitForSelector('.account');
 await page.locator('[data-edit="1"]').click();await page.waitForSelector('dialog[open]');assert.match(await page.locator('[name="next_step"]').inputValue(),/18 November/);assert.equal(await page.locator('.activity').count(),1);
 await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
 await page.locator('#new-account').click();
 await page.locator('[name="name"]').fill('<script>alert("xss")</script> Demo');await page.locator('[name="industry"]').fill('Testing');await page.locator('[name="stage"]').selectOption('Qualified');
 await page.locator('#account-form .primary').click();await page.waitForFunction(()=>document.querySelector('#form-error').textContent.includes('BANT'));
 await page.locator('[name="stage"]').selectOption('Research');await page.locator('#account-form .primary').click();await page.waitForFunction(()=>document.querySelector('#dialog-title').textContent.includes('<script>'));
 await page.locator('#close-dialog').click();assert.equal(await page.locator('.account').count(),9);
 await page.locator('[data-view=case]').click();assert.match(await page.locator('#roi-result').textContent(),/92%/);
 await page.locator('[name=adoption]').fill('0');await page.locator('#roi-form button').click();await page.waitForFunction(()=>document.querySelector('#roi-result').textContent.includes('No payback'));
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-view=pipeline]').click().then(()=>page.locator('#export').click())]);
 assert.equal(download.suggestedFilename(),'demo-pipeline-INR.csv');
 const [snapshot]=await Promise.all([page.waitForEvent('download'),page.locator('#backup').click()]);assert.match(snapshot.suggestedFilename(),/snapshot.json/);
 // A second visitor starts clean; edits never reach a shared database.
 const other=await browser.newContext();const visitor=await other.newPage();
 await visitor.goto(process.env.BASE_URL);await visitor.waitForSelector('.account');assert.equal(await visitor.locator('.account').count(),8);
 await page.reload();await page.waitForSelector('.account');assert.equal(await page.locator('.account').count(),9);
 // Stale saves from another tab in the same browser must be rejected.
 const tab=await page.context().newPage();await tab.goto(process.env.BASE_URL);await tab.waitForSelector('.account');
 const stale=await tab.evaluate(()=>DemoAPI.request('/api/accounts/1'));
 await page.evaluate(async()=>{const d=await DemoAPI.request('/api/accounts/1');await DemoAPI.request('/api/accounts/1',{...d.record,next_step:'Updated in another tab'});});
 const err=await tab.evaluate(async r=>{try{await DemoAPI.request('/api/accounts/1',r);return '';}catch(e){return e.message;}},stale.record);assert.match(err,/changed/);
 await other.close();await tab.close();
 page.on('dialog',d=>d.accept());await page.locator('#reset-demo').click();await page.waitForSelector('.account');assert.equal(await page.locator('.account').count(),8);
 assert.deepEqual(errors,[]);
 await browser.close();console.log('UI checks passed: filters, empty states, three responsive widths, all three views, persisted edit, activity, Escape, qualification guard, escaped text, new record, ROI and CSV/JSON downloads.');
})().catch(e=>{console.error(e);process.exit(1)});
