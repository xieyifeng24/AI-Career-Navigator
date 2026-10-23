import {text,t} from '../i18n.js';
import {catalog,fieldMap,visibleFields} from '../explorer-engine.js';
import {escapeHTML as e} from '../explorer-views.js';
import {renderResultStarMap} from '../star-map.js';
import {renderResultSkillTree} from '../career-explorer.js';
import {compareResults,scenarioFields} from './results.js';
import {u} from './copy.js';
const U=k=>e(u(k)),X=v=>e(text(v));
export const extraSections=['map','tree','whatif'];
export const extraLabels={map:'Career Star Map',tree:'Skill Tree',whatif:'What If'};
export function resultToolbar(result,focus){return `<section class="unified-toolbar" aria-label="${U('selected')}"><p><strong>${U(result.hypothetical?'scenario':'original')}</strong> · ${U('same')}</p><label>${U('select')}<select id="unified-career">${result.recommendations.map(r=>`<option value="${e(r.id)}" ${r.id===focus?'selected':''}>${r.rank}. ${X(r.title)} · ${r.score} ${U('points')}</option>`).join('')}</select></label>${result.hypothetical?`<button class="button secondary" data-action="scenario-reset">${U('reset')}</button>`:''}</section>`;}
export function resultSummary(result){return `<section class="unified-summary"><h2>${U('dashboard')}</h2><p>${U('rules')}</p><div class="ex-two-grid">${[['readiness','aiLimit'],['gaps','gapLimit'],['transformation','trendLimit']].map(([title,detail])=>`<article class="ex-advice"><h3>${U(title)} · ${U('unavailable')}</h3><p>${U(detail)}</p></article>`).join('')}</div><button class="button secondary" data-action="page:map">${U('returnMap')} ↗</button></section>`;}
export function sourceContext(result,focus){
 const role=result.recommendations.find(r=>r.id===focus);
 return `<details class="ex-detail unified-sources"><summary>${U('context')}</summary><p>${U('contextNote')}</p><p>${e(result.knowledgeVersion)}</p>${role.sources.length?role.sources.map(s=>`<article><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.source.toUpperCase())} · <span lang="${e(s.language)}">${e(s.title)}</span> ↗</a><p>${e(s.geography)} · ${U('published')}: ${e(s.published_at||u('unavailable'))} · ${U('verified')}: ${e(s.verified_at)} · ${e(s.version)}</p></article>`).join(''):`<p>${U('noContext')}</p>`}<a href="https://myfuturejobs.gov.my/" target="_blank" rel="noopener noreferrer">MYFutureJobs ↗</a><p>${U('trendLimit')}</p></details>`;
}
function scenarioControls(original,active,focus,error){
 const p=active.baseReport.profile,visible=new Set(catalog.steps.flatMap((_,i)=>visibleFields(p,i)));
 return `<section class="unified-controls"><p>${U('scenarioNote')}</p>${error?`<p class="field-error" role="alert">${U('keep')}</p>`:''}${scenarioFields.filter(k=>visible.has(k)).map(key=>{
 const field=fieldMap[key],values=Array.isArray(p[key])?p[key]:[p[key]];
 return `<fieldset><legend>${X(field.label)}</legend>${field.multi?`<div class="choice-grid">${field.options.map(o=>`<label class="choice ${values.includes(o.id)?'is-selected':''}"><input type="checkbox" data-scenario-field="${key}" value="${o.id}" ${values.includes(o.id)?'checked':''}><span>${X(o.label)}</span></label>`).join('')}</div>`:`<select data-scenario-field="${key}" aria-label="${X(field.label)}">${field.options.map(o=>`<option value="${o.id}" ${p[key]===o.id?'selected':''}>${X(o.label)}</option>`).join('')}</select>`}</fieldset>`;
 }).join('')}<fieldset><legend>${U('skillAssumptions')} · ${X(active.recommendations.find(r=>r.id===focus).title)}</legend><div class="choice-grid">${active.recommendations.find(r=>r.id===focus).requirements.map(s=>`<label class="choice"><input type="checkbox" data-assume-skill="${e(s.id)}" ${s.status==='assumed-present'?'checked':''}><span>${X(s.label)}</span></label>`).join('')}</div></fieldset></section>`;
}
export function renderUnifiedPage(page,original,active,state,error=''){
 const focus=state.focus||active.recommendations[0].id;
 if(page==='map')return renderResultStarMap(active,focus,{label:u,text});
 if(page==='tree')return renderResultSkillTree(active,focus,state.selectedSkill,{label:u,text});
 if(page==='whatif')return `<section><div class="report-head"><h1>${U('whatif')}</h1><p>${U('rules')}</p></div>${scenarioControls(original,active,focus,error)}<div class="unified-table"><table><caption>${U('fit')}</caption><thead><tr><th>${U('career')}</th><th>${U('before')} · ${U('rank')}</th><th>${U('after')} · ${U('rank')}</th><th>${U('before')} · ${U('points')}</th><th>${U('after')} · ${U('points')}</th><th>${U('delta')}</th></tr></thead><tbody>${compareResults(original,active).map(row=>`<tr><th><button data-action="map-select:${row.id}" class="text-button">${X(active.recommendations.find(r=>r.id===row.id).title)}</button></th><td>${row.beforeRank}</td><td>${row.rank}</td><td>${row.beforeScore}</td><td>${row.score}</td><td>${row.scoreChange>0?'+':''}${row.scoreChange}</td></tr>`).join('')}</tbody></table></div></section>`;
 return null;
}
export function supplementaryInput(notes){return `<label class="field" for="combined-notes">${U('notes')}<textarea id="combined-notes" maxlength="1500" rows="3">${e(notes||'')}</textarea><small>${U('notesHelp')}</small></label>`;}
export function supplementaryReport(notes){return notes?`<details class="ex-detail"><summary>${U('notes')}</summary><p class="unified-notes">${e(notes)}</p><small>${U('notesHelp')}</small></details>`:'';}

export function roadmapFocus(result,focus){const role=result.recommendations.find(r=>r.id===focus);return `<section class="unified-summary"><h2>${U('practicePriority')}</h2><p>${U('gapLimit')}</p><ul>${role.requirements.map(s=>`<li>${X(s.label)} · ${U(s.status==='assumed-present'?'verifyAssumptions':'unassessed')}</li>`).join('')}</ul></section>`;}
