import {language,setLanguage,t} from '../i18n.js';
import {renderHeader,renderFooter,renderForm,renderReport,sections,escapeHTML} from '../explorer-views.js';
import {catalog,buildPlan,outputInventory} from '../explorer-engine.js';
import {bank,questionsFor,chooseTrack,changeLanguage,selectAnswer,advance,previous} from '../v3/engine.js';
import {renderPreview} from '../v3/ui.js';
import {fresh,load,save,updateBackground,nextBackground,reportFor} from './model.js';
export {STORAGE_KEY} from './model.js';
const e=escapeHTML;
export function hasCombinedDraft(){try{return !!sessionStorage.getItem('career-combined-pr8-pr9-v1');}catch{return false;}}
export function mountCombined({root,onHome}) {
 let storage;try{storage=sessionStorage;}catch{storage=null;}
 let state=load(storage,language),errors={};
 setLanguage(state.v3.language);
 for(const path of ['explorer.css','v3/styles.css','combined/styles.css']) {
  if(!document.querySelector(`link[data-combined-style="${path}"]`)){
   const link=document.createElement('link');link.rel='stylesheet';link.href='./'+path;link.dataset.combinedStyle=path;document.head.append(link);
  }
 }
 function v3Evidence(){return `<section class="ex-method combined-evidence"><h2>${e(t('V3 self-report · separate from career scores'))}</h2><p>${e(t('Career rankings use your background choices. The V3 responses below are unverified self-report and do not change those rankings.'))}</p><details><summary>${e(t('Your profile'))} · V3 · 12 / 12</summary>${questionsFor(state.v3.trackId).map(q=>`<article><small>${e(bank.constructLabels[q.construct][language])}</small><h3>${e(q.statement[language])}</h3><p>${state.v3.answers[q.id]===null?e(bank.uiText.unfamiliar[language]):`${state.v3.answers[q.id]} · ${e(bank.scale.find(o=>o.value===state.v3.answers[q.id]).label[language])}`}</p></article>`).join('')}</details><button class="text-button" data-combined-action="edit-v3">${e(t('Edit your answers ↗'))} · V3</button></section>`;}
 function render(focus=false) {
  state={...state,v3:changeLanguage(state.v3,language)};
  let html;
  if(state.phase==='background') {
   html=renderHeader({report:null})+renderForm({...state,errors})+renderFooter();
   html=html.replace(e(t('View my exploration report')),e(t('Continue'))).replace(e(t('Your profile stays local; only your language choice is saved automatically.')),e(t('Your answers are safe in this tab.')));
   if(state.step===0)html=html.replace('<form id="explorer-form" novalidate>',`<p class="combined-demo-note">${e(t('Team Nexus · Domain 1 · Fictional profiles only'))}</p><form id="explorer-form" novalidate>`);
  }else if(state.phase==='v3') {
   html=renderPreview(state.v3,errors.answer||'',focus);
   // Context navigation stays in this local session instead of discarding background choices.
   html=html.replaceAll('href="/?intro=off"','href="#" data-combined-action="home"');
   if(state.v3.screen==='tracks')html=html.replace('<section class="v3-entry">',`<section class="v3-entry"><button class="text-button" data-combined-action="edit-background">${e(t('Edit your answers ↗'))}</button>`);
   if(state.v3.screen==='review')html=html.replace('<ol class="v3-review-list">',`<div class="combined-finish"><button class="button primary" data-combined-action="finish">${e(bank.uiText.submit[language])} ↗</button></div><ol class="v3-review-list">`);
  }else {
   const {base}=reportFor(state);
   const reportState={...state,report:base,focus:state.focus||base.ranking[0].id};
   html=renderHeader(reportState)+renderReport(reportState)+renderFooter();
   if(state.page==='overview')html=html.replace('<div class="report-main">','<div class="report-main">'+v3Evidence());
  }
  // Avoid collisions with the retained V2 controller's delegated actions and language input.
  html=html.replaceAll('data-action=','data-combined-action=').replaceAll('id="language-select"','id="combined-language-select"');
  html+=`<nav class="combined-legacy-links" aria-label="${e(t('Your profile'))}"><a href="/?assessment=v2&intro=off">V2 · What If · O*NET / ESCO / MYFutureJobs ↗</a></nav>`;
  root.innerHTML=html;
  document.title=e(t(state.phase==='report'?'Overview':'Your profile'))+' · AI Career Navigator';document.documentElement.lang=language;
  save(storage,state);
  if(focus){(document.getElementById('v3-heading')||root.querySelector('main h1'))?.focus?.({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
 }
 function change(event) {
  const target=event.target;
  if(['combined-language-select','v3-language'].includes(target.id)){setLanguage(target.value);errors={};render();root.querySelector('#combined-language-select,#v3-language')?.focus();return;}
  if(state.phase==='background'&&target.dataset.field){state=updateBackground(state,target.dataset.field,target.value,target.checked!==false);delete errors[target.dataset.field];render();[...document.getElementsByName(target.name)].find(el=>el.value===target.value)?.focus();return;}
  if(state.phase==='v3'&&target.name==='v3-answer'){
   state={...state,v3:selectAnswer(state.v3,questionsFor(state.v3.trackId)[state.v3.index].id,target.value==='unknown'?null:Number(target.value))};errors={};render();root.querySelector(`input[name="v3-answer"][value="${target.value}"]`)?.focus({preventScroll:true});
  }
 }
 function submit(event) {
  if(event.target.id!=='explorer-form')return;event.preventDefault();
  const next=nextBackground(state);errors=next.errors;state=next.state;render(true);
  const key=Object.keys(errors)[0];if(key)document.getElementById('field-'+key)?.focus();
 }
 function click(event) {
  const target=event.target.closest('[data-combined-action],[data-v3-action],[data-v3-edit],[data-track]');if(!target)return;
  event.preventDefault();errors={};
  if(target.dataset.track){state={...state,v3:chooseTrack(state.v3,target.dataset.track)};render(true);return;}
  if(target.dataset.v3Edit!==undefined){state={...state,v3:{...state.v3,screen:'question',index:Number(target.dataset.v3Edit)}};render(true);return;}
  if(target.dataset.v3Action){
   if(target.dataset.v3Action==='back')state={...state,v3:previous(state.v3)};
   else if(target.dataset.v3Action==='reset')state={...state,v3:{...fresh(language).v3}};
   else try{state={...state,v3:advance(state.v3)};}catch{errors.answer='Please choose an answer.';}
   render(true);return;
  }
  const action=target.dataset.combinedAction;
  if(action==='home'){onHome();return;}
  if(action==='start'||action==='edit'||action==='edit-background'){state={...state,phase:'background',step:0};render(true);return;}
  if(action==='reset'){state=fresh(language);render(true);return;}
  if(action==='prev'){if(state.step>0){state={...state,step:state.step-1};render(true);}else onHome();return;}
  if(action==='edit-v3'){state={...state,phase:'v3',v3:{...state.v3,screen:'review'}};render(true);return;}
  if(action==='finish'){const {base}=reportFor(state);state={...state,phase:'report',page:'overview',focus:base.ranking[0].id,goal:base.goals[0].id};render(true);return;}
  if(action.startsWith('page:')&&sections.includes(action.slice(5))){state={...state,page:action.slice(5)};render(true);return;}
  if(action==='toggle-careers'){state={...state,allCareers:!state.allCareers};render();return;}
  if(action.startsWith('focus:')&&catalog.careers.some(c=>c.id===action.slice(6))){state={...state,focus:action.slice(6),page:'plan'};render(true);return;}
  if(action.startsWith('goal:')&&catalog.goals.some(g=>g.id===Number(action.slice(5)))){state={...state,goal:Number(action.slice(5))};render();return;}
  if(action==='print'){window.print();return;}
  if(action==='export'){
   const report=reportFor(state),payload={...report.base,v3SelfReport:report.selfReport,v3AffectsRanking:false,selectedPlan:buildPlan(state.profile,state.focus),selectedCompanionGoal:state.goal,language,inventory:outputInventory()};
   const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
   const anchor=document.createElement('a');anchor.href=url;anchor.download='career-exploration-'+report.base.reportId+'.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
 }
 root.addEventListener('change',change);root.addEventListener('submit',submit);root.addEventListener('click',click);
 render();
 return ()=>{root.removeEventListener('change',change);root.removeEventListener('submit',submit);root.removeEventListener('click',click);};
}
