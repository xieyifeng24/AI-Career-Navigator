import test from 'node:test';
import assert from 'node:assert/strict';
import snapshot from '../data/knowledge/current.json' with {type:'json'};
import {buildLocalReport,scoreProfile,installKnowledge,refreshKnowledge} from './local/engine.js';
import {provenancePanel,renderRuleSimulator,renderLocalReport} from './local/ui.js';
import {sampleProfile} from './logic.js';
import {setLanguage} from './i18n.js';
const profile=()=>sampleProfile('marketing');
test('real source facts and geography/date/official links remain visible in all three languages',()=>{
 for(const locale of ['en','zh-CN','ms']){
  setLanguage(locale);const r=buildLocalReport(profile(),locale);
  assert.equal(r.knowledge.records.length,14);assert.ok(r.ranking.every(row=>row.facts.length===2));
  const html=provenancePanel(r);
  assert.ok(html.includes('MYFutureJobs'));assert.ok(html.includes('https://www.onetonline.org/'));assert.ok(html.includes('https://esco.ec.europa.eu/'));
  assert.ok(html.includes('US'));assert.ok(html.includes('EU'));assert.ok(!html.includes('undefined'));assert.ok(html.includes('CC BY 4.0'));
  for(const row of r.ranking)for(const fact of row.facts)assert.ok(html.includes(fact.verified_at));
 }setLanguage('en');
});
test('a new validated fact updates report modules without changing editorial matching scores',()=>{
 const before=buildLocalReport(profile()),updated=structuredClone(snapshot);
 const fact=updated.records.find(x=>x.source==='onet'&&x.id==='13-1161.00');
 fact.description='Changed public occupational description for update test.';updated.version='TEST-CHANGED';
 try{
  installKnowledge(updated);const after=buildLocalReport(profile());
  assert.equal(after.ranking.find(x=>x.id===fact.id).summary,fact.description);
  assert.ok(after.analysis.paths.some(p=>p.why.text.includes(fact.description)));
  assert.deepEqual(after.ruleScores,before.ruleScores);assert.equal(after.evidence.version,'TEST-CHANGED');
  // Previously generated report and What-if retain their exact source version.
  assert.notEqual(before.knowledge.version,after.knowledge.version);
  assert.ok(!renderRuleSimulator(before,{ratings:{technical:5}}).includes('TEST-CHANGED'));
  assert.equal(buildLocalReport(before.profile,'ms',{},before.knowledge).knowledge.version,before.knowledge.version);
 }finally{installKnowledge(snapshot);}
});
test('all core operations remain available with external sources and AI completely unavailable',async()=>{
 const previous=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('all external services unavailable');};
 try{
  assert.equal(await refreshKnowledge(),false);assert.equal(calls,1);
  for(const locale of ['en','zh-CN','ms']){
   setLanguage(locale);const r=buildLocalReport(profile(),locale);scoreProfile(profile());
   for(const page of ['capability','paths','impact','plan'])assert.ok(renderLocalReport(r,page,'A').length>1000);
   assert.ok(renderRuleSimulator(r,{ratings:{analysis:5}}).includes('→'));
  }
  assert.equal(calls,1,'No question/report/language/What-if operation may request any API');
 }finally{globalThis.fetch=previous;setLanguage('en');}
});
test('malformed public updates are rejected and leave current knowledge intact',async()=>{
 const current=buildLocalReport(profile()).knowledge.version;
 const bad=structuredClone(snapshot);bad.records[0].geography='MY';
 assert.throws(()=>installKnowledge(bad));
 assert.equal(await refreshKnowledge(async()=>({ok:true,json:async()=>({snapshot:{}})})),false);
 assert.equal(buildLocalReport(profile()).knowledge.version,current);
});
