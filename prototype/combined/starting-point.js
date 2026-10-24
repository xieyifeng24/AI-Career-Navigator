import * as legacy from './starting-point-legacy.js';
import bank from './starting-point-bank.json' with {type:'json'};
export {bank as startingPointBank};
export const STARTING_POINT_VERSION=bank.version;
export const text=(value,locale='en')=>value?.[locale]??value?.en??'';
export const selections=value=>Array.isArray(value)?value:value&&typeof value==='object'&&Array.isArray(value.selected)?value.selected:typeof value==='string'?[value]:value?.primary?[value.primary,value.secondary].filter(Boolean):[];
export function newStartingPoint(){return {version:bank.version,screen:'intro',index:0,answers:{},story:'',completed:false};}
export function stageBranch(stage){return ['A','B','C'].includes(stage)?'student':stage==='D'?'working':stage==='E'?'transition':null;}
export function startingQuestions(answers){
 if(answers.Q02?.primary&&!Array.isArray(answers.Q02.selected)||typeof answers.Q04==='string')return legacy.startingQuestions(answers);
 const questions=[...bank.questions],stage=stageBranch(answers.Q01),concern=answers.Q02?.primary;
 if(stage)questions.push({id:'Q10',kind:'single',section:3,...bank.followups.Q10[stage]});
 if(bank.followups.Q11[concern])questions.push({id:'Q11',kind:'single',section:3,...bank.followups.Q11[concern]});
 return [...questions,{...bank.story,kind:'story',section:4}];
}
function validSet(q,values){const allowed=new Set(q.options.map(o=>o.id));return Array.isArray(values)&&values.length>=1&&values.length<=(q.maxSelections||4)&&new Set(values).size===values.length&&values.every(v=>allowed.has(v))&&!(values.length>1&&values.some(v=>(q.exclusive||[]).includes(v)));}
export function questionError(intake,q){
 const value=intake.answers[q.id],allowed=new Set(q.options?.map(o=>o.id));
 if(q.kind==='story')return '';
 if(q.kind==='priority')return !value||!validSet(q,value.selected)||!value.selected.includes(value.primary)?'priority':'';
 if(q.kind==='matrix')return !value||q.rows.some(row=>!allowed.has(value[row.id]))?'matrix':'';
 if(q.kind==='multi')return validSet(q,value)?'':'multi';
 return allowed.has(value)?'':'single';
}
export const startingPointErrors=intake=>Object.fromEntries(startingQuestions(intake.answers).map(q=>[q.id,questionError(intake,q)]).filter(([,e])=>e));
export function updateStartingPoint(intake,field,value,checked=true){
 if(intake.version==='starting-point-1')return legacy.updateStartingPoint(intake,field,value,checked);
 const next=structuredClone(intake);next.completed=false;
 if(field==='story'){next.story=String(value).slice(0,1500);return next;}
 const [id,part]=field.split('.'),q=startingQuestions(next.answers).find(q=>q.id===id);
 if(!q||q.kind==='story')throw Error('INVALID_STARTING_FIELD');
 if(!q.options.some(o=>o.id===value)&&!(q.kind==='priority'&&part==='primary'&&value===''))throw Error('INVALID_STARTING_VALUE');
 if(q.kind==='priority'&&part==='primary'){
  const current=next.answers[id]||{selected:[],primary:null};
  if(value&&!current.selected.includes(value))throw Error('PRIMARY_NOT_SELECTED');
  if(id==='Q02'&&current.primary!==value)delete next.answers.Q11;
  next.answers[id]={...current,primary:value||null};
 }else if(q.kind==='matrix'){
  if(!q.rows.some(row=>row.id===part))throw Error('INVALID_STARTING_FIELD');
  next.answers[id]={...next.answers[id],[part]:value};
 }else if(q.kind==='multi'||q.kind==='priority'){
  if(part&&part!=='selected')throw Error('INVALID_STARTING_FIELD');
  let selected=selections(next.answers[id]).filter(v=>v!==value);
  if(checked){if((q.exclusive||[]).includes(value))selected=[];else selected=selected.filter(v=>!(q.exclusive||[]).includes(v));selected.push(value);}
  if(selected.length>(q.maxSelections||4))throw Error('MAX_SELECTIONS');
  selected=q.options.filter(o=>selected.includes(o.id)).map(o=>o.id);
  if(q.kind==='priority'){const primary=next.answers[id]?.primary;next.answers[id]={selected,primary:selected.includes(primary)?primary:null};if(id==='Q02'&&primary!==next.answers[id].primary)delete next.answers.Q11;}
  else next.answers[id]=selected;
 }else{
  if(part)throw Error('INVALID_STARTING_FIELD');
  if(id==='Q01'&&stageBranch(next.answers.Q01)!==stageBranch(value))delete next.answers.Q10;
  next.answers[id]=value;
 }
 const active=new Set(startingQuestions(next.answers).map(q=>q.id));for(const key of Object.keys(next.answers))if(!active.has(key))delete next.answers[key];
 return next;
}
export function advanceStartingPoint(intake){
 if(intake.version==='starting-point-1')return legacy.advanceStartingPoint(intake);
 if(intake.screen==='intro')return {...intake,screen:'question',index:0};
 const qs=startingQuestions(intake.answers),error=questionError(intake,qs[intake.index]);if(error)throw Error(error);
 if(intake.index===qs.length-1){if(Object.keys(startingPointErrors(intake)).length)throw Error('INCOMPLETE_STARTING_POINT');return {...intake,screen:'bridge',completed:true};}
 return {...intake,index:intake.index+1};
}
export function previousStartingPoint(intake){if(intake.version==='starting-point-1')return legacy.previousStartingPoint(intake);if(intake.screen==='bridge')return {...intake,screen:'question',index:startingQuestions(intake.answers).length-1};return intake.index>0?{...intake,index:intake.index-1}:{...intake,screen:'intro'};}
export function restoreStartingPoint(raw){
 if(!['starting-point-1',bank.version].includes(raw?.version)||!['intro','question','bridge'].includes(raw.screen)||!raw.answers||typeof raw.answers!=='object'||Array.isArray(raw.answers)||!Number.isInteger(raw.index)||raw.index<0||typeof raw.story!=='string'||raw.story.length>1500)throw Error('INVALID_STARTING_POINT');
 const legacy=raw.version!==bank.version,answers=structuredClone(raw.answers);
 if(legacy){for(const id of ['Q04','Q06','Q08'])if(typeof answers[id]==='string')answers[id]=[answers[id]];
 if(answers.Q02)answers.Q02={selected:[answers.Q02.primary,answers.Q02.secondary].filter(Boolean),primary:answers.Q02.primary};
 if(typeof answers.Q09==='string')answers.Q09={selected:[answers.Q09],primary:answers.Q09};}
 let clean=newStartingPoint();
 const order=['Q01','Q02','Q03','Q04','Q05','Q06','Q07','Q08','Q09','Q12','Q13','Q10','Q11'];
 if(Object.keys(answers).some(id=>!order.includes(id)))throw Error('INVALID_STARTING_POINT');
 for(const id of order){if(!Object.hasOwn(answers,id))continue;const q=startingQuestions(clean.answers).find(q=>q.id===id);if(!q)continue;const v=answers[id];
 if(q.kind==='priority'){
  if(!v||Object.keys(v).some(k=>!['selected','primary'].includes(k))||!Array.isArray(v.selected)||new Set(v.selected).size!==v.selected.length||v.selected.length>(q.maxSelections||4)||v.selected.length>1&&v.selected.some(x=>(q.exclusive||[]).includes(x)))throw Error('INVALID_STARTING_POINT');
  for(const x of v.selected)clean=updateStartingPoint(clean,id,x);
  if(v.primary)clean=updateStartingPoint(clean,id+'.primary',v.primary);
 }else if(q.kind==='multi'){
  if(!Array.isArray(v)||new Set(v).size!==v.length||v.length>(q.maxSelections||4)||v.length>1&&v.some(x=>(q.exclusive||[]).includes(x)))throw Error('INVALID_STARTING_POINT');
  for(const x of v)clean=updateStartingPoint(clean,id,x);
 }else if(q.kind==='matrix'){if(!v||typeof v!=='object'||Array.isArray(v))throw Error('INVALID_STARTING_POINT');for(const [row,x]of Object.entries(v))clean=updateStartingPoint(clean,id+'.'+row,x);}
 else clean=updateStartingPoint(clean,id,v);
 }
 const qs=startingQuestions(clean.answers);if(raw.index>=qs.length)throw Error('INVALID_STARTING_POINT');
 clean={...clean,screen:raw.screen,index:raw.index,story:raw.story,completed:raw.completed===true};
 if(legacy){const index=qs.findIndex(q=>questionError(clean,q));if(index>=0)clean={...clean,index,completed:false,screen:'question',migration:'starting-point-1'};}
 if(clean.completed&&Object.keys(startingPointErrors(clean)).length)throw Error('INCOMPLETE_STARTING_POINT');return clean;
}
const regionFor={A:'MY',B:'US',C:'GLOBAL',D:'MY',E:'GLOBAL',F:'MY'};
export const preferredRegion=intake=>regionFor[intake?.answers.Q09?.primary??intake?.answers.Q09]||'MY';
export const preferredRegions=intake=>[...new Set(selections(intake?.answers.Q09).flatMap(id=>id==='D'?['MY','GLOBAL']:id==='E'?['MY','US','GLOBAL']:[regionFor[id]]).filter(Boolean))];
export function startingOption(intake,id,locale='en',part){
 const q=startingQuestions(intake.answers).find(q=>q.id===id),raw=intake.answers[id],value=part?raw?.[part]:raw;
 const values=selections(value);return values.map(v=>text(q?.options?.find(o=>o.id===v)?.label,locale)).filter(Boolean).join(' · ');
}
export function startingPointBase(intake){if(intake.version==='starting-point-1')return legacy.startingPointBase(intake);if(!intake.completed||Object.keys(startingPointErrors(intake)).length)throw Error('INCOMPLETE_STARTING_POINT');return {mode:'context-only',version:bank.version,profile:{startingPoint:structuredClone(intake),interests:[]},preferenceCode:'—',ranking:[],goals:[],learning:[],ai:[],plan:{weeklyHours:null,totalHours:null},reportedCapabilities:structuredClone(intake.answers.Q05),experienceEvidence:structuredClone(intake.answers.Q06)};}
