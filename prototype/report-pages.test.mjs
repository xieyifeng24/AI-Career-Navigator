import test from 'node:test';
import assert from 'node:assert/strict';
import {bank,questionsFor,chooseTrack,selectAnswer,advance,newSession} from './v3/engine.js';
import {fresh,restore} from './combined/model.js';
import {buildCompatibleReport,renderCompatibleReport,reportPages} from './combined/v2-report.js';
import {pageIds,pageLabels,pageKickers,galaxySections,canonicalPage,canonicalGalaxySection,pageTarget} from './combined/page-map.js';
import {buildCapability,CAPABILITY_LEVELS,simulatePlanCapacity,buildWhatIf,WHATIF_RULE,buildImpact,IMPACT_RULE,buildProvenance} from './combined/report-model.js';
import {sampleProfile} from './explorer-engine.js';
import {setLanguage} from './i18n.js';

function stateFor(answers,locale='en',track='SW'){
 let v3=chooseTrack(newSession({legacy:true}),track);
 for(const q of questionsFor(track))v3=advance(selectAnswer(v3,q.id,answers[q.id]??null));
 return {...fresh(locale),profile:sampleProfile(),v3,phase:'report',page:'profile'};
}
const all=v=>{const answers={};for(const q of questionsFor('SW'))answers[q.id]=v;return answers;};
const persona={G01:7,G02:6,G03:6,G04:6,SW01:7,SW02:6,SW03:6,SW04:6,SW05:6,SW06:5,SW07:5,SW08:7};

test('five pages carry distinct labels, kickers and stable galaxy sections',()=>{
 assert.deepEqual(pageIds,['profile','capability','galaxy','whatif','impact']);
 assert.deepEqual(reportPages,pageIds);
 for(const page of pageIds){
  assert.equal(pageLabels[page].length,3);assert.equal(pageKickers[page].length,3);
  assert.ok(pageLabels[page].every(text=>typeof text==='string'&&text.length));
 }
 assert.deepEqual(galaxySections,['paths','map','compare','skills']);
});

test('legacy page keys resolve to one of the five pages without losing their section',()=>{
 const expected={overview:'profile',ai:'capability',careers:'galaxy',map:'galaxy',compare:'galaxy',paths:'galaxy',tree:'galaxy',future:'whatif',plan:'whatif',sdg:'impact',catalog:'impact'};
 for(const [legacy,page] of Object.entries(expected)){
  assert.equal(canonicalPage(legacy),page);
  assert.equal(pageTarget(legacy).page,page);
 }
 assert.deepEqual(pageTarget('paths'),{page:'galaxy',section:'compare'});
 assert.deepEqual(pageTarget('tree'),{page:'galaxy',section:'skills'});
 assert.deepEqual(pageTarget('galaxy','skills'),{page:'galaxy',section:'skills'});
 assert.deepEqual(pageTarget('profile','skills'),{page:'profile',section:null});
 assert.equal(canonicalPage('unknown-page'),'profile');
 assert.equal(canonicalGalaxySection('unknown-section'),'map');
});

test('AI practice band is a two-dimension ordinal rule, never a competence score',()=>{
 const high=buildCapability(buildCompatibleReport(stateFor(all(7))).signals);
 assert.equal(high.available,true);
 assert.equal(high.level,5);
 assert.equal(high.verified,false);assert.equal(high.competenceClaim,false);
 const low=buildCapability(buildCompatibleReport(stateFor(all(1))).signals);
 assert.equal(low.level,1);
 const none=buildCapability(buildCompatibleReport(stateFor(all(null))).signals);
 assert.equal(none.available,false);assert.equal(none.partial,false);assert.equal(none.level,null);
 assert.equal(CAPABILITY_LEVELS[high.level].length,3);
 assert.deepEqual(high.evidenceIds,high.practice.ids.concat(high.verification.ids));
});

test('one answered AI dimension never places a band',()=>{
 const answers={...all(null)};
 const practice=questionsFor('SW').filter(q=>q.construct==='ai_practice');
 assert.ok(practice.length);
 for(const q of practice)answers[q.id]=7;
 const cap=buildCapability(buildCompatibleReport(stateFor(answers)).signals);
 assert.equal(cap.available,false);assert.equal(cap.partial,true);assert.equal(cap.level,null);
 assert.match(renderCompatibleReport({...stateFor(answers),page:'capability'}),/ai-inspector/);
});

