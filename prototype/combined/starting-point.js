// User-supplied first questionnaire. IDs are independent from the V3 scale and legacy intake.
import bank from './starting-point-bank.json' with {type:'json'};
export {bank as startingPointBank};
export const STARTING_POINT_VERSION=bank.version;
export const text=(value,locale='en')=>value?.[locale]??value?.en??'';
export function newStartingPoint(){return {version:bank.version,screen:'intro',index:0,answers:{},story:'',completed:false};}
export function stageBranch(stage){return ['A','B','C'].includes(stage)?'student':stage==='D'?'working':stage==='E'?'transition':null;}
export function startingQuestions(answers){
 const questions=[...bank.questions];
 const stage=stageBranch(answers.Q01),concern=answers.Q02?.primary;
 if(stage)questions.push({id:'Q10',kind:'single',section:3,...bank.followups.Q10[stage]});
 if(bank.followups.Q11[concern])questions.push({id:'Q11',kind:'single',section:3,...bank.followups.Q11[concern]});
 return [...questions,{...bank.story,kind:'story',section:4}];
}
export function questionError(intake,question){
 const value=intake.answers[question.id],allowed=new Set(question.options?.map(o=>o.id));
 if(question.kind==='story')return '';
 if(question.kind==='priority')return !value||!allowed.has(value.primary)||value.secondary!=null&&(!allowed.has(value.secondary)||value.secondary===value.primary)?'priority':'';
 if(question.kind==='matrix')return !value||question.rows.some(row=>!allowed.has(value[row.id]))?'matrix':'';
 if(question.kind==='multi')return !Array.isArray(value)||value.length<1||value.length>2||new Set(value).size!==value.length||value.some(v=>!allowed.has(v))?'multi':'';
 return !allowed.has(value)?'single':'';
}
export function startingPointErrors(intake){return Object.fromEntries(startingQuestions(intake.answers).map(q=>[q.id,questionError(intake,q)]).filter(([,error])=>error));}
export function updateStartingPoint(intake,field,value,checked=true){
 const next=structuredClone(intake);next.completed=false;
 if(field==='story'){next.story=String(value).slice(0,1500);return next;}
 const [id,part]=field.split('.'),q=startingQuestions(next.answers).find(q=>q.id===id);
 if(!q||q.kind==='story')throw Error('INVALID_STARTING_FIELD');
 const allowed=new Set(q.options.map(o=>o.id));
 if(!(id==='Q02'&&part==='secondary'&&value==='')&&!allowed.has(value))throw Error('INVALID_STARTING_VALUE');
 if(q.kind==='priority'){
  if(!['primary','secondary'].includes(part))throw Error('INVALID_STARTING_FIELD');
  const current={primary:null,secondary:null,...next.answers[id]};
  if(part==='primary'&&current.primary!==value)delete next.answers.Q11;
  current[part]=value||null;
  if(current.primary===current.secondary)current.secondary=null;
  next.answers[id]=current;
 }else if(q.kind==='matrix'){
  if(!q.rows.some(row=>row.id===part))throw Error('INVALID_STARTING_FIELD');
  next.answers[id]={...next.answers[id],[part]:value};
 }else if(q.kind==='multi'){
  let selected=(next.answers[id]||[]).filter(v=>v!==value);
  if(checked)selected.push(value);
  if(selected.length>2)throw Error('MAX_TWO');
  next.answers[id]=q.options.map(o=>o.id).filter(v=>selected.includes(v));
 }else{
  if(part)throw Error('INVALID_STARTING_FIELD');
  if(id==='Q01'&&stageBranch(next.answers.Q01)!==stageBranch(value))delete next.answers.Q10;
  next.answers[id]=value;
 }
 const active=new Set(startingQuestions(next.answers).map(q=>q.id));
 for(const key of Object.keys(next.answers))if(!active.has(key))delete next.answers[key];
 return next;
}
export function advanceStartingPoint(intake){
 if(intake.screen==='intro')return {...intake,screen:'question',index:0};
 const questions=startingQuestions(intake.answers),q=questions[intake.index];
 const error=questionError(intake,q);if(error)throw Error(error);
 if(intake.index===questions.length-1){if(Object.keys(startingPointErrors(intake)).length)throw Error('INCOMPLETE_STARTING_POINT');return {...intake,screen:'bridge',completed:true};}
 return {...intake,index:intake.index+1};
}
export function previousStartingPoint(intake){
 if(intake.screen==='bridge')return {...intake,screen:'question',index:startingQuestions(intake.answers).length-1};
 return intake.index>0?{...intake,index:intake.index-1}:{...intake,screen:'intro'};
}
export function restoreStartingPoint(raw){
 if(raw?.version!==bank.version||!['intro','question','bridge'].includes(raw.screen)||!raw.answers||typeof raw.answers!=='object'||Array.isArray(raw.answers)||!Number.isInteger(raw.index)||raw.index<0||typeof raw.story!=='string'||raw.story.length>1500)throw Error('INVALID_STARTING_POINT');
 let clean=newStartingPoint();
 for(const id of ['Q01','Q02','Q03','Q04','Q05','Q06','Q07','Q08','Q09','Q10','Q11']){
  if(!Object.hasOwn(raw.answers,id))continue;
  const q=startingQuestions(clean.answers).find(q=>q.id===id);if(!q)continue;
  const value=raw.answers[id];
  if(q.kind==='priority'){
   if(!value||Object.keys(value).some(k=>!['primary','secondary'].includes(k)))throw Error('INVALID_STARTING_POINT');
   if(value.primary)clean=updateStartingPoint(clean,id+'.primary',value.primary);
   if(value.secondary)clean=updateStartingPoint(clean,id+'.secondary',value.secondary);
   if(value.primary&&value.primary===value.secondary)throw Error('INVALID_STARTING_POINT');
  }else if(q.kind==='matrix'){
   if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID_STARTING_POINT');
   for(const [row,answer]of Object.entries(value))clean=updateStartingPoint(clean,id+'.'+row,answer);
  }else if(q.kind==='multi'){
   if(!Array.isArray(value)||new Set(value).size!==value.length)throw Error('INVALID_STARTING_POINT');
   for(const answer of value)clean=updateStartingPoint(clean,id,answer);
  }else clean=updateStartingPoint(clean,id,value);
 }
 if(Object.keys(raw.answers).some(id=>!/^Q(?:0[1-9]|10|11)$/.test(id)))throw Error('INVALID_STARTING_POINT');
 if(raw.index>=startingQuestions(clean.answers).length)throw Error('INVALID_STARTING_POINT');
 clean={...clean,screen:raw.screen,index:raw.index,story:raw.story,completed:raw.completed===true};
 if(clean.completed&&Object.keys(startingPointErrors(clean)).length)throw Error('INCOMPLETE_STARTING_POINT');
 return clean;
}
export const preferredRegion=intake=>({A:'MY',B:'US',C:'GLOBAL',D:'MY',E:'GLOBAL',F:'MY'})[intake?.answers.Q09]||'MY';
export function startingOption(intake,id,locale='en',part){
 const q=startingQuestions(intake.answers).find(q=>q.id===id),value=part?intake.answers[id]?.[part]:intake.answers[id];
 return text(q?.options?.find(o=>o.id===value)?.label,locale);
}
// No new scores and no fabricated legacy answers. SDG remains a browsable reference library.
export function startingPointBase(intake){
 if(!intake.completed||Object.keys(startingPointErrors(intake)).length)throw Error('INCOMPLETE_STARTING_POINT');
 return {mode:'context-only',version:bank.version,profile:{startingPoint:structuredClone(intake),interests:[]},preferenceCode:'—',ranking:[],goals:[],learning:[],ai:[],plan:{weeklyHours:null,totalHours:null},reportedCapabilities:structuredClone(intake.answers.Q05),experienceEvidence:intake.answers.Q06};
}
