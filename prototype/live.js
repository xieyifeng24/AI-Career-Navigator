import { renderSimulator } from './simulator.js';
import {submissionProfile,answerText} from './questionnaire.js';
import {t as translate, errorMessage, language} from './i18n.js';
// Render only text and server-owned source links; model output never becomes HTML.
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=escapeHTML;
const safeURL=value=>String(value).startsWith('https://') ? e(value) : '#';
export async function requestAnalysis(profile, signal) {
  const fields=submissionProfile(profile);
  const session=await fetch('/api/session',{credentials:'same-origin',signal});
  const sessionData=await session.json();
  if(!session.ok || !sessionData.csrf_token) throw new Error(errorMessage(sessionData.detail,session.status));
  const headers={'Content-Type':'application/json','X-CSRF-Token':sessionData.csrf_token};
  const response=await fetch('/api/analyses',{method:'POST',credentials:'same-origin',headers,body:JSON.stringify({...fields,hours:Number(fields.hours)}),signal});
  let data=await response.json().catch(()=>({detail:'The server returned an unreadable response.'}));
  if(!response.ok) throw new Error(errorMessage(data.detail,response.status));
  if(data.job_id){
    const jobId=data.job_id;
    for(let attempt=0;attempt<160;attempt++){
      await new Promise((resolve,reject)=>{
        const abort=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};
        const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},3000);
        if(signal?.aborted) abort(); else signal?.addEventListener('abort',abort,{once:true});
      });
      const poll=await fetch(`/api/analyses/${encodeURIComponent(jobId)}`,{credentials:'same-origin',headers,signal});
      const status=await poll.json();
      if(!poll.ok||status.status==='error') throw new Error(errorMessage(status.detail,poll.status));
      if(status.status==='complete'){data=status.result;break;}
    }
  }
  if(data.mode!=='real-ai' || !data.analysis || !data.inference?.request_id) throw new Error('The response did not identify real inference. No report was displayed.');
  return data;
}

export async function requestMatching(profile) {
  const fields=submissionProfile(profile);
  const response=await fetch('/api/match',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...fields,hours:Number(fields.hours)})});
  const data=await response.json();
  if(!response.ok) throw new Error(errorMessage(data.detail,response.status));
  if(data.mode!=='source-matching') throw new Error('Unexpected matching response.');
  return data;
}

export function renderMatching(result) {
 const s=result.evidence.sources;
 return `<span class="demo-badge">SOURCE-BASED MATCHING · NO AI INFERENCE</span><p>${e(translate(result.note))}</p><p>Score = skill overlap (0–70) + task-word overlap (0–20) + published growth category (0–10). This is a limited English heuristic, not a hiring or replacement probability. Unmentioned skills are not proven gaps.</p><div class="ranking">${result.ranking.map((r,i)=>`<article><span>#${i+1}</span><div><strong>${e(translate(r.title))}</strong><p>${e(growthLabel(r.growth))} · ${e(r.period)} · ${translate('US data')}</p><small>${e(translate('Skills {skills}/70 · Task context {tasks}/20 · Trend {trend}/10',{skills:r.components.skill_overlap,tasks:r.components.task_context,trend:r.components.published_trend}))}</small><p>${e(translate('Skills mentioned: {skills}',{skills:r.matched_skills.map(x=>translate(x)).join(', ')||translate('No literal matches')}))}</p><p>${e(translate('Not mentioned: {skills}',{skills:r.gaps.map(x=>translate(x)).join(', ')}))}</p><p>${e(translate('Context words: {words}',{words:r.overlap_terms.map(x=>translate(x)).join(', ')||translate('None')}))}</p>${references([r.source_id],s)}<p>${e(translate('Proposed SDG {target} connection:',{target:r.sdg.target}))} ${e(translate('Explore a measurable workflow improvement in {role}; a proposed productivity contribution, not measured impact.',{role:translate(r.title)}))}</p><a href="https://sdgs.un.org/goals/goal8" target="_blank" rel="noopener noreferrer">UN target 8.2</a><p>Each listed skill: SDG 4.4 through employment-related learning; validate it with a practical work sample. This is an editorial mapping, not measured impact.</p><a href="https://sdgs.un.org/goals/goal4" target="_blank" rel="noopener noreferrer">UN target 4.4</a></div><b>${r.score}<small>/100</small></b></article>`).join('')}</div><p>${e(translate(result.evidence.attribution))} <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</p><p>${e(translate('Snapshot {version} · retrieved {date}. {geography}',{version:result.evidence.version,date:result.evidence.retrieved_at,geography:translate(result.evidence.geography)}))}</p>`;
}

