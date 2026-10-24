const {chromium}=require(process.env.CAREER_PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),{pathToFileURL}=require('url'),{resolve}=require('path');
(async()=>{
const {personaInputs}=await import(pathToFileURL(resolve(__dirname,'../prototype/emergency-personas.mjs')).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.CAREER_CHROME_PATH});const evidence=[];
try{for(const [language,width] of [['en',1440],['zh-CN',390],['ms',820]])for(const [id,c] of Object.entries(personaInputs)){
 const context=await browser.newContext({viewport:{width,height:950},locale:language});const page=await context.newPage();page.setDefaultTimeout(10000);console.log('BEGIN',language,width,id);const errors=[],failed=[],overflow=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))failed.push([r.status(),r.url()])});
 await page.addInitScript(l=>localStorage.setItem('career-language',l),language);
 await page.goto((process.env.CAREER_BASE_URL||'http://127.0.0.1:4183')+'/?intro=off');await page.locator('.production-hero [data-action="start"]').click();await page.locator('[data-combined-action="starting-next"]').click();
 let intakeCount=0;
 while(await page.locator('#starting-point-form').count()){
  if(++intakeCount>16)throw Error('INTAKE_LOOP');
  const q=await page.locator('[data-starting-question]').getAttribute('data-starting-question');
  const value=c[q]||({Q03:'B',Q09:{selected:['A','B'],primary:'A'}})[q];
  if(q==='Q05'){
   const names=await page.locator('#starting-point-form input').evaluateAll(els=>[...new Set(els.map(el=>el.name))]);
   for(const name of names)await page.locator(`input[name="${name}"][value="${c.matrix}"]`).check();
  }else if(q==='Q14'){}else if(Array.isArray(value))for(const option of value)await page.locator(`input[name="${q}"][value="${option}"]`).check();
  else if(value&&typeof value==='object'){
   for(const option of value.selected)await page.locator(`input[name="${q}"][value="${option}"]`).check();
   await page.locator(`[name="${q}.primary"]`).selectOption(value.primary);
  }else await page.locator(`#starting-point-form input${value?`[value="${value}"]`:''}`).first().check();
  if(q==='Q04'){await page.reload();await page.waitForSelector('[data-starting-question="Q04"]');if(await page.locator('input:checked').count()!==c.Q04.length)throw Error('INTAKE_NOT_RESTORED');}
  await page.locator('#starting-point-form button[type="submit"]').click();
 }
 await page.locator('[data-combined-action="starting-continue"]').click();await page.locator(`[data-track="${c.track||'SW'}"]`).click();
 for(let i=0;i<12;i++){
  const radio=page.locator('[name="v3-answer"]');if(await radio.count()!==7)throw Error('NOT_SEVEN_CIRCLES');
  const q=await page.locator('[data-question-id]').getAttribute('data-question-id');
  // Read current question ID from native field data; fall back to ordered current bank.
  const keys=['G01','G02','G03','G04',...Array.from({length:8},(_,n)=>(c.track||'SW')+String(n+1).padStart(2,'0'))],score=c.answers?.[q||keys[i]]??c.scale;
  await radio.nth(score===1?6:0).check();await page.locator(`[name="v3-answer"][value="${score}"]`).check();
  if(await page.locator('[name="v3-answer"]:checked').count()!==1)throw Error('MULTIPLE_DIRECTION_VALUES');
  if(i===0){await page.reload();await page.waitForSelector('[name="v3-answer"]');if(await page.locator('[name="v3-answer"]:checked').inputValue()!==String(score))throw Error('DIRECTION_NOT_RESTORED');}
  if(i===4&&id==='freshman'){await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`/tmp/career-question-${language}.png`,fullPage:true});}
  await page.locator('[data-v3-action="next"]').click();
 }
 await page.waitForSelector('.release-summary');await page.waitForLoadState('networkidle');
 const checkOverflow=async label=>{const d=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));if(d.scroll>d.width+2)overflow.push([label,d]);};
 await checkOverflow('profile');const profile=await page.locator('.personal-decision').innerText();if(id==='freshman'){await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`/tmp/career-report-${language}.png`,fullPage:true});}
 for(const key of ['capability','galaxy','whatif','impact']){
  await page.locator(`[data-combined-action="page:${key}"]`).first().click();await checkOverflow(key);
  if(key==='capability'){
   await page.locator('[data-combined-action="ai-focus:usage"]').click();const before=await page.locator('.ai-inspector').innerText();await page.locator('[data-combined-action="ai-focus:development"]').click();if(before===await page.locator('.ai-inspector').innerText())throw Error('AI_INSPECTOR_STATIC');
   if(id==='freshman'){await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`/tmp/career-ai-${language}.png`,fullPage:true});}
  }
  if(key==='galaxy'){
   await page.locator('[data-combined-action="map-select:B"]').first().click();await page.locator('[data-combined-action="section:compare"]').click();await page.locator('[data-combined-action="section:skills"]').click();await page.waitForSelector('.dna-workspace');await checkOverflow('dna');
  }
  if(key==='whatif'){
   const before=await page.locator('.an-timeline').innerText();await page.locator('[data-v2-control="planHours"]').fill('1');await page.locator('[data-v2-control="planHours"]').dispatchEvent('change');if(before===await page.locator('.an-timeline').innerText())throw Error('SCENARIO_STATIC');
   await page.reload();await page.waitForSelector('[data-v2-control="planHours"]');await page.waitForLoadState('networkidle');if(await page.locator('[data-v2-control="planHours"]').inputValue()!=='1')throw Error('SCENARIO_NOT_RESTORED');
   await page.locator('[data-v2-control="planHours"]').fill('10');await page.locator('[data-v2-control="planHours"]').dispatchEvent('change');
   await page.locator('.plan-horizon').evaluateAll(els=>els.forEach(el=>el.open=true));
   const contrast=await page.locator('.plan-horizons').evaluate(root=>{
    const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const failures=[];let min=99,count=0;for(const el of root.querySelectorAll('*')){if(!el.getClientRects().length||!Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()))continue;const cs=getComputedStyle(el);let p=el,bg;
     while(p){const c=rgb(getComputedStyle(p).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}p=p.parentElement;}bg=bg||[255,255,255];const a=lum(rgb(cs.color)),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),large=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.66&&parseFloat(cs.fontWeight)>=700);count++;min=Math.min(min,ratio);if(ratio<(large?3:4.5))failures.push({text:el.textContent.slice(0,50),ratio,color:cs.color,bg});}
    return {min,count,failures};});
   if(contrast.failures.length)throw Error('CONTRAST '+JSON.stringify(contrast));
   if(id==='freshman'){await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`/tmp/career-whatif-${language}.png`,fullPage:true});}
   evidence.push({id,language,width,intakeCount,directionAnswers:12,pages:5,errors,failed,overflow,contrast,profile,scenarioRestored:true});
  }
 }
 if(errors.length||failed.length||overflow.length)throw Error('BROWSER_ERRORS '+JSON.stringify({errors,failed,overflow}));await context.close();
}
fs.writeFileSync('/tmp/career-browser-evidence.json',JSON.stringify(evidence,null,2));console.log('PASS',evidence.length,'complete flows');}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
