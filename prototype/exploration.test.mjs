import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {bank,directions,questionsFor,createDraft,setDirection,validateExploration,analyzeExploration,simulateExploration,exampleProfile,contextRoles} from './exploration/engine.js';
import {renderExplorationIntake,pageQuestions,renderExplorationSection,renderExplorationSimulator,collectExploration} from './exploration/ui.js';
import {buildLocalReport} from './local/engine.js';
import {createOptionalAI} from './local/optional-ai.js';
import {setLanguage} from './i18n.js';
import {renderCareerStarMap} from './star-map.js';
import {renderCareerComparison,renderSkillDNA,renderTimeMachine,renderSDGMapper,buildCareerExplorerModel} from './career-explorer.js';
import {simulateCareer} from './simulator.js';
import manifest from './exploration/source-manifest.json' with {type:'json'};
import scoring from './exploration/scoring.json' with {type:'json'};
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const answerProfile=(id='SW',choice='A')=>{const p=createDraft(id);p.synthetic=true;p.exploration.answers=Object.fromEntries(questionsFor(id).map(q=>[q.id,choice]));return p;};
const questionOriginals=Object.values(manifest.sha256); // Independent author package hashes, not generated test snapshots.
test('1–3: author-supplied content and scoring are unchanged, 10 directions each load exactly 4+8 different questions',()=>{
 assert.equal(directions.length,10);assert.equal(bank.questions.length,84);
 const source=path.join(root,manifest.source_directory),fullName=Object.keys(manifest.sha256).find(n=>n.endsWith('_V2.json'));
 const full=JSON.parse(fs.readFileSync(path.join(source,fullName),'utf8'));
 const markdown=fs.readFileSync(path.join(source,Object.keys(manifest.sha256).find(n=>n.endsWith('.md'))),'utf8');
 for(const [filename,hash] of Object.entries(manifest.sha256))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(source,filename))).digest('hex'),hash);
 for(const filename of ['bank.json','scoring.json'])assert.ok(questionOriginals.includes(createHash('sha256').update(fs.readFileSync(path.join(root,'prototype/exploration',filename))).digest('hex')));
 for(const d of directions){const questions=questionsFor(d.id);assert.equal(questions.length,12);assert.equal(questions.filter(q=>q.direction_id==='COMMON').length,4);assert.equal(questions.filter(q=>q.direction_id===d.id).length,8);
  const profile=createDraft(d.id);assert.equal(Array.from({length:6},(_,i)=>pageQuestions(profile,i+1)).flat().length,12);
  for(const q of questions){const original=full.questions.find(x=>x.id===q.id);assert.equal(q.question,original.question);assert.ok(markdown.includes(q.question));assert.equal(q.required,false);assert.deepEqual(q.options,original.options.map(({id,text})=>({id,text})));assert.ok(q.options.some(o=>o.id==='U'));
   for(const option of original.options){assert.ok(markdown.includes(option.text));assert.deepEqual(scoring.rules[q.id].options[option.id],{score:option.score,tag:option.tag});}
  }
 }
 assert.throws(()=>questionsFor('made-up'));
});
test('4: every actual option reaches its own author rule; no preference score and U is never zero',()=>{
 for(const d of directions)for(const q of questionsFor(d.id))for(const option of q.options){
  const profile=answerProfile(d.id);profile.exploration.answers[q.id]=option.id;
  const result=analyzeExploration(profile.exploration),selected=result.selected.find(x=>x.questionId===q.id),rule=scoring.rules[q.id].options[option.id];
  assert.equal(selected.score,rule.score);assert.equal(selected.tag,rule.tag);assert.equal(selected.text,option.text);
  if(option.id==='U'){assert.equal(selected.score,null);assert.equal(selected.unknown,true);}
  if(['interest','problem_style','subdomain','scenario_preference','growth_tradeoff','motivation','career_goal','constraints'].includes(q.facet))assert.equal(selected.score,null);
 }
});
test('unknown/skip differs from stage zero; no empty profile, unassessed direction or lack of experience produces a fit judgement',()=>{
 for(const d of directions){
  const zero=analyzeExploration(answerProfile(d.id).exploration),unknown=analyzeExploration(answerProfile(d.id,'U').exploration),empty=analyzeExploration(createDraft(d.id).exploration);
  assert.equal(zero.stages.experience.score,0);assert.equal(unknown.stages.experience.score,null);assert.equal(empty.stages.experience.score,null);
  assert.equal(unknown.evidence.known,0);assert.equal(unknown.evidence.keyMissing.length,4);assert.equal(empty.evidence.provided,0);
  assert.deepEqual(validateExploration(createDraft(d.id)),{});assert.ok(Object.keys(validateExploration(createDraft())).includes('direction'));
  const r=buildLocalReport(answerProfile(d.id));assert.ok(r.ranking.every(x=>x.score===null));assert.equal(r.ranking.length,2);
  assert.ok(r.ranking.every(x=>x.id.startsWith('explore:'+d.id+':')));
 }
});
test('switching directions keeps common answers, prunes previous direction answers and never guesses ratings',()=>{
 const p=answerProfile('SW');setDirection(p,'HLT');assert.equal(p.exploration.answers.G01,'A');assert.ok(!('SW01' in p.exploration.answers));assert.equal(Object.keys(p.exploration.answers).length,4);assert.equal(p.assessment,undefined);
 p.exploration.answers.HLT01='wrong';assert.ok(validateExploration(p).HLT01);assert.throws(()=>analyzeExploration(p.exploration),/INVALID_OPTION/);
});
test('5: all ten directions reach rich reports and every existing report page while AI and external data are unavailable',()=>{
 const previous=globalThis.fetch;let calls=0;globalThis.fetch=()=>{calls++;throw Error('no network');};
 try{for(const d of directions){const p=answerProfile(d.id),r=buildLocalReport(p,'zh-CN');
  assert.equal(r.questionnaireVersion,'2.0.0');assert.equal(r.exploration.selected.length,12);assert.equal(r.analysis.paths.length,2);assert.ok(r.analysis.paths.every(x=>x.weeks.length===3));
  for(const page of ['capability','impact','paths','plan']){setLanguage('zh-CN');const html=renderExplorationSection(r,page);assert.ok(html.length>1000);assert.ok(!html.includes('undefined'));assert.ok(!html.includes('/100'));}
  for(const renderer of [renderCareerStarMap,renderCareerComparison,renderSkillDNA,renderTimeMachine,renderSDGMapper])assert.ok(!renderer(r).includes('undefined'));
  assert.equal(buildCareerExplorerModel(r).paths.length,2);assert.ok(simulateCareer(r).schedule.length);
 }assert.equal(calls,0);}finally{globalThis.fetch=previous;setLanguage('en');}
});
test('6: What-if uses the same deterministic stages, never infers experience from time and preserves the original report',()=>{
 const p=answerProfile('DATA'),r=buildLocalReport(p),before=structuredClone(r),base=simulateExploration(r.exploration);
 const moreTime=simulateExploration(r.exploration,{hours:10});assert.equal(moreTime.experience,base.experience);assert.equal(moreTime.effortHours,base.effortHours);assert.ok(moreTime.weeks<=base.weeks);
 const assumed=simulateExploration(r.exploration,{experience:'D',hours:1});assert.equal(assumed.experience,3);assert.equal(assumed.assumedExperience,true);assert.equal(assumed.scaffold,'independent');
 assert.equal(simulateExploration(r.exploration,{experience:'U'}).experience,null);assert.throws(()=>simulateExploration(r.exploration,{experience:'bad'}));
 renderExplorationSimulator(r,{experience:'D',hours:1});assert.deepEqual(r,before);assert.deepEqual(p.exploration,answerProfile('DATA').exploration);
 assert.deepEqual(buildLocalReport(p,'en',{experience:'D',hours:1}).simulation,assumed);
});
test('7: trilingual chrome keeps the exact Chinese questions as a marked block without invented translations or repeated consent',()=>{
 for(const locale of ['en','zh-CN','ms']){setLanguage(locale);
  for(const d of directions){const p=answerProfile(d.id);
   const entry=renderExplorationIntake(p,0);assert.ok(!entry.includes('type="checkbox"'));assert.ok(entry.includes('exploration-direction'));
   for(let step=1;step<=6;step++){const html=renderExplorationIntake(p,step);assert.equal((html.match(/data-question-id=/g)||[]).length,2);assert.ok(!html.includes('type="checkbox"'));assert.ok(!html.includes('textarea'));assert.ok(html.includes('lang="zh-CN"'));
    for(const q of pageQuestions(p,step))assert.ok(html.includes(q.question.replaceAll('&','&amp;')));
    if(locale!=='zh-CN')assert.ok(html.includes('v2-language-notice'));
   }
   const r=buildLocalReport(p,locale);assert.equal(r.language,locale);assert.deepEqual(r.exploration,analyzeExploration(p.exploration));assert.ok(!renderExplorationSection(r,'capability').includes('/100'));
  }
 }setLanguage('en');
});
test('reviewed source context is retained only for genuine mappings; six unmapped directions never inherit an unrelated occupation',()=>{
 for(const d of directions){const r=buildLocalReport(answerProfile(d.id));const allowed=contextRoles[d.id];
  for(const row of r.ranking)for(const fact of row.facts)assert.ok(allowed.some(id=>(r.knowledge.links[id]||[]).includes(fact.source+':'+fact.id)));
  if(!allowed.length)assert.ok(r.ranking.every(row=>row.facts.length===0&&row.source_id===''));
  assert.ok(!renderTimeMachine(r).includes(' · null · US'));
 }
});
test('fictional examples remain visibly different, and all twelve answers survive the optional AI contract without changing its protected endpoint',async()=>{
 const a=exampleProfile('marketing'),b=exampleProfile('admin');assert.notEqual(a.exploration.direction,b.exploration.direction);assert.notDeepEqual(buildLocalReport(a).exploration,buildLocalReport(b).exploration);
 for(const d of directions){let captured;const p=answerProfile(d.id,'U'),r=buildLocalReport(p);const run=createOptionalAI(async payload=>{captured=payload;return {analysis:{summary:{text:'Test only'}}};});
  await run(r.profile,'en');assert.equal(captured.exploration,undefined);assert.ok(captured.additionalContext.length<=1600);assert.equal(captured.synthetic,true);
  for(const q of questionsFor(d.id))assert.ok(captured.additionalContext.includes(q.id));assert.ok(captured.additionalContext.includes('not validated aptitude'));
 }
});
test('form collection retains hidden-page answers and passes real option IDs to scoring',()=>{
 const original=globalThis.FormData;
 globalThis.FormData=class{constructor(form){this.data=form.data;}get(name){return this.data.get(name)??null;}};
 try{
  const p=answerProfile('MKT');
  const form={data:new Map([['explore-MKT01','D'],['explore-MKT02','U']]),querySelector:selector=>selector.includes('explore-MKT01')||selector.includes('explore-MKT02')};
  collectExploration(form,p);const result=analyzeExploration(p.exploration);
  assert.equal(result.preferences.interest.tag,'analytics');assert.equal(result.stages.experience.score,null);assert.equal(p.exploration.answers.G01,'A');assert.equal(p.exploration.answers.MKT07,'A');
 }finally{globalThis.FormData=original;}
});
test('actual V2 optional serializer matches the shared Python validation contract for all directions',async()=>{
 const fixture=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/questionnaire-v2-optional.json'),'utf8'));
 for(let i=0;i<directions.length;i++){
  const p=createDraft(directions[i].id);p.synthetic=true;
  p.exploration.answers=Object.fromEntries(questionsFor(p.exploration.direction).map(q=>[q.id,[...q.options].sort((a,b)=>b.text.length-a.text.length)[0].id]));
  let payload;await createOptionalAI(async value=>{payload=value;return {};})(buildLocalReport(p).profile);
  assert.deepEqual(payload,fixture[i]);assert.ok(payload.skills.startsWith('Not assessed'));assert.ok(payload.tasks.startsWith('Proposed practice'));
 }
});
test('V2 optional AI failure leaves the complete base report and What-if available',async()=>{
 const r=buildLocalReport(exampleProfile('marketing')),before=structuredClone(r);
 await assert.rejects(()=>createOptionalAI(async()=>{throw Error('429');})(r.profile));
 assert.deepEqual(r,before);assert.ok(renderExplorationSection(r,'capability').includes('data-action="page:paths"'));assert.ok(renderExplorationSimulator(r).includes('data-v2-simulator'));
});
test('exploration goal changes actionable guidance while leaving exposure and AI strategy stages unchanged',()=>{
 const a=answerProfile('MKT'),b=structuredClone(a);a.exploration.answers.G02='A';b.exploration.answers.G02='D';
 const ra=buildLocalReport(a),rb=buildLocalReport(b);
 assert.notEqual(ra.goalAdvice,rb.goalAdvice);assert.notEqual(ra.analysis.paths[0].weeks[0].action.text,rb.analysis.paths[0].weeks[0].action.text);
 assert.deepEqual(ra.exploration.stages,rb.exploration.stages);
});
