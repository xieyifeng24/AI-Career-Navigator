// Reuse original V2 reports without inventing old categorical answers from Likert values.
import {createDraft} from '../exploration/engine.js';
import {buildExplorationReport} from '../exploration/report.js';
import {renderLocalReport} from '../local/ui.js';
import {renderCareerStarMap} from '../star-map.js';
import {renderCareerComparison,renderSkillDNA,renderTimeMachine} from '../career-explorer.js';
import {renderHeader,renderFooter,renderGoals,escapeHTML as e} from '../explorer-views.js';
import {questionsFor,bank} from '../v3/engine.js';
import {reportFor} from './model.js';
import {language,t} from '../i18n.js';
import knowledge from '../../data/knowledge/current.json' with {type:'json'};
const L=(en,zh,ms)=>({'en':en,'zh-CN':zh,ms})[language]||en;
export const reportPages=['overview','ai','careers','map','compare','tree','future','plan','sdg'];
const labels={overview:'Capabilities',ai:'AI & work',careers:'Career paths',map:'Career map',compare:'Compare paths',tree:'Skill DNA',future:'Time machine',plan:'Action plan',sdg:'SDG companions'};
export function buildCompatibleReport(state,locale=language,assumptions={}){
 const {base,selfReport}=reportFor(state);
 const profile=createDraft(selfReport.trackId);
 // Shared direction identifiers are the sole exact crosswalk. No Likert-to-option conversion.
 const report=buildExplorationReport(profile,locale,assumptions,knowledge);
 return {report,companions:base,currentAnswers:structuredClone(selfReport),background:structuredClone(state.profile),notes:String(state.notes||''),
  compatibility:{version:'v2-report-current-intake-1',mappedFields:['direction'],missingV2Questions:report.exploration.selected.map(q=>q.questionId),likertConverted:false,
   sdgBasis:'Existing background interest and career-link rules; not V2 career recommendations'}};
}
function evidence(model){
 const session=model.currentAnswers;
 return `<section class="ex-method" data-compatible-evidence><h2>${L('Your current answers','当前测评回答','Jawapan semasa anda')}</h2><p>${L('The original V2 report is reused. The current agreement scale cannot establish V2 situation choices or experience stages. Only your selected direction is mapped; missing V2 evidence stays unknown. No suitability ranking is inferred.','复用原版 V2 报告。当前程度选择不能推断 V2 的情境选项或经历阶段，仅准确对接所选方向；未采集的 V2 信息保持未知，不推断职业适合度排名。','Laporan V2 asal digunakan semula. Skala persetujuan semasa tidak menentukan pilihan situasi atau tahap pengalaman V2. Hanya arah dipilih dipetakan; bukti yang tiada kekal tidak diketahui. Tiada kedudukan kesesuaian disimpulkan。')}</p><details><summary>${e(t('Your profile'))} · 12 / 12</summary>${questionsFor(session.trackId).map(q=>{const value=session.answers[q.id];return `<article><h3>${e(q.statement[language])}</h3><p>${e(value===null?bank.uiText.unfamiliar[language]:`${value} · ${bank.scale.find(o=>o.value===value).label[language]}`)}</p></article>`;}).join('')}</details>${model.notes?`<section><h3>${L('Additional information','补充信息','Maklumat tambahan')}</h3><p style="white-space:pre-wrap">${e(model.notes)}</p><small>${L('Preserved verbatim, not scored.','按原文保留，不计分。','Dikekalkan tanpa perubahan, tidak diskor。')}</small></section>`:''}<button class="text-button" data-combined-action="edit-v3">${e(t('Edit your answers ↗'))}</button></section>`;
}
export function renderCompatibleReport(state,options={}){
 const model=buildCompatibleReport(state,language,options.assumptions),r=model.report;
 const page=reportPages.includes(state.page)?state.page:'overview',path=options.path||'A';
 let content;
 if(page==='sdg')content=renderGoals({...state,report:model.companions});
 else if(page==='map')content=renderCareerStarMap(r,path);
 else if(page==='compare')content=renderCareerComparison(r,path,path==='A'?'B':'A');
 else if(page==='tree')content=renderSkillDNA(r,path,options.skill||'');
 else if(page==='future')content=renderTimeMachine(r,options.year||'2026',options.futureScenario||'moderate');
 else content=renderLocalReport(r,{overview:'capability',ai:'impact',careers:'paths',plan:'plan'}[page],path,null,options.assumptions||{});
 const nav=reportPages.map(key=>`<button type="button" data-action="page:${key}" class="${page===key?'active':''}" ${page===key?'aria-current="page"':''}>${e(t(labels[key]))} ↗</button>`).join('');
 return renderHeader({report:model.companions})+`<main class="report-page shell ex-report"><aside class="report-sidebar"><div class="sidebar-sticky"><h2>${e(bank.tracks.find(track=>track.id===state.v3.trackId).label[language])}</h2><nav class="report-nav" aria-label="${e(t('Local report navigation'))}">${nav}</nav><button class="text-button" data-action="edit">${e(t('Edit your answers ↗'))}</button></div></aside><div class="report-main">${evidence(model)}${content}<div class="ex-report-foot"><button class="button secondary" data-action="export">${e(t('Export my report'))}</button><button class="text-button" data-action="print">${e(t('Print / save PDF'))}</button><button class="text-button" data-action="reset">${e(t('Start over'))}</button></div></div></main>`+renderFooter();
}
