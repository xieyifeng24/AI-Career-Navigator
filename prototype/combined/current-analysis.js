// Descriptive evidence adapter: preserve current scale, never manufacture V2 options or fit scores.
import {bank,questionsFor} from '../v3/engine.js';
import {contextRoles} from '../exploration/engine.js';
import {catalog} from '../explorer-engine.js';
export const directionRoles={SW:['software','ai-research'],DATA:['data','business-analysis'],FIN:['finance'],PM:['product','business-analysis'],MKT:['marketing'],DES:['ux','creative'],ENG:['energy','environment'],HLT:['health'],EDU:['education','writing'],OPS:['business-analysis','product']};
export function analyzeCurrentAnswers(session,locale='en'){
 const questions=questionsFor(session.trackId),answers=session.answers||{};
 const items=questions.map(q=>{
  const answered=Object.hasOwn(answers,q.id),value=answered?answers[q.id]:null;
  if(answered&&value!==null&&(!Number.isInteger(value)||value<1||value>7))throw Error('INVALID_CURRENT_ANSWER:'+q.id);
  const state=!answered?'unanswered':value===null?'not-assessed':'self-report';
  return {id:q.id,construct:q.construct,statement:q.statement[locale],value,state,
   response:state==='unanswered'?null:value===null?bank.uiText.unfamiliar[locale]:bank.scale.find(s=>s.value===value).label[locale],
   stance:value===null?null:value<4?'disagreement':value===4?'neutral':'agreement',source:{kind:'user-answer',questionId:q.id,version:session.version}};
 });
 const dimensions=Object.keys(bank.constructLabels).map(id=>({id,label:bank.constructLabels[id][locale],items:items.filter(q=>q.construct===id)})).filter(d=>d.items.length);
 const covered=dimensions.filter(d=>d.items.some(q=>q.state==='self-report'));
 return {version:'current-signals-1',items,dimensions,answeredCount:items.filter(i=>i.state!=='unanswered').length,
  substantiveCount:items.filter(i=>i.state==='self-report').length,notAssessedCount:items.filter(i=>i.state==='not-assessed').length,
  unansweredCount:items.filter(i=>i.state==='unanswered').length,totalQuestions:questions.length,
  coveredDimensions:covered.length,totalDimensions:dimensions.length,capabilityVerification:'not-measured',scoring:'No new scores, weights, averages or V2 categorical conversions'};
}
export function careerContexts(direction,knowledge,locale='en'){
 const idx={en:0,'zh-CN':1,ms:2}[locale]??0;
 const ids=(contextRoles[direction]||[]).flatMap(id=>knowledge.links?.[id]||[]);
 const records=Array.isArray(knowledge.records)?knowledge.records:[];
 const official=records.filter(r=>ids.includes(r.source+':'+r.id));
 const onet=official.filter(r=>r.source==='onet');
 const editorial=(directionRoles[direction]||[]).map(id=>catalog.careers.find(r=>r.id===id)).filter(Boolean);
 const candidates=onet.length?onet.map(r=>({id:r.source+':'+r.id,title:r.title,description:r.description,tasks:r.tasks||[],skills:r.skills||[],education:r.education||[],url:r.url,sourceKind:'official-context',sourceId:r.source+':'+r.id,geography:r.geography,verifiedAt:r.verified_at})):
  editorial.map(r=>({id:r.id,title:r.title[idx],description:r.entry[idx],tasks:[{label:r.project[idx]}],skills:r.skills.map(label=>({label:label[idx]})),education:[],url:null,sourceKind:'editorial-direction-example',sourceId:'catalog:'+r.id}));
 return {official,editorial,candidates,knowledgeVersion:knowledge.version||'unavailable',dataStatus:records.length?'loaded':'unavailable',officialStatus:official.length?'available':'no-reviewed-direction-mapping',ranking:'not-ranked'};
}
