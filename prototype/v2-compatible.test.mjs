import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fresh,restore,nextBackground} from './combined/model.js';
import {sampleProfile,generateOfflineReport} from './explorer-engine.js';
import {bank,chooseTrack,selectAnswer,advance} from './v3/engine.js';
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
  assert.deepEqual(fs.readFileSync(new URL('../'+path,import.meta.url)),execFileSync('git',['show','6909514:'+path],{maxBuffer:32*1024*1024}));
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
 assert.deepEqual(base.report.analysis,expected.analysis);
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
