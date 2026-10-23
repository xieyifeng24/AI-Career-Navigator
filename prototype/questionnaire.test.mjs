import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {options,initialAnswers,renderQuestion,collectAnswers,validateAnswers,toggleExclusive,submissionProfile,renderSupplement} from './questionnaire.js';
import {language,setLanguage,detectLanguage,t,localize,errorMessage} from './i18n.js';
import {emptyProfile,validateStep} from './logic.js';
import {requestAnalysis,renderLiveReport} from './live.js';
const answers=()=>({background:'software',experience:'student',tasks:['code','research'],skills:['programming','critical'],aiUsage:'frequent',concerns:['automation','skills'],goal:'internship',constraints:['budget'],custom:{}});
const profile=()=>({...emptyProfile(),answers:answers(),hours:'3',synthetic:true});
const fields=['background','experience','tasks','skills','aiUse','concerns','goal','hours','constraints'];
function form(values,consent) {
 return {values,querySelector(selector){
  if(selector==='#synthetic')return consent===undefined?null:{checked:consent};
  const match=/name="([^"]+)"/.exec(selector);return match&&Object.hasOwn(values,match[1])?{}:null;
 }};
}
function collect(values,p,changed,consent) {
 const Original=globalThis.FormData;
 globalThis.FormData=class {constructor(f){this.values=f.values;}getAll(key){const v=this.values[key];return v===undefined?[]:Array.isArray(v)?v:[v];}get(key){return this.getAll(key)[0];}has(key){return Object.hasOwn(this.values,key);}};
 try {collectAnswers(form(values,consent),p,changed);}finally {globalThis.FormData=Original;}
}
test('shared options have unique stable IDs and complete three-language labels',()=>{
 for(const [key,rows] of Object.entries(options)) {
  assert.equal(new Set(rows.map(r=>r[0])).size,rows.length,key);
  for(const row of rows){assert.equal(row.length,4);assert.ok(row.every(v=>typeof v==='string'&&v.length));}
 }
 const catalog=JSON.parse(readFileSync(new URL('./translations.json',import.meta.url)));
 for(const [key,value] of Object.entries(catalog))for(const locale of ['zh-CN','ms'])assert.ok(value[locale],`${locale}: ${key}`);
});
test('browser language detection uses primary locale and falls back to English',()=>{
 for(const [input,expected] of [['zh-TW','zh-CN'],['en-MY','en'],['ms-MY','ms'],['ja-JP','en']])assert.equal(detectLanguage([input]),expected);
 assert.equal(detectLanguage(['fr-FR','zh-CN']),'en');assert.equal(detectLanguage([]),'en');
});
test('manual language preference is saved; changing languages preserves the entire draft',()=>{
 const original=globalThis.localStorage,writes=[];globalThis.localStorage={setItem:(...v)=>writes.push(v)};
 const p=profile();p.answers.custom.concerns='Keep my own text <unchanged>';const before=structuredClone(p);
 try{for(const locale of ['zh-CN','en','ms']){setLanguage(locale);assert.deepEqual(p,before);assert.equal(language,locale);}}
 finally{globalThis.localStorage=original;setLanguage('en');}
 assert.deepEqual(writes.at(-1),['career-language','ms']);
});
test('all four steps render and validate in each supported language without typing',()=>{
 for(const locale of ['zh-CN','en','ms']){
  setLanguage(locale);const p=profile();
  for(let i=0;i<4;i++)assert.deepEqual(validateStep(p,i,'live'),{});
  for(const field of fields){const html=renderQuestion(field,p,{});assert.ok(!html.includes('undefined'));assert.ok(html.includes('field-'));}
  assert.ok(renderQuestion('aiUse',p,{}).includes(t('How have you used AI tools so far?')));
  const payload=submissionProfile({...p,language:locale});assert.deepEqual(payload.answers.concerns,['automation','skills']);assert.equal(payload.answers.aiUsage,'frequent');assert.equal(payload.language,locale);assert.equal(payload.hours,3);
 }setLanguage('en');
});
test('none is exclusive with all other concerns, including Other',()=>{
 assert.deepEqual(toggleExclusive(['skills','none'],'none',true),['none']);
 assert.deepEqual(toggleExclusive(['none','other'],'other',true),['other']);
 assert.deepEqual(toggleExclusive(['none','automation'],'automation',true),['automation']);
 const p=profile();collect({'answer-concerns':['skills','none']},p,{name:'answer-concerns',value:'none',checked:true});assert.deepEqual(p.answers.concerns,['none']);
 collect({'answer-concerns':['none','automation']},p,{name:'answer-concerns',value:'automation',checked:true});assert.deepEqual(p.answers.concerns,['automation']);
});
test('radio, multi-select, other input, unchecked selection and navigation retain correct values',()=>{
 const p=profile();collect({'answer-aiUsage':'advanced','answer-concerns':['other'],'custom-concerns':'A fictional concern'},p);
 assert.equal(p.answers.aiUsage,'advanced');assert.equal(p.aiUse,'Advanced AI user');assert.deepEqual(p.answers.concerns,['other']);assert.equal(p.concerns,'A fictional concern');assert.deepEqual(validateAnswers(p,2),{});
 const before=structuredClone(p.answers);collect({'answer-goal':'upgrade',hours:'8','answer-constraints':['none']},p,undefined,true);
 assert.deepEqual(p.answers.tasks,before.tasks);assert.equal(p.answers.custom.concerns,before.custom.concerns);assert.equal(p.hours,'8');assert.equal(p.synthetic,true);
 collect({'answer-concerns':[]},p);assert.deepEqual(p.answers.concerns,[]);assert.ok(validateAnswers(p,2).concerns);
});
test('Other does not force typing; at least two tasks and synthetic consent remain required',()=>{
 const p=profile();p.answers.concerns=['other'];assert.deepEqual(validateStep(p,2,'live'),{});
 p.answers.custom.concerns='Fictional uncertainty';assert.deepEqual(validateStep(p,2,'live'),{});
 p.answers.tasks=['code'];assert.ok(validateStep(p,1,'live').tasks);
 p.synthetic=false;assert.ok(validateStep(p,3,'live').synthetic);
});
test('submission prunes inactive custom text without modifying the editable draft',()=>{
 const p=profile();p.answers.custom.concerns='Hidden draft';p.answers.custom.goal='Other saved goal';
 const payload=submissionProfile(p);assert.deepEqual(payload.answers.custom,{});assert.equal(p.answers.custom.concerns,'Hidden draft');assert.ok(!('scenario' in payload));
});
test('localized HTML safely escapes custom input and preserves stable option values',()=>{
 const p=profile();p.answers.concerns=['other'];p.answers.custom.concerns='<img src=x onerror="alert(1)">';
 setLanguage('ms');p.additionalContext=p.answers.custom.concerns;const html=renderQuestion('concerns',p,{})+renderSupplement(p);assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;img'));assert.ok(html.includes('value="automation"'));assert.ok(html.includes('Tiada kebimbangan utama'));setLanguage('en');
});
test('UI localization never translates user-authored text nodes',()=>{
 const previousDocument=globalThis.document,previousFilter=globalThis.NodeFilter;
 const ui={textContent:' Continue ',parentElement:{closest:()=>false}},user={textContent:'Continue',parentElement:{closest:()=>true}};
 let i=-1;globalThis.document={documentElement:{},createTreeWalker:()=>({nextNode(){i++;this.currentNode=[ui,user][i];return i<2;}})};globalThis.NodeFilter={SHOW_TEXT:4};
 try{setLanguage('zh-CN');localize({querySelectorAll:()=>[]});assert.equal(ui.textContent,' 下一步 ');assert.equal(user.textContent,'Continue');}
 finally{globalThis.document=previousDocument;globalThis.NodeFilter=previousFilter;setLanguage('en');}
});
test('unknown backend and network errors have a translated, non-disclosing fallback',()=>{
 for(const locale of ['zh-CN','ms']){setLanguage(locale);const key=errorMessage('SECRET internal exception',503);assert.ok(!key.includes('SECRET'));assert.notEqual(t(key),key);assert.notEqual(t(errorMessage('',422)),errorMessage('',422));}setLanguage('en');
});
test('each language reaches the actual submission boundary with unchanged answer IDs and CSRF',async()=>{
 const original=globalThis.fetch;
 try{for(const locale of ['zh-CN','en','ms']){
  const seen=[];globalThis.fetch=async(url,init)=>{seen.push({url,init});return {ok:true,json:async()=>url==='/api/session'?{csrf_token:'TEST-CSRF'}:{mode:'real-ai',analysis:{},language:locale,inference:{request_id:'TEST-ONLY'}}};};
  await requestAnalysis({...profile(),language:locale});const body=JSON.parse(seen[1].init.body);
  assert.equal(body.language,locale);assert.deepEqual(body.answers,answers());assert.equal(seen[1].init.headers['X-CSRF-Token'],'TEST-CSRF');assert.ok(!('X-Demo-Code' in seen[1].init.headers));
 }}finally{globalThis.fetch=original;}
});
test('translated live reports retain citations, selected path and XSS escaping',()=>{
 const r=JSON.parse(readFileSync(new URL('../tests/fixtures/report.json',import.meta.url),'utf8'));
 for(const locale of ['zh-CN','en','ms']){setLanguage(locale);for(const page of ['capability','impact','paths','plan'])for(const path of ['A','B']){
  const html=renderLiveReport(r,page,path);assert.ok(!html.includes('undefined'));assert.ok(html.includes('source-links'));assert.ok(!html.includes('<script>'));
 }}setLanguage('en');
});

