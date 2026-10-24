import {validResponse,toggleBehavior} from '../v3/behaviors.js';
import {currentKnowledge,refreshAssessmentKnowledge} from '../assessment/knowledge.js';
import {executiveSummary} from '../assessment/release.js';
import {buildAssessment,simulate} from '../assessment/engine.js';
import {newStartingPoint,updateStartingPoint,advanceStartingPoint,previousStartingPoint,preferredRegion,startingQuestions} from './starting-point.js';
import {renderStartingPoint,ui as startingUI} from './starting-point-view.js';
import {personalAIContext} from './starting-point-analysis.js';
import {buildCompatibleReport,renderCompatibleReport} from './v2-report.js';
import {pageTarget} from './page-map.js';
import {language,setLanguage,t,localize} from '../i18n.js';
import {renderHeader,renderFooter,renderForm,escapeHTML} from '../explorer-views.js';
import {catalog,validWeeklyHours,backgroundSteps} from '../explorer-engine.js';
import {bank,questionsFor,chooseTrack,changeLanguage,selectAnswer,advance,previous} from '../v3/engine.js';
import {renderPreview} from '../v3/ui.js';
import {fresh,load,save,restore,updateBackground,nextBackground,reportFor,withoutPersonalityInterests,completeAssessment} from './model.js';
export {STORAGE_KEY} from './model.js';
import {supplementaryInput} from './ui.js';
import regional from '../../data/regional/current.json' with {type:'json'};
const e=escapeHTML;
export function hasCombinedDraft(){try{return !!sessionStorage.getItem('career-combined-pr8-pr9-v1');}catch{return false;}}
export function mountCombined({root,onHome}) {
 let mounted=true;
 let storage;try{storage=sessionStorage;}catch{storage=null;}
 let state=load(storage,language),errors={};
 state={...state,profile:state.phase!=='background'&&!state.startingPoint?.completed?state.profile:withoutPersonalityInterests(state.profile),step:state.step===1?2:state.step};
 if(state.phase==='background'&&!state.startingPoint)state={...state,startingPoint:newStartingPoint()};
 let startingMotion='',aiRequestSerial=0;
 refreshAssessmentKnowledge().catch(()=>false); // next report uses refreshed validated data; open reports remain stable

 let reportSignature='',cachedAssessment=null;
 try{const saved=JSON.parse(storage?.getItem('career-evidence-report-v1')||'null');if(saved?.assessment?.version==='evidence-engine-1.1'){reportSignature=saved.signature;cachedAssessment=saved.assessment;}}catch{}
 const stampReport=()=>{if(state.phase!=='report')return;const key=JSON.stringify([state.v3.trackId,state.v3.answers,state.startingPoint?.answers,state.startingPoint?.story,state.profile.exactWeeklyHours,currentKnowledge().version,v2Options.regionalSnapshot?.version||regional.version]);if(key!==reportSignature||!cachedAssessment){reportSignature=key;cachedAssessment=buildAssessment(state,{generatedAt:new Date().toISOString(),market:v2Options.regionalSnapshot||regional});try{storage?.setItem('career-evidence-report-v1',JSON.stringify({signature:key,assessment:cachedAssessment}));}catch{}}v2Options.assessment=cachedAssessment;state.reportGeneratedAt=cachedAssessment.generatedAt;};

 let skillProgress={};try{skillProgress=JSON.parse(storage?.getItem('career-skill-progress-v1')||'{}')||{};}catch{}
 let v2Options={path:'A',assumptions:{},region:preferredRegion(state.startingPoint),aiConsent:false,aiStoryConsent:false,ai:{status:'idle'},skillProgress};
 try{const saved=JSON.parse(storage?.getItem('career-scenario-v1')||'null');if(saved?.assessmentDirection===state.v3.trackId){v2Options={...v2Options,...saved.options,ai:{status:'idle'}};}}catch{}
 if(globalThis.location?.hash?.startsWith('#report/')){const [page,section]=location.hash.slice(8).split('/');const target=pageTarget(page,section);state={...state,page:target.page,section:target.section||'map'};}
 let restoringHistory=false,lastNavigation='';
 const navKey=()=>JSON.stringify([state.phase,state.v3.screen,state.v3.index,state.startingPoint?.screen,state.startingPoint?.index,state.page,state.section]);
 const safeOptions=()=>({path:v2Options.path,assumptions:v2Options.assumptions,region:v2Options.region,skill:v2Options.skill});
 function historyChanged(event){if(!event.state?.careerNavigator){onHome();return;}restoringHistory=true;state=restore(JSON.stringify(event.state.careerNavigator));v2Options={...v2Options,...event.state.options,ai:{status:'idle'}};aiRequestSerial++;render(true);restoringHistory=false;}
 window.addEventListener?.('popstate',historyChanged);
 setLanguage(state.v3.language);
 for(const path of ['explorer.css','v3/styles.css','star-map.css','career-explorer.css','combined/styles.css','combined/regional.css','assessment/styles.css','assessment/dna.css','production.css']) {
  if(!document.querySelector(`link[data-combined-style="${path}"]`)){
   const link=document.createElement('link');link.rel='stylesheet';link.href='./'+path;link.dataset.combinedStyle=path;document.head.append(link);
  }
 }
 function render(focus=false) {
  if(!mounted)return;
  const previousMilestones=[...(root.querySelectorAll?.('.release-milestone')||[])].map(el=>el.style.width);
  const reduceMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  state={...state,v3:changeLanguage(state.v3,language)};
  if(state.phase==='v3'&&state.v3.screen==='review'){
   try{state=completeAssessment(state);}catch{state={...state,v3:{...state.v3,screen:'question',index:Math.max(0,questionsFor(state.v3.trackId).findIndex(q=>!validResponse(q,state.v3.answers[q.id])))}};}
  }
  stampReport();
  let html;
  if(state.phase==='background') {
   html=renderStartingPoint(state.startingPoint,language,errors.starting||'',startingMotion);startingMotion='';
  }else if(state.phase==='v3') {
   html=renderPreview(state.v3,errors.answer||'',focus,{hideUnknown:false,hideNotice:true,directionTitle:'Your preferred career direction'});
   // Context navigation stays in this local session instead of discarding background choices.
   html=html.replaceAll('href="/?intro=off"','href="#" data-combined-action="home"');
   if(state.v3.screen==='tracks')html=html.replace('<section class="v3-entry">',`<section class="v3-entry"><button class="text-button" data-combined-action="edit-background">${e(t('Edit your answers ↗'))}</button>`);


   if(state.v3.screen==='tracks'){
    const L=(en,zh,ms)=>startingUI(language,en,zh,ms);
    const guide=`<button class="text-button" type="button" data-combined-action="starting-explore">${L('Not sure? Explore the work first','还没确定？先了解各方向的工作','Belum pasti? Terokai tugas dahulu')} ↗</button>${v2Options.directionGuide?`<section class="starting-direction-guide"><p>${L('These are task previews from the existing questionnaire, not recommendations. Try one direction and return to compare another at any time.','以下是现有题库中的任务预览，并不是职业推荐。可以先选一个方向体验，随时返回比较其他方向。','Ini pratonton tugas daripada soal selidik sedia ada, bukan cadangan. Cuba satu arah dan kembali membandingkan arah lain bila-bila masa.')}</p>${bank.tracks.map(track=>`<article><h2>${e(track.label[language])}</h2><p>${e(bank.questions.find(q=>q.trackId===track.id&&q.construct==='interest').statement[language])}</p><button type="button" class="text-button" data-track="${track.id}">${L('Try this direction','先体验这个方向','Cuba arah ini')} ↗</button></article>`).join('')}</section>`:''}`;
    html=html.replace('<div class="v3-tracks"',guide+'<div class="v3-tracks"');
   }
  }else {
   try{html=renderCompatibleReport(state,v2Options);}catch(error){
    console.error('Report view failed; evidence summary preserved',error);
    const L=(en,zh,ms)=>startingUI(language,en,zh,ms);
    html=renderHeader({report:true})+`<main class="shell">${executiveSummary(cachedAssessment||buildAssessment(state))}<section class="production-status" role="status"><h2>${L('The detailed view could not open. Your core analysis and answers are preserved.','详细视图暂时无法打开，核心分析和回答已保留。','Paparan terperinci tidak dapat dibuka. Analisis teras dan jawapan dikekalkan.')}</h2><button class="button secondary" data-combined-action="page:profile">${L('Reopen the report','重新打开报告','Buka semula laporan')}</button><button class="text-button" data-combined-action="export">${L('Export evidence','导出证据','Eksport bukti')}</button></section></main>`+renderFooter();
   }
  }
  // Avoid collisions with the retained V2 controller's delegated actions and language input.
  html=html.replaceAll('data-action=','data-combined-action=').replaceAll('id="language-select"','id="combined-language-select"');
  root.innerHTML=html;
  if(focus&&!reduceMotion)root.querySelector('.report-main>.an-view')?.animate?.([{opacity:.65,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
  if(!focus&&!reduceMotion)root.querySelectorAll?.('.release-milestone').forEach((el,i)=>{if(previousMilestones[i]&&previousMilestones[i]!==el.style.width)el.animate?.([{width:previousMilestones[i]},{width:el.style.width}],{duration:320,easing:'ease-out'});});
  if(typeof document.createTreeWalker==='function'){localize(root);for(const label of root.querySelectorAll('.star-map-origin .star-detail-label'))label.textContent=label.textContent.replace(/^YOUR STARTING POINT/,t('Your starting point'));}
  document.title=e(t(state.phase==='report'?'Overview':'Your profile'))+' · AI Career Navigator';document.documentElement.lang=language;
  save(storage,state);
  try{storage?.setItem('career-scenario-v1',JSON.stringify({assessmentDirection:state.v3.trackId,options:safeOptions()}));}catch{}
  const navigation=navKey(),url=state.phase==='report'?'#report/'+state.page+'/'+(state.section||'map'):'#assessment/'+state.phase;
  if(!restoringHistory){const method=lastNavigation&&lastNavigation!==navigation?'pushState':'replaceState';globalThis.history?.[method]?.({careerNavigator:structuredClone(state),options:safeOptions()},'',url);}
  lastNavigation=navigation;
  if(focus){(document.getElementById('starting-heading')||document.getElementById('v3-heading')||root.querySelector('main h1'))?.focus?.({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
 }
 function change(event) {
  const target=event.target;
  if(target.dataset.startingField){
   try{state={...state,startingPoint:updateStartingPoint(state.startingPoint,target.dataset.startingField,target.value,target.checked!==false)};errors={};}catch(error){errors.starting=error.message==='MAX_TWO'?'multi':'single';}
   render();[...root.querySelectorAll(`[name="${target.name}"]`)].find(el=>el.value===target.value)?.focus();return;
  }
  if(target.dataset.assessmentConsent!==undefined){v2Options.aiConsent=target.checked;return;}
  if(target.dataset.regionalStoryConsent!==undefined){v2Options.aiStoryConsent=target.checked;return;}
  if(target.dataset.exactHours){input(event);return;}
  if(target.dataset.regionalConsent!==undefined){v2Options.aiConsent=target.checked;return;}
  if(state.phase==='report'&&target.dataset.v2Control){
   const key=target.dataset.v2Control;
   aiRequestSerial++;v2Options.ai={status:'idle'};
   v2Options.assumptions={...v2Options.assumptions,[key]:['hours','planHours','planHorizon'].includes(key)?Number(target.value):target.value};
   if(key==='targetMarket')v2Options.region=['MY','US','GLOBAL'].includes(target.value)?target.value:preferredRegion(state.startingPoint);
   if(key==='planHours'&&(!Number.isFinite(Number(target.value))||Number(target.value)<0||Number(target.value)>40)){v2Options.assumptions.planHours=5;}
   render();root.querySelector(`[data-v2-control="${key}"]`)?.focus();return;
  }
  if(['combined-language-select','v3-language'].includes(target.id)){aiRequestSerial++;setLanguage(target.value);errors={};v2Options.ai={status:'idle'};render();root.querySelector('#combined-language-select,#v3-language')?.focus();return;}
  if(state.phase==='background'&&target.dataset.field){state=updateBackground(state,target.dataset.field,target.value,target.checked!==false);delete errors[target.dataset.field];render();[...document.getElementsByName(target.name)].find(el=>el.value===target.value)?.focus();return;}
  if(state.phase==='v3'&&target.name==='v3-behavior'){
   const q=questionsFor(state.v3.trackId)[state.v3.index];
   try{const values=toggleBehavior(q,state.v3.answers[q.id],target.value,target.checked);const answers={...state.v3.answers};if(values.length)answers[q.id]=values;else delete answers[q.id];state={...state,v3:{...state.v3,answers}};errors={};}catch{errors.answer='Choose up to three options.';}
   render();root.querySelector(`input[name="v3-behavior"][value="${target.value}"]`)?.focus({preventScroll:true});return;
  }
  if(state.phase==='v3'&&target.name==='v3-answer'){
   state={...state,v3:selectAnswer(state.v3,questionsFor(state.v3.trackId)[state.v3.index].id,target.value==='unknown'?null:Number(target.value))};errors={};render();root.querySelector(`input[name="v3-answer"][value="${target.value}"]`)?.focus({preventScroll:true});
  }
 }
 function submit(event) {
  if(event.target.id==='starting-point-form'){event.preventDefault();try{state={...state,startingPoint:advanceStartingPoint(state.startingPoint)};startingMotion='is-forward';errors={};}catch(error){errors.starting=error.message;}render(true);return;}
  if(event.target.id!=='explorer-form')return;event.preventDefault();
  const next=nextBackground(state);errors=next.errors;state=next.state;render(true);
  const key=Object.keys(errors)[0];if(key)document.getElementById('field-'+key)?.focus();
 }
 function click(event) {
  const target=event.target.closest('[data-combined-action],[data-v3-action],[data-v3-edit],[data-track]');if(!target)return;
  event.preventDefault();errors={};
  if(target.dataset.track){state={...state,v3:chooseTrack(state.v3,target.dataset.track)};render(true);return;}
  if(target.dataset.v3Edit!==undefined){state={...state,v3:{...state.v3,screen:'question',index:Number(target.dataset.v3Edit)}};render(true);return;}
  if(target.dataset.v3Action){
   if(target.dataset.v3Action==='back')state={...state,v3:previous(state.v3)};
   else if(target.dataset.v3Action==='reset')state={...state,v3:{...fresh(language).v3}};
   else try{const value=state.v3.answers[questionsFor(state.v3.trackId)[state.v3.index]?.id];if(!validResponse(questionsFor(state.v3.trackId)[state.v3.index],value))throw Error('ANSWER_REQUIRED');state={...state,v3:advance(state.v3)};}catch{errors.answer='Please choose an answer.';}
   render(true);return;
  }
  const action=target.dataset.combinedAction;
  if(['home','start','edit','edit-background','reset','edit-v3'].includes(action))aiRequestSerial++;
  if(action==='starting-next'||action==='starting-back'){
   try{state={...state,startingPoint:action==='starting-next'?advanceStartingPoint(state.startingPoint):previousStartingPoint(state.startingPoint)};startingMotion=action==='starting-next'?'is-forward':'is-back';}catch(error){errors.starting=error.message;}
   render(true);return;
  }
  if(action==='starting-continue'){
   if(!state.startingPoint?.completed)return;
   v2Options={...v2Options,region:preferredRegion(state.startingPoint),ai:{status:'idle'},aiConsent:false,aiStoryConsent:false};
   state={...state,phase:'v3'};render(true);return;
  }
  if(action==='starting-explore'){v2Options.directionGuide=!v2Options.directionGuide;render();return;}

  if(state.phase==='report'){
   if(action?.startsWith('region:')){const region=action.slice(7);if(['MY','US','GLOBAL'].includes(region)){v2Options.region=region;v2Options.ai={status:'idle'};render();}return;}
   if(action==='assessment-ai'){requestAssessmentAI();return;}
   if(action.startsWith('plan:')){v2Options.assumptions={...v2Options.assumptions,targetCareer:action.slice(5)};state={...state,page:'whatif'};render(true);return;}
   if(action==='regional-ai'){requestRegionalAI();return;}
   if(action.startsWith('skill-step-done:')){const [,roleId,rawIndex]=action.split(':');const index=Number(rawIndex);if(roleId&&Number.isInteger(index)&&index>=0){const current=v2Options.skillProgress?.[roleId]||[];v2Options.skillProgress={...v2Options.skillProgress,[roleId]:[...new Set([...current,index])].sort((a,b)=>a-b)};try{storage?.setItem('career-skill-progress-v1',JSON.stringify(v2Options.skillProgress));}catch{}}render();return;}
   if(action==='tree-reset'){v2Options.skillProgress={};try{storage?.removeItem('career-skill-progress-v1');}catch{}render();return;}
   if(action==='v2-reset'){aiRequestSerial++;v2Options.assumptions={};v2Options.region=preferredRegion(state.startingPoint);v2Options.ai={status:'idle'};render();return;}
   if(action.startsWith('select:')||action.startsWith('route-select:')||action.startsWith('map-select:')||action.startsWith('compare-select:')){
    const value=action.slice(action.indexOf(':')+1);if(['A','B'].includes(value))v2Options.path=value;render();return;
   }
   if(action.startsWith('skill-select:')){try{v2Options.skill=decodeURIComponent(action.slice(13));}catch{}render();return;}
   if(action.startsWith('time-year:')){const year=action.slice(10);if(['2026','2028','2030','2035'].includes(year))v2Options.year=year;render();return;}
   if(action.startsWith('time-scenario:')){const value=action.slice(14);if(['slower','moderate','fast'].includes(value))v2Options.futureScenario=value;render();return;}
   if(action.startsWith('page:')){const target=pageTarget(action.slice(5));state={...state,page:target.page,section:target.section};render(true);return;}
   if(action.startsWith('section:')){state={...state,page:'galaxy',section:action.slice(8)};render(true);return;}
  }
  if(action==='home'){history.pushState({},'','#home');onHome();return;}
  if(action==='start'||action==='edit'||action==='edit-background'){v2Options={path:'A',assumptions:{},region:'MY',aiConsent:false,ai:{status:'idle'}};state={...state,phase:'background',step:0,startingPoint:state.startingPoint?{...state.startingPoint,screen:'question',index:0,completed:false}:newStartingPoint()};render(true);return;}
  if(action==='reset'){v2Options={path:'A',assumptions:{},region:'MY',aiConsent:false,ai:{status:'idle'}};state=fresh(language);render(true);return;}
  if(action==='prev'){if(state.step>0){state={...state,step:backgroundSteps(state.profile)[backgroundSteps(state.profile).indexOf(state.step)-1]};render(true);}else onHome();return;}
  if(action==='edit-v3'){v2Options={path:'A',assumptions:{},region:'MY',aiConsent:false,ai:{status:'idle'}};state={...state,phase:'v3',v3:{...state.v3,screen:'question',index:0}};render(true);return;}
  if(action==='finish'){state=completeAssessment(state);render(true);return;}
  if(action.startsWith('goal:')&&catalog.goals.some(g=>g.id===Number(action.slice(5)))){state={...state,goal:Number(action.slice(5))};render();return;}
  if(action==='print'){window.print();return;}
  if(action==='export'){
   const assessment=cachedAssessment||buildAssessment(state,{generatedAt:state.reportGeneratedAt});
   const payload={assessment,scenario:simulate(assessment,v2Options.assumptions),selectedCompanionGoal:state.goal,language};
   const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
   const anchor=document.createElement('a');anchor.href=url;anchor.download='career-exploration-'+payload.assessment.id+'.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
 }
 async function requestAssessmentAI(){
  const L=(en,zh,ms)=>({en,'zh-CN':zh,ms})[language];
  if(!v2Options.aiConsent){v2Options.ai={status:'error',message:L('Please consent before sending answers.','请先同意发送回答。','Sila bersetuju sebelum menghantar jawapan.')};render();return;}
  if(v2Options.ai.status==='loading')return;
  const serial=++aiRequestSerial,requestLanguage=language;
  const payload={track_id:state.v3.trackId,language,answers:state.v3.answers};
  v2Options.ai={status:'loading'};render();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),35000);
  try{
   const session=await fetch('/api/session',{credentials:'same-origin',signal:controller.signal});if(!session.ok)throw Error('session');
   const token=(await session.json()).csrf_token;
   const response=await fetch('/api/assessment/explain',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':token},body:JSON.stringify(payload),signal:controller.signal});
   if(!response.ok)throw Error('unavailable');const result=await response.json();
   if(!Array.isArray(result.guide)||!result.guide.every(x=>typeof x.text==='string'&&Array.isArray(x.evidence_ids)))throw Error('invalid-guide');
   if(serial===aiRequestSerial&&language===requestLanguage&&state.phase==='report')v2Options.ai={status:'complete',result};
  }catch{if(serial===aiRequestSerial)v2Options.ai={status:'error',message:L('AI is unavailable or its response did not pass validation. Your full evidence report remains available.','AI 暂不可用或返回未通过验证；完整证据报告仍可使用。','AI tidak tersedia atau respons gagal pengesahan. Laporan bukti lengkap masih tersedia.')};}
  finally{clearTimeout(timer);render();}
 }
 async function requestRegionalAI(){
  if(!v2Options.aiConsent){v2Options.ai={status:'error',message:{en:'Please consent to this optional AI request first.','zh-CN':'请先同意本次可选 AI 请求。',ms:'Sila beri persetujuan untuk permintaan AI pilihan ini.'}[language]};render();return;}
  if(v2Options.ai.status==='loading')return;
  const model=buildCompatibleReport(state,language,v2Options.assumptions);
  const payload={track_id:state.v3.trackId,language,region:v2Options.region,
    answers:structuredClone(state.v3.answers),understand_you:state.startingPoint?.completed?structuredClone(state.startingPoint.answers):null,deterministic_profile:personalAIContext(model,state.startingPoint,v2Options.aiStoryConsent),
    scenario:Object.values(v2Options.assumptions||{}).some(Boolean)?JSON.stringify(v2Options.assumptions).slice(0,200):null};
  const serial=++aiRequestSerial;
  const signature=()=>JSON.stringify({answers:state.v3.answers,intake:state.startingPoint,assumptions:v2Options.assumptions,region:v2Options.region,language});
  const expected=signature();
  v2Options.ai={status:'loading'};render();
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),245000);
  try{
   const session=await fetch('/api/session',{credentials:'same-origin',signal:controller.signal});
   if(!session.ok)throw Error('Session unavailable');
   const token=(await session.json()).csrf_token;
   const response=await fetch('/api/regional/explain',{method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json','X-CSRF-Token':token},body:JSON.stringify(payload),signal:controller.signal});
   const data=await response.json();
   if(!response.ok){const error=Error('AI unavailable');error.status=response.status;throw error;}
   if(serial===aiRequestSerial&&state.phase==='report'&&expected===signature())v2Options.ai={status:'complete',result:data};
  }catch(error){if(serial===aiRequestSerial)v2Options.ai={status:'error',message:error.status===429?{en:'The request limit has been reached. Please try later; your base report is unchanged.','zh-CN':'已达到请求额度，请稍后再试；基础报告不受影响。',ms:'Had permintaan dicapai. Cuba kemudian; laporan asas tidak berubah.'}[language]:{en:'AI is unconfigured, timed out or unavailable. Your base report remains available.','zh-CN':'AI 未配置、超时或暂时不可用，基础报告仍可正常使用。',ms:'AI belum dikonfigurasi, tamat masa atau tidak tersedia. Laporan asas masih tersedia.'}[language]};}
  finally{clearTimeout(timeout);render();}
 }
 function input(event){
  if(event.target.matches('[data-skill-search]')){const query=event.target.value.trim().toLowerCase();for(const node of root.querySelectorAll('.dna-map-node,.dna-role-node'))node.classList.toggle('dna-search-hidden',!!query&&!(node.dataset.searchText||'').includes(query));return;}
  if(event.target.dataset.startingStory!==undefined){state={...state,startingPoint:updateStartingPoint(state.startingPoint,'story',event.target.value)};save(storage,state);const count=root.querySelector('.starting-story-count');if(count)count.textContent=state.startingPoint.story.length+' / 1500';return;}

  if(event.target.dataset.exactHours){
   const value=event.target.value===''?null:Number(event.target.value);
   if(value===null||validWeeklyHours(value)){
    state=updateBackground(state,'exactWeeklyHours',value);delete errors.weeklyTime;save(storage,state);
    const range=root.querySelector('[data-exact-hours="range"]'),number=root.querySelector('[data-exact-hours="number"]'),output=root.querySelector('#weekly-hours-value');
    if(value!==null){range.value=String(value);number.value=String(value);}
    output.textContent=value===null?t('Choose your weekly learning time'):t('{hours} hours / week',{hours:value});
   }else{state=updateBackground(state,'exactWeeklyHours',null);save(storage,state);}
   return;
  }
if(['hours','planHours','planHorizon'].includes(event.target.dataset.v2Control)){change(event);return;}if(event.target.id==='combined-notes'){state={...state,notes:event.target.value.slice(0,1500)};save(storage,state);}}
 root.addEventListener('input',input);
 root.addEventListener('change',change);root.addEventListener('submit',submit);root.addEventListener('click',click);
 render();
 fetch('/api/regional/current').then(r=>r.ok?r.json():null).then(data=>{
  if(data?.snapshot?.schema_version===1&&typeof data.snapshot.version==='string'&&Array.isArray(data.snapshot.facts)&&data.snapshot.facts.every(f=>['MY','US','GLOBAL'].includes(f.region)&&typeof f.role_id==='string'&&typeof f.source_url==='string'&&f.source_url.startsWith('https://')&&typeof f.reference_period==='string')){v2Options.regionalSnapshot=data.snapshot;v2Options.regionalDelivery=data.delivery;if(state.phase==='report')render();}
 }).catch(()=>{});
 return ()=>{mounted=false;aiRequestSerial++;window.removeEventListener?.('popstate',historyChanged);root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('submit',submit);root.removeEventListener('click',click);};
}
