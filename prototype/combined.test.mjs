import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fresh,restore,save,load,STORAGE_KEY,VERSION,nextBackground,reportFor,updateBackground} from './combined/model.js';
import {sampleProfile,generateOfflineReport,catalog} from './explorer-engine.js';
import {bank,chooseTrack,selectAnswer,advance,changeLanguage} from './v3/engine.js';
import manifest from './combined/source-manifest.json' with {type:'json'};
function complete(track,answer,locale='en'){
 let state={...fresh(locale),profile:sampleProfile()};
 for(let i=0;i<4;i++){const next=nextBackground(state);assert.deepEqual(next.errors,{});state=next.state;}
 assert.equal(state.phase,'v3');state.v3=chooseTrack(state.v3,track);
 for(const q of bank.questions.filter(q=>q.trackId==='GENERAL'||q.trackId===track)){state.v3=selectAnswer(state.v3,q.id,answer);state.v3=advance(state.v3);}
 return state;
}
test('PR8 catalog and PR9 question source are unchanged',()=>{
 for(const path of ['prototype/explorer-catalog.json']){
  const bytes=fs.readFileSync(new URL('../'+path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.original_pr8_hashes[path]);
 }
 assert.equal(createHash('sha256').update(fs.readFileSync(new URL('./v3/bank.json',import.meta.url))).digest('hex'),manifest.v3_author_sha256);
});
test('every direction and language composes a report without converting or scoring V3',()=>{
 const expected=generateOfflineReport(sampleProfile());
 for(const track of bank.tracks)for(const lang of bank.languageCodes)for(const answer of [1,7,null]){
  const state=complete(track.id,answer,lang),report=reportFor(state);
  assert.deepEqual(report.base,expected);assert.equal(report.selfReport.language,lang);assert.equal(report.selfReport.trackId,track.id);
  assert.equal(Object.keys(report.selfReport.answers).length,12);assert.ok(Object.values(report.selfReport.answers).every(x=>x===answer));
  assert.deepEqual(restore(JSON.stringify({...state,phase:'report',focus:report.base.ranking[0].id,goal:report.base.goals[0].id})).v3,state.v3);
 }
});
test('language-only changes preserve both separate answer models and rankings',()=>{
 const state=complete('FIN',4),before=structuredClone(state);
 for(const lang of bank.languageCodes){const next={...state,v3:changeLanguage(state.v3,lang)};assert.deepEqual(next.profile,state.profile);assert.deepEqual(reportFor(next).base,reportFor(state).base);assert.deepEqual(next.v3.answers,state.v3.answers);}
 assert.deepEqual(state,before);
});
test('base questions validate before V3; unsupported and incomplete states cannot produce reports',()=>{
 const state=fresh();const next=nextBackground(state);assert.equal(next.state,state);assert.ok(next.errors.age);
 assert.throws(()=>reportFor(state),/INCOMPLETE_V3/);
 assert.throws(()=>reportFor({...complete('DATA',7),v3:{...complete('DATA',7).v3,version:'2.0.0'}}),/INCOMPLETE_V3/);
 assert.equal(restore(JSON.stringify({version:'2.0.0'})).version,VERSION);
 const changed=updateBackground(state,'age','young');assert.equal(state.profile.age,'');assert.equal(changed.profile.age,'young');
 assert.throws(()=>updateBackground(state,'nationality','not-a-country'),/INVALID_COUNTRY/);
});
test('combined refresh is isolated from standalone V3, V2, malformed, partial and disabled storage',()=>{
 const data=new Map([['career-questionnaire-v3-phase1','unchanged'],['legacy-v2','A']]);
 const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
 const partial={...fresh('ms'),profile:sampleProfile(),step:2};assert.ok(save(storage,partial));assert.deepEqual(load(storage),partial);
 const completeState={...complete('OPS',null,'zh-CN'),phase:'report'};assert.ok(save(storage,completeState));assert.deepEqual(load(storage),completeState);
 assert.equal(data.get('career-questionnaire-v3-phase1'),'unchanged');assert.equal(data.get('legacy-v2'),'A');assert.ok(data.has(STORAGE_KEY));
 for(const altered of [{...completeState,profile:{age:'x'}},{...completeState,v3:{version:'2.0.0'}},{...completeState,step:99}])assert.equal(restore(JSON.stringify(altered)).phase,'background');
 const blocked={getItem(){throw Error('denied');},setItem(){throw Error('quota');}};assert.equal(load(blocked).phase,'background');assert.equal(save(blocked,partial),false);
});

test('removed personality step cannot block intake or reuse stale personality and interest answers',()=>{
 const profile={...sampleProfile(),omitPersonalityInterests:true};
 let state={...fresh(),profile};
 for(const step of [0,2,3]){assert.equal(state.step,step);const next=nextBackground(state);assert.deepEqual(next.errors,{});state=next.state;}
 assert.equal(state.phase,'v3');
 const report=generateOfflineReport(profile);
 assert.equal(report.preferenceCode,'—');assert.deepEqual(report.profile.interests,[]);
 assert.equal(report.profile.social,null);
 assert.ok(report.ranking.every(r=>r.components.interests===0));
 assert.ok(report.learning.every(id=>!/^social-|^planning-|^decision-/.test(id)));
});

test('three-step intake reaches all reports and preserves V3 and language without deleted questions',async()=>{
 const {withoutPersonalityInterests}=await import('./combined/model.js');
 const {renderForm}=await import('./explorer-views.js');
 const {setLanguage}=await import('./i18n.js');
 const {renderCompatibleReport,reportPages}=await import('./combined/v2-report.js');
 for(const locale of bank.languageCodes)for(const track of bank.tracks){
  let state={...fresh(locale),profile:withoutPersonalityInterests({...sampleProfile(),exactWeeklyHours:7.5})};
  for(const step of [0,2,3]){
   setLanguage(locale);const html=renderForm({...state,errors:{}});
   assert.ok(!html.includes('field-nationality'));
   for(const field of ['social','planning','decision','interests','learningAbility','learningStyles','mindsets'])assert.ok(!html.includes(`field-${field}`));
   if(step===3){assert.match(html,/type="range"/);assert.match(html,/type="number"/);assert.doesNotMatch(html,/name="weeklyTime"/);}
   assert.equal(state.step,step);state=nextBackground(state).state;
  }
  state.v3=chooseTrack(state.v3,track.id);
  for(const q of bank.questions.filter(q=>q.trackId==='GENERAL'||q.trackId===track.id))state.v3=advance(selectAnswer(state.v3,q.id,5));
  state={...state,phase:'report'};
  assert.equal(Object.keys(reportFor(state).selfReport.answers).length,12);
  assert.equal(restore(JSON.stringify(state)).phase,'report');
  for(const page of reportPages)assert.ok(renderCompatibleReport({...state,page},{path:'A',assumptions:{}}).length>100);
 }
});

test('exact learning hours survive refresh, drive planning and never increase career points',async()=>{
 const {withoutPersonalityInterests}=await import('./combined/model.js');
 const {validateProfile}=await import('./explorer-engine.js');
 const base=withoutPersonalityInterests(sampleProfile());
 assert.equal(base.exactWeeklyHours,null);
 assert.ok(validateProfile(base,3).weeklyTime); // Old time bands are not guessed as exact hours.
 let ranking;
 for(const hours of [0,0.5,7.5,60]){
  const state=updateBackground({...fresh(),profile:base,step:3},'exactWeeklyHours',hours);
  assert.deepEqual(validateProfile(state.profile,3),{});
  const report=generateOfflineReport(state.profile);
  assert.equal(report.plan.weeklyHours,hours);
  assert.equal(report.plan.totalHours,hours*4);
  assert.equal(Object.values(report.plan.split).reduce((a,b)=>a+b,0),hours);
  assert.ok(Object.values(report.plan.split).every(x=>x>=0));
  if(ranking)assert.deepEqual(report.ranking,ranking);ranking=report.ranking;
  assert.equal(restore(JSON.stringify(state)).profile.exactWeeklyHours,hours);
  assert.deepEqual(report.profile.mindsets,[]);
  assert.ok(report.ranking.every(r=>r.components.mindsets===0));
  assert.ok(report.learning.every(id=>!/^ability-|^style-/.test(id)));
 }
 for(const invalid of [-1,61,1.1,'7.5',NaN])assert.throws(()=>updateBackground({...fresh(),profile:base},'exactWeeklyHours',invalid),/INVALID_WEEKLY_HOURS/);
});

test('current questionnaire has behavioral choices, desired-direction title and no repeat notice or answer review',async()=>{
 const {renderPreview}=await import('./v3/ui.js');
 const {completeAssessment,withoutPersonalityInterests}=await import('./combined/model.js');
 const options={hideUnknown:true,hideNotice:true,directionTitle:'Your preferred career direction'};
 const titles={en:'Your preferred career direction','zh-CN':'你希望的职业方向',ms:'Arah kerjaya pilihan anda'};
 for(const locale of bank.languageCodes)for(const track of bank.tracks){
  let state={...fresh(locale),profile:withoutPersonalityInterests({...sampleProfile(),exactWeeklyHours:8})};
  const entry=renderPreview(state.v3,'',false,options);
  assert.ok(entry.includes(titles[locale]));assert.doesNotMatch(entry,/class="v3-notice"/);
  state.v3=chooseTrack(state.v3,track.id);
  for(let index=0;index<12;index++){
   const html=renderPreview(state.v3,'',false,options);
   assert.ok((html.match(/name="v3-behavior"/g)||[]).length>=5);
   assert.match(html,/value="unknown"/);
   const q=bank.questions.filter(q=>q.trackId==='GENERAL'||q.trackId===track.id)[index];
   state.v3=advance(selectAnswer(state.v3,q.id,index%7+1));
  }
  const completed=completeAssessment(state);
  assert.equal(completed.phase,'report');assert.equal(completed.page,'profile');
  const unknown={...state,v3:{...state.v3,answers:{...state.v3.answers,G01:null}}};
  assert.equal(completeAssessment(unknown).phase,'report'); // V4 retains independent unknown state.
 }
});
