import {mountCombined,hasCombinedDraft} from './combined/app.js';
import {shouldPlayIntro,playIntroduction,consumeIntroParameter} from './intro.js';
import {createDraft,isV2,exampleProfile,validateExploration} from './exploration/engine.js';
import {renderExplorationIntake,collectExploration,V2_STEPS,renderExplorationSimulator,explorationNotice,translationNotice} from './exploration/ui.js';
import {buildLocalReport,refreshKnowledge} from './local/engine.js';
import {rulesNotice,renderRatings,collectRatings,localErrors,renderLocalReport,renderRuleSimulator,provenancePanel,localText} from './local/ui.js';
import {optionalAI} from './local/optional-ai.js';
import { renderSimulator, simulatorDefaults, simulateCareer, simulatorResults, simulatorHoursLabel } from './simulator.js';
import {t, language, setLanguage, localize, errorMessage} from './i18n.js';
import {renderQuestion, collectAnswers, initialAnswers, answerText, renderSupplement} from './questionnaire.js';
import { requestAnalysis, renderLiveReport, requestMatching, renderMatching } from './live.js';
import { cases, steps } from './data.js';
import { emptyProfile, sampleProfile, validateStep, makeReport, recommendedPath } from './logic.js';
import { renderCareerStarMap } from './star-map.js';
import { renderCareerComparison, renderSkillDNA, renderTimeMachine, renderSDGMapper, renderExplorationPlan, buildCareerExplorerModel } from './career-explorer.js';

