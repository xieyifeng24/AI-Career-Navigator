import test from 'node:test';
import assert from 'node:assert/strict';
import {bank,questionsFor,chooseTrack,selectAnswer,advance,newSession} from './v3/engine.js';
import {careerContexts} from './combined/current-analysis.js';
import {buildP0Analysis} from './combined/p0-analysis.js';
import {buildCompatibleReport,renderCompatibleReport} from './combined/v2-report.js';
import {fresh} from './combined/model.js';
import {sampleProfile} from './explorer-engine.js';
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
 assert.equal(a.paths[0].id,'software');assert.equal(b.paths[0].id,'software');assert.equal(c.paths[0].id,'ai-research');
 assert.match(a.profile.find(p=>p.kind==='experience').text,/working artifact/);
 assert.doesNotMatch(b.profile.find(p=>p.kind==='experience').text,/working artifact/);
 assert.notEqual(a.paths[0].action.task,b.paths[0].action.task);
 assert.notEqual(a.paths[0].action.check,c.paths[0].action.check);
 assert.notEqual(a.actions[0].task,a.actions[1].task);
 assert.ok(a.paths.every(p=>p.officialMapping===false));
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
