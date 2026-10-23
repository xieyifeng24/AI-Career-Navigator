import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleProfile, validateStep, makeReport, recommendedPath } from './logic.js';

test('both demo cases have distinct task impact and action plan content', () => {
  const marketing = makeReport(sampleProfile('marketing'));
  const admin = makeReport(sampleProfile('admin'));
  assert.notDeepEqual(marketing.scenario.tasks, admin.scenario.tasks);
  assert.notEqual(marketing.scenario.plan.A.project, admin.scenario.plan.A.project);
});

test('validation blocks missing answers and unrealistic weekly hours', () => {
  const p = sampleProfile('admin');
  p.hours = '0';
  assert.ok(validateStep(p, 3).hours);
  p.hours = '2';
  assert.deepEqual(validateStep(p, 3), {});
});

test('goal changes suggested starting path while leaving choice open', () => {
  assert.equal(recommendedPath(sampleProfile('marketing')), 'A');
  assert.equal(recommendedPath(sampleProfile('admin')), 'B');
});

import { escapeHTML, requestAnalysis } from './live.js';
import { renderCareerStarMap, buildCareerStarMapModel } from './star-map.js';
import { buildCareerExplorerModel, renderCareerComparison, renderSkillDNA, renderTimeMachine, renderSDGMapper, renderExplorationPlan } from './career-explorer.js';
test('live intake permits arbitrary fictional occupations but requires consent', () => {
  const p={...sampleProfile('marketing'),scenario:'',background:'Fictional librarian'};
  assert.deepEqual(validateStep(p,0,'live'),{});
  assert.ok(validateStep(p,3,'live').synthetic);
  p.synthetic=true;
  assert.deepEqual(validateStep(p,3,'live'),{});
});
test('model text is escaped before rendering', () => {
  assert.equal(escapeHTML('<img src=x onerror="alert(1)">'),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
test('failed AI request never substitutes scripted output', async () => {
  const original=globalThis.fetch;
  globalThis.fetch=async()=>({ok:false,json:async()=>({detail:'RunPod unavailable'})});
  try { await assert.rejects(()=>requestAnalysis(sampleProfile('admin')),/RunPod unavailable/); }
  finally {globalThis.fetch=original;}
});
test('a mock-shaped response cannot masquerade as real inference', async () => {
  const original=globalThis.fetch;
  globalThis.fetch=async url=>({ok:true,json:async()=>url==='/api/session'?{csrf_token:'fixture-token'}:{mode:'demo',analysis:{}}});
  try {await assert.rejects(()=>requestAnalysis(sampleProfile('admin')),/did not identify real inference/);}
  finally {globalThis.fetch=original;}
});

import { readFileSync } from 'node:fs';
import { renderLiveReport, renderMatching } from './live.js';
test('all live report sections render from the synthetic contract fixture', () => {
  const report=JSON.parse(readFileSync(new URL('../tests/fixtures/report.json',import.meta.url),'utf8'));
  for(const page of ['capability','impact','paths','plan']) {
    for(const path of ['A','B']) {
      const html=renderLiveReport(report,page,path);
      assert.ok(html.includes('TEST FIXTURE — NO MODEL INFERENCE'));
      assert.ok(!html.includes('undefined'));
      assert.ok(html.includes('Source links provide context'));
    }
  }
  const html=renderMatching({...report,note:'Test fixture'});
  assert.ok(html.includes('NO AI INFERENCE'));
  report.analysis.summary.text='<script>alert(1)</script>';
  assert.ok(!renderLiveReport(report,'capability','A').includes('<script>'));
});

test('live third source candidate is selectable and opens a clearly limited exploration plan', () => {
  const report=JSON.parse(readFileSync(new URL('../tests/fixtures/report.json',import.meta.url),'utf8'));
  const candidate={...report.ranking[1],id:'operations',title:'Business Operations Specialists',source_id:'onet:project'};
  report.ranking.push(candidate);
  const pathsHtml=renderLiveReport(report,'paths','C');
  assert.match(pathsHtml,/PATH C · SOURCE MATCH/);
  assert.match(pathsHtml,/Business Operations Specialists/);
  assert.match(pathsHtml,/Current focus ✓/);
  assert.match(pathsHtml,/not fully analyzed by the model/);
  const model=buildCareerExplorerModel(report);
  assert.equal(model.paths.length,3);
  assert.equal(model.paths[2].id,'C');
  const plan=renderExplorationPlan(report,'C');
  assert.match(plan,/Business Operations Specialists/);
  assert.match(plan,/not an AI-generated four-week plan/i);
});

test('career star map is built from the existing live report paths and evidence', () => {
  const report = JSON.parse(readFileSync(new URL('../tests/fixtures/report.json', import.meta.url), 'utf8'));
  const model = buildCareerStarMapModel(report);
  assert.equal(model.mode, 'live');
  assert.equal(model.paths.length, 2);
  assert.equal(model.paths[0].id, 'A');
  assert.equal(model.paths[0].market.geography, 'US');
  assert.equal(model.paths[0].market.period, '2025-2035');
  assert.equal(model.paths[0].sdg.target, '4.4');
  const html = renderCareerStarMap(report, 'B', true);
  assert.match(html, /data-action="map-select:B"[^>]*aria-pressed="true"/);
  assert.match(html, /US · 2025-2035/);
  assert.match(html, /SDG 4\.4/);
  assert.match(html, /Practice a skill using synthetic evidence/);
  assert.match(html, /Possible measure:/);
  assert.match(html, /UN Goal 4/);
  assert.match(html, /not measured impact/i);
  assert.doesNotMatch(html, /undefined/);
});

test('scripted demo star map does not invent market or SDG evidence', () => {
  const report = makeReport(sampleProfile('marketing'));
  const html = renderCareerStarMap(report, 'B');
  assert.match(html, /DEMO \/ MOCK/);
  assert.match(html, /Marketing specialist/);
  assert.match(html, /Marketing operations \/ growth analysis/);
  assert.match(html, /No verified market signal in this report/);
  assert.match(html, /No supported SDG mapping is available in this report/);
  assert.doesNotMatch(html, /undefined/);
  const mappedHtml = renderCareerStarMap(report, 'C');
  assert.match(mappedHtml, /SDG 8\.2/);
  assert.match(mappedHtml, /Enabling hypothesis/);
});

test('career star map escapes profile and role content before rendering', () => {
  const report = JSON.parse(readFileSync(new URL('../tests/fixtures/report.json', import.meta.url), 'utf8'));
  report.profile.background = '<script>alert(1)</script>';
  report.profile.skills = '<img src=x onerror=alert(1)>; writing';
  const html = renderCareerStarMap(report, 'A');
  assert.doesNotMatch(html, /<script>|<img src=x/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img src=x/);
});

test('career explorer adds a clearly marked source-based third route', () => {
  const report = JSON.parse(readFileSync(new URL('../tests/fixtures/report.json', import.meta.url), 'utf8'));
  report.ranking.push({ ...report.ranking[1], id: 'extra-role', title: 'Additional occupational candidate' });
  const model = buildCareerExplorerModel(report);
  assert.equal(model.paths.length, 3);
  assert.equal(model.paths[2].id, 'C');
  assert.match(model.paths[2].evidenceKind, /not fully analyzed/i);
  assert.match(renderCareerComparison(report, 'A', 'C'), /Compare paths without locking one in/);
  assert.match(renderCareerComparison(report, 'A', 'C'), /not fully analyzed/i);
});

test('skill DNA, time machine, and SDG mapper render their evidence limits', () => {
  const report = JSON.parse(readFileSync(new URL('../tests/fixtures/report.json', import.meta.url), 'utf8'));
  const skillView = renderSkillDNA(report, 'A', 'Writing');
  assert.match(skillView, /Writing/);
  assert.match(skillView, /Self-reported/);
  assert.match(skillView, /not an independent skill assessment/i);
  assert.match(skillView, /data-action="route-select:/);
  const timeView = renderTimeMachine(report, '2035', 'fast');
  assert.match(timeView, /2035/);
  assert.match(timeView, /not a prediction/i);
  assert.match(timeView, /not year-by-year AI forecasts/i);
  const sdgView = renderSDGMapper(report, 'A');
  assert.match(sdgView, /WORK TASK/);
  assert.match(sdgView, /SDG 4\.4/);
  assert.match(sdgView, /not measured impact/i);
  assert.match(sdgView, /not classified/i);
  const demoReport = makeReport(sampleProfile('marketing'));
  const demoMapping = renderSDGMapper(demoReport, 'C');
  assert.match(demoMapping, /Market Research Analysts and Marketing Specialists/);
  assert.match(demoMapping, /Collect and analyze data on customer demographics/);
  assert.match(demoMapping, /Enabling hypothesis/);
  assert.match(demoMapping, /https:\/\/www\.onetonline\.org\/link\/summary\/13-1161\.00/);
  assert.match(demoMapping, /https:\/\/sdgs\.un\.org\/goals\/goal8/);
  assert.match(demoMapping, /not proof of productivity gain/i);
});

test('skill tree orders prerequisites from basics to advanced skills', async () => {
  const { buildSkillTree, defaultLit } = await import('./skill-tree.js');
  const { buildCareerExplorerModel, renderSkillDNA } = await import('./career-explorer.js');
  const tree = buildSkillTree(buildCareerExplorerModel(makeReport(sampleProfile('admin'))));
  assert.deepEqual(tree.routes.find(r => r.id === 'A').needs, ['Safe AI use', 'Workflow measurement', 'Operational context']);
  assert.deepEqual(tree.profileSkills, ['Scheduling', 'process documentation', 'stakeholder support', 'detail checking']);
  const lit = defaultLit(tree);
  assert.deepEqual([...lit].sort(), ['core', 'core::detail checking', 'core::process documentation', 'core::scheduling', 'core::stakeholder support'].sort());
  assert.equal(tree.items[0].parentKey, 'core');
  assert.equal(tree.items[1].parentKey, tree.items[0].key);
});

test('skill tree orders prerequisites while every step stays selectable', async () => {
  const { buildSkillTree, defaultLit, itemState } = await import('./skill-tree.js');
  const { buildCareerExplorerModel } = await import('./career-explorer.js');
  const tree = buildSkillTree(buildCareerExplorerModel(makeReport(sampleProfile('marketing'))));
  const lit = defaultLit(tree);
  const [first, second, third] = tree.routes[0].items;
  assert.equal(itemState(first, lit, tree), 'available');
  assert.equal(itemState(second, lit, tree), 'available');
  assert.equal(itemState(third, lit, tree), 'available');
  lit.add(first.key);
  assert.equal(itemState(first, lit, tree), 'lit');
  assert.equal(itemState(second, lit, tree), 'available');
  assert.equal(itemState(third, lit, tree), 'available');
  lit.delete(first.key);
  assert.equal(itemState(first, lit, tree), 'available');
});

test('skill tree renders every remaining step as selectable with a reset control', async () => {
  const { renderSkillDNA } = await import('./career-explorer.js');
  const html = renderSkillDNA(makeReport(sampleProfile('admin')), 'A', '', {});
  assert.equal((html.match(/tree-node is-lit/g) ?? []).length, 0);
  assert.equal((html.match(/tree-node is-available/g) ?? []).length, 3);
  assert.match(html, /data-action="tree-reset"/);
  assert.doesNotMatch(html, /Workflow measurement<\/span><small>/);
});

test('saved skill tree state is validated against the current report', async () => {
  const { buildSkillTree, sanitizeLit } = await import('./skill-tree.js');
  const { buildCareerExplorerModel } = await import('./career-explorer.js');
  const tree = buildSkillTree(buildCareerExplorerModel(makeReport(sampleProfile('admin'))));
  const lit = sanitizeLit(tree, ['core', 'A::safe ai use', 'Z::not a skill', 42]);
  assert.deepEqual([...lit], ['core', 'A::safe ai use']);
  assert.deepEqual([...sanitizeLit(tree, null)], []);
});

test('anonymous request uses CSRF and no shared access code', async () => {
  const original=globalThis.fetch;const seen=[];
  globalThis.fetch=async(url,options)=>{seen.push({url,options});return {ok:true,json:async()=>url==='/api/session'?{csrf_token:'fixture-token'}:{mode:'real-ai',analysis:{},inference:{request_id:'FIXTURE-NOT-LIVE'}}};};
  try {await requestAnalysis({...sampleProfile('admin'),synthetic:true});assert.equal(seen[1].options.headers['X-CSRF-Token'],'fixture-token');assert.ok(!('X-Demo-Code' in seen[1].options.headers));assert.equal(JSON.parse(seen[1].options.body).synthetic,true);}
  finally {globalThis.fetch=original;}
});
