import test from 'node:test';
import assert from 'node:assert/strict';
import {bank,questionsFor,chooseTrack,selectAnswer,advance,newSession} from './v3/engine.js';
import {careerContexts} from './combined/current-analysis.js';
import {buildP0Analysis} from './combined/p0-analysis.js';
import {buildCompatibleReport,renderCompatibleReport} from './combined/v2-report.js';
import {fresh} from './combined/model.js';
import {sampleProfile} from './explorer-engine.js';
import {buildCareerStarMapModel} from './star-map.js';
import {setLanguage} from './i18n.js';
import knowledge from '../data/knowledge/current.json' with {type:'json'};
const personas={
 A:{G01:7,G02:6,G03:6,G04:6,SW01:7,SW02:6,SW03:6,SW04:6,SW05:6,SW06:5,SW07:5,SW08:7},
 B:{G01:7,G02:6,G03:2,G04:4,SW01:7,SW02:6,SW03:5,SW04:5,SW05:2,SW06:2,SW07:null,SW08:5},
 C:{G01:6,G02:7,G03:7,G04:5,SW01:4,SW02:5,SW03:6,SW04:6,SW05:7,SW06:7,SW07:7,SW08:5}
};
function stateFor(answers,locale='en',track='SW'){
 let v3=chooseTrack(newSession(),track);
 for(const q of questionsFor(track))v3=advance(selectAnswer(v3,q.id,answers[q.id]??null));
 return {...fresh(locale),profile:sampleProfile(),v3,phase:'report',page:'overview'};
}
function analysis(answers,locale='en',track='SW'){
 const state=stateFor(answers,locale,track);
 return buildP0Analysis(state.v3,careerContexts(track,knowledge,locale),locale);
}
test('real V3 bank has exact 4+8 questions and no reverse scoring metadata',()=>{
 for(const track of bank.tracks){const qs=questionsFor(track.id);assert.equal(qs.length,12);assert.deepEqual(qs.slice(0,4).map(q=>q.id),['G01','G02','G03','G04']);assert.ok(qs.slice(4).every(q=>q.trackId===track.id));}
 assert.ok(bank.questions.every(q=>q.reverse===undefined));
});
test('three fictional SW users produce traceable distinct profiles, routes and plans',()=>{
 const a=analysis(personas.A),b=analysis(personas.B),c=analysis(personas.C);
 assert.equal(a.rankingStatus,'software-first');assert.equal(b.rankingStatus,'software-first');assert.equal(c.rankingStatus,'inconclusive');
 assert.equal(c.paths[0].priority,c.paths[1].priority);
 assert.match(a.profile.find(p=>p.kind==='experience').text,/working artifact/);
 assert.match(b.profile.find(p=>p.kind==='experience').text,/do not report a finished program/);
 assert.ok(b.profile.some(p=>p.kind==='interest-experience-gap'));
 assert.ok(c.profile.some(p=>p.kind==='experience-interest-tension'));
 assert.notEqual(a.paths[0].action.task,b.paths[0].action.task);
 assert.notEqual(a.paths[0].action.check,c.paths[0].action.check);
 assert.notEqual(a.actions[0].task,a.actions[1].task);
 assert.ok(a.paths.every(p=>p.officialMapping===true));
 assert.equal(a.paths[0].explorationEvidence.supportedTaskPreferences,4);
 assert.equal(c.paths[0].explorationEvidence.supportedTaskPreferences,3);
 assert.equal(a.paths[1].explorationEvidence.unmeasuredCoreRequirements,2);
 assert.ok(a.profile.every(p=>p.evidence.every(x=>x.kind==='self-report')));
 assert.equal(a.limits.verifiedSkills,false);assert.equal(a.limits.fitIsProbability,false);
});
test('answer sensitivity is bounded to relevant conclusions; unknown stays unknown',()=>{
 const a=analysis(personas.A),other=analysis({...personas.A,SW08:1});
 assert.equal(a.profile.find(p=>p.kind==='interest').text,other.profile.find(p=>p.kind==='interest').text);
 assert.notEqual(a.profile.find(p=>p.kind==='ai-verification').text,other.profile.find(p=>p.kind==='ai-verification').text);
 const unknown=analysis({...personas.B,SW05:null,SW06:null});
 assert.equal(unknown.profile.find(p=>p.kind==='experience').evidenceLevel,'not-measured');
 assert.equal(analysis(personas.A).paths[0].id,a.paths[0].id);
});
test('official occupational tasks and skills drive the route evidence and shared star map',()=>{
 const contexts=careerContexts('SW',knowledge,'en');
 assert.deepEqual(contexts.candidates.map(c=>c.id),['software','ai-research']);
 assert.equal(contexts.official.length,4);
 const a=analysis(personas.A),software=a.paths[0],research=a.paths[1];
 assert.equal(software.explorationEvidence.taskLinks[0].task.id,'21667');
 assert.match(software.explorationEvidence.taskLinks[0].task.label,/Design, develop and modify software systems/);
 assert.equal(software.explorationEvidence.taskLinks[0].skill.sourceId,'esco:http://data.europa.eu/esco/occupation/f2b15a0e-e65a-438a-affb-29b9d50b77d1');
 assert.equal(research.explorationEvidence.taskLinks[1].status,'not-measured');
 assert.match(research.source.mappingCaveat,/not an exact ML engineer code/);
 const changed=structuredClone(knowledge);
 changed.records.find(r=>r.source==='onet'&&r.id==='15-1252.00').tasks.find(t=>t.id==='21667').label='Updated official development task';
 assert.equal(buildP0Analysis(stateFor(personas.A).v3,careerContexts('SW',changed,'en'),'en').paths[0].tasks[0],'Updated official development task');
 const model=buildCompatibleReport(stateFor(personas.A));
 const map=buildCareerStarMapModel(model.report);
 assert.equal(map.paths[0].title,model.p0.paths[0].title);
 assert.equal(map.paths[0].next,model.p0.paths[0].action.task);
 assert.equal(map.paths[0].gaps[0].skill,model.p0.paths[0].requirements[0]);
});
test('task-affinity change can remove a lead; unrelated verification changes do not',()=>{
 const baseline=analysis(personas.A);
 const lessBuild=analysis({...personas.A,SW01:2});
 const moreBuild=analysis({...personas.A,SW01:6});
 const lessVerify=analysis({...personas.A,SW08:2});
 assert.equal(baseline.rankingStatus,'software-first');
 assert.equal(lessBuild.rankingStatus,'inconclusive');
 assert.equal(moreBuild.rankingStatus,'software-first');
 assert.equal(lessVerify.rankingStatus,baseline.rankingStatus);
 assert.deepEqual(lessVerify.paths.map(p=>p.explorationEvidence.supportedTaskPreferences),baseline.paths.map(p=>p.explorationEvidence.supportedTaskPreferences));
 assert.notEqual(lessVerify.profile.find(p=>p.kind==='ai-verification').text,baseline.profile.find(p=>p.kind==='ai-verification').text);
});
test('missing occupational records degrade to labeled team context without invented ranking',()=>{
 const unavailable={...knowledge,records:[],links:{}};
 const contexts=careerContexts('SW',unavailable),p=buildP0Analysis(stateFor(personas.A).v3,contexts);
 assert.equal(contexts.officialStatus,'no-reviewed-direction-mapping');
 assert.deepEqual(contexts.candidates.map(c=>c.id),['software','ai-research']);
 assert.equal(p.rankingStatus,'unavailable');
 assert.ok(p.paths.every(route=>!route.officialMapping&&route.priority===1));
});
test('SW What If reads the same route action while leaving original results and SDG independent',()=>{
 setLanguage('en');const state={...stateFor(personas.A),page:'galaxy'},original=buildCompatibleReport(state);
 const before=renderCompatibleReport(state),after=renderCompatibleReport({...state,page:'whatif'},{assumptions:{skillEvidence:'practiced',aiPractice:'practiced'}});
 assert.ok(before.includes(original.p0.paths[0].action.task));
 assert.match(after,/Calculated differences/);
 assert.equal(buildCompatibleReport(state,'en',{skillEvidence:'practiced'}).unified.routes[0].dimensions.experience.status,'hypothetical');
 assert.equal(original.unified.routes[0].dimensions.experience.status,'supported');
 assert.deepEqual(state.v3.answers,personas.A);
 assert.match(renderCompatibleReport({...state,page:'sdg'}),/independent context, not a result of the V3 occupational comparison/);
});
test('three locales render the new profile, route comparison and action plans without changing answers',()=>{
 for(const locale of bank.languageCodes){
  setLanguage(locale);const state=stateFor(personas.A,locale),before=structuredClone(state.v3.answers);
  const model=buildCompatibleReport(state,locale);assert.equal(model.p0.locale,locale);
  for(const page of ['overview','ai','careers','compare','plan','map','tree','sdg']){
   const html=renderCompatibleReport({...state,page});assert.ok(html.includes(bank.tracks[0].label[locale].replace('&','&amp;')));
   assert.doesNotMatch(html,/Analysis Unavailable|\bNaN\b/);
  }
  assert.deepEqual(state.v3.answers,before);
 }
});
