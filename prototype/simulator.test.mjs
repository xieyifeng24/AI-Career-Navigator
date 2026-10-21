import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {simulateCareer,renderSimulator,simulatorResults} from './simulator.js';
import {conciseProse,renderLiveReport} from './live.js';

const fixture=()=>JSON.parse(readFileSync(new URL('../tests/fixtures/report.json',import.meta.url),'utf8'));
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}return value;}

test('time changes scheduling without changing scores, skills, recommendations or source data',()=>{
  const report=freeze(fixture()),before=JSON.stringify(report);
  const slow=simulateCareer(report,{hours:1,reviewWeeks:2}),fast=simulateCareer(report,{hours:8,reviewWeeks:2});
  assert.ok(slow.fullWeeks>fast.fullWeeks);
  assert.equal(slow.totalHours,fast.totalHours);
  assert.equal(slow.role.score,fast.role.score);
  assert.deepEqual(slow.path.gaps,fast.path.gaps);
  assert.equal(JSON.stringify(report),before);
  for(const result of [slow,fast]){
    assert.ok(result.schedule.every(slot=>slot.minutes<=result.options.hours*60));
    assert.equal(result.schedule.reduce((n,slot)=>n+slot.minutes,0),Math.round(result.totalHours*60));
  }
});

test('splits and combines existing tasks in order while preserving deliverables and validation',()=>{
  const report=fixture();report.analysis.paths[0].weeks.forEach((w,i)=>{w.hours=1.5;w.deliverable=`deliverable-${i}`;});
  const result=simulateCareer(report,{hours:2});
  assert.equal(result.fullWeeks,3);
  assert.equal(result.totalHours,6);
  for(const original of report.analysis.paths[0].weeks){
    const pieces=result.schedule.flatMap(w=>w.items).filter(x=>x.source.week===original.week);
    assert.equal(pieces.reduce((n,x)=>n+x.minutes,0),90);
    assert.ok(pieces.every(x=>x.source.deliverable===original.deliverable&&x.source.validation===original.validation));
  }
});

test('earlier review reduces visible work without promising earlier employment or dropping remaining work',()=>{
  const report=fixture(),short=simulateCareer(report,{hours:1,reviewWeeks:1}),long=simulateCareer(report,{hours:1,reviewWeeks:8});
  assert.equal(short.visible.length,1);
  assert.ok(short.remainingHours>0);
  assert.ok(short.scheduledHours<long.scheduledHours);
  assert.equal(short.totalHours,long.totalHours);
  assert.match(simulatorResults(report,{hours:1,reviewWeeks:1}),/not a prediction of employment/);
});

test('salary and interest priorities change explanation, never rankings or work estimates',()=>{
  const report=fixture(),before=JSON.stringify(report.ranking);
  const salary=simulateCareer(report,{priority:'salary'}),interest=simulateCareer(report,{priority:'interest'});
  assert.equal(salary.fullWeeks,interest.fullWeeks);
  assert.match(simulatorResults(report,{priority:'salary'}),/no salary figures/);
  assert.match(simulatorResults(report,{priority:'interest'}),/whether you enjoy the work/);
  assert.equal(JSON.stringify(report.ranking),before);
});

test('direction selection reuses the other path and its official source and resources',()=>{
  const report=fixture(),chosen=simulateCareer(report,{path:'B'});
  assert.equal(chosen.path,report.analysis.paths.find(p=>p.kind==='B'));
  const html=simulatorResults(report,{path:'B',hours:40,reviewWeeks:8});
  assert.ok(html.includes(report.evidence.sources[chosen.role.source_id].url));
  for(const w of chosen.path.weeks) assert.ok(html.includes(report.evidence.sources[w.resource_id].url));
});

test('simulator has English, Chinese and Malay labels, escapes inputs and bounds invalid choices',()=>{
  const report=fixture();report.profile.goal='<img src=x onerror=alert(1)>';
  for(const [language,label] of [['en','What-if Career Simulator'],['zh','职业假设模拟器'],['ms','Simulator Senario Kerjaya']]){
    const html=renderSimulator(report,{language});
    assert.ok(html.includes(label));assert.ok(!html.includes('<img'));
    assert.ok(html.includes('data-sim-control="hours"'));assert.ok(!html.includes('undefined'));
  }
  const safe=simulateCareer(report,{hours:Infinity,reviewWeeks:-5,path:'bad',priority:'bad',language:'__proto__'});
  assert.equal(safe.options.hours,40);assert.equal(safe.options.reviewWeeks,4);assert.equal(safe.options.language,'en');
});

test('concise prose removes adjacent repetition without dropping caveats, figures or distinct advice',()=>{
  const text='Review the data. Review the data. Do not use real CVs. Allow 3.5 hours. Verify the final result.';
  const concise=conciseProse(text);
  assert.equal(concise.match(/Review the data\./g).length,1);
  assert.ok(concise.includes('Do not use real CVs. Allow 3.5 hours. Verify the final result.'));
  const report=fixture(),html=renderLiveReport(report,'plan','A');
  for(const w of report.analysis.paths[0].weeks){assert.ok(html.includes(w.deliverable));assert.ok(html.includes(w.validation));assert.ok(html.includes(report.evidence.sources[w.resource_id].url));}
});