test('what-if reschedules a fixed sample by budget and forecasts nothing',()=>{
 const atFive=simulatePlanCapacity({planHours:5,availableHours:5});
 assert.equal(atFive.fullWeeks,4);assert.equal(atFive.planMinutes,1200);assert.equal(atFive.scheduledMinutes,1200);
 const atTwo=simulatePlanCapacity({planHours:5,availableHours:2});
 assert.equal(atTwo.fullWeeks,10);assert.equal(atTwo.scheduledMinutes,1200);
 const atZero=simulatePlanCapacity({planHours:5,availableHours:0});
 assert.equal(atZero.fullWeeks,0);assert.equal(atZero.scheduledMinutes,0);
 const model=buildWhatIf({planHours:2,planHorizon:8});
 assert.equal(model.rule,WHATIF_RULE);assert.equal(model.availableHours,2);assert.equal(model.paceHours,5);
 assert.equal(model.forecast,false);assert.equal(model.sourceHours,20);
 assert.deepEqual(model.milestones.map(m=>m.weeks),[8,52,104]);
 assert.equal(model.milestones[0].cycles,0);assert.equal(model.milestones[2].cycles,10);
 const html=renderCompatibleReport({...stateFor(persona),page:'whatif'},{assumptions:{planHours:2,planHorizon:8}});
 assert.match(html,/MILESTONE COMPARISON/);
 assert.match(html,/Time schedules practice/);
 assert.doesNotMatch(html,/undefined|NaN/);
});

test('impact ranks only declared catalog links from the chosen direction',()=>{
 const impact=buildImpact('SW');
 assert.equal(impact.rule,IMPACT_RULE);assert.equal(impact.verified,false);assert.equal(impact.measuredImpact,false);
 assert.ok(impact.ranked.length>0);
 for(const row of impact.ranked){assert.deepEqual(row.reasons.interests,[]);assert.equal(row.weight,row.reasons.careers.length);}
 const weights=impact.ranked.map(r=>r.weight);assert.deepEqual(weights,[...weights].sort((a,b)=>b-a));
 assert.deepEqual(buildImpact('NOPE').ranked,[]);
});

test('provenance separates official, derived and interpretation sources',()=>{
 const model=buildCompatibleReport(stateFor(persona));
 const types=new Set(model.provenance.map(row=>row.type));
 assert.deepEqual([...types].sort(),['derived','interpretation','official']);
 for(const row of model.provenance){assert.ok(row.name);assert.ok(row.geography);assert.ok(row.scale);}
 const official=model.provenance.filter(row=>row.type==='official'&&['onet','esco'].includes(row.id));
 for(const row of official){assert.match(row.url,/^https:\/\//);assert.ok(row.date);}
 assert.ok(model.provenance.some(row=>row.id==='rules'&&row.type==='derived'));
 assert.ok(model.provenance.some(row=>row.id==='catalog'&&row.type==='interpretation'));
});

test('every page and locale renders the five-page shell without a live request',()=>{
 for(const track of bank.tracks)for(const locale of bank.languageCodes){
  setLanguage(locale);const state=stateFor(persona,locale,track.id);
  for(const page of pageIds){
   const html=renderCompatibleReport({...state,page});
   assert.match(html,/data-compatible-analysis/);
   assert.doesNotMatch(html,/undefined|NaN|\[object Object\]/);
   assert.ok(html.includes(pageLabels[page][{en:0,'zh-CN':1,ms:2}[locale]]));
  }
 }
 setLanguage('en');
});

test('galaxy sections are switchable and never declare a winning route',()=>{
 setLanguage('en');const state=stateFor(persona);
 const seen=galaxySections.map(section=>renderCompatibleReport({...state,page:'galaxy',section}));
 for(const [index,html] of seen.entries()){
  assert.ok(html.includes(`data-galaxy-section="${galaxySections[index]}"`));
  assert.equal((html.match(/data-combined-action="section:/g)||[]).length,galaxySections.length);
 }
 assert.notEqual(seen[0],seen[1]);
});

test('saved sessions restore to a canonical page and keep the galaxy section',()=>{
 const state=stateFor(persona);
 assert.equal(restore(JSON.stringify({...state,page:'plan'}),'en').page,'whatif');
 assert.equal(restore(JSON.stringify({...state,page:'tree'}),'en').section,'skills');
 assert.equal(restore(JSON.stringify({...state,page:'paths'}),'en').section,'compare');
 assert.equal(restore(JSON.stringify({...state,page:'nonsense'}),'en').page,'profile');
 assert.deepEqual(restore(JSON.stringify(state),'en').v3.answers,state.v3.answers);
});
