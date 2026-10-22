import bundledKnowledge from '../../data/knowledge/current.json' with {type:'json'};
import database from './careers.json' with {type:'json'};
import optionCatalog from '../questionnaire.json' with {type:'json'};
import {questions,rating,tr} from './questions.js';
export const VERSION='rules-1.0';
export const careers=database;
let activeKnowledge=bundledKnowledge;
export function installKnowledge(snapshot){
 if(snapshot?.schema_version!==1||!Array.isArray(snapshot.records)||!snapshot.links||typeof snapshot.version!=='string')throw Error('Invalid knowledge snapshot');
 const keys=new Set();
 for(const r of snapshot.records){
  const host=new URL(r.url).hostname;
  if(!({onet:'US',esco:'EU',myfuturejobs:'MY'}[r.source]===r.geography)||!r.description||!r.title||!r.verified_at||!r.version||!['http:','https:'].includes(new URL(r.url).protocol)||!['onetonline.org','onetcenter.org','europa.eu','myfuturejobs.gov.my','perkeso.gov.my'].some(h=>host===h||host.endsWith('.'+h)))throw Error('Invalid career provenance');
  const key=r.source+':'+r.id;if(keys.has(key))throw Error('Duplicate career');keys.add(key);
 }
 for(const role of database.roles)if(!Array.isArray(snapshot.links[role.id])||snapshot.links[role.id].some(k=>!keys.has(k)))throw Error('Invalid career links');
 activeKnowledge=structuredClone(snapshot);
}
export async function refreshKnowledge(fetcher=globalThis.fetch){
 try{const response=await fetcher('/api/knowledge/current',{signal:AbortSignal.timeout(4000)});if(!response.ok)return false;const data=await response.json();installKnowledge(data.snapshot);return true;}catch{return false;}
}
const educationLevels={secondary:1,diploma:2,degree:3};
const weights={ability:60,interest:25,preference:10,education:5};
export function scoreProfile(profile,assumptions={}) {
 const answers={...(profile.assessment||{}),...(assumptions.ratings||{})};
 const education=assumptions.education??profile.education??'unknown';
 const rows=database.roles.map(role=>{
  const terms=[];
  for(const [group,kind,targetKey] of [['ability','ability','requirements'],['interest','interest','interests'],['preference','preference','preferences']]){
   const targets=role.editorial[targetKey],count=Object.keys(targets).length;
   for(const [id,target] of Object.entries(targets)){
    const value=rating(answers[id]);
    const fit=value===null?null:group==='ability'?Math.min(value/target,1)*100:100-Math.abs(value-target)*25;
    terms.push({id,group,value,target,weight:weights[group]/count,fit});
   }
  }
  const level=educationLevels[education]??null;
  terms.push({id:'education',group:'education',value:level,target:role.editorial.education,weight:weights.education,fit:level===null?null:Math.min(level/role.editorial.education,1)*100});
  const known=terms.filter(x=>x.fit!==null),denominator=known.reduce((n,x)=>n+x.weight,0);
  return {id:role.id,score:denominator>=50?Math.round(known.reduce((n,x)=>n+x.fit*x.weight,0)/denominator):null,coverage:Math.round(denominator),terms};
 });
 return {version:VERSION,answers,education,dimensions:Object.fromEntries(questions.map(q=>[q.id,rating(answers[q.id])===null?null:(rating(answers[q.id])-1)*25])),ranking:rows.sort((a,b)=>(b.score??-1)-(a.score??-1)||a.id.localeCompare(b.id))};
}
const T=(en,zh,ms)=>({en,'zh-CN':zh,ms});
const common={
 unknown:T('Not enough information; explore with a small practice task.','信息不足；先通过小型实践探索。','Maklumat tidak mencukupi; terokai melalui tugas latihan kecil.'),
 caveat:T('Illustrative rule-based exploration, not a scientifically validated assessment, hiring prediction or proof of skill.','规则探索工具，并非经科学验证的测评、录用预测或技能证明。','Alat penerokaan berasaskan peraturan, bukan penilaian saintifik, ramalan pengambilan kerja atau bukti kemahiran.'),
 verify:T('Compare a work sample with a checklist and ask a peer to review errors, reasoning and clarity.','用检查表核验工作样本，请同伴复核错误、推理与表达。','Banding hasil kerja dengan senarai semak dan minta rakan menyemak ralat, penaakulan dan kejelasan.'),
 limitation:T('Five US reference occupations only. Summaries are dated offline material, not live demand, salary data or Malaysian forecasts.','仅包含五项美国参考职业。资料是有日期的离线内容，不是实时需求、薪资数据或马来西亚预测。','Hanya lima pekerjaan rujukan AS. Ringkasan luar talian bertarikh, bukan permintaan langsung, data gaji atau ramalan Malaysia.'),
 reality:T('Check local job requirements, qualification routes, accessibility, costs and available time before deciding.','决定前核实当地岗位要求、资格路径、可访问性、费用和可用时间。','Semak syarat pekerjaan tempatan, laluan kelayakan, akses, kos dan masa sebelum membuat keputusan.'),
};
export function buildLocalReport(profile,locale='en',assumptions={},knowledge=activeKnowledge) {
 const L=x=>tr(x,locale), scored=scoreProfile(profile,assumptions),sources={};
 const resources={
 'learn-ai':{title:'Microsoft Learn: AI learning hub',url:'https://learn.microsoft.com/en-us/ai/',tool:'Microsoft Copilot'},
 'learn-data':{title:'Microsoft Learn: Power BI learning',url:'https://learn.microsoft.com/en-us/training/powerplatform/power-bi',tool:'Power BI'},
 'learn-python':{title:'Python official tutorial',url:'https://docs.python.org/3/tutorial/',tool:'Python'},
 'learn-sheets':{title:'Google Sheets training and help',url:'https://support.google.com/a/users/answer/9282959',tool:'Google Sheets'},
 sdg4:{title:'UN SDG 4 · skills',url:'https://sdgs.un.org/goals/goal4'},sdg8:{title:'UN SDG 8 · decent work',url:'https://sdgs.un.org/goals/goal8'}};
 Object.assign(sources,resources);
 const skillName=id=>L(questions.find(q=>q.id===id)?.title||id);
 const claim=(text,id)=>({text,source_ids:[id]});
 const sdg={target:'4.4',rationale:L(T('System interpretation: practicing employment-related skills may support SDG 4.4.','系统推断：练习就业相关技能可能支持 SDG 4.4。','Tafsiran sistem: latihan kemahiran pekerjaan mungkin menyokong SDG 4.4.')),measure:L(common.verify)};
 const ranking=scored.ranking.map(row=>{
  const original=database.roles.find(r=>r.id===row.id),source_id='onet:'+original.id;
  const facts=(knowledge.links[original.id]||[]).map(key=>knowledge.records.find(r=>r.source+':'+r.id===key)).filter(Boolean);
  const official=facts.find(r=>r.source==='onet');
  const role=official?{...original,summary:{...original.summary,en:official.description}}:original;
  for(const fact of facts)sources[fact.source+':'+fact.id]={title:fact.title,url:fact.url,kind:'official',date:fact.published_at||null,text:fact.description,geography:fact.geography,verified_at:fact.verified_at,version:fact.version};
  if(!sources[source_id])sources[source_id]={title:L(role.title),url:role.source.url,kind:'editorial paraphrase',date:null,text:L(role.summary)};
  const strengths=row.terms.filter(t=>t.group==='ability'&&t.value!==null&&t.value>=t.target),gaps=row.terms.filter(t=>t.group==='ability'&&(t.value===null||t.value<t.target));
  return {...row,facts,title:L(role.title),summary:L(role.summary),source_id,skills:Object.keys(role.editorial.requirements).map(skillName),tasks:official?.tasks.map(x=>x.label)||[L(role.summary)],matched_skills:strengths.map(t=>skillName(t.id)),gaps:gaps.map(t=>skillName(t.id)),overlap_terms:[],growth:L(T('Offline occupational context · no demand forecast','离线职业背景 · 不预测需求','Konteks pekerjaan luar talian · tiada ramalan permintaan')),period:official?.published_at||null,updated:official?.verified_at||database.reviewedAt,url:role.source.url,components:{skill_overlap:0,task_context:0,published_trend:0},sdg};
 });
 const roleAId={marketing:'13-1161.00',admin:'43-6014.00',business:'13-1111.00',software:'15-2051.00'}[profile.answers?.background];
 const a=ranking.find(r=>r.id===roleAId)||ranking[0],b=ranking.find(r=>r.id!==a.id);
 const path=(row,kind)=>{
  const role=database.roles.find(r=>r.id===row.id),id=row.source_id;
  const advice=term=>({skill:skillName(term.id),advice:claim(term.value===null?L(common.unknown):`${skillName(term.id)}: ${term.value}/5 → ${L(T('editorial exploration target','编辑设定的探索目标','sasaran penerokaan editorial'))} ${term.target}/5.`,id),sdg});
  const strengths=row.terms.filter(t=>t.group==='ability'&&t.value!==null&&t.value>=t.target),gaps=row.terms.filter(t=>t.group==='ability'&&(t.value===null||t.value<t.target));
  const focus=gaps[0]?.id||strengths[0]?.id||'analysis';
  const instructions=[
   T('Read the official role profile. Choose one task, list assumptions and define a review checklist.','阅读官方职业资料，选择一项任务，列出假设并制定复核清单。','Baca profil pekerjaan rasmi. Pilih tugas, senaraikan andaian dan tentukan senarai semak.'),
   role.project,
   T('Review the work sample against the checklist. Record mistakes and revise one weak area.','用检查表审阅样本，记录错误并改进一个薄弱环节。','Semak sampel dengan senarai semak. Catat kesilapan dan baiki satu kelemahan.'),
   T('Compare the revised sample with the first version. Decide whether to continue or explore the other path.','对比修改前后的成果，决定继续此路线还是探索另一条路线。','Banding sampel yang disemak dengan versi awal. Putuskan sama ada meneruskan atau meneroka laluan lain.')];
  return {kind,role_id:row.id,why:claim(`${L(T('System interpretation','系统推断','Tafsiran sistem'))}: ${row.score===null?L(common.unknown):`${row.score}/100 · ${L(T('answered weight coverage','已回答权重覆盖率','liputan wajaran dijawab'))} ${row.coverage}%.`} ${row.summary}`,id),
   transferable:strengths.map(advice),gaps:gaps.map(advice),challenge:claim(L(common.reality),id),next_step:claim(`${skillName(focus)} · ${L(role.project)}`,id),sdg,
   tools:[{resource_id:role.resource,purpose:claim(L(T('Use official documentation to support this practice project; check free access and licensing.','使用官方文档辅助实践；请核实免费访问和许可条件。','Gunakan dokumentasi rasmi untuk projek latihan ini; semak akses percuma dan lesen.')),role.resource)}],
   weeks:instructions.map((item,i)=>({week:i+1,hours:Number(profile.hours)||3,action:claim(L(item),id),deliverable:L([T('Role/task note with a source and checklist','含来源与检查表的职业任务笔记','Nota tugas dengan sumber dan senarai semak'),T('A fictional work sample with documented decisions','记录决策的虚构工作样本','Sampel kerja rekaan dengan keputusan didokumenkan'),T('Error log and revised work sample','错误清单及改进后的样本','Log ralat dan sampel yang diperbaiki'),T('Comparison and next-step decision log','对比结果及下一步决策记录','Perbandingan dan log keputusan langkah seterusnya')][i]),validation:L(common.verify),resource_id:role.resource})),day30_review:claim(L(common.verify),id)};
 };
 const paths=[path(a,'A'),path(b,'B')];
 const caps=[['independent',['analysis','communication','planning','technical']],['collaboration',['aiCollaboration']],['extended',['research','people','creative']]].map(([lens,ids])=>({lens,assessment:claim(ids.map(id=>`${skillName(id)}: ${rating(scored.answers[id])??L(T('unknown','未知','tidak diketahui'))}/5`).join(' · '),'sdg4'),evidence_quote:L(T('Self-reported questionnaire levels; not independently verified.','问卷自述等级，未经独立验证。','Tahap soal selidik kendiri; belum disahkan secara bebas.')),verify_next:claim(L(common.verify),'sdg4')}));
 const tasks=(profile.answers?.tasks||[]).map(id=>({input_quote:(()=>{const row=optionCatalog.tasks.find(r=>r[0]===id);return row?L({en:row[1],'zh-CN':row[2],ms:row[3]}):id;})(),category:['write','data','code'].includes(id)?'assist':'human',assessment:claim(L(T('Editorial task hypothesis: drafting or sorting may be assisted by tools; quality and adoption depend on context. This is not an automation probability.','编辑任务假设：工具可能辅助起草或整理；质量和采用取决于情境，不代表自动化概率。','Hipotesis tugas editorial: alat boleh membantu draf atau penyusunan; kualiti dan penggunaan bergantung pada konteks. Bukan kebarangkalian automasi.')),a.source_id),human_check:claim(L(common.verify),a.source_id)}));
 const scenarios=[['moderate',T('Tools assist parts of the task while people review outputs.','工具辅助部分任务，人类复核产出。','Alat membantu sebahagian tugas sementara manusia menyemak hasil.')],['fast',T('More workflow steps use automation; human responsibility remains.','更多流程采用自动化，人类责任仍然存在。','Lebih banyak langkah menggunakan automasi; tanggungjawab manusia kekal.')]].map(([pace,text])=>({pace,assumption:L(text),implication:claim(L(T('Planning scenario only: practice verification, documentation and communication. No timing or adoption forecast is claimed.','仅为规划情景：练习核验、记录和沟通，不预测采用时间或程度。','Senario perancangan sahaja: latih pengesahan, dokumentasi dan komunikasi. Tiada ramalan masa atau penggunaan.')),'sdg4'),watch_for:claim(L(common.reality),'sdg8')}));
 return {knowledge:structuredClone(knowledge),mode:'rules',language:locale,profile:structuredClone(profile),weeklyHours:Number(profile.hours)||3,ruleScores:scored,assumptions:structuredClone(assumptions),ranking,evidence:{sources,roles:ranking,research:[],warnings:[],version:knowledge.version,retrieved_at:knowledge.verified_at,geography:L(T('US occupational context + EU skill classification; no Malaysian market data','美国职业背景及欧盟技能分类；无马来西亚市场数据','Konteks pekerjaan AS + pengelasan kemahiran EU; tiada data pasaran Malaysia')),attribution:knowledge.attribution.join(' \n')},analysis:{summary:claim(`${L(common.caveat)} ${L(T('Explore','探索','Terokai'))}: ${ranking.slice(0,3).map(r=>r.title).join(' · ')}.`,'sdg4'),capabilities:caps,tasks,paths,radar:paths.flatMap(p=>p.gaps.slice(0,2).map(x=>({skill:x.skill,direction:'uncertain',reasoning:x.advice,sdg}))),scenarios,uncertainties:[L(common.caveat),L(common.limitation)]},inference:{model:L(T('Local rules · no AI request','本地规则 · 未请求 AI','Peraturan tempatan · tiada permintaan AI'))},generated_at:new Date().toISOString(),report_id:'LOCAL-'+VERSION,limitations:[L(common.reality)]};
}
