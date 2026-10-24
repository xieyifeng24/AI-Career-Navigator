// Reviewed SW occupational task links. A task link describes a product interpretation
// of a V3 preference; it does not convert an answer into observed job competence.
import {catalog} from '../explorer-engine.js';

const tr=(locale,en,zh,ms)=>({en,'zh-CN':zh,ms})[locale]||en;
const text=(value,locale)=>value?.[{en:0,'zh-CN':1,ms:2}[locale]??0]||value?.[locale]||value?.en||String(value||'');
const answer=(session,id)=>Object.hasOwn(session.answers||{},id)?session.answers[id]:null;
const stance=value=>value===null||value===undefined?'unknown':value>=5?'endorsed':value<=3?'not-endorsed':'uncertain';
const evidence=(session,ids)=>ids.map(questionId=>({questionId,value:answer(session,questionId),kind:'self-report'}));
const claim=(session,ids,kind,value,level='self-report')=>({text:value,kind,evidenceLevel:level,evidence:evidence(session,ids)});
const facts={
 software:{code:'15-1252.00',anchors:[
  {id:'build',question:'SW01',task:'21667',skill:'http://data.europa.eu/esco/skill/797a4416-0b8d-44f3-8fcd-eb10bd0be6b4'},
  {id:'debug',question:'SW02',task:'21670',skill:'http://data.europa.eu/esco/skill/2522a6ce-3202-4ac8-9f5b-b9cb5a3a83a1'},
  {id:'test',question:'SW04',task:'21669',skill:'2.B.4.h:IM'},
  {id:'requirements',question:'SW03',task:'21662',skill:'2.B.4.g:IM'}]},
 'ai-research':{code:'15-1221.00',anchors:[
  {id:'problem-solving',question:'SW03',task:'14623',skill:'2.B.2.i:IM'},
  {id:'mathematical-models',question:null,task:'14629',skill:'2.A.1.e:IM'},
  {id:'intelligent-systems',question:null,task:'14626',skill:'http://data.europa.eu/esco/skill/e465a154-93f7-4973-9ce1-31659fe16dd2'}]}
};
function roleFacts(contexts,id,session){
 const def=facts[id],refs=contexts.official.filter(r=>contexts.candidates.find(c=>c.id===id)?.sourceIds?.includes(r.source+':'+r.id));
 const onet=refs.find(r=>r.source==='onet'&&r.id===def.code),esco=refs.find(r=>r.source==='esco');
 if(!onet||!esco)return null;
 const anchors=def.anchors.map(rule=>{
  const task=onet.tasks.find(item=>item.id===rule.task);
  const skill=(rule.skill.startsWith('http')?esco:onet).skills.find(item=>item.id===rule.skill);
  if(!task||!skill)throw Error('REVIEWED_SW_FACT_MISSING:'+id+':'+rule.id);
  return {id:rule.id,questionId:rule.question,answer:rule.question?answer(session,rule.question):null,
   status:rule.question?stance(answer(session,rule.question)):'not-measured',
   task:{id:task.id,label:task.label,url:task.url,date:task.date,sourceId:'onet:'+onet.id},
   skill:{id:skill.id,label:skill.label,relation:skill.relation,scale:skill.scale,value:skill.value,url:skill.url,sourceId:(rule.skill.startsWith('http')?'esco:'+esco.id:'onet:'+onet.id)}};
 });
 return {anchors,records:refs,onet,esco};
}
function synthesis(session,locale){
 const a=id=>stance(answer(session,id)),out=[];
 const add=(ids,kind,en,zh,ms)=>out.push(claim(session,ids,kind,tr(locale,en,zh,ms)));
 if(a('SW01')==='endorsed'&&a('SW05')==='not-endorsed')add(['SW01','SW05'],'interest-experience-gap',
  'You want to build tools but report little finished-program experience. Start with a supported build; this is an evidence gap, not a verdict on potential.',
  '你想构建工具，但自述很少完成程序。先借助示例完成作品；这是证据缺口，不是潜力判断。',
  'Anda mahu membina alat tetapi melaporkan sedikit pengalaman menyiapkan program. Mulakan dengan binaan berpandu; ini jurang bukti, bukan penilaian potensi.');
 if(a('SW05')==='endorsed'&&a('SW01')!=='endorsed')add(['SW05','SW01'],'experience-interest-tension',
  'You report a finished program, while enthusiasm for building another is less clear. Compare the work you actually enjoyed before choosing a specialty.',
  '你自述做过可运行程序，但再次构建的兴趣不明确。选专业前先比较自己真正喜欢的工作环节。',
  'Anda melaporkan program siap, tetapi minat membina lagi kurang jelas. Banding tugas yang benar-benar anda nikmati sebelum memilih pengkhususan.');
 if(a('G03')==='endorsed'&&(a('G04')==='not-endorsed'||a('SW08')==='not-endorsed'))add(['G03','G04','SW08'],'ai-verification-gap',
  'Frequent AI use is reported, but at least one verification habit is not endorsed. Check a generated claim against a test or independent source before reuse.',
  '你自述经常使用 AI，但至少一项核验习惯未获认同。复用生成内容前先用测试或独立来源核查。',
  'Penggunaan AI kerap dilaporkan, tetapi sekurang-kurangnya satu tabiat pengesahan tidak disokong. Semak dakwaan terjana dengan ujian atau sumber bebas.');
 if(a('SW01')==='endorsed'&&a('SW02')==='not-endorsed')add(['SW01','SW02'],'task-preference-tension',
  'Building appeals to you more than debugging. Test the full build–failure–repair cycle before assuming the daily software role will suit you.',
  '你对构建比排错更感兴趣。请先体验构建、失败、修复的完整循环，再判断日常软件工作是否合适。',
  'Membina lebih menarik daripada menyahpepijat. Cuba kitaran bina–gagal–baiki sebelum menilai kesesuaian kerja perisian harian.');
 if(a('SW05')==='endorsed'&&a('SW06')==='endorsed'&&a('SW04')==='endorsed')add(['SW05','SW06','SW04'],'reported-method-combination',
  'Your reported build and repair experience aligns with an interest in testing and iteration. A repository and test log could verify how these fit together in practice.',
  '你自述的构建、修复经历与测试迭代兴趣相呼应。仓库及测试日志可核验这些线索是否在实践中一致。',
  'Pengalaman membina dan membaiki yang dilaporkan seiring minat menguji dan mengulang. Repositori dan log ujian boleh mengesahkan gabungannya.');
 return out;
}
function routeAction(session,id,locale){
 const experience=stance(answer(session,'SW05'))==='endorsed'&&stance(answer(session,'SW06'))==='endorsed';
 const buildInterest=stance(answer(session,'SW01'))==='endorsed';
 if(id==='software'){
  if(!experience)return {why:tr(locale,'A finished program and independent repair have not been established; the linked software tasks include development, testing and error correction.','尚未确立完整程序与独立修复经历；关联的软件职业任务包括开发、测试和纠错。','Program siap dan pembaikan sendiri belum dibuktikan; tugas perisian berkaitan meliputi pembangunan, ujian dan pembetulan ralat.'),task:tr(locale,'Follow a worked example to build a local study tracker, then add an edit feature without copying the example.','跟随完整示例制作本地学习跟踪器，再不照抄示例独立增加编辑功能。','Ikut contoh untuk membina penjejak belajar setempat, kemudian tambah fungsi sunting tanpa menyalin contoh.'),check:tr(locale,'Show a runnable repository; test add, edit and delete, record one failure and explain the correction.','展示可运行仓库；测试新增、编辑、删除，记录一处失败并解释修正。','Tunjukkan repositori yang boleh dijalankan; uji tambah, sunting dan padam, rekod satu kegagalan serta pembetulannya.'),evidence:tr(locale,'Observed development, testing and repair; no claim of full job readiness.','增加可观察的开发、测试和修复证据，不等于完整岗位胜任力。','Bukti pembangunan, ujian dan pembaikan yang diperhatikan; bukan kesediaan kerja sepenuhnya.'),evidenceQuestions:['SW01','SW02','SW05','SW06']};
  if(!buildInterest)return {why:tr(locale,'You report software experience, but fresh-build interest is uncertain; compare maintenance work with new-feature work.','你自述有软件经历，但新建产品的兴趣不明确；比较维护与新功能开发。','Anda melaporkan pengalaman perisian, tetapi minat membina baharu tidak pasti; banding kerja penyelenggaraan dengan ciri baharu.'),task:tr(locale,'Take an existing small application, reproduce one defect, add a regression test, then compare that week with building one new feature.','选一个已有小应用，复现一处缺陷、加入回归测试，再与开发一个新功能的体验比较。','Ambil aplikasi kecil sedia ada, ulang satu pepijat, tambah ujian regresi, kemudian banding dengan membina satu ciri baharu.'),check:tr(locale,'Keep two commits, the failing/passing test, and a short note on which task you would willingly repeat.','保留两次提交、失败及通过的测试，并记录更愿意重复哪种任务。','Simpan dua komit, ujian gagal/lulus dan nota ringkas tentang tugas yang sanggup anda ulang.'),evidence:tr(locale,'A work sample plus a clearer task preference, without inferring broader ability.','增加工作样本与更清晰的任务偏好，不推断全面能力。','Sampel kerja dan keutamaan tugas lebih jelas, tanpa menyimpulkan kebolehan umum.'),evidenceQuestions:['SW01','SW05','SW06']};
  return {why:tr(locale,'Your reported build and repair experience can be checked against the cited software development and validation tasks.','可用有来源的软件开发与验证任务核查你自述的构建和修复经历。','Pengalaman membina dan membaiki yang dilaporkan boleh disemak terhadap tugas pembangunan dan pengesahan perisian bersumber.'),task:tr(locale,'Extend a local study tracker with one user-requested feature and an error-handling path.','为本地学习跟踪器新增一项用户提出的功能及一条错误处理流程。','Luaskan penjejak belajar setempat dengan satu ciri diminta pengguna dan satu laluan pengendalian ralat.'),check:tr(locale,'Publish a runnable repository, five normal/edge-case tests, a reproduced failure and the revision commit.','提交可运行仓库、五个正常与边界测试、一处可复现故障和修正提交。','Sediakan repositori boleh jalan, lima ujian biasa/pinggir, satu kegagalan boleh diulang dan komit pembetulan.'),evidence:tr(locale,'Direct evidence for implementation, testing and iteration—not a general proficiency score.','为实现、测试和迭代增加直接证据，不生成通用熟练度分数。','Bukti langsung pelaksanaan, pengujian dan iterasi—bukan skor kemahiran umum.'),evidenceQuestions:['SW01','SW02','SW04','SW05','SW06']};
 }
 if(experience&&!buildInterest)return {why:tr(locale,'You report software experience, but a new-build preference is uncertain and the research requirements are unmeasured; test the research work itself before switching paths.','你自述有软件经历，但新建产品的偏好不明确，研究路线要求也未测量；转向前先验证研究工作本身。','Anda melaporkan pengalaman perisian tetapi keutamaan membina baharu tidak pasti dan keperluan penyelidikan belum diukur; uji kerja penyelidikan sebelum bertukar laluan.'),task:tr(locale,'Reproduce a simple classifier result from an existing worked example, then audit its dataset split, baseline and one misleading result.','复现一个已有示例中的简单分类结果，再审查数据划分、基线与一项可能误导的结果。','Ulang hasil pengelas mudah daripada contoh sedia ada, kemudian audit pembahagian data, garis dasar dan satu hasil yang boleh mengelirukan.'),check:tr(locale,'Keep a reproducible notebook, a majority-class comparison, one leakage check and a note on whether experimental analysis interests you more than feature building.','保留可复现笔记本、多数类基线对比、一项泄漏检查，并记录实验分析是否比功能开发更吸引你。','Simpan buku nota boleh diulang, perbandingan kelas majoriti, satu semakan kebocoran dan nota sama ada analisis eksperimen lebih menarik daripada membina ciri.'),evidence:tr(locale,'A direct comparison of research-style work and software work; mathematical readiness still requires separate checking.','形成研究型工作与软件工作的直接比较；数学准备仍需另行核验。','Perbandingan langsung kerja penyelidikan dan perisian; kesediaan matematik masih perlu disemak berasingan.'),evidenceQuestions:['SW01','SW05','SW06','SW03']};
 return experience?{why:tr(locale,'Software experience is reported, but the research route also requires mathematical modelling and AI principles that the questionnaire does not measure.','你自述有软件经历，但研究路线还要求问卷未测量的数学建模与 AI 原理。','Pengalaman perisian dilaporkan, tetapi laluan penyelidikan memerlukan pemodelan matematik dan prinsip AI yang tidak diukur.'),task:tr(locale,'Build a small classifier and a majority-class baseline on the same dataset; document the train/test split and one error pattern.','用同一数据集制作小型分类器与多数类基线；记录训练／测试划分和一种错误模式。','Bina pengelas kecil dan garis dasar kelas majoriti pada set data sama; catat pembahagian latihan/ujian dan satu pola ralat.'),check:tr(locale,'Provide reproducible code, baseline comparison, one leakage check and an explanation of a mathematical assumption.','提供可复现代码、基线对比、一项数据泄漏检查，并解释一条数学假设。','Sediakan kod boleh diulang, perbandingan garis dasar, satu semakan kebocoran dan penerangan andaian matematik.'),evidence:tr(locale,'Initial observed evidence about model evaluation and mathematical reasoning; not proof of ML-engineer readiness.','增加关于模型评估与数学推理的初步可观察证据，不证明已具备机器学习工程师胜任力。','Bukti awal tentang penilaian model dan penaakulan matematik; bukan bukti kesediaan jurutera ML.'),evidenceQuestions:['SW05','SW06','SW03']}:{why:tr(locale,'The linked research tasks and AI principles are unmeasured, and finished-program experience is not established.','关联的研究任务与 AI 原理尚未测量，完整程序经历也未确立。','Tugas penyelidikan dan prinsip AI berkaitan belum diukur, dan pengalaman program siap belum dibuktikan.'),task:tr(locale,'Reproduce a guided classifier example, then calculate and compare a majority-class baseline.','复现带指导的分类器示例，再计算并比较多数类基线。','Ulang contoh pengelas berpandu, kemudian kira dan banding garis dasar kelas majoriti.'),check:tr(locale,'Identify the dataset, baseline and one wrong prediction; explain each step you cannot yet reproduce independently.','指出数据集、基线和一项错误预测，并说明尚不能独立复现的步骤。','Kenal pasti set data, garis dasar dan satu ramalan salah; terangkan langkah yang belum boleh diulang sendiri.'),evidence:tr(locale,'A first observed sample for programming and evaluation; unknown mathematics remains unknown.','形成编程与评估的初步观察样本；数学能力仍未测量。','Sampel awal pengaturcaraan dan penilaian; matematik yang tidak diketahui kekal tidak diketahui.'),evidenceQuestions:['SW03','SW05','SW06']};
}
export function buildSoftwareAnalysis(session,contexts,locale='en'){
 const roleIds=['software','ai-research'],roleData=Object.fromEntries(roleIds.map(id=>[id,roleFacts(contexts,id,session)]));
 const netTaskSignal=id=>(roleData[id]?.anchors.filter(a=>a.status==='endorsed').length||0)-(roleData[id]?.anchors.filter(a=>a.status==='not-endorsed').length||0);
 // One task link contributes one sign, without psychometric or source-importance
 // weights. Unmeasured role-specific research links form the uncertainty margin.
 const uncertainty=roleData['ai-research']?.anchors.filter(a=>a.status==='not-measured').length||0;
 const delta=netTaskSignal('software')-netTaskSignal('ai-research');
 const rankingStatus=!roleData.software||!roleData['ai-research']?'unavailable':delta>uncertainty?'software-first':'inconclusive';
 const paths=roleIds.map(id=>{
  const role=catalog.careers.find(r=>r.id===id),data=roleData[id],anchors=data?.anchors||[],ids=anchors.filter(a=>a.questionId).map(a=>a.questionId);
  const direct=anchors.filter(a=>a.status==='endorsed').length,against=anchors.filter(a=>a.status==='not-endorsed').length,unknown=anchors.filter(a=>a.status==='not-measured').length;
  const routeWhy=!data?tr(locale,'The reviewed occupational mapping is unavailable; this team-catalog route is shown without a personal priority.','已审阅职业映射暂不可用；仅展示团队目录路线，不作个人优先级排序。','Pemetaan pekerjaan disemak tidak tersedia; laluan katalog pasukan dipaparkan tanpa keutamaan peribadi.'):id==='software'?
   tr(locale,`${direct} linked software-task preferences are endorsed; the cited tasks include development, error correction, testing and requirements. Self-reported experience is considered separately.`,
    `你认同 ${direct} 项与软件任务相连的偏好；来源任务包括开发、纠错、测试与需求分析。自述经历另行考虑。`,
    `${direct} keutamaan tugas perisian berkaitan disokong; tugas bersumber termasuk pembangunan, pembetulan ralat, ujian dan keperluan. Pengalaman kendiri dinilai berasingan.`):
   tr(locale,`${direct} related problem-solving preference is endorsed; mathematical modelling and AI principles remain unmeasured. AI-tool use is not ML expertise.`,
    `${direct} 项相关问题求解偏好得到认同；数学建模与 AI 原理仍未测量。使用 AI 工具不等于机器学习能力。`,
    `${direct} keutamaan penyelesaian masalah berkaitan disokong; pemodelan matematik dan prinsip AI belum diukur. Penggunaan alat AI bukan kepakaran ML.`);
  const why=rankingStatus==='inconclusive'&&data?routeWhy+' '+tr(locale,'The remaining unmeasured research requirements prevent a defensible ordering.','尚未测量的研究路线要求使当前无法可靠排序。','Keperluan penyelidikan yang belum diukur menghalang susunan yang dapat dipertahankan.'):routeWhy;
  const action=data?routeAction(session,id,locale):{why:tr(locale,'The reviewed occupational records are unavailable; this is a team-catalog practice example.','已审阅职业记录暂不可用；以下仅为团队目录的实践示例。','Rekod pekerjaan disemak tidak tersedia; ini contoh latihan katalog pasukan.'),task:text(role.project,locale),check:tr(locale,'Save a work sample and document one failure, one correction and an independent review.','保存工作样本，记录一处失败、一次修正及一次独立复核。','Simpan sampel kerja dan rekod satu kegagalan, satu pembetulan serta semakan bebas.'),evidence:tr(locale,'A reviewed work sample; role-specific requirements still need an official source.','形成经复核的工作样本；具体职业要求仍待官方来源核实。','Sampel kerja disemak; keperluan khusus peranan masih perlukan sumber rasmi.'),evidenceQuestions:ids};
  const primary=data?.onet;
  return {id,title:text(role.title,locale),priority:rankingStatus==='inconclusive'||rankingStatus==='unavailable'?1:id==='software'?1:2,why:claim(session,ids,'exploratory-fit',why,data?'self-report':'not-measured'),
   explorationEvidence:{supportedTaskPreferences:direct,notPreferredTaskPreferences:against,netTaskSignal:direct-against,linkedTaskPreferences:ids.length,unmeasuredCoreRequirements:unknown,taskLinks:anchors,method:'One sign per linked V3 task preference; subtract explicit non-preference. Unknown core requirements create an uncertainty margin. No aptitude weights or probability.'},
   reportedExperience:claim(session,['SW05','SW06'],'experience',tr(locale,'Program building and independent repair are self-reported, not observed; inspect an artifact before treating them as skills.','构建程序和独立修复均为自述，尚未观察；将其视为技能前应检查作品。','Pembinaan program dan pembaikan sendiri dilaporkan, belum diperhatikan; periksa hasil sebelum menganggapnya kemahiran.')),
   tasks:data?anchors.map(a=>a.task.label):[text(role.project,locale)],requirements:data?anchors.map(a=>a.skill.label):role.skills.map(s=>text(s,locale)),unverifiedRequirements:anchors.map(a=>({skill:a.skill,status:'not-verified',relatedQuestion:a.questionId})),
   unmeasured:!data?tr(locale,'Official role requirements are unavailable; the questionnaire also cannot verify actual competence.','官方职业要求暂不可用；问卷也无法验证实际能力。','Keperluan pekerjaan rasmi tidak tersedia; soal selidik juga tidak dapat mengesahkan kebolehan sebenar.'):id==='software'?tr(locale,'The questionnaire records preferences and reported experience; it does not test programming, debugging, testing or requirements analysis.','问卷记录偏好及自述经历，但不测试编程、调试、测试或需求分析能力。','Soal selidik merekod keutamaan dan pengalaman kendiri; ia tidak menguji pengaturcaraan, penyahpepijatan, ujian atau analisis keperluan.'):tr(locale,'Mathematical modelling and AI principles are not measured. The linked research and intelligent-systems records are related contexts, not an exact ML-engineer occupation match.','数学建模和 AI 原理未测量。关联的研究与智能系统职业记录只是相关背景，不等同于机器学习工程师岗位。','Pemodelan matematik dan prinsip AI belum diukur. Rekod penyelidikan dan sistem pintar ialah konteks berkaitan, bukan padanan tepat jawatan jurutera ML.'),
   aiTask:!data?text(role.ai,locale):id==='software'?tr(locale,'For the cited development and validation tasks, AI may draft implementation or test ideas. This is a team workflow inference, not an official automation finding.','对于来源中的开发与验证任务，AI 可能起草实现或测试思路。这是团队流程推断，不是官方自动化结论。','Bagi tugas pembangunan dan pengesahan bersumber, AI mungkin merangka pelaksanaan atau idea ujian. Ini inferens pasukan, bukan dapatan automasi rasmi.'):tr(locale,'For related research tasks, AI may help sketch model variants or organize experiments. Whether this helps must be tested; no replacement rate is inferred.','对于相关研究任务，AI 可能帮助构思模型变体或组织实验；是否有帮助仍需验证，不推断替代率。','Bagi tugas penyelidikan berkaitan, AI mungkin membantu merangka variasi model atau menyusun eksperimen. Kegunaannya perlu diuji; tiada kadar penggantian disimpulkan.'),
   humanTask:!data?text(role.human,locale):id==='software'?tr(locale,'A person remains responsible for requirements, reproducible tests, error analysis and consequences.','需求判断、可复现测试、错误分析与后果仍由人负责。','Manusia tetap bertanggungjawab atas keperluan, ujian boleh diulang, analisis ralat dan akibat.'):tr(locale,'A person remains responsible for data quality, mathematical assumptions, baseline comparison, leakage checks and consequences.','数据质量、数学假设、基线对比、泄漏检查与后果仍由人负责。','Manusia tetap bertanggungjawab atas kualiti data, andaian matematik, perbandingan garis dasar, semakan kebocoran dan akibat.'),
   entry:text(role.entry,locale),action:{...action,evidenceQuestions:action.evidenceQuestions},
   source:primary?{kind:'official-context',id:'onet:'+primary.id,url:primary.url,geography:primary.geography,verifiedAt:primary.verified_at,relatedSourceIds:data.records.map(r=>r.source+':'+r.id),mappingCaveat:id==='ai-research'?tr(locale,'Broader related categories, not an exact ML engineer code.','较宽的相关职业类别，并非机器学习工程师的精确职业代码。','Kategori berkaitan yang lebih luas, bukan kod tepat jurutera ML.'):null}:{kind:'team-editorial-catalog',id:'catalog:'+id,url:null,geography:null},officialMapping:!!primary};
 });
 return {profileExtensions:synthesis(session,locale),paths,rankingStatus,rankingRule:`Software first only when its net directly linked task-preference signs exceed the related research route by more than ${uncertainty} unmeasured research links; otherwise no defensible order. One sign per linked task, with no aptitude weights. Experience and AI-tool use do not become verified skills or ML fit.`,occupationalDataStatus:roleData.software&&roleData['ai-research']?'reviewed':'unavailable'};
}
