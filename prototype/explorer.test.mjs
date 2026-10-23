import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {catalog,fieldMap,blankProfile,visibleFields,updateChoice,validateProfile,canonicalProfile,rankCareers,generateOfflineReport,buildPlan,sampleProfile,possibleProfileCount,outputInventory} from './explorer-engine.js';
import {renderForm,renderReport,renderCatalog,renderGoals,renderHome,sections,escapeHTML} from './explorer-views.js';
import {setLanguage} from './i18n.js';
const p=()=>sampleProfile();
const states=()=>({page:'overview',profile:p(),step:0,errors:{},report:generateOfflineReport(p()),focus:'software',goal:9,allCareers:false});
function nonemptySubsets(values){return Array.from({length:(1<<values.length)-1},(_,n)=>values.filter((_,i)=>((n+1)>>i)&1));}
function assertSound(r){
 assert.equal(r.mode,'offline-rules');assert.equal(r.ranking.length,24);assert.equal(new Set(r.ranking.map(x=>x.id)).size,24);assert.equal(r.goals.length,17);
 for(const id of [...r.learning,...r.ai])assert.ok(catalog.advice[id],id);
 assert.equal(r.plan.weeks.length,4);assert.equal(r.plan.totalHours,r.plan.weeklyHours*4);
 assert.equal(Object.values(r.plan.split).reduce((a,b)=>a+b,0),r.plan.weeklyHours);
 assert.ok(r.plan.weeks.every(w=>w.hours>0&&w.hours===r.plan.weeklyHours));
 for(const x of r.ranking)assert.equal(Object.values(x.components).reduce((a,b)=>a+b,0),x.score);
 for(let i=1;i<r.ranking.length;i++)assert.ok(r.ranking[i-1].score>=r.ranking[i].score);
}
test('complete trilingual catalog covers all 17 goals, 24 careers, 32 advice modules and 249 region codes',()=>{
 assert.equal(catalog.careers.length,24);assert.equal(catalog.goals.length,17);assert.equal(Object.keys(catalog.advice).length,32);assert.equal(catalog.countries.length,249);assert.equal(new Set(catalog.countries).size,249);
 assert.deepEqual(catalog.goals.map(x=>x.id),Array.from({length:17},(_,i)=>i+1));assert.equal(new Set(catalog.goals.map(x=>x.code)).size,17);
 for(const g of catalog.goals)assert.equal(g.url,`https://sdgs.un.org/goals/goal${g.id}`);
 const covered=new Set(catalog.careers.flatMap(r=>r.sdgs));for(const g of catalog.goals)assert.ok(covered.has(g.id),'No career connection for SDG '+g.id);
 function walk(v,key){if(Array.isArray(v)&&v.length===3&&v.every(x=>typeof x==='string')&&!['interests','majors','mindsets','purposes','fields'].includes(key)){for(const s of v)assert.ok(s.trim());}else if(Array.isArray(v))v.forEach(x=>walk(x,key));else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>walk(x,k));}walk(catalog);
});
test('no answer is silently selected for required questions; optional fields default to undisclosed',()=>{
 const b=blankProfile();assert.equal(b.gender,'undisclosed');assert.equal(b.nationality,'undisclosed');assert.ok(validateProfile(b,0).age);assert.ok(validateProfile(b,0).education);assert.deepEqual(validateProfile(p()),{});
});
test('university major and high-school stream are conditional; stale hidden values cannot change reports',()=>{
 const a=p();a.education='senior';a.stream='science';assert.ok(visibleFields(a,0).includes('stream'));assert.ok(!visibleFields(a,0).includes('major'));
 const r=generateOfflineReport(a);a.major='art';assert.deepEqual(generateOfflineReport(a),r);assert.ok(!('major' in r.profile));
 a.education='primary';assert.ok(!visibleFields(a,0).includes('stream'));assert.ok(!visibleFields(a,0).includes('major'));assert.ok(!('stream' in canonicalProfile(a)));
 a.education='doctor';assert.ok(visibleFields(a,0).includes('major'));assert.ok(generateOfflineReport(a).learning.includes('research-extension'));
});
test('multi-select ordering is canonical and none is exclusive with every AI purpose',()=>{
 const a=p();a.aiPurposes=['none'];a.aiDuration='garbage';a.reliance='garbage';assert.deepEqual(validateProfile(a,2),{});assert.ok(!visibleFields(a,2).includes('aiDuration'));
 assert.deepEqual(generateOfflineReport(a).ai,['ai-none']);assert.ok(!('reliance' in canonicalProfile(a)));
 updateChoice(a,'aiPurposes','coding',true);assert.deepEqual(a.aiPurposes,['coding']);updateChoice(a,'aiPurposes','none',true);assert.deepEqual(a.aiPurposes,['none']);
 const x=p(),y=p();y.interests.reverse();y.learningStyles.reverse();y.aiPurposes.reverse();assert.deepEqual(generateOfflineReport(x),generateOfflineReport(y));
});
test('invalid IDs, malformed multi-selects, duplicates and exclusive combinations fail before report generation',()=>{
 for(const change of [{age:'invented'},{interests:[]},{interests:['tech','tech']},{mindsets:'science'},{aiPurposes:['none','coding']},{nationality:'<script>'},{weeklyTime:99}]){
  const a={...p(),...change};assert.ok(Object.keys(validateProfile(a)).length);assert.throws(()=>generateOfflineReport(a));
 }
});
test('same answers yield byte-identical results across repetition, language and ignored hidden keys',()=>{
 const a=p(),before=JSON.stringify(a),one=JSON.stringify(generateOfflineReport(a));
 for(let i=0;i<20;i++)assert.equal(JSON.stringify(generateOfflineReport(a)),one);
 for(const locale of ['zh-CN','en','ms']){setLanguage(locale);assert.equal(JSON.stringify(generateOfflineReport({...a,language:locale,notAField:'ignored'})),one);}setLanguage('en');
 assert.equal(JSON.stringify(a),before);
});
test('gender and nationality never alter career or SDG ranking or advice',()=>{
 const baseline=generateOfflineReport(p());for(const gender of fieldMap.gender.options.map(o=>o.id))for(const nationality of ['CN','MY','IN','US','undisclosed']){
  const r=generateOfflineReport({...p(),gender,nationality});assert.deepEqual(r.ranking,baseline.ranking);assert.deepEqual(r.goals,baseline.goals);assert.deepEqual(r.learning,baseline.learning);
 }
});
test('personality and self-rated learning ability shape advice and pacing, never career points',()=>{
 const base=generateOfflineReport(p());
 for(const social of ['introvert','extrovert'])for(const planning of ['planned','spontaneous'])for(const decision of ['rational','empathetic'])for(const learningAbility of ['support','steady','confident']){
  const r=generateOfflineReport({...p(),social,planning,decision,learningAbility});assert.deepEqual(r.ranking,base.ranking);assert.ok(r.learning.includes(`ability-${learningAbility}`));assertSound(r);
 }
});
test('changing interests or subject evidence changes the ranked exploration options',()=>{
 const a=generateOfflineReport({...p(),interests:['art'],major:'art',mindsets:['art'],aiPurposes:['creative']}),b=generateOfflineReport({...p(),interests:['tech'],major:'software',mindsets:['science'],aiPurposes:['coding']});assert.notEqual(a.ranking[0].id,b.ranking[0].id);assert.ok(a.ranking[0].reasons.interests.includes('art'));
});
test('all scalar options, interests, learning styles, mindset subsets and AI combinations have defined outcomes',()=>{
 const coverage=new Set();
 for(const f of catalog.fields.filter(f=>!f.multi))for(const o of f.options){let a=p();a[f.id]=o.id;if(f.id==='stream')a.education='senior';if(f.id==='major')a.education='bachelor';if(a.education==='senior'&&!a.stream)a.stream='science';if(!validateProfile(a)[f.id]){const r=generateOfflineReport(a);assertSound(r);[...r.learning,...r.ai].forEach(x=>coverage.add(x));}}
 for(const key of ['interests','learningStyles','mindsets'])for(const subset of nonemptySubsets(fieldMap[key].options.map(o=>o.id))){const r=generateOfflineReport({...p(),[key]:subset});assertSound(r);[...r.learning,...r.ai].forEach(x=>coverage.add(x));}
 for(const purposes of [['none'],...nonemptySubsets(['homework','summary','coding','creative'])])for(const aiDuration of ['under1','1to6','6to12','over12'])for(const reliance of ['light','moderate','heavy']){const r=generateOfflineReport({...p(),aiPurposes:purposes,aiDuration,reliance});assertSound(r);r.ai.forEach(x=>coverage.add(x));}
 // Stage branches not all reached by the single-field tests.
 for(const a of [{...p(),age:'child'},{...p(),age:'teen'},{...p(),status:'graduated'}])generateOfflineReport(a).learning.forEach(x=>coverage.add(x));
 assert.deepEqual([...coverage].sort(),Object.keys(catalog.advice).sort());
});
test('every career can be selected as a plan and every age/time/support combination respects pacing',()=>{
 for(const age of fieldMap.age.options.map(o=>o.id))for(const weeklyTime of fieldMap.weeklyTime.options.map(o=>o.id))for(const learningAbility of fieldMap.learningAbility.options.map(o=>o.id))for(const role of catalog.careers){
  const a={...p(),age,weeklyTime,learningAbility},plan=buildPlan(a,role.id);assert.ok(plan.weeklyHours>0&&plan.weeklyHours<=12);assert.equal(plan.roleId,role.id);assert.equal(Object.values(plan.split).reduce((x,y)=>x+y),plan.weeklyHours);if(age==='child')assert.ok(plan.weeklyHours<=2);if(age==='teen')assert.ok(plan.weeklyHours<=4);
 }
 assert.throws(()=>buildPlan(p(),'fake-role'));
});
test('all report pages, all companion selections and the complete output catalog render in three languages',()=>{
 for(const locale of ['zh-CN','en','ms']){setLanguage(locale);const state=states();
  for(const page of sections){const html=renderReport({...state,page});assert.ok(!html.includes('undefined'));assert.ok(!html.includes('[object Object]'));assert.ok(!html.includes('NaN'));}
  for(let step=0;step<4;step++){const html=renderForm({...state,step});assert.ok(html.includes('progressbar'));assert.ok(!html.includes('undefined'));}
  for(const g of catalog.goals){const html=renderGoals({...state,goal:g.id});assert.ok(html.includes(g.code));assert.ok(html.includes(g.url));}
  assert.ok(renderCatalog().includes(String(possibleProfileCount()).slice(0,1)));assert.ok(renderHome().includes('data-action="start"'));
 }setLanguage('en');
});
test('offline entry point and import graph contain no runtime networking or prediction requests',()=>{
 const files=['offline-app.js','explorer-engine.js','explorer-views.js','i18n.js'];
 for(const file of files){const src=readFileSync(new URL('./'+file,import.meta.url),'utf8');assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|requestAnalysis|requestMatching/.test(src),file);}
 const original=globalThis.fetch;globalThis.fetch=()=>{throw new Error('No networking allowed');};try{assertSound(generateOfflineReport(p()));assert.ok(renderReport(states()));}finally{globalThis.fetch=original;}
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');assert.ok(html.includes('src="./bootstrap.js"'));const bootstrap=readFileSync(new URL('./bootstrap.js',import.meta.url),'utf8');assert.ok(bootstrap.includes("import('./offline-app.js')"));assert.ok(!html.includes('src="./app.js"')); // Isolated offline route is retained behind the shared bootstrap.
});
test('avatar sprite positions reference precisely 17 distinct cells and all labels are escaped',()=>{
 const positions=new Set();for(const g of catalog.goals){const html=renderGoals({...states(),goal:g.id});assert.ok(html.includes('role="img"'));positions.add(`${(g.id-1)%6},${Math.floor((g.id-1)/6)}`);}assert.equal(positions.size,17);assert.equal(escapeHTML('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
 const bytes=readFileSync(new URL('./sdg-characters.png',import.meta.url));assert.ok(bytes.length>1000);assert.equal(bytes.readUInt32BE(16),2*bytes.readUInt32BE(20));
});
test('finite configuration count and output inventory are stable and do not claim distinct career outcomes',()=>{
 assert.equal(possibleProfileCount(),41562794700000n);const i=outputInventory();assert.equal(i.usesNetwork,false);assert.equal(i.careerIds.length,24);assert.equal(i.goalIds.length,17);assert.ok(i.excludedFromCareerScores.includes('nationality'));
});

test('the versioned reference profile retains its reviewed exact output snapshot',()=>{
 const expected=JSON.parse(readFileSync(new URL('../tests/fixtures/offline-report.json',import.meta.url),'utf8'));
 assert.deepEqual(generateOfflineReport(sampleProfile()),expected);
});

test('every direct offline UI translation key has Chinese and Malay resources',()=>{
 const translations=JSON.parse(readFileSync(new URL('./translations.json',import.meta.url),'utf8'));
 for(const file of ['explorer-views.js','offline-app.js'])for(const [,key] of readFileSync(new URL('./'+file,import.meta.url),'utf8').matchAll(/\b(?:T|t)\('([^']+)'/g)){
  assert.ok(translations[key]?.['zh-CN'],`Missing Chinese: ${key}`);assert.ok(translations[key]?.ms,`Missing Malay: ${key}`);
 }
});
