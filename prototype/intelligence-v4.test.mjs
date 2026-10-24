import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,completeAssessment} from './combined/model.js';
import {newStartingPoint,updateStartingPoint,advanceStartingPoint} from './combined/starting-point-legacy.js';
import {bank,chooseTrack,selectAnswer,advance} from './v3/engine.js';
import {buildCompatibleReport,renderCompatibleReport} from './combined/v2-report.js';
import {buildIntelligence,scenarioDifference} from './combined/intelligence.js';
import {setLanguage} from './i18n.js';
import {fixtures,fixture} from './v4-personas.mjs';
test('six complete fixtures have source-linked evidence, distinct preparation and no fabricated competence',()=>{
 const states=Object.fromEntries(Object.entries(fixtures).map(([id,make])=>[id,make()]));
 const models=Object.fromEntries(Object.entries(states).map(([id,state])=>[id,buildCompatibleReport(state)]));
 for(const model of Object.values(models)){
  assert.equal(model.unified.version,'career-intelligence-4.0');
  assert.ok(model.unified.evidence.length>=22);
  assert.ok(model.unified.routes.every(r=>r.dimensions.skillReadiness.status==='unknown'));
  for(const c of model.unified.claims){assert.ok(c.evidence_ids.every(id=>model.unified.evidence.some(e=>e.id===id)));assert.ok(c.recommended_action_ids.every(id=>model.unified.actions.some(a=>a.id===id)));}
  for(const r of model.unified.routes)for(const requirement of r.requirements)assert.ok(model.report.evidence.sources[requirement.sourceId]);
 }
 assert.deepEqual(models.A.unified.personal.interests,models.B.unified.personal.interests);
 assert.deepEqual(models.A.unified.personal.experience,models.B.unified.personal.experience);
 assert.deepEqual(models.A.unified.routes,models.B.unified.routes);
 assert.notEqual(models.A.startingPointContext.focus,models.B.startingPointContext.focus);
 assert.notEqual(models.A.p0.actions[0].why,models.B.p0.actions[0].why);
 assert.notEqual(models.C.p0.actions[0].task,models.D.p0.actions[0].task);
 assert.equal(models.F.unified.routes[0].dimensions.interest.status,'unknown');
 assert.ok(models.A.unified.claims.some(c=>c.rule==='artifact-without-repair'));
});
test('one answer sensitivity changes related evidence only and preserves unknown mathematics',()=>{
 const a=buildCompatibleReport(fixture()),b=buildCompatibleReport(fixture({},{SW06:6}));
 assert.equal(a.unified.personal.experience.dimension.status,'mixed');assert.equal(b.unified.personal.experience.dimension.status,'supported');
 assert.deepEqual(a.unified.personal.interests,b.unified.personal.interests);
 assert.deepEqual(a.unified.personal.ai,b.unified.personal.ai);
 assert.equal(a.unified.claims.some(c=>c.rule==='artifact-without-repair'),true);
 assert.equal(b.unified.claims.some(c=>c.rule==='artifact-without-repair'),false);
 assert.equal(b.unified.routes[1].requirements.find(r=>r.id==='mathematical-models').status,'unverified');
});
test('all numeric levels participate as ordinal evidence; no fit percentage and missing never becomes zero',()=>{
 for(let n=1;n<=7;n++){
  const u=buildCompatibleReport(fixture({},{SW01:n})).unified;
  assert.equal(u.evidence.find(e=>e.id==='SW01').answer,n);
  assert.equal(u.evidence.find(e=>e.id==='SW01').status,n<4?'not-endorsed':n>4?'supported':'mixed');
 }
 const missing=buildCompatibleReport(fixtures.F()).unified;
 assert.deepEqual(missing.routes[0].dimensions.interest.range,[0,2]);
 assert.equal(missing.comparison.relation,'incomparable');
 assert.ok(!Object.hasOwn(missing.routes[0],'score'));
});
test('scenario uses same engine, updates linked requirements, preserves original and feeds shared report',()=>{
 const state=fixtures.C(),copy=structuredClone(state),base=buildCompatibleReport(state),sim=buildCompatibleReport(state,'en',{skillEvidence:'practiced',aiPractice:'practiced'});
 assert.deepEqual(state,copy);
 assert.ok(scenarioDifference(base.unified,sim.unified).some(d=>d.requirementId==='debug'));
 assert.equal(sim.report.unified,sim.unified);
 assert.notEqual(sim.p0.actions[0].task,base.p0.actions[0].task);
 assert.equal(sim.report.analysis.paths[0].unified,sim.unified.routes.find(r=>r.id===sim.report.analysis.paths[0].role_id));
 assert.equal(sim.unified.routes[1].requirements.find(r=>r.id==='mathematical-models').status,'unverified');
 assert.deepEqual(buildCompatibleReport(state).unified,base.unified);
});
test('structured conclusions and comparison agree across all locales; every existing report section renders offline',()=>{
 const state=fixtures.A(),before=structuredClone(state);
 const original=buildCompatibleReport(state,'en').unified;
 for(const lang of ['en','zh-CN','ms']){
  setLanguage(lang);const result=buildCompatibleReport(state,lang).unified;
  assert.deepEqual(result.routes.map(r=>({id:r.id,dimensions:r.dimensions,priority:r.priority})),original.routes.map(r=>({id:r.id,dimensions:r.dimensions,priority:r.priority})));
  assert.deepEqual(result.claims,original.claims);
  for(const page of ['overview','ai','careers','map','compare','tree','future','plan','sdg'])assert.doesNotMatch(renderCompatibleReport({...state,page}),/Analysis Unavailable|\bNaN\b|undefined/);
 }
 assert.deepEqual(state,before);setLanguage('en');
});
test('damaged snapshot retains catalog fallback without inventing source facts',()=>{
 const state=fixtures.A(),model=buildCompatibleReport(state);
 const empty={...model.contexts,official:[],knowledgeVersion:'unavailable'};
 const unlinked={...model.p0,paths:model.p0.paths.map(p=>({...p,officialMapping:false,source:{id:'catalog:'+p.id},explorationEvidence:null}))};
 const u=buildIntelligence(state.v3,state.startingPoint,unlinked,empty);
 assert.ok(u.routes.every(r=>!r.officialMapping));assert.ok(u.routes.every(r=>r.requirements.every(x=>x.mapping==='team-editorial')));
});

test('target route, market and AI reliance change scenario priorities and checks, never original ability',()=>{
 const state=fixtures.A(),before=structuredClone(state),base=buildCompatibleReport(state),sim=buildCompatibleReport(state,'en',{targetCareer:'ai-research',targetMarket:'US',aiReliance:'higher'});
 assert.equal(sim.report.analysis.paths[0].role_id,'ai-research');
 assert.equal(sim.unified.routes.find(r=>r.id==='ai-research').dimensions.goalAlignment.status,'user-selected-scenario');
 assert.notEqual(base.p0.actions.find(a=>a.routeId==='cross-cutting').task,sim.p0.actions.find(a=>a.routeId==='cross-cutting').task);
 for(const route of base.unified.routes){const other=sim.unified.routes.find(r=>r.id===route.id);for(const key of ['interest','workPreference','experience','skillReadiness'])assert.deepEqual(route.dimensions[key],other.dimensions[key]);}
 assert.deepEqual(state,before);
});
