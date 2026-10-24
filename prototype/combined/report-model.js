// The single model behind all five report pages. Pure functions only: no DOM,
// no network. Every derived value carries its rule and its limits.
import {buildIntelligence,applyIntelligence} from './intelligence.js';
import {startingPointContext,contextualPreparation} from './starting-point-analysis.js';
import {analyzeCurrentAnswers,careerContexts,directionRoles} from './current-analysis.js';
import {buildP0Analysis} from './p0-analysis.js';
import {createDraft} from '../exploration/engine.js';
import {buildExplorationReport} from '../exploration/report.js';
import {reportFor} from './model.js';
import {catalog,validWeeklyHours} from '../explorer-engine.js';
import {bank} from '../v3/engine.js';
import {language} from '../i18n.js';
import knowledge from '../../data/knowledge/current.json' with {type:'json'};
import regional from '../../data/regional/current.json' with {type:'json'};

const pick=(value,locale=language)=>Array.isArray(value)?value[{en:0,'zh-CN':1,ms:2}[locale]??0]:value?.[locale]||value?.en||String(value||'');

export function buildCompatibleReport(state,locale=language,assumptions={}){
 const {base,selfReport}=reportFor(state);
 const profile=createDraft(selfReport.trackId);
 // Shared direction identifiers are the sole exact crosswalk. No Likert-to-option conversion.
 const report=buildExplorationReport(profile,locale,assumptions,knowledge);
 const signals=analyzeCurrentAnswers(selfReport,locale),contexts=careerContexts(selfReport.trackId,knowledge,locale);
 // The legacy V2 report intentionally has no SW context mapping. Add only the
 // reviewed V3 SW source records to this compatibility report's source registry.
 if(selfReport.trackId==='SW')for(const fact of contexts.official)report.evidence.sources[fact.source+':'+fact.id]={title:fact.title,url:fact.url,kind:'official occupational context',date:fact.published_at,geography:fact.geography,verified_at:fact.verified_at,version:fact.version,text:fact.description};
 signals.explicitNoAIUse=state.profile.aiPurposes?.includes('none')===true;
 signals.conflicts=signals.explicitNoAIUse?signals.items.filter(i=>i.construct==='ai_practice'&&i.stance==='agreement').map(i=>({questionId:i.id,backgroundField:'aiPurposes',reason:'no-ai-use-vs-reported-practice'})):[];
 report.currentEvidence=signals;report.careerContexts=contexts;
 report.currentDirection=selfReport.trackId;
 attachContextPaths(report,contexts,signals,locale);
 attachCurrentEvidence(report,signals,contexts,assumptions,locale);
 const originalP0=buildP0Analysis(selfReport,contexts,locale);
 const unified=buildIntelligence(selfReport,state.startingPoint,originalP0,contexts,assumptions);
 const p0=applyIntelligence(originalP0,unified,locale);
 if(state.startingPoint?.completed){const context=startingPointContext(state.startingPoint,locale);
  for(const path of p0.paths){const prep=contextualPreparation(context,state.startingPoint,path,locale);path.action={...path.action,why:context.focus+' '+path.action.why,task:(assumptions.skillEvidence==='practiced'&&path.id==='software'?'':prep.task+' ')+path.action.task,check:(assumptions.skillEvidence==='practiced'&&path.id==='software'?'':prep.check+' ')+path.action.check,evidenceQuestions:[...new Set([...path.action.evidenceQuestions,...prep.evidence])]};}
  p0.actions=p0.actions.map(action=>{const path=p0.paths.find(p=>p.id===action.routeId);return path?{...action,...path.action}:action;});
 }
 if(assumptions.targetCareer)p0.actions.sort((a,b)=>(a.routeId===assumptions.targetCareer?-1:b.routeId===assumptions.targetCareer?1:0));
 if(assumptions.targetCareer&&p0.paths.some(p=>p.id===assumptions.targetCareer)){p0.paths.sort((a,b)=>(a.id===assumptions.targetCareer?-1:b.id===assumptions.targetCareer?1:0));}
 for(const action of unified.actions){const current=p0.actions.find(a=>a.routeId===action.routeId);if(current)Object.assign(action,{task:current.task,check:current.check,why:current.why});}
 report.unified=unified;
 report.p0Analysis=p0;
 report.analysis.summary={text:`${signals.answeredCount}/${signals.totalQuestions} answered. `+p0.profile.map(c=>c.text).join(' '),source_ids:[]};
 for(const route of p0.paths){const path=report.analysis.paths.find(p=>p.role_id===route.id);if(path){path.why={text:route.why.text,source_ids:route.officialMapping?route.source.relatedSourceIds||[route.source.id]:[]};path.next_step={text:route.action.task,source_ids:[]};path.unified=unified.routes.find(r=>r.id===route.id);path.challenge={text:route.unmeasured,source_ids:[]};if(selfReport.trackId==='SW'&&route.officialMapping)path.gaps=route.unverifiedRequirements.map(item=>({skill:item.skill.label,advice:{text:route.unmeasured,source_ids:[item.skill.sourceId]}}));}}
 report.ranking.sort((a,b)=>assumptions.targetCareer?p0.paths.findIndex(p=>p.id===a.id)-p0.paths.findIndex(p=>p.id===b.id):(p0.paths.find(p=>p.id===a.id)?.priority??99)-(p0.paths.find(p=>p.id===b.id)?.priority??99));
 report.analysis.paths.sort((a,b)=>assumptions.targetCareer?p0.paths.findIndex(p=>p.id===a.role_id)-p0.paths.findIndex(p=>p.id===b.role_id):(p0.paths.find(p=>p.id===a.role_id)?.priority??99)-(p0.paths.find(p=>p.id===b.role_id)?.priority??99));
 report.analysis.paths.forEach((path,index)=>{path.kind=String.fromCharCode(65+index);});
 const starting=startingPointContext(state.startingPoint,locale);
 if(starting)report.startingPoint=starting;
 const model={report,signals,contexts,p0,unified,startingPointContext:starting,startingPoint:state.startingPoint?.completed?structuredClone(state.startingPoint):null,companions:base,currentAnswers:structuredClone(selfReport),background:structuredClone(state.profile),notes:String(state.startingPoint?.completed?state.startingPoint.story:state.notes||''),
  compatibility:{version:'v2-report-current-intake-2',mappedFields:['direction'],missingV2Questions:report.exploration.selected.map(q=>q.questionId),likertConverted:false,
   sdgBasis:'Existing background interest and career-link rules; not V2 career recommendations'}};
 model.capability=buildCapability(signals);
 model.impact=buildImpact(selfReport.trackId);
 model.whatIf=buildWhatIf(assumptions);
 model.provenance=buildProvenance(contexts);
 return model;
}

