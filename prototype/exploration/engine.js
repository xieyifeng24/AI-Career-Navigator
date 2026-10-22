// V2.0 supplied exploration policies: preferences are tags, exposure is not aptitude.
import bank from './bank.json' with {type:'json'};
import mapping from './scoring.json' with {type:'json'};
export {bank};
export const directions=bank.metadata.directions;
export const contextRoles={SW:[],DATA:['15-2051.00'],FIN:[],PM:['13-1082.00','13-1111.00'],MKT:['13-1161.00'],DES:[],ENG:[],HLT:[],EDU:[],OPS:['43-6014.00','13-1082.00']};
export const isV2=profile=>profile?.exploration?.version==='2.0.0';
export const directionName=(id,locale='zh-CN')=>directions.find(d=>d.id===id)?.[{en:'name_en',ms:'name_ms','zh-CN':'name_zh'}[locale]||'name_zh']||'';
export function questionsFor(direction){
 if(!directions.some(d=>d.id===direction))throw Error('UNKNOWN_DIRECTION');
 return bank.questions.filter(q=>q.direction_id==='COMMON'||q.direction_id===direction);
}
export function createDraft(direction=''){
 return {background:'',experience:'',tasks:'',skills:'',aiUse:'',concerns:'',goal:'',hours:'',constraints:'',additionalContext:'',synthetic:false,exploration:{version:'2.0.0',direction,answers:{}}};
}
export function setDirection(profile,direction){
 const allowed=new Set(questionsFor(direction).map(q=>q.id));
 profile.exploration.direction=direction;
 profile.exploration.answers=Object.fromEntries(Object.entries(profile.exploration.answers).filter(([id])=>allowed.has(id)));
}
export function validateExploration(profile,step=0){
 if(!directions.some(d=>d.id===profile.exploration?.direction))return {direction:'Choose a direction.'};
 const active=questionsFor(profile.exploration.direction),errors={};
 for(const q of active){const value=profile.exploration.answers[q.id];if(value!==undefined&&value!==''&&!q.options.some(o=>o.id===value))errors[q.id]='Invalid option.';}
 return errors;
}
export function analyzeExploration(exploration){
 const questions=questionsFor(exploration.direction),answers=exploration.answers||{};
 const selected=questions.map(q=>{
  const id=answers[q.id];
  if(id!==undefined&&id!==''&&!q.options.some(o=>o.id===id))throw Error('INVALID_OPTION:'+q.id);
  const option=q.options.find(o=>o.id===id),rule=option?mapping.rules[q.id].options[option.id]:null;
  return {questionId:q.id,facet:q.facet,question:q.question,optionId:option?.id??null,text:option?.text??null,tag:rule?.tag??(rule?.score===undefined?'unknown':null),score:rule?.score??null,policy:mapping.rules[q.id].facet,note:q.interpretation_note,unknown:!option||option.id==='U'};
 });
 const common=facet=>selected.find(q=>q.questionId.startsWith('G')&&q.facet===facet);
 const domain=facet=>selected.find(q=>!q.questionId.startsWith('G')&&q.facet===facet);
 const experience=domain('experience'),generalAI=common('ai_experience'),domainAI=domain('ai_experience'),verification=domain('ai_judgement');
 const key=[experience,generalAI,domainAI,verification];
 return {version:'2.0.0',direction:exploration.direction,selected,
  preferences:{motivation:common('motivation'),goal:common('career_goal'),interest:domain('interest'),problemStyle:domain('problem_style'),subdomain:domain('subdomain'),task:domain('scenario_preference'),growth:domain('growth_tradeoff')},
  stages:{experience,generalAI,domainAI,verification},time:common('constraints'),
  evidence:{provided:selected.filter(q=>q.optionId!==null).length,known:selected.filter(q=>!q.unknown).length,total:12,keyMissing:key.filter(q=>q.unknown).map(q=>q.questionId)},
  relatedRoles:contextRoles[exploration.direction]};
}
export const timeBudgets={time_lt1:.5,time_1_3:2,time_3_6:4,time_gt6:7};
export function simulateExploration(result,assumptions={}){
 const baseHours=timeBudgets[result.time.tag]??null;
 const requested=Number(assumptions.hours);
 const weeklyHours=assumptions.hours!==undefined&&Number.isFinite(requested)&&requested>=.5&&requested<=20?requested:baseHours??1;
 const question=questionsFor(result.direction).find(q=>q.facet==='experience');
 const chosen=question.options.find(o=>o.id===assumptions.experience);
 if(assumptions.experience!==undefined&&assumptions.experience!=='baseline'&&!chosen)throw Error('INVALID_SCENARIO');
 const stage=chosen?mapping.rules[question.id].options[chosen.id].score:result.stages.experience.score;
 // Effort estimates are editorial exercise sizing, not official qualification requirements.
 const effort=stage===null?1:[1,1.5,2,3,3][stage];
 return {weeklyHours,baseHours,budgetIsAssumed:baseHours===null&&assumptions.hours===undefined,
  experience:stage,originalExperience:result.stages.experience.score,assumedExperience:!!chosen,
  effortHours:effort,weeks:Math.ceil(effort/weeklyHours),firstSessionHours:Math.min(weeklyHours,effort),
  scaffold:stage===null?'explore':stage<=1?'guided':stage===2?'adapt':'independent',
  nextPractice:result.preferences.task.tag==='unknown'?result.preferences.interest:result.preferences.task};
}
export function exampleProfile(id){
 const direction=id==='marketing'?'MKT':'OPS',profile=createDraft(direction);
 profile.synthetic=true;
 const choices=id==='marketing'?['A','C','B','C','A','C','A','A','C','B','B','B']:['C','A','A','B','B','A','B','C','A','D','C','B'];
 profile.exploration.answers=Object.fromEntries(questionsFor(direction).map((q,i)=>[q.id,choices[i]]));
 return profile;
}
