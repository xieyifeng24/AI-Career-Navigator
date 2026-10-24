import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startingPointBank as bank,newStartingPoint,startingQuestions,updateStartingPoint,advanceStartingPoint,previousStartingPoint,restoreStartingPoint,startingPointErrors,preferredRegion} from './combined/starting-point.js';
import {renderStartingPoint} from './combined/starting-point-view.js';
import {fresh,restore,completeAssessment} from './combined/model.js';
import {bank as v3,chooseTrack,selectAnswer,advance} from './v3/engine.js';
import {buildCompatibleReport,renderCompatibleReport,reportPages} from './combined/v2-report.js';
import {personalAIContext,contextualPreparation} from './combined/starting-point-analysis.js';
import {setLanguage} from './i18n.js';
const fixture={Q01:'B','Q02.primary':'A','Q03':'C',Q04:'A','Q05.knowledge':'examples','Q05.execution':'guided','Q05.problemSolving':'untried','Q05.communication':'independent',Q06:'B',Q07:['B','F'],Q08:'D',Q09:'D',Q10:'B',Q11:'1'};
function intake(changes={}){
 let result=newStartingPoint();
 for(const [field,value]of Object.entries({...fixture,...changes}))for(const one of Array.isArray(value)?value:[value])result=updateStartingPoint(result,field,one);
 result=advanceStartingPoint(result);
 while(result.screen!=='bridge')result=advanceStartingPoint(result);
 return result;
}
function stateFor(initial,track='SW',locale='en'){
 let state={...fresh(locale),startingPoint:initial,phase:'v3',v3:chooseTrack(fresh(locale).v3,track)};
 for(let i=0;i<12;i++){const q=v3.questions.filter(q=>q.trackId==='GENERAL'||q.trackId===track)[i];state.v3=advance(selectAnswer(state.v3,q.id,5));}
 return completeAssessment(state);
}
test('nine core prompts and Chinese options come from the supplied document; every display string supports three languages',()=>{
 const source=fs.readFileSync(new URL('../docs/STARTING_POINT_QUESTIONNAIRE.md',import.meta.url),'utf8').replaceAll('**','');
 assert.equal(bank.questions.length,9);
 for(const q of bank.questions){
  assert.ok(source.includes(q.prompt['zh-CN']),q.id);
  if(q.id!=='Q05')for(const o of q.options)assert.ok(source.includes(o.label['zh-CN']),q.id+o.id);
 }
 const check=(value)=>{
  if(value&&typeof value==='object'){
   if(Object.hasOwn(value,'zh-CN')){for(const language of ['en','zh-CN','ms'])assert.ok(typeof value[language]==='string'&&value[language].length>0);assert.doesNotMatch(value.en,/\p{Script=Han}/u);assert.doesNotMatch(value.ms,/\p{Script=Han}/u);}
   else for(const child of Object.values(value))check(child);
  }
 };
 check(bank);
 assert.equal(Object.keys(bank.followups.Q10).length,3);assert.equal(Object.keys(bank.followups.Q11).length,9);
});
test('one page per question; Q05 retains four rows and Q12 is the only optional free-text field',()=>{
 for(const locale of ['en','zh-CN','ms']){
  const draft=intake();
  for(let i=0;i<startingQuestions(draft.answers).length;i++){
   const q=startingQuestions(draft.answers)[i],html=renderStartingPoint({...draft,screen:'question',index:i},locale);
   assert.equal((html.match(/data-starting-question=/g)||[]).length,1);
   assert.equal((html.match(/<textarea/g)||[]).length,q.id==='Q12'?1:0);
   assert.match(html,new RegExp('data-starting-question="'+q.id+'"'));
   if(q.id==='Q05')assert.equal((html.match(/<fieldset/g)||[]).length,4);
  }
 }
});
test('priority concern and adaptive routes stay distinct; changing primary or stage removes obsolete follow-up answers',()=>{
 const complete=intake({'Q02.secondary':'G'});assert.equal(complete.answers.Q02.primary,'A');assert.equal(complete.answers.Q02.secondary,'G');
 let changed=updateStartingPoint(complete,'Q02.primary','G');assert.equal(changed.answers.Q02.secondary,null);assert.equal(changed.answers.Q11,undefined);
 changed=updateStartingPoint(changed,'Q01','D');assert.equal(changed.answers.Q10,undefined);
 assert.equal(startingQuestions(changed.answers).find(q=>q.id==='Q10').prompt.en,bank.followups.Q10.working.prompt.en);
 for(const stage of ['A','B','C','D','E','F'])for(const primary of 'ABCDEFGHI'){
  let draft=updateStartingPoint(newStartingPoint(),'Q01',stage);draft=updateStartingPoint(draft,'Q02.primary',primary);
  const follow=startingQuestions(draft.answers).filter(q=>['Q10','Q11'].includes(q.id));
  assert.equal(follow.length,stage==='F'?1:2);
  assert.deepEqual(follow.find(q=>q.id==='Q11').options,bank.followups.Q11[primary].options);
 }
 assert.throws(()=>updateStartingPoint(complete,'Q07','A'),/MAX_TWO/);
});
test('missing matrix rows prevent completion; untried is a valid non-numeric answer, and optional story may be skipped',()=>{
 const done=intake();assert.deepEqual(startingPointErrors(done),{});assert.equal(done.story,'');
 const partial=structuredClone(done);delete partial.answers.Q05.execution;assert.ok(startingPointErrors(partial).Q05);
 assert.equal(done.answers.Q05.problemSolving,'untried');assert.equal(typeof done.answers.Q05.problemSolving,'string');
 assert.deepEqual(restoreStartingPoint(JSON.parse(JSON.stringify(done))),done);
 assert.throws(()=>restoreStartingPoint({...done,answers:{...done.answers,Q05:{knowledge:7}}}),/INVALID_STARTING_VALUE/);
 const prev=previousStartingPoint(done);assert.equal(startingQuestions(prev.answers)[prev.index].id,'Q12');
});
test('new background flows into all ten V3 directions and report pages offline in three languages',()=>{
 for(const locale of ['en','zh-CN','ms'])for(const track of v3.tracks){
  setLanguage(locale);const state=stateFor(intake(),track.id,locale),model=buildCompatibleReport(state,locale);
  assert.equal(model.startingPointContext.primaryConcern,bank.questions[1].options[0].label[locale]);
  assert.equal(model.startingPointContext.capabilities[2].status,'unmeasured');
  assert.equal(model.startingPointContext.capabilities[2].verified,false);
  assert.equal(model.companions.mode,'context-only');assert.deepEqual(model.companions.goals,[]);
  assert.equal(restore(JSON.stringify(state)).startingPoint.answers.Q02.primary,'A');
  for(const page of reportPages){const html=renderCompatibleReport({...state,page},{path:'A',assumptions:{},region:preferredRegion(state.startingPoint)});assert.match(html,/data-compatible-analysis/);assert.doesNotMatch(html,/undefined|NaN|Analysis Unavailable|v3-review-list/);}
 }
});
test('concerns route report focus, capability evidence changes preparation, regions never change V3 career comparison',()=>{
 const a=stateFor(intake()),b=stateFor(intake({'Q02.primary':'G',Q09:'B','Q05.execution':'independent',Q06:'E'}));
 const am=buildCompatibleReport(a,'en'),bm=buildCompatibleReport(b,'en');
 assert.equal(am.startingPointContext.focusPage,'ai');assert.equal(bm.startingPointContext.focusPage,'careers');assert.equal(preferredRegion(b.startingPoint),'US');
 assert.deepEqual(am.unified.personal.interests,bm.unified.personal.interests);
 assert.deepEqual(am.unified.routes.map(r=>r.priority),bm.unified.routes.map(r=>r.priority)); // Goal context never becomes ability.
 assert.notEqual(contextualPreparation(am.startingPointContext,a.startingPoint,am.p0.paths[0]).task,contextualPreparation(bm.startingPointContext,b.startingPoint,bm.p0.paths[0]).task);
 assert.equal(am.startingPointContext.objectivePage,'plan');
 const renderA=renderStartingPoint({...a.startingPoint,screen:'bridge'},'en');assert.doesNotMatch(renderA,/career-success|probability/);
});
test('story remains local without separate consent; requested AI context is bounded and contains no guessed ability scores',()=>{
 const starting=updateStartingPoint(intake(),'story','Fictional story SECRET_CONTEXT');starting.completed=true;
 const state=stateFor(starting),model=buildCompatibleReport(state,'en');
 assert.ok(!JSON.stringify(personalAIContext(model,starting,false)).includes('SECRET_CONTEXT'));
 assert.ok(JSON.stringify(personalAIContext(model,starting,true)).includes('SECRET_CONTEXT'));
 const long={...starting,story:'x'.repeat(1500)};
 const payload=personalAIContext(model,long,true);assert.ok(payload.length<=8&&payload.every(s=>s.length>=4&&s.length<=400));
 assert.equal(payload.filter(s=>s.startsWith('Unverified optional story: ')).map(s=>s.slice('Unverified optional story: '.length)).join('').length,1500);
 assert.ok(model.report.startingPoint);
});