// --- AI capability ---------------------------------------------------------
// A self-reported practice band. Two ordinal dimensions are combined; nothing is
// averaged, no answer is reverse-scored and no competence is claimed.
export const CAPABILITY_RULE='ai-practice-level-v1';
export const CAPABILITY_LEVELS={
 1:['AI support is not part of the reported workflow','自述工作流程中暂未包含 AI','Sokongan AI bukan sebahagian aliran kerja dilaporkan'],
 2:['Occasional AI use, no stated check routine','偶尔使用 AI，未自述核验流程','Penggunaan AI sekali-sekala tanpa rutin semakan'],
 3:['Regular AI use, no stated check routine','规律使用 AI，但未自述核验流程','Penggunaan AI kerap tanpa rutin semakan'],
 4:['AI use with partial independent checks','使用 AI，并有部分独立核验','Penggunaan AI dengan semakan bebas separa'],
 5:['AI use with independent checks','使用 AI，并有独立核验','Penggunaan AI dengan semakan bebas']
};
const CAPABILITY_BASIS={
 endorsed:['endorsed','认同','disokong'],
 mixed:['mixed answers','回答不一致','jawapan bercampur'],
 'not-endorsed':['not endorsed','未认同','tidak disokong'],
 unknown:['not answered','未回答','tidak dijawab']
};
const CAPABILITY_TABLE={
 endorsed:{endorsed:5,mixed:4,'not-endorsed':3},
 mixed:{endorsed:4,mixed:2,'not-endorsed':2},
 'not-endorsed':{endorsed:2,mixed:1,'not-endorsed':1}
};
function tally(dimension){
 if(!dimension)return {endorsed:0,disagreed:0,neutral:0,known:0,total:0,ids:[]};
 const observed=dimension.items.filter(item=>item.state==='self-report');
 return {endorsed:observed.filter(i=>i.stance==='agreement').length,disagreed:observed.filter(i=>i.stance==='disagreement').length,
  neutral:observed.filter(i=>i.stance==='neutral').length,known:observed.length,total:dimension.items.length,ids:observed.map(i=>i.id)};
}
function stanceOf(value){return !value.known?'unknown':value.endorsed===value.known?'endorsed':value.disagreed===value.known?'not-endorsed':'mixed';}
export function buildCapability(signals){
 const practice=tally(signals.dimensions.find(d=>d.id==='ai_practice'));
 const verification=tally(signals.dimensions.find(d=>d.id==='ai_verification'));
 const practiceStance=stanceOf(practice),verificationStance=stanceOf(verification);
 // Both dimensions must be answered: a missing answer is not a low level, and
 // one known dimension is not enough to place a band.
 const available=practice.known>0&&verification.known>0,partial=!available&&(practice.known>0||verification.known>0);
 return {rule:CAPABILITY_RULE,available,partial,level:available?CAPABILITY_TABLE[practiceStance][verificationStance]:null,
  practice:{...practice,stance:practiceStance},verification:{...verification,stance:verificationStance},
  evidenceIds:[...practice.ids,...verification.ids],verified:false,competenceClaim:false,
  basisLabels:{endorsed:CAPABILITY_BASIS.endorsed,mixed:CAPABILITY_BASIS.mixed,'not-endorsed':CAPABILITY_BASIS['not-endorsed'],unknown:CAPABILITY_BASIS.unknown}};
}

