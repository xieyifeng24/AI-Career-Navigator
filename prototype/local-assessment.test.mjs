import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreProfile,buildLocalReport,careers} from './local/engine.js';
import {questions,validateRatings} from './local/questions.js';
import {renderRatings,renderLocalReport,renderRuleSimulator} from './local/ui.js';
import {createOptionalAI} from './local/optional-ai.js';
import {sampleProfile} from './logic.js';
import {setLanguage} from './i18n.js';
import {renderCareerStarMap} from './star-map.js';
import {renderCareerComparison,renderSkillDNA,renderTimeMachine,renderSDGMapper} from './career-explorer.js';
const profile=()=>({...sampleProfile('marketing'),synthetic:true});
test('A: the complete core runs with all fetches forbidden, using dated source-backed records',()=>{
 const previous=globalThis.fetch;globalThis.fetch=()=>{throw Error('NO NETWORK ALLOWED');};
 try{for(const locale of ['en','zh-CN','ms']){
  setLanguage(locale);const p=profile(),r=buildLocalReport(p,locale);
  assert.equal(r.mode,'rules');assert.equal(r.analysis.paths.length,2);assert.equal(r.analysis.capabilities.length,3);
  for(const path of r.analysis.paths){assert.equal(path.weeks.length,4);assert.ok(path.weeks.every(w=>w.hours<=p.hours));assert.ok(path.tools.length);}
  for(const page of ['capability','impact','paths','plan']){const html=renderLocalReport(r,page,'A');assert.ok(html.includes('source-links'));assert.ok(!html.includes('undefined'));assert.ok(!html.includes('AI INFERENCE · SYNTHETIC PROFILE'));}
  for(const renderer of [renderCareerStarMap,renderCareerComparison,renderSkillDNA,renderTimeMachine,renderSDGMapper])assert.ok(!renderer(r).includes('undefined'));
  assert.ok(r.ranking.every(role=>role.url.startsWith('https://www.onetonline.org/')));
 }}finally{globalThis.fetch=previous;setLanguage('en');}
});
test('B: different self-reports produce different ranked roles; formula is independently reproducible',()=>{
 const marketing=scoreProfile(profile()),admin=scoreProfile(sampleProfile('admin'));
 assert.equal(marketing.ranking[0].id,'13-1161.00');assert.equal(admin.ranking[0].id,'43-6014.00');
 for(const row of marketing.ranking){const known=row.terms.filter(t=>t.fit!==null);const total=known.reduce((sum,t)=>sum+t.weight,0);assert.equal(row.score,Math.round(known.reduce((sum,t)=>sum+t.fit*t.weight,0)/total));}
});
test('unknown is missing evidence, not zero ability; malformed values are also unscored',()=>{
 const p=profile();p.assessment=Object.fromEntries(questions.map(q=>[q.id,'unknown']));p.education='unknown';
 const r=scoreProfile(p);assert.ok(r.ranking.every(x=>x.score===null&&x.coverage===0));assert.ok(Object.values(r.dimensions).every(x=>x===null));
 p.education='degree';assert.ok(scoreProfile(p).ranking.every(x=>x.coverage===5&&x.score===null));
 p.assessment.technical=6;assert.equal(scoreProfile(p).dimensions.technical,null);
 for(let step=1;step<4;step++)assert.deepEqual(validateRatings(p,step),step===1?{'rating-technical':'Please choose an answer.'}:{});
});
test('C: skills and education What-if reuse the exact scoring function, time never changes matching',()=>{
 const p=profile(),before=structuredClone(p),base=scoreProfile(p),changes={ratings:{technical:5,analysis:5},education:'degree'};
 const next=scoreProfile(p,changes),report=buildLocalReport(p,'en',changes);
 assert.deepEqual(report.ruleScores,next);assert.notDeepEqual(next.ranking.map(x=>x.score),base.ranking.map(x=>x.score));
 assert.notDeepEqual(scoreProfile({...p,education:'secondary'}).ranking.map(x=>x.score),scoreProfile({...p,education:'degree'}).ranking.map(x=>x.score));
 assert.deepEqual(scoreProfile({...p,hours:30}),base);assert.deepEqual(p,before);
 assert.ok(renderRuleSimulator(buildLocalReport(p),changes).includes('→'));
});
test('E: all semantic items have five explained anchors and an unknown option in every locale',()=>{
 for(const locale of ['en','zh-CN','ms']){setLanguage(locale);const p=profile();
  for(const q of questions){assert.equal(q.levels.length,5);assert.ok(q.levels.every(level=>level[locale]?.length>8));}
  for(let step=0;step<4;step++){const html=renderRatings(p,step);assert.ok(!html.includes('undefined'));if(step)assert.ok(html.includes('value="unknown"'));}
  const r=buildLocalReport(p,locale);assert.equal(r.language,locale);assert.deepEqual(scoreProfile(p),buildLocalReport(p,locale).ruleScores);
 }setLanguage('en');
});
test('rules report never exposes old lexical 70/20/10 or invented live forecasts',()=>{
 const r=buildLocalReport(profile());const html=renderLocalReport(r,'paths','A');
 assert.ok(!html.includes('0–70 points'));assert.ok(!html.includes('skill overlap (0–70)'));
 assert.ok(html.includes('Ability 60%'));assert.ok(html.includes('coverage'));
 assert.ok(!renderLocalReport(r,'impact','A').includes('LIVE PUBLIC SOURCES'));assert.ok(!renderLocalReport(r,'impact','A').includes('MODEL ASSESSMENT'));
 assert.ok(careers.roles.every(role=>role.source.reviewedAt&&role.editorial.note.includes('NOT official')));
});
test('D: actual 429 transport fails only the optional request, preserving the same readable base report',async()=>{
 const old=globalThis.fetch,base=buildLocalReport(profile()),before=structuredClone(base);let posts=0;
 globalThis.fetch=async(url)=>url==='/api/session'?{ok:true,json:async()=>({csrf_token:'TEST'})}:(posts++,{ok:false,status:429,json:async()=>({detail:'Limit'})});
 try{const run=createOptionalAI(undefined,{timeoutMs:100});await assert.rejects(()=>run(profile()));assert.equal(posts,1);assert.deepEqual(base,before);assert.ok(renderLocalReport(base,'plan','A').includes('Week 1'));}
 finally{globalThis.fetch=old;}
});
test('optional AI deduplicates pending/completed requests, rejects failed retries and enforces timeout',async()=>{
 let calls=0,resolve;const run=createOptionalAI(()=>{calls++;return new Promise(r=>resolve=r);},{timeoutMs:100});
 const a=run(profile()),b=run(profile());assert.equal(a,b);resolve({analysis:{summary:{text:'TEST'}}});await a;await run(profile());assert.equal(calls,1);
 const bad=createOptionalAI(async()=>{throw Error('429');});await assert.rejects(()=>bad(profile()));await assert.rejects(()=>bad(profile()),/AI_COOLDOWN/);
 const hang=createOptionalAI(()=>new Promise(()=>{}),{timeoutMs:5});await assert.rejects(()=>hang(profile()),/AI_TIMEOUT/);
});