function references(ids,sources) {
  return `<span class="source-links">${[...new Set(ids)].map(id=>{const s=sources[id];return s?`<a href="${safeURL(s.url)}" target="_blank" rel="noopener noreferrer">${e(translate(s.title))}</a>`:'';}).join(' · ')}</span>`;
}
export function conciseProse(text) {
  // Remove only adjacent duplicate sentences; never summarise or truncate advice.
  if(typeof Intl.Segmenter!=='function') return String(text);
  const parts=[...new Intl.Segmenter('en',{granularity:'sentence'}).segment(String(text))];
  let previous='';
  return parts.filter(({segment})=>{const key=segment.trim().replace(/\s+/g,' ');const duplicate=key===previous;previous=key;return !duplicate;}).map(x=>x.segment).join('').trim();
}
function claim(c,sources) {return `<p data-user-content>${e(conciseProse(c.text))}</p>${references(c.source_ids,sources)}`;}
function sdg(value) {return `<details class="sdg"><summary>${translate('SDG {target} · proposed contribution',{target:value.target})}</summary><p data-user-content>${e(value.rationale)}</p><p><strong>Check:</strong> ${e(value.measure)}</p><a href="https://sdgs.un.org/goals/goal${value.target.startsWith('4')?'4':'8'}" target="_blank" rel="noopener noreferrer">UN target definition</a></details>`;}
const headings={capability:['CAPABILITY ASSESSMENT','Your experience, in context.'],impact:['FUTURE SKILLS RADAR','What is changing — and what is uncertain.'],paths:['CAREER PATHS','Compare two practical options.'],plan:['30-DAY ACTION PLAN','Turn an idea into evidence.']};

