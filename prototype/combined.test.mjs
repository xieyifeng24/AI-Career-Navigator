import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
// Canonical LF checksums preserve author-content checks on Windows CRLF checkouts.
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
test('PR8 engine and catalogs plus PR9 question source are unchanged',()=>{
 for(const path of ['prototype/explorer-engine.js','prototype/explorer-catalog.json']){
  const bytes=fs.readFileSync(new URL('../'+path,import.meta.url));assert.equal(createHash('sha256').update(bytes.toString('utf8').replace(/\r\n/g,'\n')).digest('hex'),manifest.original_pr8_hashes[path]);
 }
 assert.equal(createHash('sha256').update(fs.readFileSync(new URL('./v3/bank.json',import.meta.url)).toString('utf8').replace(/\r\n/g,'\n')).digest('hex'),manifest.v3_author_sha256);
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
