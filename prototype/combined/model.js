// Only compose existing engines. V3 never supplies inputs to PR8's career scoring.
import {catalog,blankProfile,validateProfile,generateOfflineReport,updateChoice} from '../explorer-engine.js';
import {deriveResult,scenarioResult} from './results.js';
import {newSession,changeLanguage,restoreSession,answeredCount,bank} from '../v3/engine.js';
export const STORAGE_KEY='career-combined-pr8-pr9-v1';
export const VERSION='combined-pr8-pr9-1';
export function fresh(language='en') {
 return {version:VERSION,phase:'background',step:0,profile:blankProfile(),v3:changeLanguage(newSession(),language),page:'overview',focus:null,goal:9,allCareers:false,notes:'',scenarioPatch:{},assumedSkills:[],selectedSkill:''};
}
export function updateBackground(state,key,value,checked=true) {
 const profile=structuredClone(state.profile);
 if(key==='nationality') {
  if(value!=='undisclosed'&&!catalog.countries.includes(value))throw Error('INVALID_COUNTRY');
  profile.nationality=value;
 }else updateChoice(profile,key,value,checked);
 return {...state,profile,scenarioPatch:{},assumedSkills:[]};
}
export function nextBackground(state) {
 const errors=validateProfile(state.profile,state.step);
 if(Object.keys(errors).length)return {state,errors};
 return {state:state.step<3?{...state,step:state.step+1}:{...state,phase:'v3'},errors:{}};
}
export function reportFor(state) {
 if(state.v3.version!==bank.schemaVersion || state.v3.screen!=='review' || answeredCount(state.v3)!==12)throw Error('INCOMPLETE_V3');
 return {base:generateOfflineReport(state.profile),selfReport:structuredClone(state.v3)};
}
export function restore(raw,language='en') {
 try {
  const state=JSON.parse(raw);
  if(state?.version!==VERSION || !['background','v3','report'].includes(state.phase) || !Number.isInteger(state.step) || state.step<0 || state.step>3) return fresh(language);
  if(!state.profile || !bank.languageCodes.includes(state.v3?.language) || state.v3.version!==bank.schemaVersion)return fresh(language);
  for(const field of catalog.fields) {
   const value=state.profile[field.id],values=field.multi?value:[value];
   if(!Array.isArray(values) || (field.multi&&new Set(values).size!==values.length) || values.some(v=>v!==''&&!field.options.some(o=>o.id===v)))return fresh(language);
  }
  if(state.profile.nationality!=='undisclosed'&&!catalog.countries.includes(state.profile.nationality))return fresh(language);
  const v3=restoreSession(JSON.stringify(state.v3));
  if(JSON.stringify(v3)!==JSON.stringify(state.v3))return fresh(language);
  if(state.phase!=='background'&&Object.keys(validateProfile(state.profile)).length)return fresh(language);
  const clean={...fresh(v3.language),phase:state.phase,step:state.step,profile:structuredClone(state.profile),v3,page:['overview','ai','careers','plan','sdg','catalog','map','tree','whatif'].includes(state.page)?state.page:'overview',focus:catalog.careers.some(c=>c.id===state.focus)?state.focus:null,goal:catalog.goals.some(g=>g.id===state.goal)?state.goal:9,allCareers:state.allCareers===true};
  clean.notes=typeof state.notes==='string'?state.notes.slice(0,1500):'';
  clean.selectedSkill=typeof state.selectedSkill==='string'?state.selectedSkill:'';
  if(clean.phase==='report'){
   reportFor(clean);
   try{const original=deriveResult(clean.profile);scenarioResult(original,state.scenarioPatch||{},state.assumedSkills||[]);clean.scenarioPatch=state.scenarioPatch||{};clean.assumedSkills=state.assumedSkills||[];}catch{}
  }
  return clean;
 }catch{return fresh(language);}
}
export function load(storage,language='en') {try{return restore(storage.getItem(STORAGE_KEY),language);}catch{return fresh(language);}}
export function save(storage,state) {try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
