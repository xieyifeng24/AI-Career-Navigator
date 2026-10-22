import {language, t} from './i18n.js';
import questionnaireOptions from './questionnaire.json' with {type:'json'};
export const options=questionnaireOptions;
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const multi=['tasks','skills','concerns','constraints'];
const questions={background:'Current role or field',experience:'Professional experience',tasks:'What do you do on a typical week?',skills:'What skills do you already use?',aiUsage:'How have you used AI tools so far?',concerns:'What feels uncertain right now?',goal:'What would you like to move toward?',hours:'Hours you can learn per week',constraints:'What needs to be realistic?'};
export function initialAnswers(profile) {
  if(profile.answers) return profile.answers;
  const a={background:'',experience:'',tasks:[],skills:[],aiUsage:'',concerns:[],goal:'',constraints:[],custom:{}};
  if(profile.background) {
    a.background=profile.scenario==='marketing'?'marketing':profile.scenario==='admin'?'admin':'other';
    if(a.background==='other') a.custom.background=profile.background;
    a.experience=profile.experience==='1–2 years'?'1to2':'3to5'; a.tasks=[profile.scenario==='marketing'?'communicate':'coordinate','other']; a.custom.tasks=profile.tasks;
    a.skills=['other'];a.custom.skills=profile.skills; a.aiUsage='occasional';
    a.concerns=['other'];a.custom.concerns=profile.concerns;
    a.goal='other';a.custom.goal=profile.goal;a.constraints=['other'];a.custom.constraints=profile.constraints;
  }
  profile.answers=a; return a;
}
export function label(key,value) {const row=options[key]?.find(r=>r[0]===value);return row?row[{en:1,'zh-CN':2,ms:3}[language]]:value;}
export function renderQuestion(key,profile,errors) {
  const a=initialAnswers(profile);if(key==='aiUse') key='aiUsage';
  const errorKey=key==='aiUsage'?'aiUse':key;
  const error=errors[errorKey]?`<span class="field-error" id="error-${key}" role="alert">${e(t(errors[errorKey]))}</span>`:'';
  const help=key==='tasks'?t('Choose at least two tasks.'):multi.includes(key)?t('Choose all that apply.'):t('Choose one.');
  if(key==='hours') return `<div class="field"><label for="field-hours">${t(questions[key])} *</label><select name="hours" id="field-hours" aria-invalid="${!!error}" ${error?'aria-describedby="error-hours"':''}><option value="">${t('Choose an option')}</option>${[1,2,3,5,8,10,15,20,30,40].map(n=>`<option value="${n}" ${Number(profile.hours)===n?'selected':''}>${n} ${t('hours / week')}</option>`).join('')}</select>${error}</div>`;
  const values=Array.isArray(a[key])?a[key]:[a[key]];
  const aria=`aria-labelledby="legend-${key}" aria-invalid="${!!error}" ${error?`aria-describedby="error-${key}"`:''}`;
  let control;
  if(['background','experience'].includes(key)) control=`<select name="answer-${key}" id="field-${key}" ${aria}><option value="">${t('Choose an option')}</option>${options[key].map(row=>`<option value="${row[0]}" ${values.includes(row[0])?'selected':''}>${e(label(key,row[0]))}</option>`).join('')}</select>`;
  else control=`<div class="choice-grid" id="field-${key}" tabindex="-1" ${aria}>${options[key].map(row=>`<label class="choice ${values.includes(row[0])?'is-selected':''}"><input type="${multi.includes(key)?'checkbox':'radio'}" name="answer-${key}" value="${row[0]}" ${values.includes(row[0])?'checked':''}><span>${e(label(key,row[0]))}</span></label>`).join('')}</div>`;
  const custom=values.includes('other')?`<label class="custom-label" for="custom-${key}">${t('Describe your other answer')}</label><textarea name="custom-${key}" id="custom-${key}" maxlength="${key==='background'?180:500}" rows="2" placeholder="${t('A short fictional example is enough.')}">${e(a.custom[key]||'')}</textarea>`:'';
  return `<fieldset class="field choice-field"><legend id="legend-${key}">${t(questions[key])} *</legend><p class="field-help">${help}</p>${control}${custom}${error}</fieldset>`;
}
export function toggleExclusive(values, changed, checked) {
  if(!checked) return values;
  return changed==='none'?['none']:values.filter(v=>v!=='none');
}
export function collectAnswers(form,profile,changed) {
  const a=initialAnswers(profile),data=new FormData(form);
  for(const key of Object.keys(options)) {
    if(!form.querySelector(`[name="answer-${key}"]`)) continue;
    let values=data.getAll(`answer-${key}`).map(String);
    if(['concerns','constraints'].includes(key) && changed?.name===`answer-${key}`) values=toggleExclusive(values,changed.value,changed.checked);
    a[key]=multi.includes(key)?values:values[0]||'';
    if(data.has(`custom-${key}`)) a.custom[key]=String(data.get(`custom-${key}`)).trim();
  }
  for(const key of Object.keys(options)) {
    const values=Array.isArray(a[key])?a[key]:[a[key]];
    profile[key==='aiUsage'?'aiUse':key]=values.filter(Boolean).map(value=>value==='other'?a.custom[key]||'':options[key].find(row=>row[0]===value)?.[1]||'').join('; ');
  }
  if(data.has('hours')) profile.hours=String(data.get('hours'));
  const consent=form.querySelector('#synthetic');if(consent) profile.synthetic=consent.checked;
}
export function validateAnswers(profile,index) {
 const a=initialAnswers(profile),errors={};
 const keys=[['background','experience'],['tasks','skills'],['aiUsage','concerns'],['goal','hours','constraints']][index];
 for(const key of keys){
   const value=key==='hours'?profile.hours:a[key],values=Array.isArray(value)?value:[value];
   const target=key==='aiUsage'?'aiUse':key;
   if(!values.length||!values[0]) errors[target]='Please choose an answer.';
   else if(values.includes('other')&&!a.custom[key]?.trim()) errors[target]='Please describe your other answer.';
 }
 for(const key of keys) {if(a.custom[key] && /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?\d[\s()-]*){9,}/.test(a.custom[key])) errors[key]='Use fictional details without contact information.';}
 if(a.tasks.length<2&&index===1)errors.tasks='Choose at least two tasks.';
 if(index===3&&(!Number.isFinite(Number(profile.hours))||Number(profile.hours)<1||Number(profile.hours)>40))errors.hours='Choose 1–40 hours per week.';
 return errors;
}

export function submissionProfile(profile) {
 const {scenario,...payload}=structuredClone(profile);
 if(payload.answers) {
   payload.answers.custom=Object.fromEntries(Object.entries(payload.answers.custom).filter(([key])=>{
     const values=payload.answers[key];return Array.isArray(values)?values.includes('other'):values==='other';
   }));
 }
 return {...payload,hours:Number(payload.hours)};
}

export function answerText(profile,key) {
 const answerKey=key==='aiUse'?'aiUsage':key;
 if(!profile.answers) return profile[key]||'';
 const value=profile.answers[answerKey],values=Array.isArray(value)?value:[value];
 return values.filter(Boolean).map(id=>id==='other'?profile.answers.custom[answerKey]||'':label(answerKey,id)).join('; ');
}
