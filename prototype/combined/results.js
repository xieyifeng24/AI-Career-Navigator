// Adapter only: PR8 remains the sole scoring/learning-plan engine.
import {catalog,generateOfflineReport,buildPlan,updateChoice,validateProfile} from '../explorer-engine.js';
import knowledge from '../../data/knowledge/current.json' with {type:'json'};
export const RESULT_VERSION='unified-results-1';
// Contextual crosswalks, not occupational equivalences. Never map V3 direction IDs to scores.
export const contextIds={data:'15-2051.00',marketing:'13-1161.00','business-analysis':'13-1111.00'};
export const scenarioFields=['interests','mindsets','major','learningAbility','weeklyTime'];
export const skillId=(role,index)=>`${role}:skill:${index}`;
export function deriveResult(profile,{selfReport=null,notes='',assumedSkills=[],hypothetical=false}={}){
 const base=generateOfflineReport(profile);
 const recommendations=base.ranking.map((row,index)=>{
  const role=catalog.careers.find(r=>r.id===row.id);
  const requirements=role.skills.map((label,i)=>({id:skillId(role.id,i),label,provenance:'editorial-pr8',status:assumedSkills.includes(skillId(role.id,i))?'assumed-present':'unassessed'}));
  const sourceKeys=knowledge.links[contextIds[role.id]]||[];
  const sources=knowledge.records.filter(r=>sourceKeys.includes(`${r.source}:${r.id}`));
  return {...row,rank:index+1,title:role.title,requirements,skillGaps:{available:false,reason:'no-verified-skill-baseline',items:requirements.filter(r=>r.status==='unassessed')},project:role.project,entry:role.entry,ai:role.ai,human:role.human,sources,plan:buildPlan(base.profile,role.id)};
 });
 return {schemaVersion:RESULT_VERSION,engineVersion:base.version,hypothetical,baseReport:base,
  careerFit:{kind:'editorial-rule-points',isPercentage:false,items:base.ranking},
  aiReadiness:{available:false,score:null,reason:'usage-is-not-competence',adviceIds:base.ai},
  recommendations,careerSkillRequirements:recommendations.map(r=>({careerId:r.id,items:r.requirements})),
  skillGaps:{available:false,reason:'no-verified-skill-baseline'},
  careerTransformation:{available:false,reason:'no-comparable-transformation-data'},
  learningRecommendations:recommendations.map(r=>({careerId:r.id,plan:r.plan,project:r.project,entry:r.entry,practicePriorities:r.requirements.filter(s=>s.status==='unassessed').map(s=>s.id),assumptionsToVerify:r.requirements.filter(s=>s.status==='assumed-present').map(s=>s.id)})),
  selfReport:structuredClone(selfReport),notes:String(notes).slice(0,1500),knowledgeVersion:knowledge.version};
}
export function scenarioResult(original,patch={},assumedSkills=[]){
 const profile=structuredClone(original.baseReport.profile);
 for(const [key,value] of Object.entries(patch)){
  if(!scenarioFields.includes(key))throw Error('INVALID_SCENARIO_FIELD');
  const field=catalog.fields.find(f=>f.id===key),values=field.multi?value:[value];
  if(!Array.isArray(values)||!values.length||values.some(v=>!field.options.some(o=>o.id===v)))throw Error('INVALID_SCENARIO_VALUE');
  profile[key]=field.multi?[]:profile[key];
  for(const v of values)updateChoice(profile,key,v);
 }
 if(Object.keys(validateProfile(profile)).length)throw Error('INCOMPLETE_SCENARIO');
 const validIds=new Set(original.careerSkillRequirements.flatMap(r=>r.items.map(s=>s.id)));
 if(!Array.isArray(assumedSkills)||assumedSkills.some(id=>!validIds.has(id)))throw Error('INVALID_SKILL_ASSUMPTION');
 return deriveResult(profile,{selfReport:original.selfReport,notes:original.notes,assumedSkills,hypothetical:Object.keys(patch).length>0||assumedSkills.length>0});
}
export function compareResults(original,active){return active.recommendations.map(row=>{const before=original.recommendations.find(r=>r.id===row.id);return {id:row.id,beforeRank:before.rank,rank:row.rank,beforeScore:before.score,score:row.score,rankChange:before.rank-row.rank,scoreChange:row.score-before.score};});}
export function exportResult(original,active,focus,assumptions){
 return {...original.baseReport,v3SelfReport:original.selfReport,v3AffectsRanking:false,unifiedResult:original,scenario:active.hypothetical?{assumptions,result:active}:null,selectedCareerId:focus,selectedPlan:active.recommendations.find(r=>r.id===focus)?.plan,additionalInformation:original.notes};
}