test('the complete questionnaire exposes exactly one optional text box in every language, even with every Other selected',()=>{
 const p=profile();for(const key of ['background','tasks','skills','concerns','goal','constraints'])p.answers[key]=['tasks','skills','concerns','constraints'].includes(key)?(key==='tasks'?['research','other']:['other']):'other';
 for(const locale of ['en','zh-CN','ms']){setLanguage(locale);
  const html=fields.map(key=>renderQuestion(key,p,{})).join('')+renderSupplement(p);
  assert.equal((html.match(/<textarea/g)||[]).length,1);assert.ok(!html.includes('type="text"'));assert.ok(!html.includes('name="custom-'));
  assert.ok(!/<textarea[^>]*\srequired/.test(html));for(let i=0;i<4;i++)assert.deepEqual(validateStep(p,i,'live'),{});
 }setLanguage('en');
 collect({additionalContext:'Fictional interest in accessible software'},p);assert.equal(submissionProfile(p).additionalContext,'Fictional interest in accessible software');
 collect({additionalContext:''},p);assert.deepEqual(validateStep(p,3,'live'),{});
 p.additionalContext='private@example.com';assert.ok(validateStep(p,3,'live').additionalContext);
});
test('global report language also controls What-if without a competing language selector',()=>{
 const r=JSON.parse(readFileSync(new URL('../tests/fixtures/report.json',import.meta.url)));
 for(const [locale,title] of [['en','What-if Career Simulator'],['zh-CN','职业假设模拟器'],['ms','Simulator Senario Kerjaya']]){setLanguage(locale);const html=renderLiveReport(r,'paths','B');assert.ok(html.includes(title));assert.ok(!html.includes('id="sim-language"'));assert.ok(html.includes('value="B" selected'));}setLanguage('en');
});
