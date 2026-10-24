import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import baseline from './combined/v2-protected-files.json' with {type:'json'};
import {fresh,restore,nextBackground} from './combined/model.js';
import {sampleProfile,generateOfflineReport} from './explorer-engine.js';
import {bank,chooseTrack,selectAnswer,advance} from './v3/engine.js';
import {analyzeCurrentAnswers,careerContexts} from './combined/current-analysis.js';
import {buildCompatibleReport,renderCompatibleReport,reportPages} from './combined/v2-report.js';
import {buildExplorationReport} from './exploration/report.js';
import {createDraft} from './exploration/engine.js';
import {renderGoals} from './explorer-views.js';
import {setLanguage} from './i18n.js';
import knowledge from '../data/knowledge/current.json' with {type:'json'};
function complete(track='SW',answer=7,locale='en'){
 let state={...fresh(locale),profile:sampleProfile(),notes:'<script>fictional note</script>'};
 for(let i=0;i<4;i++)state=nextBackground(state).state;
 state.v3=chooseTrack(state.v3,track);
 for(let i=0;i<12;i++){const q=bank.questions.filter(q=>q.trackId==='GENERAL'||q.trackId===track)[i];state.v3=advance(selectAnswer(state.v3,q.id,answer));}
 return {...state,phase:'report',goal:9};
}
test('question banks, intake, storage, V2 engines and SDG sources stay byte-identical to main baseline',()=>{
 for(const path of ['prototype/v3/bank.json','prototype/v3/engine.js','prototype/v3/ui.js','prototype/v3/styles.css','prototype/combined/model.js','prototype/combined/styles.css','prototype/explorer-views.js','prototype/explorer-engine.js','prototype/explorer-catalog.json','prototype/explorer.css','prototype/sdg-characters.png','prototype/exploration/bank.json','prototype/exploration/scoring.json','prototype/exploration/engine.js','prototype/exploration/report.js','prototype/exploration/ui.js','prototype/translations.json','prototype/questionnaire.js']){
  const bytes=fs.readFileSync(new URL('../'+path,import.meta.url));
  // Git may check text out as CRLF on Windows. Compare canonical LF text;
  // binary assets remain byte-exact. The protected source files are unedited.
  const canonical=path.endsWith('.png')?bytes:bytes.toString('utf8').replace(/\r\n/g,'\n');
  assert.equal(createHash('sha256').update(canonical).digest('hex'),baseline.sha256[path],path);
 }
});
test('every direction and locale renders all V2 pages and unchanged SDG without inferring missing answers',()=>{
 for(const track of bank.tracks)for(const locale of bank.languageCodes){
  setLanguage(locale);const state=complete(track.id,null,locale),before=structuredClone(state),model=buildCompatibleReport(state,locale);
  assert.equal(model.report.exploration.direction,track.id);
  assert.equal(model.report.exploration.evidence.known,0);
  assert.equal(model.report.exploration.evidence.provided,0);
  assert.ok(Object.values(model.report.exploration.stages).every(s=>s.score===null));
  assert.deepEqual(model.companions,generateOfflineReport(state.profile));
  for(const page of reportPages){
   const html=renderCompatibleReport({...state,page});
   assert.doesNotMatch(html,/undefined|NaN|data-scenario-field|All outcomes &amp; rules/);
   assert.match(html,/data-compatible-evidence/);
   assert.ok(html.includes('&lt;script&gt;fictional note&lt;/script&gt;'));
   if(page==='sdg')assert.ok(html.includes(renderGoals({...state,page,report:model.companions})));
  }
  assert.deepEqual(state,before);
 }
});
test('Likert answers survive export and restore but never become categorical V2 scores',()=>{
 const low=complete('DATA',1),high=complete('DATA',7);
 const a=buildCompatibleReport(low),b=buildCompatibleReport(high);
 assert.notDeepEqual(a.currentAnswers.answers,b.currentAnswers.answers);
 assert.deepEqual(a.report.exploration,b.report.exploration);
 assert.deepEqual(restore(JSON.stringify(high)).v3,high.v3);
 const exported=JSON.parse(JSON.stringify(b));
 assert.deepEqual(exported.currentAnswers,high.v3);
 assert.deepEqual(exported.background,high.profile);
 assert.equal(exported.notes,high.notes);
 assert.equal(exported.compatibility.likertConverted,false);
});
test('V2 behavior matches the original engine and What If changes only explicit planning assumptions',()=>{
 const state=complete('SW'),base=buildCompatibleReport(state,'en'),next=buildCompatibleReport(state,'en',{hours:2,experience:'D'});
 const expected=buildExplorationReport(createDraft('SW'),'en',{},knowledge);
 assert.deepEqual(base.report.exploration,expected.exploration);
 assert.deepEqual(base.report.project,expected.project);
 assert.ok(base.report.ranking.every(r=>r.score===null));
 assert.equal(base.report.simulation.experience,null);
 assert.equal(next.report.simulation.experience,3);
 assert.equal(next.report.simulation.weeklyHours,2);
 assert.equal(next.report.exploration.stages.experience.score,null);
 assert.deepEqual(next.currentAnswers,base.currentAnswers);
 assert.deepEqual(next.companions,base.companions);
 const other={...state,profile:{...state.profile,interests:['art']}};
 assert.notDeepEqual(buildCompatibleReport(other).companions.goals,base.companions.goals);
 assert.notDeepEqual(buildCompatibleReport(complete('HLT')).report.project,base.report.project);
 assert.throws(()=>buildCompatibleReport({...state,v3:fresh().v3}),/INCOMPLETE_V3/);
});