export function renderLiveReport(r,page,pathId,simulation=null) {
 const a=r.analysis,s=r.evidence.sources;
 simulation={...simulation,language:language==='zh-CN'?'zh':language};
 const head=`<div class="report-head"><span class="kicker">${headings[page][0]}</span><h1>${headings[page][1]}</h1><p>${e(translate('Real model output · {model} · {date}',{model:r.inference.model,date:r.generated_at.slice(0,10)}))}</p><span class="demo-badge">AI INFERENCE · SYNTHETIC PROFILE</span></div>`;
 let body='';
 if(page==='capability') body=`<div class="profile-summary">${claim(a.summary,s)}</div><div class="capability-grid">${a.capabilities.map((c,i)=>`<article class="cap-card cap-${i}"><span class="small-label">${e(translate(c.lens))}</span><h2>${{independent:'Independent professional capability',collaboration:'AI collaboration capability',extended:'AI-extended capability'}[c.lens]}</h2>${claim(c.assessment,s)}<div class="cap-detail"><span>FICTIONAL SELF-REPORT, NOT VERIFIED EVIDENCE</span><p data-user-content>“${e(c.evidence_quote)}”</p></div><div class="cap-next"><span>WHAT TO VERIFY</span>${claim(c.verify_next,s)}</div></article>`).join('')}</div>`;
 if(page==='impact') body=`${sourceRadar(r.evidence)}<h2 class="section-space">Skill signals</h2><p>Conditional AI assessments. Research signals and US employment projections do not prove a skill is rising in Malaysia.</p><div class="task-grid">${a.radar.map(t=>`<article class="task-card"><span class="kicker">${e(translate(t.direction))}</span><h2>${e(translate(t.skill))}</h2>${claim(t.reasoning,s)}${sdg(t.sdg)}</article>`).join('')}</div><h2 class="section-space">Your specific tasks</h2><div class="task-grid">${a.tasks.map(t=>`<article class="task-card"><span class="kicker">${e(translate(t.category))} · ${translate('MODEL ASSESSMENT')}</span><h2 data-user-content>${e(t.input_quote)}</h2>${claim(t.assessment,s)}<strong>Human review</strong>${claim(t.human_check,s)}</article>`).join('')}</div><h2 class="section-space">Two futures to prepare for</h2><div class="paths-grid">${a.scenarios.map(x=>`<article class="path-card"><h2>${translate('{pace} AI adoption',{pace:translate(x.pace)})}</h2><p><strong>Assumption:</strong> ${e(x.assumption)}</p>${claim(x.implication,s)}<strong>Watch for</strong>${claim(x.watch_for,s)}</article>`).join('')}</div>`;
 if(page==='paths') body=`<details class="explain-panel"><summary>How the matching score works</summary><p>0–70 points: mentioned skills / retrieved skills; 0–20: overlap of English input words with occupational tasks; 0–10: published growth category. This transparent heuristic is not a calibrated fit, hiring or replacement probability. Missing skill mentions are not proven weaknesses. Only five reference occupations are covered.</p></details><div class="ranking">${r.ranking.map((role,i)=>`<article><span>#${i+1}</span><div><strong>${e(translate(role.title))}</strong><p>${e(growthLabel(role.growth))} · ${e(role.period)} · ${translate('US')}</p><small>${e(translate('Skills {skills}/70 · Context {tasks}/20 · Trend {trend}/10',{skills:role.components.skill_overlap,tasks:role.components.task_context,trend:role.components.published_trend}))}</small><details><summary>Skill overlap and gaps</summary><p>${e(translate('Matched: {skills}',{skills:role.matched_skills.map(x=>translate(x)).join(', ')||translate('No literal matches')}))}</p><p>${e(translate('Not mentioned: {skills}',{skills:role.gaps.map(x=>translate(x)).join(', ')}))}</p><p>${e(translate('Context words: {words}',{words:role.overlap_terms.map(x=>translate(x)).join(', ')||translate('None')}))}</p>${references([role.source_id],s)}<p>SDG ${e(role.sdg.target)}: ${e(translate('Explore a measurable workflow improvement in {role}; a proposed productivity contribution, not measured impact.',{role:translate(role.title)}))}</p></details></div><b>${role.score}<small>/100</small></b></article>`).join('')}</div><div class="paths-grid">${a.paths.map(p=>`<article class="path-card ${pathId===p.kind?'selected':''}"><span class="kicker">${translate('Path {path}',{path:p.kind})}</span><h2>${p.kind==='A'?'Upgrade your current work':'Explore an adjacent career'}</h2><p>${e(translate(r.ranking.find(x=>x.id===p.role_id).title))}${p.kind==='A'?' · '+translate('reference role'):''}</p>${claim(p.why,s)}${skillList('TRANSFERABLE STRENGTHS',p.transferable,s)}${skillList('SKILLS TO DEVELOP',p.gaps,s)}<strong>Practical challenge</strong>${claim(p.challenge,s)}<strong>Next experiment</strong>${claim(p.next_step,s)}${sdg(p.sdg)}<button class="button secondary" data-action="select:${p.kind}">${pathId===p.kind?'Selected ✓':'Focus on this path'}</button></article>`).join('')}</div>`;
 if(page==='plan') {
  const p=a.paths.find(x=>x.kind===pathId);
  body=`<div class="plan-summary"><div><span>${translate('Your choice · path {path}',{path:p.kind})}</span><h2>${e(translate(r.ranking.find(x=>x.id===p.role_id).title))}</h2><p data-user-content>${e(answerText(r.profile,'goal'))}</p></div><div class="time-token"><strong>${r.weeklyHours}h</strong><span>weekly budget</span></div></div><p>${translate('Days 1–30 · {hours} planned hours. Week 4 includes the final two review days; review is included in the budget.',{hours:(p.weeks.reduce((n,w)=>n+w.hours,0)).toFixed(1)})}</p><section class="plan-mini"><span class="kicker">TOOLS TO EXPLORE</span>${p.tools.map(t=>`<h3>${e(s[t.resource_id].tool||s[t.resource_id].title)}</h3>${claim(t.purpose,s)}`).join('')}<p>Optional tools. Check access, pricing and workplace policy. Use fictional data only.</p></section><div class="week-list">${p.weeks.map(w=>`<article class="plan-mini"><span class="kicker">${translate('Week {week} · days {start}–{end} · {hours} hours',{week:w.week,start:1+(w.week-1)*7,end:w.week===4?30:w.week*7,hours:w.hours})}</span>${claim({...w.action,text:w.action.text.replace(new RegExp('^Week '+w.week+':\\s*','i'),'')},s)}<p><strong>Deliver:</strong> ${e(w.deliverable)}</p><p><strong>Validate:</strong> ${e(w.validation)}</p><p>${translate('Learning resource:')} ${references([w.resource_id],s)}</p></article>`).join('')}</div><div class="proof-box"><strong>Day 30 · review and decide</strong>${claim(p.day30_review,s)}</div><div class="reality-panel"><strong>Your constraints</strong><p data-user-content>${e(answerText(r.profile,'constraints'))}</p></div>`;
 }
 if(page==='paths') body=body.replace('<div class="paths-grid">',renderSimulator(r,{path:pathId,...simulation},pathId)+'<div class="paths-grid">');
 if(page==='plan') body=body.replace('<section class="plan-mini">',renderSimulator(r,{path:pathId,...simulation},pathId)+'<section class="plan-mini">');
 return head+body+`<div class="method-note"><div><strong>Uncertainties and limits</strong><ul>${[...new Set([...a.uncertainties,...r.limitations])].map(x=>`<li>${e(translate(x))}</li>`).join('')}</ul><p>${e(translate('Source snapshot {version} · retrieved {date}. Report {report}.',{version:r.evidence.version,date:r.evidence.retrieved_at,report:r.report_id}))}</p><p>${e(translate(r.evidence.attribution))} <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. SDG mapping is a proposed contribution, not measured impact.</p><p>Source links provide context. They do not certify the model's interpretation. A human should review every recommendation.</p></div></div>`;
}
function skillList(title,skills,sources) {return `<div class="path-list"><span>${title}</span>${skills.map(x=>`<div><strong>${e(translate(x.skill))}</strong>${claim(x.advice,sources)}${sdg(x.sdg)}</div>`).join('')}</div>`;}

