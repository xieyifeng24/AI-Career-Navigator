import {language,setLanguage,t} from './i18n.js';
import {blankProfile,updateChoice,validateProfile,generateOfflineReport,sampleProfile,catalog,outputInventory,buildPlan} from './explorer-engine.js';
import {renderHeader,renderFooter,renderHome,renderForm,renderReport,renderStandalone,sections,sectionLabels} from './explorer-views.js';
const root=document.getElementById('app');
const state={page:'home',profile:blankProfile(),step:0,errors:{},report:null,focus:null,goal:9,allCareers:false};
function render(){
 const content=state.page==='home'?renderHome():state.page==='profile'?renderForm(state):state.report&&sections.includes(state.page)?renderReport(state):renderStandalone(state);
 root.innerHTML=renderHeader(state)+content+renderFooter();
 document.documentElement.lang=language;
 document.title=(state.page==='home'?'AI Career Navigator':t(sectionLabels[state.page]||(state.page==='profile'?'Questionnaire overview':'SDG companions')))+' · AI Career Navigator';
 document.querySelector('meta[name=description]')?.setAttribute('content',t('Answer with choices. Explore career directions, build a learning plan and meet your SDG action companions.'));
}
function go(page){state.page=page;render();window.scrollTo({top:0,behavior:'instant'});}
function generate(){
 state.errors=validateProfile(state.profile);
 if(Object.keys(state.errors).length){state.step=catalog.steps.findIndex((s,i)=>s.fields.some(k=>state.errors[k]));go('profile');focusError();return;}
 state.report=generateOfflineReport(state.profile);state.focus=state.report.ranking[0].id;state.goal=state.report.goals[0].id;state.allCareers=false;go('overview');
}
function focusError(){const key=Object.keys(state.errors)[0];document.getElementById(`field-${key}`)?.focus();}
root.addEventListener('change',event=>{
 const target=event.target;
 if(target.id==='language-select'){setLanguage(target.value);render();document.getElementById('language-select')?.focus();return;}
 const key=target.dataset.field;if(!key)return;
 if(key==='nationality'){state.profile.nationality=target.value;delete state.errors[key];return;}
 updateChoice(state.profile,key,target.value,target.checked!==false);delete state.errors[key];
 if(key==='education'){delete state.errors.major;delete state.errors.stream;}
 if(key==='aiPurposes'){delete state.errors.aiDuration;delete state.errors.reliance;}
 render();Array.from(document.getElementsByName(key)).find(el=>el.value===target.value)?.focus();
});
root.addEventListener('submit',event=>{
 if(event.target.id!=='explorer-form')return;event.preventDefault();
 state.errors=validateProfile(state.profile,state.step);
 if(Object.keys(state.errors).length){render();focusError();return;}
 if(state.step<3){state.step++;go('profile');}else generate();
});
root.addEventListener('click',event=>{
 const control=event.target.closest('[data-action]');if(!control)return;
 const action=control.dataset.action;
 if(action==='home'){go('home');return;}
 if(action==='reset'){state.profile=blankProfile();state.report=null;state.step=0;state.errors={};state.focus=null;state.goal=9;go('home');return;}
 if(action==='start'||action==='edit'){state.step=0;state.errors={};go('profile');return;}
 if(action==='sample'){state.profile=sampleProfile();state.step=0;state.errors={};go('profile');return;}
 if(action==='prev'){state.step=Math.max(0,state.step-1);state.errors={};go('profile');return;}
 if(action==='gallery'){go(state.report?'sdg':'gallery');return;}
 if(action==='catalog'){go('catalog');return;}
 if(action.startsWith('page:')){const page=action.slice(5);if(state.report&&sections.includes(page))go(page);return;}
 if(action.startsWith('goal:')){const id=Number(action.slice(5));if(catalog.goals.some(g=>g.id===id)){state.goal=id;render();document.querySelector('.ex-goal-feature')?.scrollIntoView({behavior:'instant',block:'start'});}return;}
 if(action==='toggle-careers'){state.allCareers=!state.allCareers;render();return;}
 if(action.startsWith('focus:')){const id=action.slice(6);if(state.report?.ranking.some(r=>r.id===id)){state.focus=id;go('plan');}return;}
 if(action==='print'){window.print();return;}
 if(action==='export'&&state.report){
  const payload={...state.report,selectedPlan:buildPlan(state.report.profile,state.focus),selectedCompanionGoal:state.goal,language,inventory:outputInventory()};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`career-exploration-${state.report.reportId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
 }
});
render();