const root = document.getElementById('app');
const legacyAssessment = new URLSearchParams(location.search).get('assessment') === 'v2';
let combinedActive=false,combinedUnmount=null;
function startCombined(){
 combinedUnmount?.();combinedActive=true;
 combinedUnmount=mountCombined({root,onHome:()=>{combinedUnmount?.();combinedUnmount=null;combinedActive=false;state.page='home';state.report=null;render();}});
}
const state = { page: 'home', step: 0, profile: emptyProfile(), report: null, path: 'A', comparePath: 'B', selectedSkill: '', timeYear: '2026', timeScenario: 'moderate', errors: {}, mode: 'live', health: null, busy: false, apiError: '', controller: null, radar: null, matching: null, simulator: null, localScenario:{ratings:{}}, ai:{busy:false,result:null,error:'',consent:false} };
const reportPages = ['star-map', 'compare', 'skill-dna', 'time-machine', 'sdg-map', 'capability', 'impact', 'paths', 'plan'];
const pageLabels = { 'star-map': 'Career map', compare: 'Compare paths', 'skill-dna': 'Skill DNA', 'time-machine': 'Time machine', 'sdg-map': 'SDG mapper', capability: 'Capabilities', impact: 'AI & work', paths: 'Career paths', plan: 'Action plan' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nl = value => esc(value).replace(/\n/g, '<br>');

function button(label, action, cls = 'button primary', extra = '') {
  return `<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
}
function iconArrow() { return '<span aria-hidden="true">↗</span>'; }
function badge(label=state.mode==='demo'?'DEMO / MOCK':state.report?.mode==='rules'?'LOCAL RULES · AI OPTIONAL':state.report?.mode==='real-ai'?'REAL AI · SYNTHETIC INPUT':'LOCAL-FIRST · AI OPTIONAL') { return `<span class="demo-badge"><span class="demo-dot"></span>${label}</span>`; }
function header() {
  const links = state.report ? `<nav class="top-nav" aria-label="Report navigation">${reportPages.map(p => `<button type="button" data-action="page:${p}" class="${state.page === p ? 'active' : ''}">${pageLabels[p]}</button>`).join('')}</nav>` : '';
  return `<header class="site-header"><div class="shell header-inner"><button type="button" class="brand" data-action="home" aria-label="AI Career Navigator home"><span class="brand-mark"><i></i><i></i><i></i></span><span>AI Career<br><b>Navigator</b></span></button>${links}<div class="header-actions"><label class="language-switch"><span class="sr-only">${t('Language')}</span><select id="language-select" aria-label="${t('Language')}">${[['en','English'],['zh-CN','简体中文'],['ms','Bahasa Melayu']].map(([id,name])=>`<option value="${id}" ${language===id?'selected':''}>${name}</option>`).join('')}</select></label>${badge()}${state.report ? button('Start over', 'restart', 'button small ghost') : button('Start assessment', 'start', 'button small dark')}</div></div></header>`;
}
function footer() {
  return `<footer class="site-footer"><div class="shell footer-inner"><span class="footer-brand">AI Career Navigator <span>·</span> Your Skills. Your Future. Your Choice.</span><span>Team Nexus · Domain 1 · Fictional profiles only</span></div></footer>`;
}
function heroGraphic() {
  return `<div class="hero-visual" aria-label="Illustration of capabilities leading to future paths" role="img"><div class="visual-grid"></div><div class="visual-top"><span class="micro">YOUR CAREER, IN CONTEXT</span><span class="visual-index">01 / 03</span></div><div class="visual-orbit"><div class="orbit-ring ring-one"></div><div class="orbit-ring ring-two"></div><div class="orbit-core"><span>YOU</span><strong>More than<br>a job title.</strong></div><div class="orbit-node node-a">Skills</div><div class="orbit-node node-b">AI + work</div><div class="orbit-node node-c">Possibilities</div></div><div class="visual-bottom"><span class="sparkle">✳</span><span>From uncertainty<br>to informed choices.</span><span class="mini-arrow">↗</span></div></div>`;
}
function home() {
  return `<main><section class="hero shell"><div class="hero-copy"><div class="eyebrow"><span class="eyebrow-line"></span> A more human way to navigate change</div><h1>Your skills.<br>Your future.<br><em>Your choice.</em></h1><p class="hero-lede">Understand what you bring to work, how AI may change your tasks, and which next steps fit your real life.</p><div class="hero-buttons">${button(`Start assessment ${iconArrow()}`, 'start')}${button(t('Previous assessment versions'), 'samples', 'button secondary')}</div><div class="hero-note"><span class="shield">✦</span><span>Local assessment runs in your browser. AI is optional. Competition mode: fictional profiles only.</span></div></div>${heroGraphic()}</section><section class="proof-strip"><div class="shell proof-inner"><span>Know your strengths</span><span class="proof-divider"></span><span>Understand changing tasks</span><span class="proof-divider"></span><span>Choose your next move</span></div></section><section class="section shell" id="approach"><div class="section-heading"><div><span class="kicker">THE APPROACH</span><h2>A clearer picture of<br>what comes next.</h2></div><p>Career change is personal. We connect your experience, the tasks that are changing, and the limits that shape what is realistic.</p></div><div class="feature-grid"><article class="feature-card"><span class="feature-icon violet">◇</span><span class="feature-num">01 / UNDERSTAND</span><h3>See your capabilities</h3><p>Look at what you can do independently, with AI, and what you could explore next. Every insight points back to evidence.</p></article><article class="feature-card"><span class="feature-icon peach">✳</span><span class="feature-num">02 / INTERPRET</span><h3>Look beyond job titles</h3><p>Explore which specific tasks AI may assist, which may be automated, and where human judgment remains central.</p></article><article class="feature-card"><span class="feature-icon mint">↗</span><span class="feature-num">03 / DECIDE</span><h3>Compare real options</h3><p>See how upgrading your role or exploring a new direction could work, with trade-offs and a small, testable next step.</p></article></div></section><section class="process-section"><div class="shell process-inner"><div><span class="kicker">HOW IT WORKS</span><h2>One step at a time.<br><em>At your pace.</em></h2><p>We start with your context, then move from explanation to action. You stay in control of the decision.</p>${button(`Begin your assessment ${iconArrow()}`, 'start', 'button light')}</div><ol class="process-list"><li><b>01</b><div><strong>Tell us about your work</strong><span>Your background, tasks, skills and constraints.</span></div></li><li><b>02</b><div><strong>Explore the analysis</strong><span>Capabilities and task-level AI impact.</span></div></li><li><b>03</b><div><strong>Compare several paths</strong><span>Compare a current-role upgrade with adjacent directions.</span></div></li><li><b>04</b><div><strong>Try a practical next step</strong><span>A small project with a way to check progress.</span></div></li></ol></div></section><section class="bottom-cta shell"><div><span class="kicker">YOUR NEXT CHAPTER</span><h2>Make sense of change.<br>Then make your move.</h2></div>${button(`Start assessment ${iconArrow()}`, 'start')}</section></main>`;
}
function samples() {
  return `<main class="subpage shell"><div class="back-row">${button('← Back to home','home','text-button')}</div><div class="intro-narrow"><span class="kicker">${state.mode==='demo'?'EXPLORE THE PROTOTYPE':t('Previous assessment versions')}</span><h1>Choose a starting point.</h1><p>${state.mode==='demo'?'Scripted V0.1 demo: no AI inference.':t('These fictional profiles use the earlier V2 assessment. Start assessment on the homepage opens the current questionnaire.')}</p>${badge('TWO FICTIONAL DEMO CASES')}</div><div class="sample-grid">${Object.entries(cases).map(([id,c]) => `<button class="sample-card ${c.color}" type="button" data-action="sample:${id}"><span class="sample-top"><span class="sample-icon">${id==='marketing'?'✳':'◇'}</span><span>${t('CASE {number}',{number:id==='marketing'?'01':'02'})}</span></span><strong>${esc(c.label)}</strong><p>${id==='marketing'?'Wants to use AI to move from content production toward strategy.':'Wants to explore a move from administration into operations.'}</p><span class="sample-link">Load this profile ↗</span></button>`).join('')}</div><div class="info-banner"><span>ⓘ</span><p>${state.mode==='demo'?'Insights in this mode are scripted, not model inference.':'Base reports use local rules and dated occupational sources. Only optional AI analysis sends fictional inputs to the backend and RunPod.'}</p></div></main>`;
}
function profile() {
  if(isV2(state.profile))return renderExplorationIntake(state.profile,state.step,state.errors);
  const step = steps[state.step];
  const intro = [
    'Your work is more than a job title. Start with the context that feels closest to you.',
    'Specific tasks and skills help make the experience more useful than a generic career quiz.',
    'There is no right answer. We want to understand your starting point and what matters to you.',
    'The best next step is one that fits your time, resources and goals.'
  ];
  return `<main class="form-page"><div class="shell"><div class="back-row">${button(state.step===0?'← Back to home':'← Previous step',state.step===0?'home':'prev','text-button')}</div><div class="form-shell"><aside class="form-side"><span class="kicker">PERSONAL PROFILE</span><h1>Let's start<br>with <em>you.</em></h1><p>${state.mode==='demo'?'Four steps for a browser-only scripted demo.':'Your base assessment stays in this browser tab. No upload, account or AI request is needed. Use fictional details for this competition demo.'}</p><div class="privacy-note"><span>✳</span><div><strong>Your choice, always.</strong><p>${state.mode==='demo'?'No AI call in scripted mode.':'Unknown is a valid answer. Scores are exploratory rules, not a validated personality test. Optional AI requires separate consent.'}</p></div></div></aside><div class="form-card"><div class="progress-top"><span>${step.eyebrow}</span><span>${t('{percent}% complete',{percent:Math.round((state.step+1)/steps.length*100)})}</span></div><div class="progress-track"><div style="width:${(state.step+1)/steps.length*100}%"></div></div><h2>${t(step.title)}</h2><p class="field-help">${t('About 4–6 minutes · choices and clear level descriptions')}</p><p class="form-intro">${intro[state.step]}</p><form id="profile-form" novalidate>${state.step===0 && state.mode==='demo' ? `<div class="field"><label for="field-scenario">Demo context <span class="required">*</span></label><select name="scenario" id="field-scenario" aria-invalid="${!!state.errors.scenario}" ${state.errors.scenario?'aria-describedby="error-scenario"':''}><option value="">Choose one of two supported cases</option><option value="marketing" ${state.profile.scenario==='marketing'?'selected':''}>Marketing</option><option value="admin" ${state.profile.scenario==='admin'?'selected':''}>Administration</option></select>${state.errors.scenario?`<span class="field-error" id="error-scenario">${esc(state.errors.scenario)}</span>`:''}<span class="field-help">V0.1 only includes these two scripted demo contexts.</span></div>`:''}${step.fields.filter(f=>f!=='scenario').map(key=>renderQuestion(key,state.profile,state.errors)).join('')}${state.mode==='live'?renderRatings(state.profile,state.step,state.errors):''}${state.step===3?renderSupplement(state.profile,state.errors):''}${state.step===0 && state.mode==='live'?`<div class="info-banner"><p>${t('Competition rules require fictional profiles. Base answers are processed only in this tab; optional AI sends fictional details to our backend and RunPod. Do not enter real names, CVs or contact details.')}</p></div><label class="consent"><input id="local-consent" type="checkbox" ${state.profile.synthetic?'checked':''}> ${t('I understand and will use fictional details for this demo.')}</label>${state.errors.synthetic?`<p class="field-error">${esc(state.errors.synthetic)}</p>`:''}`:''}<div class="form-actions"><span>${t('Step {step} of {total}',{step:state.step+1,total:steps.length})}</span><button class="button primary" type="submit">${state.step===steps.length-1?(state.mode==='demo'?'View mock report':'View local report'):'Continue'} <span aria-hidden="true">→</span></button></div></form></div></div></div></main>`;
}
function reportHeader(kicker, title, lede) {
  return `<div class="report-head"><div class="report-head-top"><span class="kicker">${kicker}</span>${badge()}</div><h1>${title}</h1><p>${lede}</p></div>`;
}
function reportShell(content, active) {
  const r = state.report;
  const notice=r.mode==='real-ai' && r.language && r.language!==language ? `<p class="info-banner">${esc(t('Your report was generated in {language}. To change its language, edit your answers and generate it again.',{language:{en:'English','zh-CN':'简体中文',ms:'Bahasa Melayu'}[r.language]}))}</p>`:'';
  const activeIndex = reportPages.indexOf(active);
  const nav = reportPages.map((page, i) => {
    const marker = page === 'star-map' ? '✦' : String(i).padStart(2, '0');
    return `<button type="button" data-action="page:${page}" class="${active===page?'active':''}" ${active===page?'aria-current="page"':''}><span>${marker}</span>${pageLabels[page]}<b aria-hidden="true">↗</b></button>`;
  }).join('');
  const previous = activeIndex === 0
    ? button('Edit your answers ↗','edit','text-button')
    : button(t('Previous: {section}',{section:t(pageLabels[reportPages[activeIndex-1]])}),`page:${reportPages[activeIndex-1]}`,'button secondary');
  const next = activeIndex === reportPages.length-1
    ? button('Start again ↗','restart','button primary')
    : button(t('Next: {section} →',{section:t(pageLabels[reportPages[activeIndex+1]])}),`page:${reportPages[activeIndex+1]}`,'button primary');
  return `<main class="report-page shell"><aside class="report-sidebar"><div class="sidebar-sticky"><div class="report-person"><span class="person-avatar">${esc((r.scenario?.short||r.profile.background).slice(0,1))}</span><div><span>${r.mode==='rules'?t('LOCAL RULES · FICTIONAL SELF-REPORT'):r.mode==='real-ai'?'FICTIONAL INPUT · REAL INFERENCE':'SCRIPTED DEMO PROFILE'}</span><strong><span data-user-content>${esc(answerText(r.profile,'background'))}</span></strong></div></div><nav aria-label="Report sections" class="report-nav">${nav}</nav><div class="sidebar-bottom"><span>YOUR INPUT</span><p><span data-user-content>${esc(answerText(r.profile,'experience'))}</span> · ${r.questionnaireVersion==='2.0.0'?localText.T('Planning assumption','排期假设','Andaian perancangan')+': '+r.weeklyHours+'h':t('{hours} hours / week',{hours:r.weeklyHours})}</p>${button('Edit your answers ↗','edit','text-button')}</div></div></aside><div class="report-main">${notice}${r.mode==='rules'&&!['capability','impact','paths','plan'].includes(active)?(r.questionnaireVersion==='2.0.0'?explorationNotice()+translationNotice():rulesNotice())+provenancePanel(r):''}${content}${r.mode==='rules'?aiPanel():''}<div class="report-bottom-nav">${previous}${next}</div></div></main>`;
}
function methodology() { return `<div class="method-note"><span class="method-icon">ⓘ</span><div><strong>How to read this demo</strong><p>${esc(t(state.report.evidenceLimit))} ${t('Treat each suggestion as a hypothesis to test, not a prediction.')}</p></div></div>`; }
function capability() {
  const r=state.report;
  return reportShell(`${reportHeader('01 / CAPABILITY ASSESSMENT','What you bring to the table.','Three lenses on your experience. We show concrete clues and open questions instead of a made-up score.')}<div class="profile-summary"><span>BASED ON YOUR ANSWERS</span><p>“<span data-user-content>${esc(r.profile.skills)}</span>”</p><small>${esc(answerText(r.profile,'background'))} · ${esc(answerText(r.profile,'experience'))}</small></div><div class="capability-grid">${r.scenario.capabilities.map((c,i)=>`<article class="cap-card cap-${i}"><div class="cap-top"><span class="cap-icon">${c.icon}</span><span class="cap-label">${t('LENS {number}',{number:i+1})}</span></div><h2>${c.title}</h2><p class="cap-summary">${c.summary}</p><div class="cap-detail"><span class="small-label">WHY THIS APPEARS</span><p>${i===0 ? `${esc(t('Your self-reported tasks: {tasks}',{tasks:r.profile.tasks}))}` : i===1 ? esc(t('Your self-reported AI use: {usage}',{usage:r.profile.aiUse})) : c.evidence}</p></div><div class="chip-row">${c.examples.map(e=>`<span>${e}</span>`).join('')}</div><div class="cap-next"><span>WHAT TO VERIFY NEXT</span><p>${c.next}</p></div></article>`).join('')}</div>${methodology()}`,'capability');
}
const taskLabels = { 'AI can assist':'Assist', 'Automation potential':'Automate', 'Human judgment':'Human-led', 'Develop further':'Grow' };
function impact() {
  const r=state.report;
  return reportShell(`${reportHeader('02 / AI CAREER IMPACT','Look at the work. Not the label.','AI can affect different tasks in different ways. The cards below are scripted examples for your chosen demo context.')}<div class="impact-intro"><span class="impact-symbol">✳</span><div><strong>${esc(r.scenario.label)}</strong><p>${esc(t('Your self-reported tasks: {tasks}',{tasks:r.profile.tasks}))}</p></div></div><div class="task-grid">${r.scenario.tasks.map((t,i)=>`<article class="task-card task-${i}"><div class="task-top"><span class="task-dot"></span><span>${t.type.toUpperCase()}</span></div><h2>${t.name}</h2><p>${t.note}</p><span class="task-tag">${taskLabels[t.type]}</span></article>`).join('')}</div><div class="explain-panel"><div><span class="kicker">A USEFUL DISTINCTION</span><h3>Possible to automate ≠ guaranteed to disappear.</h3></div><p>Technical capability, workplace adoption, responsibility and human preference are different questions. This prototype does not assign a job replacement probability.</p></div>${methodology()}`,'impact');
}
function pathCard(id) {
  const p=state.report.scenario.paths[id]; const selected=state.path===id;
  const list=(label,items)=>`<div class="path-list"><span>${label}</span><ul>${items.map(item=>`<li>${item}</li>`).join('')}</ul></div>`;
  return `<article class="path-card ${selected?'selected':''}"><div class="path-top"><span>${t('Path {path}',{path:id})}</span>${selected?'<span class="selected-pill">SELECTED</span>':''}</div><h2>${p.title}</h2><p class="path-subtitle">${p.subtitle}</p><div class="why-box"><span>WHY CONSIDER IT</span><p>${p.why}</p></div><div class="path-columns">${list('YOUR STRENGTHS',p.strengths)}${list('SKILLS TO ADD',p.gaps)}${list('POTENTIAL OPPORTUNITIES',p.opportunities)}</div><div class="path-reality"><span>REAL-WORLD LIMIT</span><p>${p.constraints}</p></div><div class="path-next"><span>NEXT EXPERIMENT</span><p>${p.next}</p></div>${button(selected?'Current focus ✓':'Focus on this path',`select:${id}`,selected?'button selected-button':'button secondary')}</article>`;
}
function paths() {
  const recommendation=recommendedPath(state.report.profile);
  return reportShell(`${reportHeader('03 / CAREER PATHS','Three ways to explore. No choice is permanent.','Compare a current-role upgrade with two adjacent directions. Every route is a hypothesis to test, not a commitment.')}<div class="path-tip"><span>✦</span><p>From your stated goal, <strong>Path ${recommendation}</strong> may be a useful first experiment. This is a scripted demo suggestion, not a recommendation based on validated market data.</p></div><div class="paths-grid">${['A','B','C'].filter(id=>state.report.scenario.paths[id]).map(pathCard).join('')}</div><div class="choice-banner"><strong>Your choice can change.</strong><span>Try one small experiment before committing to a major career move.</span></div>${methodology()}`,'paths');
}
function plan() {
  const livePathExists = !['real-ai','rules'].includes(state.report?.mode) || state.report.analysis.paths.some(path => path.kind === state.path);
  if (!livePathExists) return reportShell(renderExplorationPlan(state.report, state.path),'plan');
  if (state.report?.mode === 'rules') return reportShell(renderLocalReport(state.report,'plan',state.path,state.simulator,state.localScenario),'plan');
  if (state.report?.mode === 'real-ai') return reportShell(renderLiveReport(state.report,'plan',state.path,state.simulator),'plan');
  const r=state.report, p=r.scenario.plan[state.path], path=r.scenario.paths[state.path];
  return reportShell(`${reportHeader('04 / ACTION PLAN','Make the next step visible.','A practical starting plan for your selected demo path, shaped around the time you said you have.')}<div class="plan-summary"><div><span>YOUR FOCUS</span><h2>${t('Path {path}',{path:state.path})}: ${t(path.subtitle)}</h2><p><span data-user-content>${esc(answerText(r.profile,'goal'))}</span></p></div><div class="time-token"><strong>${r.weeklyHours}h</strong><span>per week available</span></div></div><div class="plan-layout"><section class="plan-primary"><div class="plan-section-title"><span>01</span><div><small>THE PRACTICE PROJECT</small><h2>Build evidence, not just confidence.</h2></div></div><p class="project-copy">${p.project}</p><div class="milestone-box"><span>SHORT-TERM MILESTONE</span><strong>${p.milestone}</strong></div><div class="proof-box"><span>HOW TO CHECK PROGRESS</span><p>${p.proof}</p></div></section><div class="plan-side"><section class="plan-mini"><span class="small-label">02 / SKILLS TO PRIORITIZE</span><ol>${p.skills.map(x=>`<li>${x}</li>`).join('')}</ol></section><section class="plan-mini"><span class="small-label">03 / TOOLS TO EXPLORE</span><ul>${p.tools.map(x=>`<li>${x}</li>`).join('')}</ul><p class="tool-note">Examples only. Check workplace privacy rules before entering any real work data into an AI tool.</p></section></div></div><div class="reality-panel"><span>YOUR REAL-WORLD LIMIT</span><p><span data-user-content>${esc(answerText(r.profile,'constraints'))}</span></p><small>${t('Keep the project small enough to fit roughly {hours} hours per week. Adjust the milestone if that is unrealistic.',{hours:r.weeklyHours})}</small></div>${methodology()}`,'plan');
}
function render() {
  if(combinedActive)return;
  if(state.report?.mode==='rules' && state.report.language!==language) state.report=buildLocalReport(state.report.profile,language,{},state.report.knowledge);
  const explorerPages = {
    compare: () => renderCareerComparison(state.report,state.path,state.comparePath),
    'skill-dna': () => renderSkillDNA(state.report,state.path,state.selectedSkill),
    'time-machine': () => renderTimeMachine(state.report,state.timeYear,state.timeScenario),
    'sdg-map': () => renderSDGMapper(state.report,state.path)
  };
  const pageContent = state.report && state.page==='star-map' ? reportShell(renderCareerStarMap(state.report,state.path),'star-map')
    : state.report && explorerPages[state.page] ? reportShell(explorerPages[state.page](),state.page)
    : state.report?.mode==='rules' && ['capability','impact','paths'].includes(state.page) ? reportShell(renderLocalReport(state.report,state.page,state.path,state.simulator,state.localScenario),state.page)
    : state.report?.mode==='real-ai' && ['capability','impact','paths'].includes(state.page) ? reportShell(renderLiveReport(state.report,state.page,state.path,state.simulator),state.page)
    : ({ home, samples, profile, capability, impact, paths, plan, loading, failure, matching })[state.page]();
  root.innerHTML = `${header()}${pageContent}${footer()}`;
  localize(root);
  document.title = `${state.page==='home'?'AI Career Navigator':state.page==='profile'?'Your profile':pageLabels[state.page]||({loading:'Analyzing',failure:'Analysis unavailable',matching:'Source-based matches',samples:'Fictional profiles'}[state.page])||'AI Career Navigator'} · AI Career Navigator`;
  document.title=t(document.title.replace(' · AI Career Navigator',''))+' · AI Career Navigator';
  document.querySelector('meta[name=description]')?.setAttribute('content',t('Explore your skills, understand how AI changes work tasks, and compare practical career paths.'));
}
function go(page) { state.page=page; render(); window.scrollTo({top:0,behavior:'instant'}); }
function collectForm(changed) {const form=document.getElementById('profile-form');if(form && isV2(state.profile))return collectExploration(form,state.profile);if(form) {collectAnswers(form,state.profile,changed);collectRatings(form,state.profile);const data=new FormData(form);if(data.has('scenario')) state.profile.scenario=String(data.get('scenario'));}}
root.addEventListener('change',event=>{
 if(combinedActive)return;
 if(event.target.matches('[data-v2-control]')){
  const key=event.target.dataset.v2Control;state.localScenario[key]=key==='hours'?Number(event.target.value):event.target.value;
  const panel=event.target.closest('[data-v2-simulator]');panel.outerHTML=renderExplorationSimulator(state.report,state.localScenario);root.querySelector(`[data-v2-control="${key}"]`)?.focus();return;
 }
 if(event.target.id==='ai-consent'){state.ai.consent=event.target.checked;return;}
 if(event.target.matches('[data-local-rating],[data-local-education]')) {
  const key=event.target.dataset.localRating;
  if(key){if(event.target.value==='baseline')delete state.localScenario.ratings[key];else state.localScenario.ratings[key]=Number(event.target.value);}
  else state.localScenario.education=event.target.value;
  const focus=key?`[data-local-rating="${key}"]`:'[data-local-education]';
  const panel=event.target.closest('[data-local-simulator]');panel.outerHTML=renderRuleSimulator(state.report,state.localScenario);root.querySelector(focus)?.focus();return;
 }
 if(event.target.id==='language-select') {collectForm();setLanguage(event.target.value);if(state.simulator)state.simulator.language=language==='zh-CN'?'zh':language;return render();}
 if(event.target.closest('#profile-form')) {
   collectForm(event.target);
   if(isV2(state.profile)){const name=event.target.name,value=event.target.value;render();[...document.getElementsByName(name)].find(el=>el.value===value)?.focus();return;}
   if(event.target.name.startsWith('answer-')) {
     const {name,value,checked}=event.target;render();
     const custom=value==='other' && checked!==false ? document.getElementById(`custom-${name.slice(7)}`) : null;
     (custom||Array.from(document.getElementsByName(name)).find(el=>el.value===value))?.focus();
   }
 }
});
root.addEventListener('click', event=>{
  if(combinedActive)return;
  const control=event.target.closest('[data-action]'); if(!control) return;
  const action=control.dataset.action;
  if(state.busy && action!=='cancel') return;
  if(action==='cancel') { state.controller?.abort(); state.busy=false; return go('profile'); }
  if(action==='ai-deep')return deepen();
  if(action==='v2-reset'){state.localScenario={};return render();}
  if(action==='local-reset'){state.localScenario={ratings:{}};return render();}
  if(action==='retry') return generate();
  if(action==='sim-reset' && ['real-ai','rules'].includes(state.report?.mode)) { state.simulator={...simulatorDefaults(state.report,state.path),language:language==='zh-CN'?'zh':language}; render(); root.querySelector('[data-action="sim-reset"]')?.focus(); return; }
  if(action==='match') return getMatches();
  if(action==='home') { state.report=null; return go('home'); }
  if(action==='start'&&!legacyAssessment)return startCombined();
  if(action==='start') { state.mode='live'; state.profile=createDraft(); state.report=null; state.step=0; state.errors={}; return go('profile'); }
  if(action==='samples') {state.mode='live'; return go('samples');}
  if(action.startsWith('sample:')) { state.profile=state.mode==='live'?exampleProfile(action.split(':')[1]):sampleProfile(action.split(':')[1]); if(!isV2(state.profile))initialAnswers(state.profile); state.report=null; state.step=0; state.errors={}; return go('profile'); }
  if(action==='prev') { collectForm(); state.errors={}; state.step=Math.max(0,state.step-1); return go('profile'); }
  if(action==='edit') { state.report=null; state.errors={}; state.step=0; return go('profile'); }
  if(action==='restart') { state.report=null; state.profile=emptyProfile(); state.step=0; state.path='A'; state.errors={}; return go('home'); }
  if(action.startsWith('page:') && state.report) return go(action.split(':')[1]);
  if(action.startsWith('map-select:') && state.report) { const id=action.split(':')[1]; if(buildCareerExplorerModel(state.report).paths.some(path=>path.id===id)){state.path=id; if(state.simulator && ['A','B'].includes(id))state.simulator.path=id; render(); const selectedMapNode=[...document.querySelectorAll('[data-action^="map-select:"]')].find(node=>node.dataset.action===`map-select:${id}`); selectedMapNode?.focus();} return; }
  if(action.startsWith('compare-select:') && state.report) { state.comparePath=action.split(':')[1]; return render(); }
  if(action.startsWith('route-select:') && state.report) { const id=action.split(':')[1]; if(buildCareerExplorerModel(state.report).paths.some(path=>path.id===id)){ if(state.page==='compare') state.comparePath=state.path; state.path=id; if(state.simulator && ['A','B'].includes(id))state.simulator.path=id; return render(); } }
  if(action.startsWith('skill-select:') && state.report) { try { state.selectedSkill=decodeURIComponent(action.slice('skill-select:'.length)); } catch { return; } return render(); }
  if(action.startsWith('time-year:') && state.report) { state.timeYear=action.slice('time-year:'.length); return render(); }
  if(action.startsWith('time-scenario:') && state.report) { state.timeScenario=action.slice('time-scenario:'.length); return render(); }
  if(action.startsWith('select:') && state.report) { state.path=action.split(':')[1]; if(state.simulator)state.simulator.path=state.path; return go('paths'); }
});

function updateSimulator(event) {
  const control=event.target.closest('[data-sim-control]');
  if(!control || !['real-ai','rules'].includes(state.report?.mode)) return;
  if((event.type==='input')!==(control.type==='range')) return;
  const choices={...(state.simulator||simulatorDefaults(state.report,state.path)),language:language==='zh-CN'?'zh':language,[control.dataset.simControl]:control.value};
  state.simulator=simulateCareer(state.report,choices).options;
  if(control.dataset.simControl==='path') {state.path=state.simulator.path;render();root.querySelector('#sim-path')?.focus();return;}
  const panel=control.closest('[data-simulator]');
  if(control.dataset.simControl==='language') {
    panel.outerHTML=renderSimulator(state.report,state.simulator,state.path);
    root.querySelector('#sim-language')?.focus();
  } else {
    panel.querySelector('[data-sim-results]').innerHTML=simulatorResults(state.report,state.simulator);
    panel.querySelector('#sim-hours-value').textContent=simulatorHoursLabel(state.simulator);
    localize(panel);
  }
}
root.addEventListener('input',event=>{
 if(combinedActive)return;
 if(event.target.matches('[data-v2-control="hours"]')){
  state.localScenario.hours=Number(event.target.value);
  const panel=event.target.closest('[data-v2-simulator]'),probe=document.createElement('div');
  probe.innerHTML=renderExplorationSimulator(state.report,state.localScenario);
  panel.querySelector('.sim-comparison').outerHTML=probe.querySelector('.sim-comparison').outerHTML;
  panel.querySelector('output').textContent=event.target.value+'h';
  return;
 }
 updateSimulator(event);
});
root.addEventListener('change',updateSimulator);

root.addEventListener('submit', event=>{
  if(combinedActive)return;
  if(event.target.id!=='profile-form') return;
  event.preventDefault(); collectForm();
  if(isV2(state.profile)){
   state.errors=validateExploration(state.profile,state.step);
   if(Object.keys(state.errors).length){render();document.getElementById('exploration-direction')?.focus();return;}
   if(state.step===0)state.profile.synthetic=true; // The entry button acknowledges the single fictional-demo notice.
   if(state.step<V2_STEPS-1){state.step++;return go('profile');}
   state.report=buildLocalReport(state.profile,language);state.simulator=null;state.localScenario={};state.ai={busy:false,result:null,error:'',consent:false};state.path='A';state.comparePath='B';state.selectedSkill='';return go('capability');
  }
  state.errors={...validateStep(state.profile,state.step,state.mode),...(state.mode==='live'?localErrors(state.profile,state.step):{})};
  if(Object.keys(state.errors).length) { render(); (document.getElementById(`field-${Object.keys(state.errors)[0]==='aiUse'?'aiUsage':Object.keys(state.errors)[0]}`)||document.getElementById('synthetic'))?.focus(); return; }
  if(state.step<steps.length-1) {state.step++; return go('profile');}
  if(state.mode==='live') {state.report=buildLocalReport(state.profile,language);state.simulator=null;state.localScenario={ratings:{}};state.ai={busy:false,result:null,error:'',consent:false};state.path='A';state.comparePath='B';state.selectedSkill='';return go('star-map');}
  state.report=makeReport(state.profile); state.path=recommendedPath(state.profile); go('star-map');
});
let introCleanup = null;
function beginIntroduction() {
  introCleanup?.();
  state.mode='live';state.profile=createDraft();state.report=null;state.step=0;state.errors={};
  if(legacyAssessment)go('profile');else startCombined();
  introCleanup=playIntroduction({app:root,storage:introStorage,onComplete:()=>{
    introCleanup=null;
    (document.getElementById('exploration-direction')||root.querySelector('main h1'))?.focus?.({preventScroll:true});
  }});
}
let introStorage;
try { introStorage=window.sessionStorage; } catch { introStorage=null; }
const playOnEntry=shouldPlayIntro(introStorage,window.location.search);
consumeIntroParameter();
if(playOnEntry)beginIntroduction();else if(!legacyAssessment&&hasCombinedDraft())startCombined();else render();

function loading() { return `<main class="subpage shell"><div class="form-card status-panel" role="status" aria-live="polite"><span class="kicker">REAL MODEL INFERENCE</span><h1>Building a sourced perspective.</h1><p>Retrieving public signals, comparing reference roles, then asking RunPod to analyze your fictional profile. Cold starts can take several minutes.</p><div class="progress-track indeterminate"><div></div></div><p>No scripted fallback. Every response must pass citation, structure and time-budget checks.</p>${button('Stop waiting and edit','cancel','button secondary')}<p class="field-help">Stopping the browser wait may not cancel a GPU request already running.</p></div></main>`; }
function failure() { return `<main class="subpage shell"><div class="form-card status-panel" role="alert"><span class="kicker">ANALYSIS UNAVAILABLE</span><h1>Your answers are safe in this tab.</h1><p>${esc(state.apiError)}</p><p>No mock report has been substituted.</p>${button('Retry real analysis','retry')}${button('Edit fictional profile','edit','button secondary')}</div></main>`; }
function generate(){return deepen();}
function aiPanel(){
 const T=localText.T,a=state.ai;
 return `<section class="plan-mini optional-ai"><h2>${T('Optional AI deep analysis','可选 AI 深度分析','Analisis mendalam AI pilihan')}</h2><p>${state.report.questionnaireVersion==='2.0.0'?T('Your V2 report is complete. Optional AI provides a separate interpretation only; it cannot change local tags or exposure stages. If it fails, your report remains available.','V2 本地报告已完整生成。可选 AI 只提供独立文字解读，不改变本地标签或接触阶段；失败也不影响已有报告。','Laporan V2 tempatan sudah lengkap. AI pilihan hanya memberi tafsiran berasingan; ia tidak mengubah tag atau tahap pendedahan. Jika gagal, laporan kekal tersedia.'):T('Your local report is complete. Only this button sends fictional answers to RunPod; AI output never replaces rule scores. Waiting stops after 90 seconds, although a provider request may continue. Existing server quotas still apply.','你的本地报告已经完整生成。只有此按钮会将虚构答案发送至 RunPod，AI 结果不会替换规则评分。界面最多等待 90 秒，但服务端请求可能继续；现有额度保护仍有效。','Laporan tempatan anda sudah lengkap. Hanya butang ini menghantar jawapan rekaan ke RunPod; output AI tidak menggantikan skor peraturan. Penantian tamat selepas 90 saat, namun permintaan penyedia mungkin berterusan. Kuota pelayan masih terpakai。')}</p><label class="consent"><input id="ai-consent" type="checkbox" ${a.consent?'checked':''}>${T('I choose to send this fictional profile to RunPod for optional analysis.','我选择将本份虚构资料发送至 RunPod 进行可选分析。','Saya memilih menghantar profil rekaan ini ke RunPod untuk analisis pilihan。')}</label><button class="button secondary" data-action="ai-deep" ${a.busy?'disabled':''}>${a.busy?T('AI is working… Local report remains available.','AI 正在分析……本地报告仍可使用。','AI sedang memproses… Laporan tempatan kekal tersedia。'):T('AI deep analysis','AI 深度分析','Analisis mendalam AI')}</button>${a.error?`<p role="alert">${a.error==='consent'?T('Choose optional data sharing first. Your local report is unchanged.','请先选择是否分享虚构资料。本地报告保持不变。','Pilih perkongsian data pilihan dahulu. Laporan tempatan tidak berubah。'):T('AI is unavailable, timed out or rate-limited. Your complete local report is preserved. Please wait before retrying.','AI 暂不可用、超时或达到频率限制。完整本地报告已保留，请稍后重试。','AI tidak tersedia, tamat masa atau dihadkan kadar. Laporan tempatan lengkap anda dikekalkan. Tunggu sebelum mencuba lagi。')}</p>`:''}${a.result?`<details><summary>${T('View separate AI interpretation','查看独立 AI 解读','Lihat tafsiran AI berasingan')}</summary><p data-user-content>${esc(a.result.analysis.summary.text)}</p>${(state.report.questionnaireVersion==='2.0.0'?[]:a.result.analysis.paths).map(p=>`<h3>${esc(a.result.ranking.find(r=>r.id===p.role_id)?.title||p.role_id)}</h3><p data-user-content>${esc(p.why.text)}</p>`).join('')}<p>${esc(a.result.inference.model)}</p></details>`:''}</section>`;
}
async function deepen(){
 const base=state.report,T=localText.T,ai=state.ai;if(base?.mode!=='rules'||ai.busy)return;
 if(!state.ai.consent){state.ai.error='consent';return render();}
 state.ai.busy=true;state.ai.error='';render();
 try{const result=await optionalAI(base.profile,language);if(state.ai===ai && state.report?.profile && JSON.stringify(state.report.profile)===JSON.stringify(base.profile))ai.result=result;}
 catch(error){if(state.ai===ai)ai.error='unavailable';}
 finally{ai.busy=false;if(state.ai===ai)render();}
}

fetch('/api/health').then(r=>r.ok?r.json():null).then(data=>{collectForm();state.health=data;render();}).catch(()=>{});

function matching() {return `<main class="subpage shell"><h1>Explainable role matches</h1>${state.matching?renderMatching(state.matching):`<p role="status">${esc(state.apiError||'Matching your fictional profile against public occupational evidence…')}</p>`}${button('Return to profile','edit','button secondary')}</main>`;}
async function getMatches() {collectForm();state.errors=validateStep(state.profile,state.step,'live');if(Object.keys(state.errors).length){render();return;}state.apiError='';state.matching=null;go('matching');try{state.matching=await requestMatching({...state.profile,language});}catch(error){state.apiError=error.name==='TypeError'?'The service is temporarily unavailable. Your answers are preserved. Please try again.':error.message;}if(state.page==='matching')render();}

// Background public-data refresh affects the next assessment only; it never blocks submission.
refreshKnowledge();
