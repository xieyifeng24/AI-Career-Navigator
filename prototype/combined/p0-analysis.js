// V3-only interpretive layer. Thresholds describe agreement; they are not aptitude weights.
import {questionsFor,bank} from '../v3/engine.js';
import {buildSoftwareAnalysis} from './sw-analysis.js';
const I={en:0,'zh-CN':1,ms:2};
const T=(locale,en,zh,ms)=>({en,'zh-CN':zh,ms})[locale]||en;
const label=(row,locale)=>Array.isArray(row)?row[I[locale]??0]:row?.[locale]||row?.en||String(row||'');
const band=value=>value===null||value===undefined?'unknown':value>=5?'endorsed':value<=3?'not-endorsed':'neutral';
const byId=(session,id)=>session.answers?.[id];
const trace=(session,ids)=>ids.map(id=>({questionId:id,value:Object.hasOwn(session.answers||{},id)?session.answers[id]:null,kind:'self-report'}));
const known=(session,ids)=>ids.filter(id=>band(byId(session,id))!=='unknown');
const count=(session,ids)=>ids.filter(id=>band(byId(session,id))==='endorsed').length;
function claim(session,ids,kind,text,level='self-report') {return {text,kind,evidenceLevel:level,evidence:trace(session,ids)};}
function pickClaim(session,ids,locale,strong,weak,unknown,kind='preference'){
 const present=known(session,ids);
 const text=!present.length?label(unknown,locale):count(session,ids)>=2?label(strong,locale):label(weak,locale);
 return claim(session,ids,kind,text,present.length?'self-report':'not-measured');
}
const sw={
 build:['SW01','SW02'],method:['SW03','SW04'],experience:['SW05','SW06'],ai:['G03','SW07'],verify:['G04','SW08']
};
const SW_COPY={
 buildStrong:['You prefer making working tools and investigating failures, so an engineering sample can test a concrete interest.','你倾向于制作可运行工具并追查故障，工程作品能验证这项具体兴趣。','Anda cenderung membina alat berfungsi dan menyiasat kegagalan; sampel kejuruteraan boleh menguji minat ini.'],
 buildWeak:['Your interest in building and debugging is mixed or limited; try both tasks before choosing a route.','你对构建和排错的兴趣线索有限或不一致，先分别体验两种任务。','Minat anda pada pembinaan dan penyahpepijatan bercampur atau terhad; cuba kedua-duanya dahulu.'],
 buildUnknown:['Building and debugging interests were not established by these answers.','目前回答不足以判断构建与排错兴趣。','Jawapan ini belum menentukan minat membina dan menyahpepijat.'],
 methodStrong:['You report a preference for testable steps and refinement; a project with an error log can check whether this becomes practice.','你自述偏好可测试的拆解与反复修正；带错误记录的项目可以检验能否落实。','Anda melaporkan keutamaan pada langkah yang boleh diuji dan penambahbaikan; projek dengan log ralat boleh menyemaknya.'],
 methodWeak:['Your method preferences are mixed; compare a tested iteration with your usual way of working.','工作方式偏好不一致；比较一次经过测试的迭代与你惯用方式的效果。','Keutamaan cara kerja bercampur; banding satu iterasi diuji dengan cara kerja biasa.'],
 methodUnknown:['The questionnaire did not establish a test-and-refine preference.','问卷未确立测试与迭代的工作偏好。','Soal selidik belum menentukan keutamaan menguji dan memperbaiki.'],
 experienceStrong:['You report making a working artifact and fixing a technical problem; neither outcome has been observed here.','你自述制作过可运行作品并修复过技术问题；本次没有观察到作品或过程。','Anda melaporkan pernah membina hasil berfungsi dan membaiki masalah teknikal; kedua-duanya belum diperhatikan di sini.'],
 experienceWeak:['Only part of the described software experience is reported; keep the specific evidence separate.','仅有部分软件经历得到自述支持，应分别核验具体经历。','Hanya sebahagian pengalaman perisian dilaporkan; semak bukti khusus secara berasingan.'],
 experienceNone:['These answers do not report a finished program or independent repair; that is not proof you cannot learn either task.','这些回答未报告完成程序或独立修复经历；这不证明你无法学会这些任务。','Jawapan ini tidak melaporkan program siap atau pembaikan sendiri; itu bukan bukti anda tidak boleh mempelajari tugas tersebut.'],
 experienceUnknown:['No conclusion about programming experience is available from these answers.','这些回答无法判断编程经历。','Jawapan ini tidak mencukupi untuk menyimpulkan pengalaman pengaturcaraan.'],
 aiStrong:['You report recent AI use and willingness to revise AI-generated code; this is a workflow clue, not observed code quality or ML expertise.','你自述近期使用 AI，并表示愿意修改 AI 生成代码；这是协作方式线索，不证明代码质量或机器学习能力。','Anda melaporkan penggunaan AI terkini dan kesediaan menyemak kod janaan AI; ini petunjuk aliran kerja, bukan bukti kualiti kod atau kepakaran ML.'],
 aiWeak:['AI use and code revision do not both have support; start with a manual baseline and an optional AI comparison.','AI 使用与代码修改未同时获得回答支持；先保留人工基线，再按需比较 AI 辅助版本。','Penggunaan AI dan semakan kod tidak sama-sama disokong; mulakan dengan garis dasar manual dan perbandingan AI pilihan.'],
 aiUnknown:['AI practice is not established by these answers.','这些回答不足以判断 AI 实践。','Amalan AI belum ditentukan oleh jawapan ini.'],
 verifyStrong:['You describe checking AI claims and testing failure cases; the login example is hypothetical and needs an actual test record.','你描述了核查 AI 结论与测试异常情况的习惯；登录示例是假设情景，仍需真实测试记录。','Anda menerangkan semakan dakwaan AI dan ujian kes gagal; contoh log masuk ialah hipotesis dan memerlukan rekod ujian sebenar.'],
 verifyWeak:['Verification responses are mixed; require one independent check before accepting generated output.','核验回答不一致；采用生成内容前先完成至少一项独立检查。','Jawapan pengesahan bercampur; lakukan satu semakan bebas sebelum menerima output terjana.'],
 verifyUnknown:['AI verification practice is not established by these answers.','这些回答不足以判断 AI 核验习惯。','Amalan pengesahan AI belum ditentukan oleh jawapan ini.']
};
const C=(key)=>({en:SW_COPY[key][0],'zh-CN':SW_COPY[key][1],ms:SW_COPY[key][2]});
function profileFor(session,locale){
 const track=session.trackId,ids=questionsFor(track);
 const dimension=construct=>ids.filter(q=>q.construct===construct).map(q=>q.id);
 const result=[];
 if(track==='SW')for(const [key,kind] of [['build','interest'],['method','workstyle'],['experience','experience'],['ai','ai-practice'],['verify','ai-verification']]){
  if(key==='experience'&&known(session,sw.experience).length===2&&count(session,sw.experience)===0)result.push(claim(session,sw.experience,kind,label(C('experienceNone'),locale)));
  else result.push(pickClaim(session,sw[key],locale,C(key+'Strong'),C(key+'Weak'),C(key+'Unknown'),kind));
 } else for(const [construct,kind] of [['interest','interest'],['workstyle','workstyle'],['experience','experience'],['ai_practice','ai-practice'],['ai_verification','ai-verification']]){
  const qids=dimension(construct),yes=count(session,qids),present=known(session,qids).length;
  const title=bank.constructLabels[construct][locale];
  const desc=present===0?T(locale,'No interpretable answer for this dimension.','这个维度没有可解释的回答。','Tiada jawapan yang boleh ditafsir untuk dimensi ini.'):yes===qids.length?T(locale,`You endorse both ${title} statements; verify the stated behavior in a real task.`,`你认同两项${title}陈述；请在真实任务中核验所述行为。`,`Anda bersetuju dengan kedua-dua pernyataan ${title}; semak tingkah laku dalam tugas sebenar.`):T(locale,`Your ${title} answers are mixed or limited; keep each specific clue separate.`,`关于${title}的回答线索有限或不一致，应分别保留具体依据。`,`Jawapan ${title} bercampur atau terhad; kekalkan setiap petunjuk khusus.`);
  result.push(claim(session,qids,kind,desc,present?'self-report':'not-measured'));
 }
 result.push(claim(session,['G01','G02'],'exploration',count(session,['G01','G02'])===2?T(locale,'You favor reversible trials and adapting plans; this is willingness, not measured learning speed.','你倾向于先做可逆实验并调整计划；这是意愿，并非已测量学习速度。','Anda cenderung mencuba percubaan boleh balik dan menyesuaikan rancangan; ini kesediaan, bukan kelajuan belajar yang diukur.'):T(locale,'Use a short, reversible trial before committing; the answers do not predict learning speed.','先做短期可逆体验；回答不能预测学习速度。','Cuba percubaan singkat yang boleh diubah sebelum komitmen; jawapan tidak meramal kelajuan belajar.')));
 return result;
}
function genericPaths(session,locale,contexts){
 return contexts.candidates.slice(0,2).map((c,index)=>({id:c.id,title:c.title,priority:index+1,why:claim(session,questionsFor(session.trackId).filter(q=>q.construct==='interest').map(q=>q.id),'exploratory-context',T(locale,'This is a role context within your selected direction; compare its actual tasks with the interests you reported. No personal ranking is available.','这是你所选方向内的职业背景；请把实际任务与你自述的兴趣比较。当前不提供个人排名。','Ini konteks peranan dalam arah pilihan; banding tugasnya dengan minat yang dilaporkan. Tiada kedudukan peribadi tersedia.'),'direction-only'),reportedExperience:null,tasks:c.tasks.map(t=>t.label),requirements:[...new Set(c.skills.map(s=>s.label))].slice(0,5),unmeasured:T(locale,'Role requirements are not measured personal skill gaps.','职业要求不是已测量的个人技能缺口。','Keperluan peranan bukan jurang kemahiran peribadi yang diukur.'),aiTask:T(locale,'Check a real task before deciding where AI assists; no automation probability is available.','需对照实际任务判断 AI 的辅助环节；没有自动化概率数据。','Semak tugas sebenar untuk menentukan bantuan AI; tiada kebarangkalian automasi tersedia.'),humanTask:T(locale,'Keep human responsibility for reviewing evidence and consequences.','保留人工核查证据与结果的责任。','Kekalkan tanggungjawab manusia menyemak bukti dan akibat.'),entry:'',action:{why:T(locale,'The questionnaire has not verified the relevant skill requirements.','问卷尚未验证相关技能要求。','Soal selidik belum mengesahkan keperluan kemahiran.'),task:c.tasks[0]?.label||c.description,check:T(locale,'Produce one work sample and have its key result checked against the source task.','制作一份工作样本，并对照来源任务核查关键结果。','Hasilkan satu sampel kerja dan semak keputusan utama dengan tugas sumber.'),evidence:T(locale,'A reviewed sample adds task-specific evidence.','经过复核的样本增加任务证据。','Sampel yang disemak menambah bukti tugas.'),evidenceQuestions:[]},source:{kind:c.sourceKind,id:c.sourceId,url:c.url,geography:c.geography||null,verifiedAt:c.verifiedAt||null},officialMapping:c.sourceKind==='official-context'}));
}
export function buildP0Analysis(session,contexts,locale='en'){
 const questions=questionsFor(session.trackId),answerIds=questions.map(q=>q.id);
 if(answerIds.some(id=>!Object.hasOwn(session.answers||{},id)))throw Error('INCOMPLETE_V3');
 const swResult=session.trackId==='SW'?buildSoftwareAnalysis(session,contexts,locale):null;
 const profile=[...profileFor(session,locale),...(swResult?.profileExtensions||[])],paths=swResult?.paths||genericPaths(session,locale,contexts);
 const independent=profile.find(c=>c.kind==='ai-verification');
 const conflicts=[];
 if(session.trackId==='SW'&&count(session,['SW05'])&&band(byId(session,'SW06'))==='not-endorsed')conflicts.push(claim(session,['SW05','SW06'],'evidence-gap',T(locale,'A built artifact is reported, but independent fault-finding is not; inspect both separately.','自述有可运行作品，但未认同独立排错经历；两者应分别核查。','Hasil berfungsi dilaporkan tetapi penyahpepijatan sendiri tidak; semak kedua-duanya berasingan.')));
 const commonAction={why:T(locale,'Reported AI-checking habits need an observed example before they can inform confidence.','自述 AI 核验习惯需要真实案例才能增加可信度。','Amalan semakan AI yang dilaporkan memerlukan contoh diperhatikan sebelum keyakinan meningkat.'),task:T(locale,'Keep a manual baseline and one AI-assisted attempt for your chosen route; record a rejected or corrected AI suggestion.','为所选路线保留一份人工基线与一份 AI 辅助尝试，并记录一条被拒绝或修正的 AI 建议。','Simpan garis dasar manual dan satu percubaan bantuan AI bagi laluan pilihan; rekod satu cadangan AI yang ditolak atau dibetulkan.'),check:T(locale,'Show the original input, AI output, independent source or test, and final correction.','展示原始输入、AI 输出、独立来源或测试，以及最终修正。','Tunjukkan input asal, output AI, sumber atau ujian bebas, dan pembetulan akhir.'),evidence:T(locale,'This can validate the reported checking process, not general AI proficiency.','这可以验证自述核验流程，但不证明通用 AI 熟练度。','Ini boleh mengesahkan proses semakan dilaporkan, bukan kemahiran AI umum.'),evidenceQuestions:independent?.evidence.map(x=>x.questionId)||[]};
 return {version:'v3-interpretation-2',locale,trackId:session.trackId,questionnaireVersion:session.version,profile,conflicts,paths,rankingStatus:swResult?.rankingStatus||'not-ranked',rankingRule:swResult?.rankingRule||null,occupationalDataStatus:swResult?.occupationalDataStatus||contexts.officialStatus,actions:[...paths.map(p=>({routeId:p.id,...p.action})),{routeId:'cross-cutting',...commonAction}],limits:{verifiedSkills:false,fitIsProbability:false,otherDirectionsRanked:false,reverseScored:false,officialMappedRoutes:paths.filter(p=>p.officialMapping).map(p=>p.id),thresholds:'1-3 disagreement, 4 neutral, 5-7 agreement; product interpretation, not validated psychometrics'},sourceQuestions:answerIds};
}
