import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {installMalaysiaSnapshot,loadMalaysiaIntelligence,analyseMalaysiaCareer,malaysiaReport,renderMalaysiaContext} from './combined/malaysia-intelligence.js';
import {buildCompatibleReport,renderCompatibleReport} from './combined/v2-report.js';
import {fresh,nextBackground} from './combined/model.js';
import {bank,chooseTrack,selectAnswer,advance} from './v3/engine.js';
import {sampleProfile} from './explorer-engine.js';
import {setLanguage} from './i18n.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/malaysia_intelligence/current.json',import.meta.url),'utf8'));
function complete(track='SW'){
 let s={...fresh('en'),profile:sampleProfile(),notes:''};
 for(let i=0;i<4;i++)s=nextBackground(s).state;
 s.v3=chooseTrack(s.v3,track);
 for(const q of bank.questions.filter(q=>q.trackId==='GENERAL'||q.trackId===track))s.v3=advance(selectAnswer(s.v3,q.id,7));
 return {...s,phase:'report',goal:9};
}
test('all 24 original careers expose tasks, evidence, three rules and explicit unknown abilities',()=>{
 assert.equal(installMalaysiaSnapshot(data),true);
 const context=malaysiaReport();assert.equal(context.allCareers.length,24);
 for(const c of context.allCareers){
  assert.equal(c.profiles.length,9);assert.ok(c.tasks.length>=5);assert.equal(c.scenarios.length,3);
  assert.ok(c.market.length&&c.mapping.length&&c.regions.length&&c.salary_and_entry.length);
  assert.ok(c.skill_gaps.every(r=>r.state==='unknown'&&!r.verified_ability));
  assert.ok(c.scenarios.every(r=>r.status==='unknown'&&r.evidence.records.length&&r.evidence.sources.length));
  assert.equal(c.outlook_score,null);assert.equal(c.ai_exposure_score,null);
 }
});
test('every rule is conjunctive; only stated assumptions change and remaining target skills survive',()=>{
 installMalaysiaSnapshot(data);
 for(const rule of data.analysis_model.scenarios){
  const assumed={};for(const p of rule.all_of)(assumed[p.field]??={})[p.key]=true;
  const before=structuredClone(assumed),profile={};
  const r=analyseMalaysiaCareer(rule.occupation_id,profile,assumed),s=r.scenarios.find(x=>x.id===rule.id);
  assert.equal(s.status,'conditional');assert.equal(s.success_probability,null);assert.ok(s.target_requirements_to_verify.length);
  assert.deepEqual(before,assumed);assert.deepEqual(profile,{});
  assert.ok(analyseMalaysiaCareer(rule.occupation_id).skill_gaps.every(r=>r.state==='unknown'));
  for(const p of rule.all_of){const trial=structuredClone(assumed);trial[p.field][p.key]=false;
   assert.equal(analyseMalaysiaCareer(rule.occupation_id,{},trial).scenarios.find(x=>x.id===rule.id).status,'unmet');}
 }
});
test('reject numeric questionnaires; false is an explicit gap, not the same as missing',()=>{
 installMalaysiaSnapshot(data);
 for(const input of [{answers:{G01:7}},{skills:{sql:7}},{skills:{invented:true}},{skills:[]}])assert.throws(()=>analyseMalaysiaCareer('data',input));
 const r=analyseMalaysiaCareer('data',{skills:{sql:false}});
 assert.equal(r.skill_gaps.find(x=>x.skill_id==='sql').state,'reported_gap');
 assert.equal(r.skill_gaps.find(x=>x.skill_id==='statistics').state,'unknown');
});
test('V2 reads Malaysian data; questionnaire, exploration, SDG and old planning assumptions remain separate',()=>{
 installMalaysiaSnapshot(data);const state=complete(),before=structuredClone(state);
 const a=buildCompatibleReport(state,'en'),b=buildCompatibleReport(state,'en',{}, {assumptions:{skills:{sql:true}}});
 assert.equal(a.report.malaysiaIntelligence.version,data.version);
 assert.deepEqual(a.report.malaysiaIntelligence.careers.map(r=>r.occupation_id),['software','ai-research']);
 assert.deepEqual(a.report.exploration,b.report.exploration);assert.deepEqual(a.report.ranking,b.report.ranking);
 assert.deepEqual(a.companions,b.companions);assert.deepEqual(a.currentAnswers,b.currentAnswers);assert.deepEqual(state,before);
 assert.equal(a.report.malaysiaIntelligence.careers[0].skill_gaps.find(r=>r.skill_id==='sql').state,'unknown');
 assert.equal(b.report.malaysiaIntelligence.careers[0].skill_gaps.find(r=>r.skill_id==='sql').basis,'hypothetical');
 for(const locale of ['en','zh-CN','ms']){
  setLanguage(locale);const html=renderCompatibleReport({...state,page:'careers'});
  assert.match(html,/data-malaysia-career="marine"/);assert.match(html,/MY-OFFICIAL/);
  assert.match(html,/https:\/\/www.dosm.gov.my/);assert.match(html,/data-malaysia-context/);
 }
 setLanguage('en');
});
test('missing, malformed and updated snapshots degrade safely and do not retain corrupt context',async()=>{
 assert.equal(await loadMalaysiaIntelligence(async()=>({ok:false})),false);
 assert.equal(malaysiaReport().status,'unavailable');
 assert.doesNotThrow(()=>renderCompatibleReport({...complete(),page:'plan'}));
 assert.equal(installMalaysiaSnapshot({}),false);assert.equal(malaysiaReport().status,'invalid-data');
 const invalid=structuredClone(data);invalid.analysis_model.scenarios[0].record_refs[0].record_id='missing';
 assert.equal(installMalaysiaSnapshot(invalid),false);
 const updated=structuredClone(data);updated.version='updated-test';
 assert.equal(await loadMalaysiaIntelligence(async()=>({ok:true,json:async()=>updated})),true);
 assert.equal(malaysiaReport().version,'updated-test');
 installMalaysiaSnapshot(data);
});
test('source and research HTML is escaped',()=>{
 const unsafe=structuredClone(data);unsafe.tables['Malaysia Career Profiles'][0].finding_zh='<script>bad()</script>';
 assert.equal(installMalaysiaSnapshot(unsafe),true);
 const html=renderMalaysiaContext(malaysiaReport(['software']),'en');
 assert.match(html,/&lt;script&gt;bad\(\)&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>bad/);
 installMalaysiaSnapshot(data);
});
test('archival mixed claim is corrected for display without rewriting the preserved pilot',()=>{
 installMalaysiaSnapshot(data);
 const r=analyseMalaysiaCareer('environment').salary_and_entry.find(r=>r.record_id==='04-010');
 assert.equal(r.evidence_type,'INFERENCE');assert.equal(r.original_evidence_type,'MY-OFFICIAL');
 assert.equal(data.tables['Malaysia Salary & Skills'].find(r=>r.record_id==='04-010').evidence_type,'MY-OFFICIAL');
});
test('a synchronous fetch failure can be retried successfully',async()=>{
 assert.equal(await loadMalaysiaIntelligence(()=>{throw Error('offline');}),false);
 assert.equal(await loadMalaysiaIntelligence(async()=>({ok:true,json:async()=>data})),true);
});
test('report controller changes one named Malaysian assumption and exports it without changing answers',async()=>{
 const {mountCombined}=await import('./combined/app.js');
 const {STORAGE_KEY}=await import('./combined/model.js');
 const saved={document:globalThis.document,window:globalThis.window,sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch,create:URL.createObjectURL};
 const state=complete(),storage=new Map([[STORAGE_KEY,JSON.stringify(state)]]),listeners={};let exported;
 const root={innerHTML:'',querySelector(){return {focus(){}};},addEventListener(k,f){listeners[k]=f;},removeEventListener(k){delete listeners[k];}};
 globalThis.sessionStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 globalThis.document={documentElement:{},querySelector(){return {};},createElement(){return {click(){}};}};
 globalThis.window={scrollTo(){}};globalThis.fetch=async()=>({ok:true,json:async()=>data});
 URL.createObjectURL=blob=>{exported=blob;return 'blob:test';};let dispose;
 try{
  dispose=mountCombined({root,onHome(){}});await loadMalaysiaIntelligence();
  listeners.change({target:{dataset:{malaysiaAssumption:'skills',malaysiaKey:'sql'},value:'true'}});
  const target={dataset:{combinedAction:'export'}};
  listeners.click({target:{closest:()=>target},preventDefault(){}});
  const result=JSON.parse(await exported.text()),career=result.report.malaysiaIntelligence.allCareers.find(c=>c.occupation_id==='software');
  assert.deepEqual(career.assumptions,{skills:{sql:true}});
  assert.equal(career.skill_gaps.find(r=>r.skill_id==='sql').basis,'hypothetical');
  assert.ok(career.scenarios.every(s=>s.status==='unknown'));
  assert.deepEqual(result.currentAnswers,state.v3);
  assert.deepEqual(JSON.parse(storage.get(STORAGE_KEY)).v3,state.v3);
 }finally{
  dispose?.();URL.createObjectURL=saved.create;
  for(const k of ['document','window','sessionStorage','fetch']){if(saved[k]===undefined)delete globalThis[k];else globalThis[k]=saved[k];}
 }
});
test('loaded Malaysian context renders every direction in all languages without changing SDG',()=>{
 installMalaysiaSnapshot(data);
 for(const track of bank.tracks)for(const locale of ['en','zh-CN','ms']){
  setLanguage(locale);const state=complete(track.id),before=structuredClone(state),model=buildCompatibleReport(state,locale);
  for(const page of ['ai','careers','tree','future','plan']){
   const html=renderCompatibleReport({...state,page});
   assert.equal((html.match(/data-malaysia-career=/g)||[]).length,24);
   assert.doesNotMatch(html,/undefined|NaN/);
  }
  assert.deepEqual(state,before);
  assert.deepEqual(buildCompatibleReport(state,locale,{}, {assumptions:{skills:{ai_tool:true}}}).companions,model.companions);
 }
 setLanguage('en');
});
