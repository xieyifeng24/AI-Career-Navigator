import {validDirectionAnswer} from '../v3/engine.js';
import {newStartingPoint,restoreStartingPoint,startingPointBase} from './starting-point.js';
import {canonicalPage,canonicalGalaxySection,legacyPageSections} from './page-map.js';
// Only compose existing engines. V3 never supplies inputs to PR8's career scoring.
import {catalog,validWeeklyHours,backgroundSteps,blankProfile,validateProfile,generateOfflineReport,updateChoice} from '../explorer-engine.js';
import {deriveResult,scenarioResult} from './results.js';
import {newSession,changeLanguage,restoreSession,answeredCount,questionsFor,bank} from '../v3/engine.js';
export const STORAGE_KEY='career-combined-pr8-pr9-v1';
export const VERSION='combined-pr8-pr9-1';
export function withoutPersonalityInterests(profile){return {...profile,omitPersonalityInterests:true,social:'',planning:'',decision:'',interests:[],nationality:'undisclosed',omitLearningPreferences:true,learningAbility:'',learningStyles:[],mindsets:[],weeklyTime:'',exactWeeklyHours:validWeeklyHours(profile.exactWeeklyHours)?profile.exactWeeklyHours:null};}
export function fresh(language='en') {
 return {version:VERSION,phase:'background',step:0,profile:withoutPersonalityInterests(blankProfile()),startingPoint:newStartingPoint(),v3:changeLanguage(newSession(),language),page:'profile',section:'map',focus:null,goal:9,allCareers:false,notes:'',scenarioPatch:{},assumedSkills:[],selectedSkill:''};
}
export function updateBackground(state,key,value,checked=true) {
 const profile=structuredClone(state.profile);
 if(key==='exactWeeklyHours'){
  if(value!==null&&!validWeeklyHours(value))throw Error('INVALID_WEEKLY_HOURS');
  profile.exactWeeklyHours=value;
 }else if(key==='nationality') {
  if(value!=='undisclosed'&&!catalog.countries.includes(value))throw Error('INVALID_COUNTRY');
  profile.nationality=value;
 }else updateChoice(profile,key,value,checked);
 return {...state,profile,scenarioPatch:{},assumedSkills:[]};
}
export function nextBackground(state) {
 const errors=validateProfile(state.profile,state.step);
 if(Object.keys(errors).length)return {state,errors};
 const steps=backgroundSteps(state.profile),next=steps[steps.indexOf(state.step)+1];
 return {state:next!==undefined?{...state,step:next}:{...state,phase:'v3'},errors:{}};
}
export function reportFor(state) {
 if(state.v3.version!==bank.schemaVersion || state.v3.screen!=='review' || answeredCount(state.v3)!==12)throw Error('INCOMPLETE_V3');
 return {base:state.startingPoint?.completed?startingPointBase(state.startingPoint):generateOfflineReport(state.profile),selfReport:structuredClone(state.v3)};
}
export function completeAssessment(state){
 if(state.v3.screen!=='review'||questionsFor(state.v3.trackId).some(q=>!Object.hasOwn(state.v3.answers,q.id)||!(validDirectionAnswer(state.v3.answers[q.id])||state.v3.responseVersion==='legacy-likert7'&&state.v3.answers[q.id]===null)))throw Error('INCOMPLETE_V3');
 const {base}=reportFor(state);
 return {...state,phase:'report',page:'profile',section:'map',focus:base.ranking[0]?.id||null,goal:base.goals[0]?.id||9};
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
  if(state.profile.omitLearningPreferences&&state.profile.exactWeeklyHours!==null&&!validWeeklyHours(state.profile.exactWeeklyHours))return fresh(language);
  const v3=restoreSession(JSON.stringify(state.v3));
  if(state.v3.trackId&&v3.trackId!==state.v3.trackId)return fresh(language);
  const startingPoint=state.startingPoint?restoreStartingPoint(state.startingPoint):null;
  const migratingIntake=!!startingPoint&&!startingPoint.completed&&startingPoint.migration;
  if(state.phase!=='background'&&!startingPoint?.completed&&!migratingIntake&&Object.keys(validateProfile(state.profile)).length)return fresh(language);
  const clean={...fresh(v3.language),phase:state.phase,step:state.step,startingPoint,profile:structuredClone(state.profile),v3,page:canonicalPage(state.page),section:legacyPageSections[state.page]||canonicalGalaxySection(state.section),focus:catalog.careers.some(c=>c.id===state.focus)?state.focus:null,goal:catalog.goals.some(g=>g.id===state.goal)?state.goal:9,allCareers:state.allCareers===true};
  clean.notes=typeof state.notes==='string'?state.notes.slice(0,1500):'';
  clean.selectedSkill=typeof state.selectedSkill==='string'?state.selectedSkill:'';
  if(migratingIntake)clean.phase='background';
  else if(v3.needsReanswer?.length)clean.phase='v3';
  if(clean.phase==='report'){
   reportFor(clean);
   try{const original=deriveResult(clean.profile);scenarioResult(original,state.scenarioPatch||{},state.assumedSkills||[]);clean.scenarioPatch=state.scenarioPatch||{};clean.assumedSkills=state.assumedSkills||[];}catch{}
  }
  return clean;
 }catch{return fresh(language);}
}
export function load(storage,language='en') {try{return restore(storage.getItem(STORAGE_KEY),language);}catch{return fresh(language);}}
export function save(storage,state) {try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
