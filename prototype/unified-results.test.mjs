import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sampleProfile,generateOfflineReport,catalog} from './explorer-engine.js';
import {deriveResult,scenarioResult,compareResults,exportResult} from './combined/results.js';
import {fresh,restore} from './combined/model.js';
import {chooseTrack,selectAnswer,advance,questionsFor} from './v3/engine.js';
import {setLanguage,text} from './i18n.js';
import {renderReport,escapeHTML} from './explorer-views.js';
import {renderResultStarMap} from './star-map.js';
import {renderResultSkillTree} from './career-explorer.js';
import {renderUnifiedPage,resultToolbar} from './combined/ui.js';
import {copy,u} from './combined/copy.js';
const base=()=>deriveResult(sampleProfile());
test('adapter exactly preserves existing engine scores, ties, IDs and plans',()=>{
 for(const interest of catalog.fields.find(f=>f.id==='interests').options){
  const profile={...sampleProfile(),interests:[interest.id]},original=generateOfflineReport(profile),result=deriveResult(profile);
  assert.deepEqual(result.baseReport,original);assert.deepEqual(result.careerFit.items,original.ranking);
  assert.equal(result.recommendations.length,24);assert.equal(new Set(result.recommendations.map(r=>r.id)).size,24);
  for(const row of result.recommendations)assert.equal(row.score,original.ranking.find(r=>r.id===row.id).score);
 }
});
test('What If invokes the same algorithm and preserves original profile and report',()=>{
 const original=base(),snapshot=structuredClone(original),patch={interests:['art'],mindsets:['humanities'],major:'art'};
 // Pick actual catalog values instead of inventing fixture choices.
 patch.interests=[catalog.careers.find(c=>c.id==='creative').interests[0]];
 patch.mindsets=[catalog.careers.find(c=>c.id==='creative').mindsets[0]];
 const next=scenarioResult(original,patch),expected=generateOfflineReport({...sampleProfile(),...patch});
 assert.deepEqual(next.baseReport,expected);assert.notEqual(next.recommendations[0].id,original.recommendations[0].id);
 assert.deepEqual(original,snapshot);assert.equal(next.hypothetical,true);
 for(const delta of compareResults(original,next))assert.equal(delta.scoreChange,expected.ranking.find(r=>r.id===delta.id).score-original.recommendations.find(r=>r.id===delta.id).score);
 assert.deepEqual(scenarioResult(original).baseReport,original.baseReport);
});
test('study time and assumed skills change plans/tree without fictitious scoring',()=>{
 const original=base(),id=original.recommendations[0].requirements[0].id;
 const next=scenarioResult(original,{weeklyTime:'over40'},[id]);
 assert.deepEqual(next.careerFit,original.careerFit);assert.ok(next.learningRecommendations[0].plan.weeklyHours>original.learningRecommendations[0].plan.weeklyHours);
 assert.equal(next.recommendations[0].requirements[0].status,'assumed-present');
 assert.equal(original.recommendations[0].requirements[0].status,'unassessed');
 assert.equal(next.aiReadiness.score,null);assert.equal(next.skillGaps.available,false);assert.equal(next.careerTransformation.available,false);
 assert.throws(()=>scenarioResult(original,{salary:100}),/INVALID_SCENARIO/);
 assert.throws(()=>scenarioResult(original,{interests:[]}),/INVALID_SCENARIO/);
 assert.throws(()=>scenarioResult(original,{},['foreign-skill']),/INVALID_SKILL/);
});
test('map order, selected skills and scenario comparison share stable career IDs in three languages',()=>{
 const original=base(),active=scenarioResult(original,{weeklyTime:'over40'});
 for(const language of ['en','zh-CN','ms']){
  setLanguage(language);const map=renderResultStarMap(active,'software',{label:u,text});
  assert.deepEqual([...map.matchAll(/data-action="map-select:([^"]+)"/g)].map(m=>m[1]),active.recommendations.map(r=>r.id));
  for(const role of active.recommendations){
   const tree=renderResultSkillTree(active,role.id,'',{label:u,text});
   assert.ok(tree.includes(text(role.title)));
   assert.deepEqual([...tree.matchAll(/data-action="skill-id:([^"]+)"/g)].map(m=>m[1]),role.requirements.map(s=>s.id));
  }
  const page=renderUnifiedPage('whatif',original,active,{focus:'software'});assert.ok(page.includes(u('scenarioNote')));assert.ok(page.includes('data-scenario-field="interests"'));
 }
 setLanguage('en');
 for(const [key,values] of Object.entries(copy)){assert.equal(values.length,3,key);assert.ok(values.every(v=>v.trim()),key);assert.ok(!/[\u3400-\u9fff]/.test(values[0]+values[2]),key);}
});
test('changing the selected career keeps AI context, tree and roadmap on the same result in three languages',()=>{
 const original=base(),focus=original.recommendations[1].id,role=original.recommendations[1];
 assert.notEqual(focus,original.recommendations[0].id);
 for(const locale of ['en','zh-CN','ms']){
  setLanguage(locale);
  const result=scenarioResult(original,{weeklyTime:'over40'});
  const ai=renderReport({report:result.baseReport,page:'ai',focus});
  const plan=renderReport({report:result.baseReport,page:'plan',focus});
  const tree=renderUnifiedPage('tree',original,result,{focus,selectedSkill:''});
  const title=escapeHTML(text(role.title));
  assert.ok(ai.includes(`<section class="ex-feature"><h2>${title}</h2>`),locale);
  assert.ok(plan.includes(`<h2>${title}</h2>`),locale);
  assert.ok(tree.includes(title),locale);
  assert.deepEqual(result.baseReport.ranking,original.baseReport.ranking);
 }
 setLanguage('en');
});
test('What If presents one restore control for an active scenario',()=>{
 const original=base(),active=scenarioResult(original,{interests:['business']});
 const controls=resultToolbar(active,active.recommendations[0].id)+renderUnifiedPage('whatif',original,active,{focus:active.recommendations[0].id});
 assert.equal([...controls.matchAll(/data-action="scenario-reset"/g)].length,1);
});
test('saved original answers, optional notes, V3 and scenario restore independently; invalid scenario does not erase answers',()=>{
 let state={...fresh('ms'),profile:sampleProfile(),phase:'report',notes:'Fictional context <script>',page:'tree',focus:'data',scenarioPatch:{weeklyTime:'over40'},assumedSkills:['data:skill:0']};
 state.v3=chooseTrack(state.v3,'DATA');for(const q of questionsFor('DATA')){state.v3=selectAnswer(state.v3,q.id,null);state.v3=advance(state.v3);}
 const saved=restore(JSON.stringify(state));assert.deepEqual(saved.profile,state.profile);assert.deepEqual(saved.v3,state.v3);assert.equal(saved.notes,state.notes);assert.deepEqual(saved.scenarioPatch,state.scenarioPatch);
 const invalid=restore(JSON.stringify({...state,scenarioPatch:{salary:999}}));assert.deepEqual(invalid.profile,state.profile);assert.deepEqual(invalid.scenarioPatch,{});
});
test('export retains original report and independent scenario, includes notes and selected roadmap',()=>{
 const original=deriveResult(sampleProfile(),{notes:'Fictional context'}),active=scenarioResult(original,{weeklyTime:'over40'});
 const exported=exportResult(original,active,'software',{choices:{weeklyTime:'over40'}});
 assert.deepEqual(exported.ranking,original.baseReport.ranking);assert.deepEqual(exported.profile,original.baseReport.profile);
 assert.equal(exported.additionalInformation,'Fictional context');assert.equal(exported.selectedPlan.roleId,'software');assert.equal(exported.scenario.result.hypothetical,true);
 assert.equal(exportResult(original,original,'data',{}).scenario,null);
});
test('unified result and What If work with all network unavailable; skill gaps are never fabricated',()=>{
 const old=globalThis.fetch;globalThis.fetch=()=>{throw Error('OFFLINE');};
 try{const original=base();for(const role of scenarioResult(original).recommendations){assert.ok(role.requirements.every(s=>s.status==='unassessed'));assert.equal(role.skillGaps.available,false);}assert.equal(original.aiReadiness.available,false);}finally{globalThis.fetch=old;}
 for(const file of ['results.js','ui.js','model.js'])assert.doesNotMatch(fs.readFileSync(new URL('./combined/'+file,import.meta.url),'utf8'),/fetch\(|runpod\.ai/);
});
