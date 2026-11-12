// Optional developer UI checks. See docs/TEST_REPORT.md for setup.
// Run while a test instance of app.py is listening at port 8766.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const shots=process.env.SCREENSHOT_DIR||path.join(process.cwd(),'artifacts');fs.mkdirSync(shots,{recursive:true});
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:1000}});
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
 assert.deepEqual(errors,[]);
 await browser.close();console.log('UI checks passed: filters, empty states, three responsive widths, all three views, persisted edit, activity, Escape, qualification guard, escaped text, new record, ROI and CSV/JSON downloads.');
})().catch(e=>{console.error(e);process.exit(1)});