// --- Global impact ---------------------------------------------------------
// Ordered by the direction the person actively chose, then by the career links
// the existing catalog already declares. No interest inference is added.
export const IMPACT_RULE='direction-career-sdg-links-v1';
export function buildImpact(direction){
 const careers=(directionRoles[direction]||[]).map(id=>catalog.careers.find(role=>role.id===id)).filter(Boolean);
 const goals=new Map();
 for(const role of careers)for(const id of role.sdgs||[]){if(!goals.has(id))goals.set(id,[]);goals.get(id).push(role.id);}
 const ranked=[...goals.entries()].sort((a,b)=>b[1].length-a[1].length||a[0]-b[0])
  .map(([id,linked])=>({id,weight:linked.length,reasons:{interests:[],careers:linked}}));
 return {rule:IMPACT_RULE,direction,ranked,careers:careers.map(role=>role.id),verified:false,measuredImpact:false};
}

// --- What if ---------------------------------------------------------------
// Capacity arithmetic: the same four-week sample rescheduled under an explicit
// weekly time budget. It is not a completion or employment forecast.
export const WHATIF_RULE='plan-capacity-v1';
export const WHATIF_HORIZONS=[8,52,104];
// The sample is designed at this pace; the user's budget only reschedules it.
export const WHATIF_SAMPLE_PACE=5;
export function simulatePlanCapacity({planHours=5,availableHours=5}={}){
 const source=[1,2,3,4].map(week=>({week,minutes:Math.max(0,Math.round(planHours*60))}));
 const capacity=Math.max(0,Math.round(availableHours*60));
 const schedule=[];
 if(capacity>0)for(const item of source){
  let remaining=item.minutes;
  while(remaining>0){
   let slot=schedule.at(-1);
   if(!slot||slot.minutes===capacity){slot={week:schedule.length+1,minutes:0,items:[]};schedule.push(slot);}
   const minutes=Math.min(remaining,capacity-slot.minutes);
   slot.items.push({source:item.week,minutes,split:minutes<item.minutes});
   slot.minutes+=minutes;remaining-=minutes;
  }
 }
 return {planHours,availableHours,capacityMinutes:capacity,schedule,fullWeeks:schedule.length,
  planMinutes:source.reduce((total,item)=>total+item.minutes,0),
  scheduledMinutes:schedule.reduce((total,slot)=>total+slot.minutes,0)};
}
export function buildWhatIf(assumptions={}){
 const availableHours=validWeeklyHours(Number(assumptions.planHours))?Number(assumptions.planHours):WHATIF_SAMPLE_PACE;
 const planHours=WHATIF_SAMPLE_PACE;
 const horizon=WHATIF_HORIZONS.includes(Number(assumptions.planHorizon))?Number(assumptions.planHorizon):52;
 const simulation=simulatePlanCapacity({planHours,availableHours});
 const milestones=WHATIF_HORIZONS.map(weeks=>{
  const cycles=simulation.fullWeeks?Math.floor(weeks/simulation.fullWeeks):0;
  const planWeek=simulation.fullWeeks?weeks%simulation.fullWeeks:0;
  return {weeks,cycles,planWeek,hours:weeks*availableHours,complete:simulation.fullWeeks>0&&weeks>=simulation.fullWeeks};
 });
 return {rule:WHATIF_RULE,availableHours,planHours,paceHours:planHours,horizon,simulation,milestones,sourceHours:planHours*4,forecast:false};
}

