import {buildCompatibleReport,renderCompatibleReport,reportPages as compatiblePages} from './v2-report.js';
import {language,setLanguage,t} from '../i18n.js';
import {renderHeader,renderFooter,renderForm,escapeHTML} from '../explorer-views.js';
import {catalog} from '../explorer-engine.js';
import {bank,questionsFor,chooseTrack,changeLanguage,selectAnswer,advance,previous} from '../v3/engine.js';
import {renderPreview} from '../v3/ui.js';
import {fresh,load,save,updateBackground,nextBackground,reportFor} from './model.js';
export {STORAGE_KEY} from './model.js';
import {supplementaryInput} from './ui.js';
const e=escapeHTML;
export function hasCombinedDraft(){try{return !!sessionStorage.getItem('career-combined-pr8-pr9-v1');}catch{return false;}}
export function mountCombined({root,onHome}) {
 let storage;try{storage=sessionStorage;}catch{storage=null;}
 let state=load(storage,language),errors={};
 let v2Options={path:'A',assumptions:{}};
 setLanguage(state.v3.language);
 for(const path of ['explorer.css','v3/styles.css','star-map.css','career-explorer.css','combined/styles.css']) {
  if(!document.querySelector(`link[data-combined-style="${path}"]`)){
   const link=document.createElement('link');link.rel='stylesheet';link.href='./'+path;link.dataset.combinedStyle=path;document.head.append(link);
  }
 }
 function render(focus=false) {
  state={...state,v3:changeLanguage(state.v3,language)};
  let html;
  if(state.phase==='background') {
   html=renderHeader({report:null})+renderForm({...state,errors})+renderFooter();
   html=html.replace(e(t('View my exploration report')),e(t('Continue'))).replace(e(t('Your profile stays local; only your language choice is saved automatically.')),e(t('Your answers are safe in this tab.')));
   if(state.step===3)html=html.replace('<div class="form-actions">',supplementaryInput(state.notes)+'<div class="form-actions">');
   if(state.step===0)html=html.replace('<form id="explorer-form" novalidate>',`<p class="combined-demo-note">${e(t('Team Nexus · Domain 1 · Fictional profiles only'))}</p><form id="explorer-form" novalidate>`);
  }else if(state.phase==='v3') {
   html=renderPreview(state.v3,errors.answer||'',focus);
   // Context navigation stays in this local session instead of discarding background choices.
   html=html.replaceAll('href="/?intro=off"','href="#" data-combined-action="home"');
   if(state.v3.screen==='tracks')html=html.replace('<section class="v3-entry">',`<section class="v3-entry"><button class="text-button" data-combined-action="edit-background">${e(t('Edit your answers ↗'))}</button>`);
   if(state.v3.screen==='review')html=html.replace('<ol class="v3-review-list">',`<div class="combined-finish"><button class="button primary" data-combined-action="finish">${e(bank.uiText.submit[language])} ↗</button></div><ol class="v3-review-list">`);
  }else {
   html=renderCompatibleReport(state,v2Options);
  }
  // Avoid collisions with the retained V2 controller's delegated actions and language input.
  html=html.replaceAll('data-action=','data-combined-action=').replaceAll('id="language-select"','id="combined-language-select"');
  if(state.phase!=='report')html+=`<nav class="combined-legacy-links" aria-label="${e(t('Your profile'))}"><a href="/?assessment=v2&intro=off">${e(t('Previous assessment versions'))} ↗</a></nav>`;
  root.innerHTML=html;
  document.title=e(t(state.phase==='report'?'Overview':'Your profile'))+' · AI Career Navigator';document.documentElement.lang=language;
  save(storage,state);
  if(focus){(document.getElementById('v3-heading')||root.querySelector('main h1'))?.focus?.({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
 }
 function change(event) {
  const target=event.target;
  if(state.phase==='report'&&target.dataset.v2Control){
   const key=target.dataset.v2Control;
   v2Options.assumptions={...v2Options.assumptions,[key]:key==='hours'?Number(target.value):target.value};
   render();root.querySelector(`[data-v2-control="${key}"]`)?.focus();return;
  }
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
  if(state.phase==='report'){
   if(action==='v2-reset'){v2Options.assumptions={};render();return;}
   if(action.startsWith('select:')||action.startsWith('route-select:')||action.startsWith('map-select:')||action.startsWith('compare-select:')){
    const value=action.slice(action.indexOf(':')+1);if(['A','B'].includes(value))v2Options.path=value;render();return;
   }
   if(action.startsWith('skill-select:')){try{v2Options.skill=decodeURIComponent(action.slice(13));}catch{}render();return;}
   if(action.startsWith('time-year:')){const year=action.slice(10);if(['2026','2028','2030','2035'].includes(year))v2Options.year=year;render();return;}
   if(action.startsWith('time-scenario:')){const value=action.slice(14);if(['slower','moderate','fast'].includes(value))v2Options.futureScenario=value;render();return;}
   if(action.startsWith('page:')){const page=action.slice(5);if(compatiblePages.includes(page)){state={...state,page};render(true);}return;}
  }
  if(action==='home'){onHome();return;}
  if(action==='start'||action==='edit'||action==='edit-background'){state={...state,phase:'background',step:0};render(true);return;}
  if(action==='reset'){v2Options={path:'A',assumptions:{}};state=fresh(language);render(true);return;}
  if(action==='prev'){if(state.step>0){state={...state,step:state.step-1};render(true);}else onHome();return;}
  if(action==='edit-v3'){state={...state,phase:'v3',v3:{...state.v3,screen:'review'}};render(true);return;}
  if(action==='finish'){const {base}=reportFor(state);state={...state,phase:'report',page:'overview',focus:base.ranking[0].id,goal:base.goals[0].id};render(true);return;}
  if(action.startsWith('goal:')&&catalog.goals.some(g=>g.id===Number(action.slice(5)))){state={...state,goal:Number(action.slice(5))};render();return;}
  if(action==='print'){window.print();return;}
  if(action==='export'){
   const payload={...buildCompatibleReport(state,language,v2Options.assumptions),selectedCompanionGoal:state.goal,language,selectedPath:v2Options.path,planningAssumptions:structuredClone(v2Options.assumptions)};
   const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
   const anchor=document.createElement('a');anchor.href=url;anchor.download='career-exploration-'+payload.report.report_id+'.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
 }
 function input(event){if(event.target.dataset.v2Control==='hours'){change(event);return;}if(event.target.id==='combined-notes'){state={...state,notes:event.target.value.slice(0,1500)};save(storage,state);}}
 root.addEventListener('input',input);
 root.addEventListener('change',change);root.addEventListener('submit',submit);root.addEventListener('click',click);
 render();
 return ()=>{root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('submit',submit);root.removeEventListener('click',click);};
}
