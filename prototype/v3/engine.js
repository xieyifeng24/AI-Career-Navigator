// Answer collection only. No scoring, reporting, AI, or V2 answer migration.
import bank from './bank.json' with {type:'json'};
export {bank};
export const RESPONSE_VERSION='likert7-2';
export const validDirectionAnswer=value=>Number.isInteger(value)&&value>=1&&value<=7;
export const VERSION = '3.0.0';
export const STORAGE_KEY = 'career-questionnaire-v3-phase1';
export const languages = ['en','zh-CN','ms'];
const owns = (object, key) => Object.hasOwn(object, key);
function requireV3(state) { if (state?.version !== VERSION) throw new Error('INVALID_V3_VERSION'); }
const validAnswer = value => value === null || (Number.isInteger(value) && value >= 1 && value <= 7);
export function validateBank(data) {
  const errors = [];
  const translated = (value, path) => {
    for (const language of languages) if (typeof value?.[language] !== 'string' || !value[language].trim()) errors.push(`${path}.${language}`);
  };
  if (data?.schemaVersion !== VERSION || data.defaultLanguage !== 'en') errors.push('version/defaultLanguage');
  if (JSON.stringify(data.languageCodes) !== JSON.stringify(languages)) errors.push('languages');
  if (data.design?.itemsPerSession !== 12 || data.design?.totalBankItems !== 84 || data.design?.missingValue !== null) errors.push('design');
  if (JSON.stringify(data.design?.responseCodes) !== JSON.stringify([1,2,3,4,5,6,7])) errors.push('responseCodes');
  const tracks = data.tracks || [], questions = data.questions || [], scale = data.scale || [];
  if (tracks.length !== 10 || new Set(tracks.map(t => t.id)).size !== 10) errors.push('tracks');
  if (questions.length !== 84 || new Set(questions.map(q => q.id)).size !== 84) errors.push('questions');
  if (JSON.stringify(scale.map(option => option.value)) !== JSON.stringify([1,2,3,4,5,6,7])) errors.push('scale');
  for (const track of tracks) translated(track.label, `track.${track.id}`);
  for (const option of scale) translated(option.label, `scale.${option.value}`);
  for (const [key, value] of Object.entries(data.uiText || {})) translated(value, `uiText.${key}`);
  for (const [key, value] of Object.entries(data.constructLabels || {})) translated(value, `constructLabels.${key}`);
  for (const key of ['intro','unfamiliar','unfamiliar_help','experience_help','scenario_help','progress','next','back','submit','low_evidence']) {
    if (!data.uiText?.[key]) errors.push(`uiText.${key}`);
  }
  for (const question of questions) {
    translated(question.statement, question.id);
    if (!['GENERAL', ...tracks.map(t => t.id)].includes(question.trackId)) errors.push(`${question.id}.trackId`);
    if (!data.constructLabels?.[question.construct]) errors.push(`${question.id}.construct`);
    if (question.responseType !== 'likert7' || question.allowNotApplicable !== true) errors.push(`${question.id}.response`);
    if (question.helpKey !== null && !data.uiText?.[question.helpKey]) errors.push(`${question.id}.helpKey`);
  }
  if (questions.filter(q => q.trackId === 'GENERAL').length !== 4) errors.push('GENERAL.count');
  for (const track of tracks) if (questions.filter(q => q.trackId === track.id).length !== 8) errors.push(`${track.id}.count`);
  return errors;
}
const errors = validateBank(bank);
if (errors.length) throw new Error('INVALID_V3_BANK: ' + errors.join(', '));
export function questionsFor(trackId) {
  if (!bank.tracks.some(track => track.id === trackId)) throw new Error('INVALID_TRACK');
  return [...bank.questions.filter(q => q.trackId === 'GENERAL'), ...bank.questions.filter(q => q.trackId === trackId)];
}
export function newSession({legacy=false}={}) {
  return {version:VERSION, responseVersion:legacy?'legacy-likert7':RESPONSE_VERSION, language:bank.defaultLanguage, trackId:'', screen:'tracks', index:0, answers:{}};
}
export function chooseTrack(state, trackId) {
  requireV3(state);
  const allowed = new Set(questionsFor(trackId).map(q => q.id));
  return {...state, trackId, screen:'question', index:0, answers:Object.fromEntries(Object.entries(state.answers).filter(([id]) => allowed.has(id)))};
}
export function changeLanguage(state, language) {
  requireV3(state);
  if (!languages.includes(language)) throw new Error('INVALID_LANGUAGE');
  return {...state, language};
}
export function selectAnswer(state,id,value){
 requireV3(state);
 if(!questionsFor(state.trackId).some(q=>q.id===id)||!(validDirectionAnswer(value)||value===null&&state.responseVersion==='legacy-likert7'))throw Error('INVALID_V3_ANSWER');
 const needsReanswer=(state.needsReanswer||[]).filter(qid=>qid!==id);
 return {...state,answers:{...state.answers,[id]:value},...(state.needsReanswer?{needsReanswer}: {})};
}
export function answeredCount(state) { return state.trackId ? questionsFor(state.trackId).filter(q => owns(state.answers, q.id)).length : 0; }
export function advance(state) {
  requireV3(state);
  if (state.screen !== 'question' || !owns(state.answers, questionsFor(state.trackId)[state.index].id)) throw new Error('ANSWER_REQUIRED');
  if (state.index === 11) {
    if (answeredCount(state) !== 12) throw new Error('INCOMPLETE_V3');
    return {...state, screen:'review'};
  }
  return {...state, index:state.index + 1};
}
export function previous(state) {
  requireV3(state);
  if (state.screen === 'review') return {...state, screen:'question', index:11};
  return state.index === 0 ? {...state, screen:'tracks'} : {...state, index:state.index - 1};
}
export function restoreSession(raw){
 try{
 const s=JSON.parse(raw);
 if(!s||s.version!==VERSION||!languages.includes(s.language)||!['tracks','question','review'].includes(s.screen)||!Number.isInteger(s.index)||s.index<0||s.index>11||!s.answers||Array.isArray(s.answers)||typeof s.answers!=='object')return newSession();
 if(s.responseVersion&&!['likert7-2','behavior-evidence-1','legacy-likert7'].includes(s.responseVersion))return newSession();
 if(!s.trackId)return s.screen==='tracks'&&Object.keys(s.answers).length===0?{...newSession(),language:s.language}:newSession();
 const questions=questionsFor(s.trackId),allowed=new Set(questions.map(q=>q.id));
 if(Object.keys(s.answers).some(id=>!allowed.has(id)))return newSession();
 const answers={},archivedAnswers={...(s.archivedAnswers||{})};let migrated=false;
 for(const [id,v]of Object.entries(s.answers)){
  if(validDirectionAnswer(v)||s.responseVersion==='legacy-likert7'&&v===null)answers[id]=v;
  else if(Array.isArray(v)||v===null){archivedAnswers[id]=v;migrated=true;}
  else return newSession();
 }
 const needsReanswer=questions.filter(q=>!Object.hasOwn(answers,q.id)).map(q=>q.id);
 const clean={version:VERSION,responseVersion:s.responseVersion==='legacy-likert7'?'legacy-likert7':RESPONSE_VERSION,language:s.language,trackId:s.trackId,screen:s.screen,index:s.index,answers};
 if(migrated||s.needsReanswer?.length||Object.keys(archivedAnswers).length){clean.needsReanswer=needsReanswer;clean.archivedAnswers=archivedAnswers;}
 if(s.screen==='review'&&needsReanswer.length||migrated){clean.screen='question';clean.index=questions.findIndex(q=>!Object.hasOwn(answers,q.id));}
 if(clean.screen==='question'&&questions.slice(0,clean.index).some(q=>!Object.hasOwn(answers,q.id)))clean.index=questions.findIndex(q=>!Object.hasOwn(answers,q.id));
 return clean;
 }catch{return newSession();}
}
export function loadSession(storage) {
  try { return restoreSession(storage.getItem(STORAGE_KEY)); } catch { return newSession(); }
}
export function saveSession(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