// --- Provenance ------------------------------------------------------------
const SOURCE_SITES={onet:{name:'O*NET OnLine',url:'https://www.onetonline.org/',geography:'United States'},esco:{name:'ESCO',url:'https://esco.ec.europa.eu/',geography:'European Union'}};
export function buildProvenance(contexts){
 const official=(contexts?.official||[]).map(record=>({...record,source:record.source,geography:record.geography,date:record.verified_at}));
 const sources=new Map();
 for(const record of official){
  if(sources.has(record.source))continue;
  const site=SOURCE_SITES[record.source]||{name:record.source,url:null,geography:record.geography||null};
  sources.set(record.source,{id:record.source,name:site.name,url:site.url,type:'official',geography:record.geography||site.geography,date:record.verified_at||null,version:record.version||null,scale:record.source==='onet'?'O*NET Importance 1–5 / Level 0–7':'ESCO skill relation'});
 }
 return [
  ...sources.values(),
  {id:'regional',name:'Malaysia / US / ESCO regional snapshot',url:'https://www.onetonline.org/',type:'official',geography:'Malaysia · United States · European Union',date:regional.checked_at||null,version:regional.version||null,scale:'Published statistics, no live refresh'},
  {id:'sdg',name:'United Nations Sustainable Development Goals',url:'https://sdgs.un.org/goals',type:'official',geography:'Global',date:null,version:null,scale:'Goal titles and targets'},
  {id:'catalog',name:'AI Career Navigator editorial catalog',url:null,type:'interpretation',geography:'Not a jurisdiction',date:null,version:catalog.version||null,scale:'Career examples, practice advice, SDG links'},
  {id:'rules',name:'Ordinal evidence rules',url:null,type:'derived',geography:'Not a jurisdiction',date:null,version:'career-intelligence-4.0',scale:'Task-preference comparison, practice band, capacity arithmetic'}
 ];
}