test('12 current answers cover seven dimensions independently of absent legacy V2 categorical answers',()=>{
 const model=buildCompatibleReport(complete('SW',7),'en');
 assert.equal(model.signals.answeredCount,12);
 assert.equal(model.signals.substantiveCount,12);
 assert.equal(model.signals.coveredDimensions,7);
 assert.equal(model.report.exploration.evidence.provided,0); // Legacy categorical answers were never invented.
 for(const locale of bank.languageCodes){
  setLanguage(locale);const html=renderCompatibleReport(complete('SW',7,locale));
  assert.doesNotMatch(html,/0\/12|G01.*尚未作答|Inspect all 12 selections and rules/);
  assert.match(html,/12\/12/);
  assert.ok(html.includes(bank.questions[0].statement[locale]));
 }
});
test('unanswered, not-assessed, neutral and disagreement stay distinct; no absence of experience is invented',()=>{
 const state=complete('SW',1),session=structuredClone(state.v3);
 delete session.answers.G01;session.answers.G02=null;session.answers.G03=4;
 const signals=analyzeCurrentAnswers(session);
 assert.equal(signals.unansweredCount,1);assert.equal(signals.notAssessedCount,1);
 assert.equal(signals.answeredCount,11);assert.equal(signals.substantiveCount,10);
 assert.equal(signals.items.find(q=>q.id==='G03').stance,'neutral');
 assert.equal(signals.items.find(q=>q.id==='SW05').state,'self-report');
 assert.equal(signals.items.find(q=>q.id==='SW05').stance,'disagreement');
 assert.equal(signals.capabilityVerification,'not-measured');
 assert.throws(()=>analyzeCurrentAnswers({...session,answers:{...session.answers,G03:8}}),/INVALID_CURRENT_ANSWER/);
});
test('editing real answers recomputes cited advice without changing score rules or SDG matches',()=>{
 setLanguage('en');const low=complete('SW',1),high=complete('SW',7);
 const before=structuredClone(low),a=buildCompatibleReport(low),b=buildCompatibleReport(high);
 assert.notDeepEqual(a.signals,b.signals);
 assert.deepEqual(a.companions,b.companions);
 assert.notEqual(renderCompatibleReport({...low,page:'plan'}),renderCompatibleReport({...high,page:'plan'}));
 assert.ok(a.signals.items.every(item=>item.source.questionId===item.id&&item.value===1));
 const restored=restore(JSON.stringify(high));assert.deepEqual(buildCompatibleReport(restored).signals,b.signals);
 assert.deepEqual(low,before);
});
test('What If uses explicit assumptions and never changes answers, career scores or original SDG',()=>{
 setLanguage('en');const state={...complete('DATA',1),page:'careers'},saved=structuredClone(state);
 const original=buildCompatibleReport(state),assumed=buildCompatibleReport(state,'en',{skillEvidence:'practiced',aiPractice:'practiced'});
 assert.deepEqual(original.signals,assumed.signals);assert.deepEqual(original.companions,assumed.companions);
 const baseline=renderCompatibleReport(state),scenario=renderCompatibleReport(state,{assumptions:{skillEvidence:'practiced',aiPractice:'practiced'}});
 assert.notEqual(baseline,scenario);assert.match(scenario,/Conditional next step/);
 assert.deepEqual(state,saved);
});
test('occupational tasks use reviewed source records; unmapped directions are editorial and never fake live data',()=>{
 const mapped=buildCompatibleReport(complete('DATA')).contexts;
 assert.equal(mapped.officialStatus,'available');assert.ok(mapped.candidates.every(c=>c.sourceKind==='official-context'));
 for(const c of mapped.candidates){
  const source=knowledge.records.find(r=>r.source+':'+r.id===c.sourceId);
  assert.deepEqual(c.tasks,source.tasks);assert.equal(c.description,source.description);assert.equal(c.url,source.url);
 }
 const unmapped=careerContexts('SW',knowledge);
 assert.equal(unmapped.officialStatus,'no-reviewed-direction-mapping');assert.ok(unmapped.candidates.every(c=>c.sourceKind==='editorial-direction-example'));
 const unavailable=careerContexts('DATA',{...knowledge,records:[],links:{}});
 assert.equal(unavailable.officialStatus,'no-reviewed-direction-mapping');assert.ok(unavailable.candidates.length);
 const conflict={...complete('SW',7),profile:{...sampleProfile(),aiPurposes:['none']}};
 assert.ok(buildCompatibleReport(conflict).signals.conflicts.length);
 assert.ok(buildCompatibleReport(conflict).signals.explicitNoAIUse);
});
test('controller completes intake review, edits answers, navigates SDG, isolates What If and exports actual evidence',async()=>{
 const {mountCombined}=await import('./combined/app.js');
 const {STORAGE_KEY}=await import('./combined/model.js');
 const old={document:globalThis.document,window:globalThis.window,storage:globalThis.sessionStorage,create:URL.createObjectURL};
 const values=new Map([[STORAGE_KEY,JSON.stringify({...complete('SW',7),phase:'v3'})]]),listeners={};let exported;
 const root={innerHTML:'',querySelector(){return {focus(){}};},addEventListener(k,f){listeners[k]=f;},removeEventListener(k){delete listeners[k];}};
 globalThis.sessionStorage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 globalThis.document={documentElement:{},title:'',querySelector(){return {};},getElementById(){return {focus(){}};},createElement(){return {click(){}};}};
 globalThis.window={scrollTo(){},print(){}};
 URL.createObjectURL=blob=>{exported=blob;return 'blob:test';};
 const click=dataset=>{const target={dataset};listeners.click({target:{closest:()=>target},preventDefault(){}});};
 let dispose;
 try{
  dispose=mountCombined({root,onHome(){}});
  click({combinedAction:'finish'});assert.match(root.innerHTML,/data-compatible-evidence/);assert.doesNotMatch(root.innerHTML,/0\/12/);
  const original=JSON.parse(values.get(STORAGE_KEY)).v3;
  click({combinedAction:'page:plan'});
  listeners.change({target:{dataset:{v2Control:'skillEvidence'},value:'practiced'}});
  assert.match(root.innerHTML,/Conditional practice plan/);
  assert.deepEqual(JSON.parse(values.get(STORAGE_KEY)).v3,original);
  click({combinedAction:'edit-v3'});click({v3Edit:'0'});
  listeners.change({target:{dataset:{},name:'v3-answer',value:'1'}});
  for(let i=0;i<12;i++)click({v3Action:'next'});
  click({combinedAction:'finish'});
  assert.equal(JSON.parse(values.get(STORAGE_KEY)).v3.answers.G01,1);
  click({combinedAction:'page:sdg'});assert.match(root.innerHTML,/ex-goal-grid/);
  click({combinedAction:'goal:4'});assert.equal(JSON.parse(values.get(STORAGE_KEY)).goal,4);
  click({combinedAction:'export'});
  const payload=JSON.parse(await exported.text());
  assert.equal(payload.signals.answeredCount,12);assert.equal(payload.currentAnswers.answers.G01,1);
  assert.deepEqual(payload.planningAssumptions,{});assert.equal(payload.selectedCompanionGoal,4);
 }finally{
  dispose?.();URL.createObjectURL=old.create;
  for(const [key,value] of [['document',old.document],['window',old.window],['sessionStorage',old.storage]]){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
 }
});
test('exported analysis describes current answers and cites actual task records rather than empty legacy stages',()=>{
 const model=buildCompatibleReport(complete('DATA',6),'en');
 assert.match(model.report.analysis.summary.text,/12\/12 answered/);
 assert.equal(model.report.analysis.capabilities.length,7);
 assert.ok(model.report.analysis.capabilities.every(d=>d.evidence.every(x=>x.kind==='user-answer'&&x.value===6)));
 for(const task of model.report.analysis.tasks){
  const [id]=task.assessment.source_ids;
  assert.ok(model.contexts.official.some(r=>r.source+':'+r.id===id&&r.tasks.some(t=>t.label===task.input_quote)));
 }
 assert.equal(model.report.practiceEvidence.reportedExperienceEndorsed,true);
 assert.equal(model.report.practiceEvidence.notProficiencyScore,true);
 assert.equal(model.report.legacyV2InputStatus.categoricalAnswersAvailable,false);
 const scenario=buildCompatibleReport(complete('DATA',1),'en',{skillEvidence:'practiced'});
 assert.equal(scenario.report.practiceEvidence.reportedExperienceEndorsed,false);
 assert.equal(scenario.report.practiceEvidence.hypotheticalPractice.skillEvidence,true);
 assert.equal(careerContexts('DATA',{}).dataStatus,'unavailable');
 assert.equal(careerContexts('DATA',knowledge).dataStatus,'loaded');
});
