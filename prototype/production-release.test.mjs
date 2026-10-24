import test from 'node:test';
import assert from 'node:assert/strict';
import {bank,questionsFor,newSession,chooseTrack,selectAnswer,advance,restoreSession} from './v3/engine.js';
import {behaviorOptions,validResponse,responseStrength,toggleBehavior,RESPONSE_VERSION} from './v3/behaviors.js';
import {fresh,completeAssessment,restore} from './combined/model.js';
import {sampleProfile} from './explorer-engine.js';
import {buildAssessment,simulate} from './assessment/engine.js';
import {usableKnowledge,installAssessmentKnowledge,currentKnowledge,refreshAssessmentKnowledge} from './assessment/knowledge.js';
import {renderCompatibleReport} from './combined/v2-report.js';
import {setLanguage} from './i18n.js';
import bundled from '../data/knowledge/current.json' with {type:'json'};
const session=(track='SW',none=false)=>{let s=chooseTrack(newSession(),track);for(const q of questionsFor(track)){const ids=none?['none']:behaviorOptions(q).filter(o=>!o.exclusive).slice(0,2).map(o=>o.id);s=advance(selectAnswer(s,q.id,ids));}return s;};
const state=(track='SW',none=false)=>completeAssessment({...fresh(),profile:sampleProfile(),v3:session(track,none)});
test('all 84 task contexts have translated semantic options, exclusive responses, and bounded normalized evidence',()=>{
 for(const q of bank.questions){const options=behaviorOptions(q);assert.ok(options.length>=5,q.id);for(const o of options)for(const l of bank.languageCodes)assert.ok(o.label[l]?.trim());
 const positive=options.filter(o=>!o.exclusive);assert.ok(positive.every(o=>o.strength>=1&&o.strength<=7));
 for(const ids of [[],['invalid'],[positive[0].id,positive[0].id],['none',positive[0].id],positive.slice(0,4).map(o=>o.id)])assert.equal(validResponse(q,ids),false);
 const ids=positive.slice(0,3).map(o=>o.id),v=responseStrength(q,ids);assert.ok(v>=Math.min(...positive.slice(0,3).map(o=>o.strength))&&v<=Math.max(...positive.slice(0,3).map(o=>o.strength)));
 assert.deepEqual(toggleBehavior(q,[positive[0].id],'none',true),['none']);assert.deepEqual(toggleBehavior(q,['none'],positive[0].id,true),[positive[0].id]);assert.throws(()=>toggleBehavior(q,ids,positive[3].id,true),/MAX_BEHAVIORS/);
 }
});
test('equivalent evidence does not improve just because more boxes are selected',()=>{const q=questionsFor('SW').find(q=>q.construct==='interest');assert.equal(responseStrength(q,['try']),responseStrength(q,['try','learn']));});
test('new answers and old ordinal answers restore without conversion or destructive migration',()=>{
 const next=session();assert.equal(next.responseVersion,RESPONSE_VERSION);assert.deepEqual(restoreSession(JSON.stringify(next)),next);
 const old={...next};delete old.responseVersion;old.answers=Object.fromEntries(questionsFor('SW').map(q=>[q.id,6]));assert.deepEqual(restoreSession(JSON.stringify(old)),old);
 const s=state();assert.deepEqual(restore(JSON.stringify(s)).v3,s.v3);assert.ok(buildAssessment(s).evidence.filter(e=>e.dimension!=='context').every(e=>Array.isArray(e.raw)&&e.responseFormat===RESPONSE_VERSION));
});
test('three languages and all ten directions render all five real reports and DNA from multi-select evidence',()=>{
 for(const l of bank.languageCodes){setLanguage(l);for(const track of bank.tracks){const s=state(track.id);for(const page of ['profile','capability','galaxy','whatif','impact']){const html=renderCompatibleReport({...s,page});assert.doesNotMatch(html,/undefined|NaN|\[object Object\]/);assert.ok(html.includes('data-compatible-analysis'));}assert.match(renderCompatibleReport({...s,page:'galaxy',section:'skills'}),/dna-workspace/);}}setLanguage('en');
});
test('no reported experience still gives objective tasks and an actionable report without ability percentages',()=>{const s=state('SW',true),a=buildAssessment(s),html=renderCompatibleReport(s);assert.equal(a.dimensions.experience.status,'limited');assert.ok(a.roles.every(r=>r.tasks.length&&r.requirements.length));assert.match(html,/release-task-bar/);assert.match(html,/Build my next experiment/);assert.deepEqual(a.verifiedSkills,[]);});
test('validated live snapshot reaches assessment calculations, rejected or failing refresh retains real source evidence',async()=>{
 assert.ok(usableKnowledge(bundled));const changed=structuredClone(bundled);changed.version='release-refresh-test';const role=buildAssessment(state()).roles[0];const fact=changed.records.find(r=>r.source+':'+r.id===role.sourceId);fact.tasks[0].label='Analyze and explain a changed source task.';
 try{assert.ok(await refreshAssessmentKnowledge(async()=>({ok:true,json:async()=>({snapshot:changed})})));const a=buildAssessment(state());assert.equal(a.knowledgeVersion,changed.version);assert.equal(a.roles.find(r=>r.id===role.id).tasks[0].label,fact.tasks[0].label);
 assert.equal(await refreshAssessmentKnowledge(async()=>{throw Error('OFFLINE');}),false);assert.equal(buildAssessment(state()).knowledgeVersion,changed.version);assert.throws(()=>installAssessmentKnowledge({records:[]}),/INVALID/);const fallback=buildAssessment(state(),{knowledge:{version:'invalid',records:[]}});assert.equal(fallback.knowledgeVersion,changed.version);assert.ok(fallback.roles.every(r=>r.requirements.length));
 }finally{installAssessmentKnowledge(bundled);}
});
test('What If updates actual milestone timing and keeps original evidence unchanged at zero and high budgets',()=>{const a=buildAssessment(state()),before=JSON.stringify(a);const fast=simulate(a,{planHours:15}),slow=simulate(a,{planHours:1}),zero=simulate(a,{planHours:0});assert.ok(fast.stages.at(-1).endWeek<slow.stages.at(-1).endWeek);assert.equal(zero.stages.at(-1).endWeek,null);assert.equal(JSON.stringify(a),before);});
test('mixing a retained scale answer and a new behavior does not create a comparative score',()=>{const s=state();s.v3.answers.SW01=7;const a=buildAssessment(s);assert.equal(a.dimensions.interest.status,'mixed');assert.ok(a.roles.every(r=>r.interest.value===null));assert.equal(a.tied,true);});

test('intake and directional experience disagreement stays visible without discarding either answer',()=>{const s=state();s.v3.answers.SW05=['artifact'];const a=buildAssessment({...s,startingPoint:{version:'starting-point-1',answers:{Q06:'A'},story:''}});assert.equal(a.dimensions.experience.status,'conflict');assert.ok(a.conflicts.some(c=>c.rule==='intake-domain-experience-tension-v1'));assert.deepEqual(a.evidence.find(e=>e.id==='SW05').raw,['artifact']);assert.equal(a.evidence.find(e=>e.id==='Q06').raw,'A');});