function attachContextPaths(report,contexts,signals,locale){
 const local=(en,zh,ms)=>({en,'zh-CN':zh,ms})[locale]||en;
 const why=local('Context linked to your selected direction, not an inferred fit or rank.','依据你主动选择的方向关联职业背景，不推断适合度或排名。','Konteks berkaitan arah dipilih, bukan kesesuaian atau kedudukan yang disimpulkan.');
 const verification=local('Use a work sample to check this requirement; it is not a measured skill gap.','用工作样本核验此项要求；这不是已测量的个人能力缺口。','Semak keperluan ini melalui sampel kerja; bukan jurang kemahiran yang diukur.');
 report.profile.background=bank.tracks.find(t=>t.id===report.currentDirection).label[locale];
 report.profile.experience=local('Unverified self-report; see the current-answer evidence.','未经验证的自述，详见当前回答依据。','Laporan kendiri belum disahkan; lihat bukti jawapan semasa.');
 report.ranking=contexts.candidates.map(c=>({id:c.id,title:c.title,score:null,coverage:null,terms:[],source_id:c.sourceId,url:c.url||'',facts:contexts.official.filter(r=>(c.sourceIds||[c.sourceId]).includes(r.source+':'+r.id)),tasks:c.tasks.map(t=>t.label),skills:[...new Set(c.skills.map(t=>t.label))],matched_skills:[],gaps:[],growth:'',period:null}));
 report.analysis.paths=report.ranking.map((r,index)=>({kind:String.fromCharCode(65+index),role_id:r.id,
  why:{text:why,source_ids:r.facts.length?[r.source_id]:[]},transferable:[],
  gaps:r.skills.slice(0,5).map(skill=>({skill,advice:{text:verification,source_ids:r.facts.length?[r.source_id]:[]}})),
  next_step:{text:pick(report.project.task,locale),source_ids:[]},challenge:{text:local('Check role-specific prerequisites and local requirements; the questionnaire did not verify eligibility.','需核实具体岗位先修与当地要求；问卷未验证准入资格。','Semak prasyarat jawatan dan keperluan tempatan; soal selidik tidak mengesahkan kelayakan.'),source_ids:[]},sdg:null}));
 report.currentEvidence=signals;
}
function attachCurrentEvidence(report,signals,contexts,assumptions,locale){
 const local=(en,zh,ms)=>({en,'zh-CN':zh,ms})[locale]||en;
 const claim=(text,ids=[])=>({text,source_ids:ids});
 // Export the same current evidence as the visible report, not empty legacy V2 assessments.
 report.analysis.summary=claim(local(
  `${signals.answeredCount}/${signals.totalQuestions} answered; ${signals.substantiveCount} substantive self-reports across ${signals.coveredDimensions}/${signals.totalDimensions} dimensions. No verified ability or suitability score is inferred.`,
  `已回答 ${signals.answeredCount}/${signals.totalQuestions} 题；${signals.substantiveCount} 条可解释自述，覆盖 ${signals.coveredDimensions}/${signals.totalDimensions} 个维度。不推断已验证能力或适合度分数。`,
  `${signals.answeredCount}/${signals.totalQuestions} dijawab; ${signals.substantiveCount} laporan kendiri bermakna meliputi ${signals.coveredDimensions}/${signals.totalDimensions} dimensi. Tiada skor kebolehan disahkan atau kesesuaian disimpulkan.`));
 report.analysis.capabilities=signals.dimensions.map(d=>({dimension:d.id,label:d.label,
  assessment:claim(d.items.filter(i=>i.state==='self-report').map(i=>`${i.id}: ${i.statement} — ${i.response} (${i.value}/7)`).join(' · ')||local('Not assessed','当前未评估','Belum dinilai')),
  evidence:d.items.map(i=>({...i.source,state:i.state,value:i.value})),verified:false}));
 report.analysis.tasks=contexts.candidates.flatMap(c=>c.tasks.slice(0,3).map(task=>({input_quote:task.label,category:'unclassified',
  assessment:claim(c.sourceKind==='official-context'?local('Occupational task from the linked source; AI automation impact is not measured.','有来源的职业任务；AI 自动化影响未被测量。','Tugas pekerjaan daripada sumber dipautkan; impak automasi AI tidak diukur.'):
   local('Existing editorial practice task; not an official occupational requirement or AI forecast.','现有团队实践任务，不是官方职业要求或 AI 预测。','Tugas latihan editorial sedia ada; bukan syarat pekerjaan rasmi atau ramalan AI.'),c.sourceKind==='official-context'?[c.sourceId]:[])})));
 report.practiceEvidence={
  experienceQuestionIds:signals.items.filter(i=>i.construct==='experience'&&i.state==='self-report').map(i=>i.id),
  verificationQuestionIds:signals.items.filter(i=>i.construct==='ai_verification'&&i.state==='self-report').map(i=>i.id),
  reportedExperienceEndorsed:signals.items.some(i=>i.construct==='experience'&&i.stance==='agreement'),
  reportedVerificationEndorsed:signals.items.some(i=>i.construct==='ai_verification'&&i.stance==='agreement'),
  hypotheticalPractice:{skillEvidence:assumptions?.skillEvidence==='practiced',aiPractice:assumptions?.aiPractice==='practiced'},
  notProficiencyScore:true};
 report.legacyV2InputStatus={categoricalAnswersAvailable:false,reason:'current-questionnaire-has-different-semantics'};
}
