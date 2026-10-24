const {chromium}=require(process.env.CAREER_PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CAREER_CHROME_PATH});const evidence=[];
for(const [language,width] of [['en',1440],['zh-CN',390],['ms',820]]){
 const context=await browser.newContext({viewport:{width,height:950},locale:language==='zh-CN'?'zh-CN':language});const page=await context.newPage();page.setDefaultTimeout(10000);console.log('BEGIN',language,width);const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))failed.push([r.status(),r.url()])});
 await page.addInitScript(l=>localStorage.setItem('career-language',l),language);
 await page.goto((process.env.CAREER_BASE_URL||'http://127.0.0.1:4183')+'/?intro=off');await page.waitForSelector('.production-hero');await page.screenshot({path:`/tmp/career-home-${language}.png`,fullPage:true});
 await page.locator('.production-hero [data-action="start"]').click();await page.waitForSelector('.starting-intro');await page.locator('[data-combined-action="starting-next"]').click();
 let intakeCount=0;
 while(await page.locator('#starting-point-form').count()){
  console.log('INTAKE',language,intakeCount);if(++intakeCount>15)throw Error('INTAKE_LOOP');
  const inputs=await page.locator('#starting-point-form input[type="radio"]').evaluateAll(els=>[...new Set(els.map(el=>el.name))]);
  for(const name of inputs){const options=page.locator(`#starting-point-form input[name="${name}"]`);await options.nth(name==='Q01'?1:name.startsWith('Q05')?2:0).check();}
  if(await page.locator('#starting-point-form input[type="checkbox"]').count())await page.locator('#starting-point-form input[type="checkbox"]').first().check();
  await page.locator('#starting-point-form button[type="submit"]').click();
 }
 await page.locator('[data-combined-action="starting-continue"]').click();await page.locator('[data-track="SW"]').click();
 for(let i=0;i<12;i++){console.log('DIRECTION',language,i);
  await page.waitForSelector('[name="v3-behavior"]');const checkboxes=page.locator('[name="v3-behavior"]');await checkboxes.nth(0).check();await page.locator('[name="v3-behavior"]').nth(1).check();
  if(i===0){await page.reload();await page.waitForSelector('[name="v3-behavior"]');const selected=await page.locator('[name="v3-behavior"]:checked').count();if(selected!==2)throw Error('DRAFT_NOT_RESTORED');}
  if(i===4)await page.screenshot({path:`/tmp/career-question-${language}.png`,fullPage:true});
  await page.locator('[data-v3-action="next"]').click();
 }
 await page.waitForSelector('.release-summary');await page.screenshot({path:`/tmp/career-report-${language}.png`,fullPage:true});
 let overflow=[];const checkOverflow=async label=>{const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));if(dimensions.scroll>dimensions.width+2)overflow.push([label,dimensions]);};await checkOverflow('profile');
 const pages=[];for(const id of ['capability','galaxy','whatif','impact']){console.log('PAGE',language,id);await page.locator(`[data-combined-action="page:${id}"]`).first().click();await page.waitForSelector('[data-compatible-analysis]');await checkOverflow(id);pages.push(id);if(id==='galaxy'){
   await page.locator('[data-combined-action="map-select:B"]').first().click();await page.locator('[data-combined-action="section:compare"]').click();await page.locator('[data-combined-action="section:skills"]').click();await page.waitForSelector('.dna-workspace');await checkOverflow('dna');await page.screenshot({path:`/tmp/career-dna-${language}.png`,fullPage:true});
  }if(id==='whatif'){
   const before=await page.locator('.an-timeline').innerText();await page.locator('[data-v2-control="planHours"]').fill('1');await page.locator('[data-v2-control="planHours"]').dispatchEvent('change');const after=await page.locator('.an-timeline').innerText();if(before===after)throw Error('WHATIF_NOT_UPDATED');await page.reload();await page.waitForSelector('[data-v2-control="planHours"]');if(await page.locator('[data-v2-control="planHours"]').inputValue()!=='1')throw Error('SCENARIO_NOT_RESTORED');await page.screenshot({path:`/tmp/career-whatif-${language}.png`,fullPage:true});
  }}
 await page.goBack();await page.waitForSelector('[data-rebuild="whatif"]');
 evidence.push({language,width,intakeCount,directionAnswers:12,pages:['profile',...pages],errors,failed,overflow,history:'returned to whatif',scenarioRestored:true});await context.close();
}
fs.writeFileSync('/tmp/career-browser-evidence.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));await browser.close();})();
