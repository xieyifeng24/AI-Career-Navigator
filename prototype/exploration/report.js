import {analyzeExploration,simulateExploration,directionName} from './engine.js';
import projects from './projects.json' with {type:'json'};
const T=(en,zh,ms)=>({en,'zh-CN':zh,ms});
export const resources={
 mdn:{title:'MDN · Learn web development',url:'https://developer.mozilla.org/en-US/docs/Learn_web_development'},
 sheets:{title:'Google Sheets training and help',url:'https://support.google.com/a/users/answer/9282959'},
 'learn-ai':{title:'Microsoft Learn · AI learning hub',url:'https://learn.microsoft.com/en-us/ai/'},
 who:{title:'WHO · Health topics',url:'https://www.who.int/health-topics'},
 unesco:{title:'UNESCO · Education',url:'https://www.unesco.org/en/education'},
 sdg4:{title:'UN SDG 4 · skills',url:'https://sdgs.un.org/goals/goal4'},
 sdg8:{title:'UN SDG 8 · decent work',url:'https://sdgs.un.org/goals/goal8'}
};
export function buildExplorationReport(profile,locale,assumptions,knowledge){
 const L=value=>value[locale]||value.en;
 const exploration=analyzeExploration(profile.exploration),simulation=simulateExploration(exploration,assumptions);
 const direction=directionName(exploration.direction,locale),project=projects[exploration.direction];
 const sourceIds=(exploration.relatedRoles||[]).flatMap(id=>knowledge.links[id]||[]);
 const facts=knowledge.records.filter(r=>sourceIds.includes(r.source+':'+r.id));
 const sources=structuredClone(resources);
 for(const fact of facts)sources[fact.source+':'+fact.id]={title:fact.title,url:fact.url,kind:'official occupational context',date:fact.published_at,geography:fact.geography,verified_at:fact.verified_at,version:fact.version,text:fact.description};
 const caveat=L(T('Exploration from your selections, not an aptitude test, verified skill or employment prediction. Unassessed directions are not ranked.','根据选择整理探索线索，并非能力考试、技能验证或就业预测；不对未回答的方向排名。','Penerokaan berdasarkan pilihan, bukan ujian kebolehan, kemahiran disahkan atau ramalan pekerjaan. Arah yang belum dijawab tidak diberi kedudukan.'));
 const verify=L(T('Keep your inputs, decision steps, one error you found and the correction. Compare with reliable references; peer review is optional and must be identified as such.','保留输入、决策步骤、发现的一处错误及修正，对照可靠资料自查；可选同伴复核需单独注明。','Simpan input, langkah keputusan, satu ralat dan pembetulannya. Banding dengan rujukan boleh dipercayai; semakan rakan adalah pilihan dan perlu dikenal pasti.'));
 const evidenceBoundary=L(T('Experience is self-reported. Missing experience or uncertainty is not evidence of low potential. AI scenario strategy is a selected response, not observed performance.','经历来自自述；没有经验或不确定不代表缺乏潜力。AI 情境策略仅为所选回答，并非观察到的操作表现。','Pengalaman ialah laporan kendiri. Kekurangan pengalaman atau ketidakpastian bukan bukti potensi rendah. Strategi AI ialah jawapan dipilih, bukan prestasi diperhatikan.'));
 const readiness=L(T('Qualification, licensing, prerequisites, costs and local opportunities still need checking. These exercises do not establish professional eligibility.','资格、执照、先修要求、费用与当地机会仍需核实；体验任务不证明职业准入资格。','Kelayakan, lesen, prasyarat, kos dan peluang tempatan masih perlu disemak. Latihan ini tidak membuktikan kelayakan profesional.'));
 const claim=(text,ids=[])=>({text,source_ids:ids});
 const sdg={target:'4.4',rationale:L(T('Editorial proposal: deliberate practice may support employment-related learning. This is not measured SDG impact.','团队建议：有意识的实践可支持就业相关学习，并非已测量的 SDG 成效。','Cadangan editorial: latihan terancang mungkin menyokong pembelajaran pekerjaan, bukan impak SDG yang diukur.')),measure:verify};
 const scaffold=L({guided:T('Start with a worked example and reproduce one small part before changing it.','先观察完整示例，再跟随重做一个小步骤。','Mulakan dengan contoh lengkap dan ulang satu bahagian kecil sebelum mengubahnya.'),adapt:T('Adapt a template and write down why you changed one part.','改动现成模板的一处，并说明改动依据。','Ubah satu bahagian templat dan catat alasannya.'),independent:T('Define your own checklist, make a sample, then revise it after reviewing errors.','自行制定检查表，完成样本后根据错误复盘修改。','Tentukan senarai semak, hasilkan sampel, kemudian semak semula berdasarkan ralat.'),explore:T('Observe one example first; decide whether you want to try a small part. No experience level is assumed.','先观察一个示例，再决定是否试做小部分；不假定已有经历。','Perhatikan satu contoh dahulu; tentukan sama ada mahu mencuba bahagian kecil. Tiada tahap pengalaman diandaikan.')}[simulation.scaffold]);
 const stageName=stage=>stage.score===null?L(T('Not enough information','暂缺信息','Maklumat tidak mencukupi')):`${stage.score}/${stage.facet==='ai_judgement'?3:4}`;
 const interestTitle=L(T('Interest-led exercise','从兴趣出发的体验','Latihan berpandukan minat'));
 const taskTitle=L(T('Task-led exercise','从任务出发的体验','Latihan berpandukan tugas'));
 const foci=[exploration.preferences.interest,exploration.preferences.task];
 const pathNames=[interestTitle,taskTitle];
 const goalAdvice=L({
  discover:T('Observe two examples before choosing a small part to try.','先观察两个示例，再选择一个小环节尝试。','Perhatikan dua contoh sebelum memilih bahagian kecil untuk dicuba.'),
  compare:T('Compare the two exercises within your selected direction; write down which daily tasks you would like to repeat.','比较所选方向内的两条体验路线，记录愿意反复从事哪些日常任务。','Bandingkan dua latihan dalam arah dipilih; catat tugas harian yang ingin diulang.'),
  next_step:T('Complete one small artifact and use it to choose your next course, project or internship question.','完成一份小样，用它明确下一项课程、项目或实习中要核实的问题。','Siapkan satu hasil kecil dan gunakannya untuk memilih soalan kursus, projek atau latihan industri seterusnya.'),
  ai_transition:T('Compare a manual first draft with one optional AI-assisted step; keep a record of what required human judgement.','比较手动初稿与一个可选 AI 辅助步骤，记录哪些环节仍需人工判断。','Bandingkan draf manual dengan satu langkah bantuan AI pilihan; catat perkara yang memerlukan pertimbangan manusia.'),
  unknown:T('Use a brief example to decide what you would like this exploration to clarify.','先用一个简短示例，明确希望本次探索解决什么问题。','Gunakan contoh ringkas untuk menentukan perkara yang ingin dijelaskan melalui penerokaan ini.')
 }[exploration.preferences.goal.tag||'unknown']);
 const steps=[
  {action:goalAdvice+' '+scaffold,hours:simulation.effortHours*.2,deliverable:L(T('A source note and one question to investigate','一份来源笔记和一个待探索问题','Nota sumber dan satu soalan untuk diterokai'))},
  {action:L(project.task),hours:simulation.effortHours*.6,deliverable:L(project.title)},
  {action:verify,hours:simulation.effortHours*.2,deliverable:L(T('An error log and a decision to continue, adapt or try another task','错误记录及继续、调整或换任务的决定','Log ralat serta keputusan meneruskan, mengubah atau mencuba tugas lain'))}
 ];
 // Same-direction experiments, not fabricated alternative occupations or suitability scores.
 const ranking=foci.map((focus,index)=>({id:`explore:${exploration.direction}:${index}`,title:`${direction} · ${pathNames[index]}`,summary:L(project.task),score:null,coverage:null,terms:[],source_id:facts[0]?facts[0].source+':'+facts[0].id:'',url:facts[0]?.url||'',facts,tasks:[L(project.task)],skills:[],matched_skills:[],gaps:[L(T('Practice and review a work sample','实践并复核工作样本','Latih dan semak sampel kerja'))],growth:'',period:null,updated:knowledge.verified_at,focus}));
 const paths=ranking.map((role,index)=>({kind:index===0?'A':'B',role_id:role.id,focus:foci[index],
  why:claim(foci[index].unknown?L(T('Your preference is not yet known. Use this small exercise to explore, without treating missing evidence as a negative judgement.','这项偏好暂不明确，可通过小体验探索；缺失信息不作为负面判断。','Keutamaan belum diketahui. Gunakan latihan kecil untuk meneroka tanpa menganggap maklumat hilang sebagai penilaian negatif.')):L(T('This route follows the task preference you selected. It is an exploration starting point, not a fit score.','这条体验路线对应你选择的任务偏好，只作为探索起点，不是适合度结论。','Laluan ini mengikuti keutamaan tugas yang dipilih. Ia titik mula penerokaan, bukan skor kesesuaian.'))),
  transferable:exploration.stages.experience.score>0?[{skill:L(T('Reported participation experience','自述参与经历','Pengalaman penyertaan dilaporkan')),advice:claim(evidenceBoundary),sdg}]:[],
  gaps:[{skill:L(T('Build and review one work sample','完成并复核一个工作样本','Hasilkan dan semak satu sampel kerja')),advice:claim(verify),sdg}],
  challenge:claim(readiness),next_step:claim(`${scaffold} ${L(project.task)}`),sdg,
  tools:[{resource_id:project.resource,purpose:claim(L(T('Optional reference for the exercise; do the task manually first if AI is unfamiliar. Check access and terms before using a tool.','可选练习参考；不熟悉 AI 时先手动完成。使用工具前核实访问条件及条款。','Rujukan latihan pilihan; lakukan secara manual dahulu jika AI belum biasa. Semak akses dan syarat sebelum menggunakan alat.')),[project.resource])}],
  // Reuse existing scheduling contract: each row is an effort chunk, not a credential milestone.
  weeks:steps.map((step,i)=>({week:i+1,hours:step.hours,action:claim(step.action),deliverable:step.deliverable,validation:verify,resource_id:project.resource})),day30_review:claim(verify)}));
 const p={...structuredClone(profile),background:direction,experience:L(T('Reported experience stage','自述经历阶段','Tahap pengalaman dilaporkan'))+' '+stageName(exploration.stages.experience),skills:'',tasks:L(project.task),goal:L(T('Explore the selected direction with a small exercise','通过小体验探索所选方向','Terokai arah dipilih melalui latihan kecil')),aiUse:stageName(exploration.stages.domainAI),hours:simulation.weeklyHours,constraints:exploration.time.unknown?L(T('Time budget not supplied; schedule is illustrative.','未提供时间预算；排期仅为示例。','Bajet masa tidak diberikan; jadual ialah contoh.')):L(T('Use the selected time band; the schedule uses a stated planning assumption within it.','遵循所选时间区间；排期使用区间内明确标注的假设值。','Gunakan julat masa dipilih; jadual menggunakan andaian perancangan yang dinyatakan dalam julat itu.'))};
 delete p.answers;delete p.assessment;delete p.education;
 return {mode:'rules',questionnaireVersion:'2.0.0',goalAdvice,language:locale,profile:p,weeklyHours:simulation.weeklyHours,knowledge:structuredClone(knowledge),exploration,simulation,assumptions:structuredClone(assumptions),project:structuredClone(project),ranking,
  evidence:{sources,roles:[],research:[],warnings:[],version:knowledge.version,retrieved_at:knowledge.verified_at,geography:L(T('US/EU occupational context where mapped; no Malaysian market trends','仅在有映射时引用美国／欧盟背景；无马来西亚市场趋势','Konteks pekerjaan AS/EU jika dipetakan; tiada trend pasaran Malaysia')),attribution:knowledge.attribution.join(' ')},
  analysis:{summary:claim(caveat),paths,
   capabilities:[['independent',exploration.stages.experience],['collaboration',exploration.stages.domainAI],['extended',exploration.stages.verification]].map(([lens,stage])=>({lens,assessment:claim(stageName(stage)),evidence_quote:evidenceBoundary,verify_next:claim(verify)})),
   tasks:[{input_quote:L(project.title),category:'human',assessment:claim(L(T('AI may help draft or organize a practice sample. Whether it is useful must be checked in the actual task; no automation probability is claimed.','AI 可辅助起草或整理练习样本，是否有用需要在任务中核验；不预测自动化概率。','AI mungkin membantu draf atau menyusun sampel latihan. Kegunaan perlu disemak dalam tugas sebenar; tiada kebarangkalian automasi.'))),human_check:claim(verify)}],radar:[],scenarios:[],uncertainties:[caveat,evidenceBoundary]},
  inference:{model:L(T('Local V2 exploration rules · no AI request','本地 V2 探索规则 · 未请求 AI','Peraturan penerokaan V2 tempatan · tiada permintaan AI'))},generated_at:new Date().toISOString(),report_id:'EXPLORE-2.0.0',limitations:[readiness]};
}
