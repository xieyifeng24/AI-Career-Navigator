// V4: ordinal evidence comparison. Product exploration rules, not psychometrics.
import {questionsFor} from '../v3/engine.js';
import {startingPointContext,contextualPreparation} from './starting-point-analysis.js';
import {escapeHTML as e} from '../explorer-views.js';
const tr=(l,en,zh,ms)=>({en,'zh-CN':zh,ms})[l]||en;
const level=n=>n==null?'unknown':n>4?'supported':n<4?'not-endorsed':'mixed';
const range={supported:[2,2],mixed:[1,1],'not-endorsed':[0,0],unknown:[0,2],hypothetical:[2,2]};
export const VERSION='career-intelligence-4.0';
export function extractEvidence(session,intake){
 const out=questionsFor(session.trackId).map(q=>({id:q.id,question:q.statement,answer:session.answers[q.id]??null,construct:q.construct,type:'self-report',status:level(session.answers[q.id]),rule:'literal-ordinal-v3',verified:false}));
 if(intake?.completed)for(const [id,value]of Object.entries(intake.answers))out.push({id,answer:structuredClone(value),type:'self-report-context',status:'reported',rule:'literal-starting-point',verified:false});
 return out;
}
function dimension(evidence,ids,sourceIds=[]){
 const items=ids.map(id=>evidence.find(x=>x.id===id)).filter(Boolean),known=items.filter(x=>x.status!=='unknown');
 // Retain mixed evidence; never average opposing answers into competence.
 const statuses=[...new Set(known.map(x=>x.status))];
 const status=!known.length?'unknown':statuses.length===1&&known.length===items.length?statuses[0]:'mixed';
 return {status,evidenceIds:ids,sourceIds,range:range[status],verified:false};
}
export function paretoCompare(a,b){
 const ids=['interest','workPreference','experience'];
 const comparable=ids.filter(id=>a.dimensions[id].status!=='unknown'&&b.dimensions[id].status!=='unknown');
 // Unknown role-specific requirements prevent a strong job-readiness order.
 const dominates=(x,y)=>comparable.length>=2&&comparable.every(k=>x.dimensions[k].range[0]>=y.dimensions[k].range[1])&&comparable.some(k=>x.dimensions[k].range[0]>y.dimensions[k].range[1]);
 return {relation:dominates(a,b)?'a-provisional':dominates(b,a)?'b-provisional':'incomparable',compared:comparable,rule:'observed-pareto-v1',limitation:'Partial task evidence only; unknown requirements remain unresolved. No overall fit score.'};
}
export function buildIntelligence(session,intake,p0,contexts,assumptions={}){
 const evidence=extractEvidence(session,intake),by=Object.fromEntries(evidence.map(x=>[x.id,x])),a=intake?.completed?intake.answers:null;
 const groups=Object.fromEntries(['interest','workstyle','experience','ai_practice','ai_verification','exploration','adaptability'].map(c=>[c,dimension(evidence,evidence.filter(x=>x.construct===c).map(x=>x.id))]));
 const claims=[];
 const add=(id,ids,copy,action)=>claims.push({claim_id:id,evidence_ids:ids,source_ids:[],inference_type:'product-rule',uncertainty:'self-report-unverified',copy,rule:id,recommended_action_ids:[action],limitations:['No observed competence test']});
 const high=id=>by[id]?.status==='supported',low=id=>by[id]?.status==='not-endorsed';
 if(session.trackId==='SW'){
  if(high('SW01')&&(low('SW05')||a&&['A','B','G'].includes(a.Q06)))add('interest-before-artifact',['SW01','SW05',...(a?['Q06']:[])],['Your interest in building is stronger than the available artifact evidence. Try a guided implementation, then change one requirement independently; evaluate the result before judging readiness.','构建兴趣比现有作品证据更明确。先完成有指导的实现，再独立改变一项要求；用成果核验准备情况，而非否定潜力。','Minat membina lebih jelas daripada bukti hasil. Cuba pelaksanaan berpandu, kemudian ubah satu keperluan sendiri; nilai hasil sebelum menilai kesediaan.'],'software-verify');
  if((high('SW05')||a&&['C','D','E','F'].includes(a.Q06))&&low('SW06'))add('artifact-without-repair',['SW05','SW06',...(a?['Q06']:[])],['A project or runnable artifact is reported, but independent repair is not. It may reflect teamwork or tutorial support. Reproduce a defect and explain your own correction before claiming independent delivery.','你报告了项目或可运行作品，却未报告独立修复经历；可能涉及团队或教程支持。先复现故障并解释自己的修正，再判断独立交付准备。','Projek atau hasil berfungsi dilaporkan tetapi pembaikan sendiri tidak. Ini mungkin melibatkan pasukan atau tutorial. Ulang kecacatan dan terangkan pembetulan sendiri sebelum menilai penghantaran bebas.'],'software-verify');
  if(high('G03')&&(low('G04')||low('SW08')))add('ai-without-check',['G03','G04','SW08'],['AI use and quality assurance are different. Compare an AI-produced implementation with independent test cases and keep one rejected suggestion; usage frequency does not establish model-development skill.','AI 使用与质量保障不同。用独立测试检查生成实现，保留一项被否决的建议；使用频率不证明模型开发能力。','Penggunaan AI berbeza daripada jaminan kualiti. Banding pelaksanaan AI dengan ujian bebas dan simpan cadangan ditolak; kekerapan bukan kemahiran membina model.'],'ai-verify');
  if(high('SW01')&&low('SW02'))add('build-maintain-tension',['SW01','SW02'],['Building appeals more than investigating failures. Both appear in software work; compare your willingness to repeat each task before choosing that route.','构建比追查故障更吸引你，而两者都是软件任务；选择路线前先比较自己是否愿意反复承担这两类工作。','Membina lebih menarik daripada menyiasat kegagalan. Kedua-duanya tugas perisian; banding kesediaan mengulang setiap tugas sebelum memilih laluan.'],'software-verify');
 }
 if(a){
  if(['C','D','E','F'].includes(a.Q06)&&['guided','untried'].includes(a.Q05.execution))add('artifact-execution-context',['Q05','Q06'],['An artifact and limited independent execution are both reported. These can coexist in a team or guided project. Record your contribution and repeat one task independently to clarify the evidence.','作品经历与较少独立执行经验可以同时存在于团队或指导项目中。记录个人贡献，并独立重复一个任务以厘清证据。','Hasil dan pelaksanaan bebas terhad boleh wujud bersama dalam projek pasukan atau berpandu. Rekod sumbangan anda dan ulang satu tugas sendiri untuk menjelaskan bukti.'],'software-verify');
  add('decision-context',['Q02','Q08','Q09'],['Your concern and target market set the report focus, not your ability. Check local task evidence and access requirements separately from personal preparation.','困惑与目标地区决定报告重点，不改变你的能力证据。将当地职业任务与准入条件和个人准备分别核查。','Kebimbangan dan pasaran sasaran menetapkan fokus laporan, bukan kebolehan. Semak tugas tempatan dan syarat akses berasingan daripada persediaan diri.'],'context-verify');
 }
 const routes=p0.paths.map(path=>{
  const links=path.explorationEvidence?.taskLinks||[],sources=path.source.relatedSourceIds||[path.source.id];
  const ids=links.filter(x=>x.questionId).map(x=>x.questionId);
  const dims={interest:dimension(evidence,ids.filter(id=>by[id]?.construct==='interest'),sources),workPreference:dimension(evidence,ids.filter(id=>by[id]?.construct==='workstyle'),sources),experience:dimension(evidence,session.trackId==='SW'?path.id==='software'?['SW05','SW06']:['SW05']:evidence.filter(x=>x.construct==='experience').map(x=>x.id),sources),skillReadiness:{status:'unknown',range:[0,2],verified:false,evidenceIds:[],sourceIds:sources},goalAlignment:{status:a?'contextual':'unknown',evidenceIds:a?['Q02','Q08']:[]},practicalFeasibility:{status:'unknown',evidenceIds:a?['Q10']:[],missing:['time-budget','entry-eligibility']},marketOutlook:{status:'separate-regional-context',sourceIds:[]}};
  if(session.trackId==='SW'&&path.id==='ai-research')dims.experience={...dims.experience,status:'unknown',range:[0,2],transferableProgramming:dimension(evidence,['SW05']),reason:'Programming experience does not establish research or ML experience'};
  const hypothesis=assumptions.skillEvidence==='practiced'&&path.id==='software';
  if(hypothesis)dims.experience={...dims.experience,status:'hypothetical',range:[2,2],assumption:'Reviewed implementation and repair sample',verified:false};
  const requirements=(links.length?links:path.requirements.map((label,i)=>({id:'catalog-'+i,skill:{label},task:null}))).map(link=>({id:link.id,label:link.skill.label,task:link.task,sourceId:link.skill.sourceId||path.source.id,status:hypothesis&&['build','debug','test'].includes(link.id)?'hypothetical-sample':'unverified',evidenceIds:link.questionId?[link.questionId]:[],mapping:path.officialMapping?'reviewed-context':'team-editorial'}));
  const known=Object.values(dims).filter(d=>d.status==='supported').length;
  return {id:path.id,title:path.title,dimensions:dims,requirements,priority:1,label:known>=2?'promising-needs-validation':known?'worth-exploring':'insufficient-evidence',sourceIds:sources,actionId:path.id+'-verify',officialMapping:path.officialMapping};
 });
 if(assumptions.targetCareer)for(const route of routes)route.dimensions.goalAlignment={status:route.id===assumptions.targetCareer?'user-selected-scenario':'alternative-scenario',evidenceIds:[],assumption:true};
 const comparison=routes.length===2&&session.trackId==='SW'?paretoCompare(routes[0],routes[1]):{relation:'incomparable',compared:[],rule:'no-reviewed-task-crosswalk'};
 if(comparison.relation==='a-provisional')routes[1].priority=2;
 if(comparison.relation==='b-provisional')routes[0].priority=2;
 const edges=[];
 for(let i=0;i<routes.length;i++)for(let j=i+1;j<routes.length;j++){
  const shared=routes[i].requirements.filter(r=>routes[j].requirements.some(s=>s.label===r.label));
  edges.push({from:routes[i].id,to:routes[j].id,type:'exploration-comparison',sharedRequirements:shared.map(r=>r.label),migrationVerified:false,conditions:routes[j].requirements.filter(r=>!shared.includes(r)).map(r=>r.label)});
 }
 const actions=p0.paths.map(path=>({id:path.id+'-verify',routeId:path.id,evidenceIds:[...new Set([...path.action.evidenceQuestions,...(a?['Q02','Q05','Q06','Q08']:[])])],sourceIds:path.source.relatedSourceIds||[path.source.id],task:path.action.task,check:path.action.check,why:path.action.why,stage:'now',verified:false}));
 if(a){
  const context=startingPointContext(intake,'en');
  actions.push({id:'context-verify',routeId:'context',evidenceIds:['Q02','Q08','Q09'],sourceIds:[],task:context.focus,check:'Save one source-backed comparison and identify the next unresolved access or task requirement.',stage:'now',verified:false});
 }
 const aiAction=p0.actions.find(x=>x.routeId==='cross-cutting');
 if(aiAction)actions.push({id:'ai-verify',routeId:'cross-cutting',evidenceIds:aiAction.evidenceQuestions,sourceIds:[],task:aiAction.task,check:aiAction.check,stage:'now',verified:false});
 return {version:VERSION,evidence,personal:{contradictions:claims.filter(c=>['artifact-without-repair','artifact-execution-context','ai-without-check','build-maintain-tension'].includes(c.rule)).map(c=>c.claim_id),currentSituation:a?{stage:a.Q01,field:a.Q04}:null,primaryConcerns:a?{primary:a.Q02.primary,secondary:a.Q02.secondary,decisionContext:a.Q03,goal:a.Q08}:null,interests:groups.interest,workPreferences:groups.workstyle,selfReportedCapability:a?structuredClone(a.Q05):null,experience:{dimension:groups.experience,artifact:a?.Q06||null,verified:false},ai:{practice:groups.ai_practice,verification:groups.ai_verification,assumedVerification:assumptions.aiPractice==='practiced'},constraints:a?{market:a.Q09,circumstance:a.Q10,barriers:a.Q07,timeBudget:null}:null,unknowns:['observed-skills','mathematical-readiness','employment-eligibility','time-budget']},claims,routes,comparison,edges,actions,scenario:structuredClone(assumptions),coverage:{selectedDirection:session.trackId,unmeasuredDirections:9,knowledgeVersion:contexts.knowledgeVersion},method:'Ordinal evidence / partial Pareto; no weighted average, ability score or career-success probability'};
}
export function applyIntelligence(p0,unified,locale='en'){
 const result=structuredClone(p0);
 result.rankingStatus=unified.comparison.relation==='incomparable'?'inconclusive':'provisional-evidence-order';result.rankingRule=unified.method;
 for(const claim of unified.claims)result.profile.push({text:claim.copy[{en:0,'zh-CN':1,ms:2}[locale]||0],kind:'integrated-evidence',evidenceLevel:'self-report',evidence:claim.evidence_ids.map(id=>({questionId:id,value:unified.evidence.find(x=>x.id===id)?.answer,kind:'self-report'})),rule:claim.rule});
 for(const path of result.paths){const route=unified.routes.find(r=>r.id===path.id);path.priority=route.priority;path.unified=route;path.why.text=tr(locale,'Compare the task-linked evidence below; any priority is provisional and does not establish job readiness.','请比较下方与任务关联的证据；优先级仅为暂定探索顺序，不证明岗位胜任力。','Bandingkan bukti berkaitan tugas di bawah; keutamaan adalah sementara dan bukan kesediaan kerja.');}
 if(unified.scenario.skillEvidence==='practiced'){
  const route=result.paths.find(p=>p.id==='software');
  if(route)route.action={...route.action,task:tr(locale,'Assuming the implementation and repair sample was independently reviewed, add one new user requirement to that same artifact and a regression test showing that the repaired failure stays fixed.','假设实现与修复样本已经独立复核，请在同一作品中加入一项新用户需求，并用回归测试证明已修复的问题没有再次出现。','Andaikan sampel pelaksanaan dan pembaikan sudah disemak bebas, tambah satu keperluan pengguna pada hasil sama dan ujian regresi yang menunjukkan kegagalan dibaiki tidak berulang.'),check:tr(locale,'Keep the hypothetical baseline, the new requirement, a failing/passing test pair and independent feedback. Actual skill remains unverified until this evidence exists.','保留假设基线、新需求、失败及通过的测试对和独立反馈。在真实证据出现之前，实际技能仍未验证。','Simpan garis dasar hipotesis, keperluan baharu, pasangan ujian gagal/lulus dan maklum balas bebas. Kemahiran sebenar belum disahkan sehingga bukti ini wujud.')};
 }
 if(unified.scenario.aiReliance==='higher'){const check=result.actions.find(a=>a.routeId==='cross-cutting');if(check)check.task=tr(locale,'Under higher AI reliance, run the same acceptance tests on a manual baseline and generated output, record one rejected suggestion and define when human review is mandatory.','在更依赖 AI 的假设下，对人工基线与生成结果运行同一组验收测试，记录一项被否决的建议，并明确必须人工复核的环节。','Di bawah andaian pergantungan AI lebih tinggi, jalankan ujian penerimaan sama pada garis dasar manual dan output AI, rekod satu cadangan ditolak dan tentukan bila semakan manusia wajib.');}
 result.actions=result.actions.map(action=>{const path=result.paths.find(p=>p.id===action.routeId);return path?{...action,...path.action}:action;});
 return result;
}
export function renderIntelligence(unified,locale='en'){
 const T=(en,zh,ms)=>tr(locale,en,zh,ms),names={interest:T('Interest','兴趣','Minat'),workPreference:T('Work preference','工作偏好','Keutamaan kerja'),experience:T('Reported experience','自述经历','Pengalaman dilaporkan'),skillReadiness:T('Verified readiness','已验证准备度','Kesediaan disahkan')};
 const status={supported:T('Supported by self-report','自述支持','Disokong laporan kendiri'),mixed:T('Mixed evidence','线索不一致','Bukti bercampur'),'not-endorsed':T('Not endorsed','未认同','Tidak disokong'),unknown:T('Unknown / unverified','未知／未验证','Tidak diketahui / belum disahkan'),hypothetical:T('Scenario assumption only','仅情景假设','Andaian senario sahaja')};
 return `<section class="local-dimensions" data-intelligence-version="${VERSION}">${unified.routes.map(r=>`<article class="plan-mini"><h3>${e(r.title)}</h3>${Object.entries(names).map(([id,name])=>`<p><strong>${name}:</strong> ${status[r.dimensions[id].status]}</p>`).join('')}<details><summary>${T('Evidence and occupational requirements','证据与职业要求','Bukti dan keperluan pekerjaan')}</summary>${r.requirements.map(q=>`<p lang="en">${e(q.label)}</p><small>${e(q.evidenceIds.join(' · ')||T('Not measured','未测量','Belum diukur'))} · ${e(q.sourceId)} · ${status[q.status==='hypothetical-sample'?'hypothetical':'unknown']}</small>`).join('')}</details></article>`).join('')}</section>`;
}
export function scenarioDifference(before,after){
 const changes=[];
 for(const route of after.routes){const old=before.routes.find(r=>r.id===route.id);
  for(const id of ['interest','workPreference','experience','skillReadiness'])if(old.dimensions[id].status!==route.dimensions[id].status)changes.push({routeId:route.id,dimension:id,before:old.dimensions[id].status,after:route.dimensions[id].status});
  for(const requirement of route.requirements)if(old.requirements.find(r=>r.id===requirement.id)?.status!==requirement.status)changes.push({routeId:route.id,requirementId:requirement.id,before:'unverified',after:requirement.status});
 }
 if(before.personal.ai.assumedVerification!==after.personal.ai.assumedVerification)changes.push({dimension:'ai-verification-practice',before:false,after:true});
 return changes;
}
export function renderScenario(model,options,locale='en'){
 const U=model.unified,original=buildIntelligence(model.currentAnswers,model.startingPoint,model.p0,model.contexts,{}),diff=scenarioDifference(original,U),T=(en,zh,ms)=>tr(locale,en,zh,ms),a=options.assumptions||{};
 const labelStatus=value=>({supported:T('Self-report supported','自述支持','Laporan kendiri disokong'),mixed:T('Mixed','不一致','Bercampur'),unknown:T('Unknown','未知','Tidak diketahui'),unverified:T('Unverified','未验证','Belum disahkan'),hypothetical:T('Assumed practice','假设实践','Latihan diandaikan'),'hypothetical-sample':T('Hypothetical sample','假设样本','Sampel hipotesis'),false:T('Original evidence','原始证据','Bukti asal'),true:T('Hypothetical independent check','假设独立核验','Semakan bebas hipotesis')})[String(value)]||value;
 const labelChange=d=>({experience:T('Reported experience','自述经历','Pengalaman dilaporkan'),build:T('Implementation','实现','Pelaksanaan'),debug:T('Debugging','调试','Penyahpepijatan'),test:T('Testing','测试','Pengujian'),'ai-verification-practice':T('AI checking practice','AI 核验实践','Amalan semakan AI')})[d.requirementId||d.dimension]||d.requirementId||d.dimension;
 const choices=(name,key,items)=>`<label>${name}<select data-v2-control="${key}">${items.map(([id,label])=>`<option value="${id}" ${a[key]===id?'selected':''}>${e(label)}</option>`).join('')}</select></label>`;
 const row=(name,key)=>`<label>${name}<select data-v2-control="${key}"><option value="baseline">${T('Original evidence','原始证据','Bukti asal')}</option><option value="practiced" ${a[key]==='practiced'?'selected':''}>${T('Assume completed and independently reviewed','假设完成并经独立复核','Andaikan siap dan disemak bebas')}</option></select></label>`;
 return `<section class="whatif" data-v2-simulator><h2>What If</h2><p>${T('Same evidence engine, different explicit assumptions. Reviewed practice is hypothetical, not an earned skill. Original answers and market facts stay unchanged.','同一证据引擎，改变明确假设。复核过的实践仍是假设，并非已掌握的技能；原始答案和市场事实保持不变。','Enjin bukti sama dengan andaian jelas berbeza. Latihan disemak ialah hipotesis, bukan kemahiran diperoleh. Jawapan asal dan fakta pasaran kekal.')}</p><div class="sim-controls">${row(T('Implementation and repair sample','实现与修复样本','Sampel pelaksanaan dan pembaikan'),'skillEvidence')}${row(T('Independent AI output check','独立核验 AI 输出','Semakan bebas output AI'),'aiPractice')}${choices(T('Target route','目标路线','Laluan sasaran'),'targetCareer',[['',T('Keep original exploration','保持原始探索','Kekalkan penerokaan asal')],...U.routes.map(r=>[r.id,r.title])])}${choices(T('Target market','目标市场','Pasaran sasaran'),'targetMarket',[['',T('Keep original market','保持原始市场','Kekalkan pasaran asal')],['MY','Malaysia'],['US',T('United States','美国','Amerika Syarikat')],['GLOBAL',T('International skills','国际技能视角','Kemahiran antarabangsa')]])}${choices(T('AI reliance','AI 依赖假设','Pergantungan AI'),'aiReliance',[['',T('Current practice','当前做法','Amalan semasa')],['higher',T('Assume greater reliance','假设更多依赖 AI','Andaikan pergantungan lebih tinggi')]])}</div>${a.targetCareer||a.targetMarket||a.aiReliance?`<p>${T('Explicit scenario priorities; not new capability evidence','明确的情景优先项，不是新的能力证据','Keutamaan senario jelas; bukan bukti kebolehan baharu')}: ${e(U.routes.find(r=>r.id===a.targetCareer)?.title||'')} · ${e(a.targetMarket||'')} ${a.aiReliance==='higher'?T('More AI reliance requires an independent review baseline.','更多依赖 AI 需要独立复核基线。','Pergantungan AI lebih tinggi memerlukan garis dasar semakan bebas.'):''}</p>`:''}<h3>${T('Calculated differences','计算得到的变化','Perbezaan dikira')}</h3>${diff.length?`<ul>${diff.map(d=>`<li>${e(U.routes.find(r=>r.id===d.routeId)?.title||'AI')} · ${e(labelChange(d))}: ${e(labelStatus(d.before))} → ${e(labelStatus(d.after))}</li>`).join('')}</ul>`:`<p>${T('No assumption changed; original evidence is shown.','尚未改变假设，显示原始证据。','Tiada andaian berubah; bukti asal dipaparkan.')}</p>`}<div class="ex-two-grid"><article><h3>${T('Original comparison','原始比较','Perbandingan asal')}</h3>${renderIntelligence(original,locale)}</article><article><h3>${T('Scenario comparison','情景比较','Perbandingan senario')}</h3>${renderIntelligence(U,locale)}</article></div><p>${T('Mathematics, model evaluation and employment eligibility remain unverified. A hypothetical software sample does not satisfy ML research requirements.','数学、模型评估和就业资格仍未验证。假设的软件样本不能证明满足机器学习研究要求。','Matematik, penilaian model dan kelayakan bekerja kekal belum disahkan. Sampel perisian hipotesis tidak memenuhi keperluan penyelidikan ML.')}</p><button class="text-button" data-combined-action="v2-reset">${T('Restore original','恢复原始结果','Pulihkan asal')}</button></section>`;
}
export function renderConnections(unified,locale='en'){
 const T=(en,zh,ms)=>tr(locale,en,zh,ms);
 return `<section class="ex-detail"><h3>${T('Connections and conditions','职业联系与迁移条件','Hubungan dan syarat')}</h3>${unified.edges.map(edge=>`<p>${e(unified.routes.find(r=>r.id===edge.from).title)} ↔ ${e(unified.routes.find(r=>r.id===edge.to).title)}</p><p>${T('Shared source skill requirements','来源中共有的技能要求','Keperluan kemahiran sumber dikongsi')}: ${e(edge.sharedRequirements.join(' · ')||T('No identical reviewed skill relation in this snapshot','当前快照未核对到相同的技能关联','Tiada hubungan kemahiran sama disemak dalam petikan ini'))}</p><p>${T('Before considering a transition, verify','考虑迁移前需验证','Sebelum mempertimbangkan peralihan, sahkan')}: <span lang="en">${e(edge.conditions.join(' · '))}</span></p>`).join('')}<p>${T('Links compare requirements; they do not prove a successful career transition.','连线用于比较职业要求，不证明能够成功转型。','Hubungan membanding keperluan; bukan bukti peralihan kerjaya berjaya.')}</p></section>`;
}