export function sourceRadar(snapshot) {
 return `<section class="source-radar"><span class="kicker">LIVE PUBLIC SOURCES</span><p>${e(translate('Retrieved {date} · snapshot {version} · {geography}',{date:snapshot.retrieved_at,version:snapshot.version,geography:translate(snapshot.geography)}))}</p>${snapshot.warnings.map(x=>`<p class="field-error">${e(sourceWarning(x))}</p>`).join('')}<div class="task-grid">${snapshot.roles.map(r=>`<article class="task-card"><h3>${e(translate(r.title))}</h3><p>${e(growthLabel(r.growth))}</p><small>${e(translate('Projection {period} · source updated {date}',{period:r.period,date:translate(r.updated)}))}</small><p><a href="${safeURL(r.url)}" target="_blank" rel="noopener noreferrer">O*NET occupational source ↗</a></p></article>`).join('')}</div><details class="plan-mini"><summary>AI research signals · not proven job-market effects</summary>${snapshot.research.map(x=>`<p><a href="${safeURL(x.url)}" target="_blank" rel="noopener noreferrer">${e(x.title)}</a><br><small>${e(translate('{date} · preprint; human review required',{date:x.date}))}</small></p>`).join('')}</details></section>`;
}

function growthLabel(value) {const [category,...rest]=String(value).split(' (');return translate(category)+(rest.length?' ('+rest.join(' ('):'');}

function sourceWarning(value){const match=/^O\*NET (.+) unavailable; omitted from matching\.$/.exec(value);return match?translate('O*NET {id} unavailable; omitted from matching.',{id:match[1]}):translate(value);}
