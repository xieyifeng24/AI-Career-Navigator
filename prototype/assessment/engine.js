// Pure evidence -> decisions -> plans. Intake banks are read-only contracts.
import {questionsFor,bank} from '../v3/engine.js';
import {startingQuestions,preferredRegion,preferredRegions,selections} from '../combined/starting-point.js';
import rules from './roles.json' with {type:'json'};
import bundled from '../../data/knowledge/current.json' with {type:'json'};
import regional from '../../data/regional/current.json' with {type:'json'};
import {validResponse} from '../v3/behaviors.js';
import {buildPersonalModel,buildAIEvidence} from './personal-model.js';
import {currentKnowledge,resolveKnowledge} from './knowledge.js';
export const VERSION='evidence-engine-2.0';
export const pick=(v,l='en')=>Array.isArray(v)?v[{en:0,'zh-CN':1,ms:2}[l]??0]:v?.[l]??v?.en??v??'';
const tri=(en,zh,ms)=>[en,zh,ms];
export const STATUS={unknown:tri('Not yet assessed','尚未评估','Belum dinilai'),limited:tri('Limited reported practice','实践自述有限','Amalan dilaporkan terhad'),mixed:tri('Context-dependent / mixed','依情境而异／回答不一致','Mengikut konteks / bercampur'),reported:tri('Reported, not verified','有自述，未经验证','Dilaporkan, belum disahkan'),conflict:tri('Needs clarification','需要澄清','Perlu penjelasan'),neutral:tri('Undecided','尚未确定','Belum pasti'),high:tri('Stronger task interest','任务兴趣较强','Minat tugas lebih kuat'),low:tri('Less task interest','任务兴趣较弱','Minat tugas lebih rendah')};
export function summarize(items){
 const known=items.filter(x=>Number.isFinite(x.signalValue??x.raw)),values=known.map(x=>x.signalValue??x.raw);
 const mixedFormats=new Set(known.map(x=>x.responseFormat||'legacy-likert7')).size>1;
 const conflict=false; // Different task contexts are not logically mutually exclusive.
 return {status:!values.length?'unknown':mixedFormats?'mixed':conflict?'conflict':values.every(v=>v>=5)?'reported':values.every(v=>v<=3)?'limited':values.every(v=>v===4)?'neutral':'mixed',
 conflict,known:known.length,total:items.length,evidenceIds:items.map(x=>x.id),confidence:!known.length?'none':mixedFormats||conflict||known.length<items.length?'limited':'self-report-only',range:values.length?[Math.min(...values),Math.max(...values)]:null,verified:false};
}
function weighted(evidence,weights){
 const terms=Object.entries(weights).map(([id,weight])=>({id,weight,value:(evidence.find(e=>e.id===id)?.signalValue??evidence.find(e=>e.id===id)?.raw)??null}));
 const known=terms.filter(x=>Number.isFinite(x.value));
 const mixedFormats=new Set(known.map(t=>evidence.find(e=>e.id===t.id)?.responseFormat||'legacy-likert7')).size>1;
 return {value:!mixedFormats&&known.length===terms.length?known.reduce((n,t)=>n+t.value*t.weight,0)/known.reduce((n,t)=>n+t.weight,0):null,terms,coverage:known.length,required:terms.length};
}
function fingerprint(value){let n=2166136261;for(const c of JSON.stringify(value)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return (n>>>0).toString(16);}
const AI_IMPACT_RULES={grow:['develop','software','program','model','machine learning','statistical','analyze','create','design','technology','system','integrat','algorithm','application','innovation'],automate:['enter','database','record','maintain','process','file','sort','schedule','routine','data entry','track','compile','transcribe','update'],human:['advise','negotiat','mentor','coach','supervis','diagnos','present','explain','collaborat','confer','communicate','lead','decision','interview','teach','care','greet','answer','solicit','mediate','resolve'],assist:['write','draft','document','prepare','summar','translat','generate','format','report','copy']};
function classifyTask(label){const t=String(label??'').toLowerCase();for(const id of ['grow','automate','human','assist'])if(AI_IMPACT_RULES[id].some(word=>t.includes(word)))return id;return 'context';}
function classifyAIImpact(tasks){
 const counts={assist:0,automate:0,human:0,grow:0,context:0};
 const categorized=(tasks||[]).map(item=>({label:item.label,id:item.id,category:classifyTask(item.label)}));
 for(const item of categorized)counts[item.category]++;
 let path;
 const max=Math.max(counts.grow,counts.automate,counts.human);
 if(counts.grow>=2&&counts.grow===max)path='ai-growth';
 else if(counts.automate>=2&&counts.automate===max)path='automation-pressure';
 else if(counts.human>=2&&counts.human===max)path='limited-change';
 else path='restructuring';
 return {path,counts,tasks:categorized,rule:'ai-task-impact-v1',forecast:false,verified:false};
}
export function buildAssessment(state,{knowledge=currentKnowledge(),market=regional,generatedAt=null}={}){
 knowledge=resolveKnowledge(knowledge);
 const direction=state.v3.trackId,answers=state.v3.answers||{},intake=state.startingPoint;
 const evidence=questionsFor(direction).map(q=>{
  const raw=answers[q.id]??null;
  if(!validResponse(q,raw))throw Error('INVALID_EVIDENCE:'+q.id);
  return {id:q.id,raw,signalValue:raw,responseFormat:'likert7-2',dimension:q.construct,question:q.statement,response:raw===null?bank.uiText.unfamiliar:bank.scale.find(s=>s.value===raw).label,type:'self-report',verified:false,missing:raw===null,conflict:false,version:state.v3.version};
 });
 if(intake)for(const q of startingQuestions(intake.answers)){
  const raw=q.kind==='story'?intake.story:intake.answers[q.id]??null;
  const labels=value=>q.options?.find(o=>o.id===value)?.label??null;
  const response=q.kind==='story'?raw:Array.isArray(raw)?raw.map(labels):q.kind==='matrix'&&raw&&typeof raw==='object'?q.rows.map(row=>Object.fromEntries(['en','zh-CN','ms'].map(l=>[l,(row.label[l]||row.id)+': '+(labels(raw[row.id])?.[l]||'—')]))):raw&&typeof raw==='object'?Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,Array.isArray(v)?v.map(labels):labels(v)])):labels(raw);
  evidence.push({id:q.id,raw,response,question:q.prompt??q.title??{},dimension:'context',type:q.kind==='story'?'unverified-free-text':'self-report',verified:false,missing:raw===null||raw==='',conflict:false,version:intake.version});
 }
 const dimension=id=>summarize(evidence.filter(e=>e.dimension===id));
 const dimensions=Object.fromEntries(['interest','workstyle','experience','ai_practice','ai_verification','adaptability','exploration'].map(id=>[id,dimension(id)]));
 const conflicts=[];
 const region=preferredRegion(intake),context={stage:intake?.answers.Q01??null,concern:intake?.answers.Q02??null,goal:intake?.answers.Q08??null,barriers:intake?.answers.Q07??[],field:intake?.answers.Q04??null,reportedAbilities:intake?.answers.Q05??null,experience:intake?.answers.Q06??null,region,regions:preferredRegions(intake),regionAnswer:intake?.answers.Q09??null,weeklyHours:state.profile?.exactWeeklyHours??null,story:intake?.story??state.notes??''};
 const insights=[];
 const add=(rule,evidenceIds,copy)=>insights.push({rule,evidenceIds,copy,type:'product-inference',verified:false});
 if(dimensions.interest.status==='reported'&&dimensions.experience.status!=='reported')add('interest-practice-gap-v1',[direction+'01',direction+'02',direction+'05',direction+'06'],tri('Your interest is clearer than your practical evidence. A small reviewed sample is the most useful next test of this direction.','你的兴趣比实践证据更明确。下一步最有价值的是完成一个经过复核的小样本，验证是否愿意继续。','Minat anda lebih jelas daripada bukti praktikal. Sampel kecil yang disemak ialah ujian seterusnya yang berguna.'));
 if(dimensions.experience.status==='reported')add('experience-evidence-v1',[direction+'05',direction+'06'],tri('You describe relevant experience. Bring one existing artifact and explain a decision, an error and a revision before attempting a larger project.','你自述具有相关经历。先找出已有作品，说明一次决策、一个错误及一次修改，再尝试更大的项目。','Anda melaporkan pengalaman berkaitan. Bawa hasil sedia ada dan terangkan keputusan, ralat serta pembetulan sebelum projek lebih besar.'));
 if(dimensions.ai_practice.status==='reported'&&dimensions.ai_verification.status!=='reported')add('usage-check-gap-v1',dimensions.ai_practice.evidenceIds.concat(dimensions.ai_verification.evidenceIds),tri('AI use is more clearly reported than independent checking. Verify one important result before expanding automation.','AI 使用自述比独立核验更明确。扩大自动化之前，先核实一项重要结果。','Penggunaan AI lebih jelas dilaporkan berbanding semakan bebas. Sahkan satu hasil penting sebelum meluaskan automasi.'));
 const barrierCopy={A:tri('Start with the foundations of one target task before committing to a large project.','先学习一个目标任务的基础，再投入大型项目。','Mulakan dengan asas satu tugas sebelum projek besar。'),B:tri('Prioritise a finished sample over another broad course. Save the process, not just the output.','优先完成一个作品而不是再上一门泛课程；保留过程和结果。','Utamakan sampel siap berbanding kursus umum lain. Simpan proses dan hasil.'),C:tri('Compare a manual attempt with an AI-assisted attempt using the same quality checks.','用相同验收标准比较手动与 AI 辅助尝试。','Banding percubaan manual dan bantuan AI dengan semakan kualiti sama.'),D:tri('Write down an assumption, contrary evidence and a reason for your decision.','记录一个假设、反面证据和决策理由。','Catat andaian, bukti bertentangan dan alasan keputusan.'),E:tri('Read the linked occupational tasks, then check two local role descriptions before choosing training.','阅读关联职业任务，并核查两个本地岗位要求，再选择培训。','Baca tugas pekerjaan dipautkan dan semak dua jawatan tempatan sebelum memilih latihan.'),F:tri('Use the prerequisite order in What If to choose one next task.','依据 What If 的先修顺序，选择下一项任务。','Gunakan urutan prasyarat dalam What If untuk memilih satu tugas.'),G:tri('Resources are a stated constraint. Start with public material and a paper or spreadsheet sample; set a realistic weekly budget yourself.','你明确提到资源限制。先用公开资料和纸面或表格样本，并自行设定可行的每周预算。','Sumber ialah kekangan dilaporkan. Mulakan dengan bahan awam dan sampel kertas atau hamparan; tetapkan bajet mingguan yang realistik.'),H:tri('Document your contribution and review evidence in one portfolio case.','用一个作品集案例说明你的贡献与复核证据。','Dokumentasikan sumbangan dan bukti semakan dalam satu kes portfolio.'),I:tri('Start with a diagnostic sample to discover what needs practice.','先做诊断性小样本，找出需要练习的部分。','Mulakan sampel diagnostik untuk mengenal pasti latihan diperlukan.')};
 for(const b of context.barriers)if(barrierCopy[b])add('barrier-'+b+'-v1',['Q07'],barrierCopy[b]);
 if(!insights.length)add('insufficient-evidence-v1',evidence.filter(e=>e.missing).map(e=>e.id),tri('Compare two real tasks from your chosen direction and note which you want to try first.','比较所选方向的两项真实任务，选择你愿意先尝试的一项。','Bandingkan dua tugas sebenar dalam arah dipilih dan pilih satu untuk dicuba dahulu.'));
 const roles=rules.roles.filter(r=>r.track===direction).map(r=>{
  const fact=knowledge?.records?.find(x=>x.source+':'+x.id===r.sourceId);
  const interest=weighted(evidence,r.interestWeights),preference=weighted(evidence,r.preferenceWeights);
  const priorityValue=interest.value!==null&&preference.value!==null?.75*interest.value+.25*preference.value:null;
  // Source importance informs which requirements to investigate, not a personal ability score.
  const skillFacts=(fact?.skills||[]).filter(s=>s.id.endsWith(':IM')).sort((a,b)=>(b.value??0)-(a.value??0)||a.id.localeCompare(b.id)).slice(0,6);
  const requirements=skillFacts.map(s=>({id:r.id+':'+s.id,label:s.label,sourceId:r.sourceId,sourceFactId:s.id,importance:s.value,scale:s.scale,status:'unknown',personalEvidenceIds:[],verified:false}));
  const roleFacts=(market?.facts||[]).filter(f=>f.role_id===r.id);
  const marketByRegion={MY:roleFacts.filter(f=>f.region==='MY'),US:roleFacts.filter(f=>f.region==='US'),GLOBAL:roleFacts.filter(f=>f.region==='GLOBAL')};
  const marketFacts=marketByRegion[region]||[];
  return {...r,interest,preference,priorityValue,priority:null,readiness:dimensions.experience,confidence:interest.value===null?'insufficient':'self-report-only',requirements,source:fact??null,tasks:fact?.tasks??[],aiImpact:classifyAIImpact(fact?.tasks??[]),marketFacts,marketByRegion,opportunity:marketFacts.length?'context-available':'no-comparable-data',mapping:{sourceId:r.sourceId,targetId:r.id,type:r.mappingType,exact:false,evidence:fact?{occupationTitle:fact.title,taskIds:fact.tasks.slice(0,3).map(t=>t.id),answerIds:Object.keys(r.interestWeights)}:null,rule:rules.version}};
 });
 roles.sort((a,b)=>(b.priorityValue??-1)-(a.priorityValue??-1)||a.id.localeCompare(b.id));
 const tied=roles.some(r=>r.priorityValue===null)||Math.abs(roles[0].priorityValue-roles[1].priorityValue)<.35;
 roles.forEach((r,i)=>r.priority=tied?1:i+1);
 const aiEvidence=buildAIEvidence(evidence,intake,roles,direction),ai=aiEvidence.ai;conflicts.push(...aiEvidence.contradictions);
 for(const c of conflicts)for(const item of evidence)if(c.evidenceIds.includes(item.id))item.conflict=true;
 const priority={roleId:roles[0].id,kind:dimensions.ai_verification.status!=='reported'?'verification':dimensions.experience.status!=='reported'?'guided-sample':'reviewed-workflow',evidenceIds:[...dimensions.ai_verification.evidenceIds,...dimensions.experience.evidenceIds],verified:false};
 const input={answers,intake:intake?.answers??null,story:context.story,direction,region,version:VERSION,data:knowledge?.version??'unavailable',market:market?.version??'unavailable'};
 const assessment={version:VERSION,id:'assessment-'+fingerprint(input),generatedAt,questionnaireVersions:[state.v3.version,'likert7-2',intake?.version].filter(Boolean),knowledgeVersion:knowledge?.version??'unavailable',regionalVersion:market?.version??'unavailable',mappingVersion:rules.version,direction,context,evidence,dimensions,conflicts,insights,roles,tied,ai,aiEvidence,priority,missing:evidence.filter(e=>e.missing).map(e=>e.id),verifiedSkills:[],limits:tri('Exploratory product rules, not a validated psychometric test. All personal evidence is self-reported. Occupational requirements do not establish your proficiency or eligibility.','这是探索性产品规则，不是经过效度验证的心理测量。个人证据均为自述；职业要求不能证明你的熟练度或准入资格。','Peraturan penerokaan produk, bukan ujian psikometrik disahkan. Semua bukti peribadi ialah laporan kendiri. Keperluan pekerjaan tidak membuktikan kemahiran atau kelayakan anda.')};
 assessment.personal=buildPersonalModel(assessment,intake);
 assessment.relatedDirections=rules.roles.filter(r=>selections(intake?.answers.Q12).includes(r.track)&&r.track!==direction).map(r=>({id:r.id,title:r.title,track:r.track,source:knowledge.records.find(f=>f.source+':'+f.id===r.sourceId)})).filter(r=>r.source);
 return assessment;
}
export function simulate(assessment,assumptions={}){
 const role=assessment.roles.find(r=>r.id===assumptions.targetCareer)||assessment.roles[0];
 const hours=Number(assumptions.planHours??assessment.context.weeklyHours??5);
 if(!Number.isFinite(hours)||hours<0||hours>40)throw Error('INVALID_PLAN_HOURS');
 const requirement=role.requirements.find(r=>r.id===assumptions.focusSkill)||role.requirements[0]||null;
 const focus=['foundations','practice','verification','portfolio'].includes(assumptions.focusSkill)?assumptions.focusSkill:assessment.priority.kind==='verification'?'verification':'practice';
 const assumed=assumptions.skillEvidence==='practiced';
 const experienced=assessment.dimensions.experience.status==='reported';
 const stages=[
  {id:'foundations',hours:role.effortHours[0],dependencies:[],title:tri('Check prerequisites','检查先修基础','Semak prasyarat'),task:tri('Inspect one official task and its highest-priority skill requirement. Try a small diagnostic example.','阅读一项官方任务及其优先技能要求，试做诊断性小样本。','Semak satu tugas rasmi dan keperluan kemahiran utama. Cuba contoh diagnostik kecil.'),check:tri('Record what you can reproduce and what you still need to learn.','记录可复现的步骤及仍需学习的内容。','Catat perkara boleh diulang dan yang masih perlu dipelajari。')},
  {id:'practice',hours:assumed?4:role.effortHours[1]*(experienced?1:1.5),dependencies:['foundations'],title:tri('Create a task sample','制作任务样本','Cipta sampel tugas'),task:role.project,check:tri('Save inputs, steps, output and one decision; use public or fictional material.','保存输入、步骤、结果及一个决策；使用公开或虚构材料。','Simpan input, langkah, hasil dan satu keputusan; gunakan bahan awam atau rekaan.')},
  {id:'verification',hours:role.effortHours[3],dependencies:['practice'],title:tri('Test and revise','核查与改进','Uji dan semak'),task:tri('Compare an AI-assisted result with your baseline and an independent source or test.','将 AI 辅助结果与手动基线、独立来源或测试比较。','Banding hasil bantuan AI dengan garis dasar serta sumber atau ujian bebas.'),check:tri('Keep a detected error or limitation, a correction and a repeatable check.','保留发现的错误或局限、修正及可重复的核验。','Simpan ralat atau batasan, pembetulan serta semakan boleh ulang.')},
  {id:'portfolio',hours:role.effortHours[2],dependencies:['verification'],title:tri('Build a reviewed case','建立经复核的案例','Bina kes yang disemak'),task:tri('Extend the sample to a second case and request feedback from a suitable reviewer.','把样本扩展到第二个案例，并请适当的评审者反馈。','Kembangkan sampel kepada kes kedua dan minta maklum balas penyemak sesuai.'),check:tri('Explain differences between cases and unresolved requirements; qualifications still require separate checks.','解释案例差异及未解决的要求；资格仍需单独核实。','Jelaskan perbezaan kes dan keperluan belum selesai; kelayakan masih perlu disemak berasingan.')}
 ];
 // Focus gets one extra bounded practice/review session; prerequisite order never changes.
 stages.find(s=>s.id===focus).hours+=6;
 for(const stage of stages)stage.requirementIds=requirement?[requirement.id]:[];
 if(requirement)stages[0].task=stages[0].task.map(t=>t+' '+requirement.label+'.');
 let elapsed=0;
 for(const s of stages){s.startHours=elapsed;elapsed+=s.hours;s.endHours=elapsed;s.endWeek=hours>0?Math.ceil(elapsed/hours):null;s.status='planned';}
 const horizons=[8,52,104].map(weeks=>({weeks,budgetHours:weeks*hours,planned:stages.filter(s=>s.endHours<=weeks*hours).map(s=>s.id),remaining:stages.filter(s=>s.endHours>weeks*hours).map(s=>s.id),unallocatedHours:Math.max(0,weeks*hours-elapsed)}));
 const changes=[];if(assumptions.planHours===undefined&&assessment.context.weeklyHours===null)changes.push('default-budget');else if(assumptions.planHours!==undefined&&Number(assumptions.planHours)!==(assessment.context.weeklyHours??5))changes.push('time');if(assumed)changes.push('assumed-sample');if(focus!=='practice')changes.push('focus');if(!changes.length)changes.push('baseline');
 return {version:'skill-plan-1.0',roleId:role.id,focus,selectedRequirement:requirement,focusSelection:role.requirements.some(r=>r.id===assumptions.focusSkill)?assumptions.focusSkill:focus,weeklyHours:hours,budgetAssumed:assumptions.planHours===undefined&&assessment.context.weeklyHours===null,assumedEvidence:assumed,stages,horizons,totalHours:elapsed,requirements:role.requirements,unknownRequirements:role.requirements.length,changes,forecast:false,verified:false,baseAssessmentId:assessment.id};
}
