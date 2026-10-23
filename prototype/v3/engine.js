// Answer collection only. No scoring, reporting, AI, or V2 answer migration.
import bank from './bank.json' with {type:'json'};
export {bank};
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
export function newSession() {
  return {version:VERSION, language:bank.defaultLanguage, trackId:'', screen:'tracks', index:0, answers:{}};
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
export function selectAnswer(state, id, value) {
  requireV3(state);
  if (!questionsFor(state.trackId).some(q => q.id === id) || !validAnswer(value)) throw new Error('INVALID_V3_ANSWER');
  return {...state, answers:{...state.answers, [id]:value}};
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
export function restoreSession(raw) {
  try {
    const state = JSON.parse(raw);
    if (!state || state.version !== VERSION || !languages.includes(state.language) || !['tracks','question','review'].includes(state.screen)) return newSession();
    if (!Number.isInteger(state.index) || state.index < 0 || state.index > 11 || !state.answers || Array.isArray(state.answers) || typeof state.answers !== 'object') return newSession();
    const allowed = new Set(state.trackId ? questionsFor(state.trackId).map(q => q.id) : []);
    if (!state.trackId && state.screen !== 'tracks') return newSession();
    if (Object.entries(state.answers).some(([id, value]) => !allowed.has(id) || !validAnswer(value))) return newSession();
    const clean = {version:VERSION, language:state.language, trackId:state.trackId, screen:state.screen, index:state.index, answers:{...state.answers}};
    if (clean.screen === 'review' && answeredCount(clean) !== 12) return newSession();
    if (clean.screen === 'question' && questionsFor(clean.trackId).slice(0,clean.index).some(q => !owns(clean.answers,q.id))) return newSession();
    return clean;
  } catch { return newSession(); }
}
export function loadSession(storage) {
  try { return restoreSession(storage.getItem(STORAGE_KEY)); } catch { return newSession(); }
}
export function saveSession(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
