// Independent evidence adapter. Questionnaire scales never enter this interface.
import {catalog} from '../explorer-engine.js';
import {escapeHTML as e} from '../explorer-views.js';
let snapshot=null,pending=null,status='not-loaded';
const clone=x=>structuredClone(x);
const required=['Career Catalog 24','Evidence & Sources','Malaysia Career Profiles','MASCO Occupation Mapping','Malaysia Job Demand','Malaysia Salary & Skills','Malaysia AI Transformation','Malaysia Regional Opportunities','Career Paths & What If','Career Relations','Occupation Tasks'];
function validate(d){
 if(!d?.version||!d.tables||!d.analysis_model?.skills)throw Error('SCHEMA');
 for(const n of required)if(!Array.isArray(d.tables[n]))throw Error('TABLE');
 const ids=d.tables['Career Catalog 24'].map(r=>r.occupation_id),sources=new Set(d.tables['Evidence & Sources'].map(s=>s.source_id)),records=new Set();
 if(ids.length!==24||new Set(ids).size!==24||catalog.careers.some(c=>!ids.includes(c.id)))throw Error('CATALOG');
 if(sources.size!==d.tables['Evidence & Sources'].length)throw Error('SOURCE_DUPLICATE');
 for(const [name,rows] of Object.entries(d.tables))for(const r of rows){
  if(r.record_id){const k=name+'\n'+r.record_id;if(records.has(k))throw Error('RECORD_DUPLICATE');records.add(k);}
  if(r.occupation_id&&r.occupation_id!=='ALL'&&!ids.includes(r.occupation_id))throw Error('OCCUPATION');
  if((r.source_ids||'').split(';').filter(Boolean).some(s=>!sources.has(s)))throw Error('SOURCE');
 }
 for(const key of ['requirements','scenarios']){
  const a=d.analysis_model[key];if(!Array.isArray(a)||new Set(a.map(r=>r.id)).size!==a.length)throw Error('RULES');
  for(const r of a){
   if(!ids.includes(r.occupation_id)||!r.record_refs?.length||r.record_refs.some(x=>!records.has(x.table+'\n'+x.record_id)))throw Error('REFERENCE');
   if(r.skill_id&&!Object.hasOwn(d.analysis_model.skills,r.skill_id))throw Error('SKILL');
   if(key==='scenarios'&&(!ids.includes(r.target_occupation_id)||!r.all_of?.length||r.all_of.some(p=>!['skills','projects','conditions'].includes(p.field))))throw Error('PREDICATE');
  }
 }
}
export function installMalaysiaSnapshot(d){
 try{validate(d);snapshot=clone(d);status='available';return true;}
 catch{snapshot=null;status='invalid-data';return false;}
}
export async function loadMalaysiaIntelligence(fetcher=globalThis.fetch){
 if(pending)return pending;
 status='loading';pending=(async()=>{
  try{const r=await fetcher(new URL('../../data/malaysia_intelligence/current.json',import.meta.url),{signal:AbortSignal.timeout(6000),cache:'no-cache'});
   if(!r.ok)throw Error('HTTP');return installMalaysiaSnapshot(await r.json());
  }catch{snapshot=null;status='unavailable';return false;}
 })().finally(()=>{pending=null;});return pending;
}
function check(v){
 if(!v||typeof v!=='object'||Array.isArray(v))throw Error('EXPLICIT_SKILL_STATEMENTS_REQUIRED');
 for(const [field,items] of Object.entries(v)){
  if(!['skills','projects','conditions'].includes(field)||!items||typeof items!=='object'||Array.isArray(items)||Object.values(items).some(x=>typeof x!=='boolean'))throw Error('EXPLICIT_SKILL_STATEMENTS_REQUIRED');
  if(field==='skills'&&Object.keys(items).some(k=>!Object.hasOwn(snapshot.analysis_model.skills,k)))throw Error('UNKNOWN_SKILL');
 }
}
function evidence(refs){
 const records=refs.map(x=>effective(x.table,snapshot.tables[x.table].find(r=>r.record_id===x.record_id)));
 const ids=new Set(records.flatMap(r=>(r.source_ids||'').split(';').filter(Boolean)));
 return {records,sources:snapshot.tables['Evidence & Sources'].filter(s=>ids.has(s.source_id)).map(clone)};
}
function effective(table,row){
 const override=snapshot.record_overrides?.[table+'#'+row.record_id];
 return override?{...clone(row),original_evidence_type:row.evidence_type,...clone(override)}:clone(row);
}
export function analyseMalaysiaCareer(id,profile={},assumptions={}){
 if(!snapshot)return {occupation_id:id,status,market:[],tasks:[],scenarios:[],skill_gaps:[],personal_fit:'not_assessed'};
 const occupation=snapshot.tables['Career Catalog 24'].find(c=>c.occupation_id===id);if(!occupation)throw Error('UNKNOWN_OCCUPATION');
 check(profile);check(assumptions);
 const rows=n=>snapshot.tables[n].filter(r=>r.occupation_id===id).map(r=>effective(n,r));
 const requirements=snapshot.analysis_model.requirements.filter(r=>r.occupation_id===id).map(clone);
 const state=(f,k)=>Object.hasOwn(assumptions[f]||{},k)?{value:assumptions[f][k],basis:'hypothetical'}:Object.hasOwn(profile[f]||{},k)?{value:profile[f][k],basis:'self_reported'}:{value:null,basis:'not_reported'};
 const skill_gaps=requirements.map(r=>{const s=state('skills',r.skill_id);return {...r,state:s.value===null?'unknown':s.value?'reported_met':'reported_gap',basis:s.basis,verified_ability:false};});
 const scenarios=snapshot.analysis_model.scenarios.filter(r=>r.occupation_id===id).map(rule=>{
  const evaluated=rule.all_of.map(p=>({...p,...state(p.field,p.key)}));
  return {...clone(rule),evaluated,status:evaluated.some(p=>p.value===false)?'unmet':evaluated.some(p=>p.value===null)?'unknown':'conditional',
   evidence:evidence(rule.record_refs),success_probability:null,
   target_requirements_to_verify:snapshot.analysis_model.requirements.filter(r=>r.occupation_id===rule.target_occupation_id&&state('skills',r.skill_id).value!==true).map(clone)};
 });
 return {status:'available',research_status:snapshot.stage,snapshot:snapshot.version,occupation:clone(occupation),occupation_id:id,
  profiles:rows('Malaysia Career Profiles'),mapping:rows('MASCO Occupation Mapping'),market:rows('Malaysia Job Demand'),salary_and_entry:rows('Malaysia Salary & Skills'),
  regions:rows('Malaysia Regional Opportunities'),tasks:rows('Occupation Tasks'),ai_tasks:rows('Malaysia AI Transformation'),paths:rows('Career Paths & What If'),relations:rows('Career Relations'),
  requirements,skill_gaps,scenarios,assumptions:clone(assumptions),
  next_actions:skill_gaps.filter(r=>r.state!=='reported_met').map(r=>({skill_id:r.skill_id,action:r.state==='unknown'?'request_practice_evidence':'practice',suggestion:r.practice,record_refs:r.record_refs})),
  personal_fit:'not_assessed',outlook_score:null,ai_exposure_score:null,eligibility:'not_determined'};
}
export function malaysiaReport(ids=[],profile={},assumptions={}){
 if(!snapshot)return {status,careers:[],allCareers:[],sources:[]};
 const allCareers=snapshot.tables['Career Catalog 24'].map(c=>analyseMalaysiaCareer(c.occupation_id,profile,assumptions));
 return {status,version:snapshot.version,coverage:clone(snapshot.analysis_model.research_coverage),careers:allCareers.filter(c=>ids.includes(c.occupation_id)),allCareers,
  sources:clone(snapshot.tables['Evidence & Sources']),selection_basis:'explicit direction links / complete original catalog, not personal ranking'};
}
export function renderMalaysiaContext(context,locale='en'){
 const L=(en,zh,ms)=>({en,'zh-CN':zh,ms})[locale]||en;
 const title=L('Malaysia career intelligence','马来西亚职业情报','Perisikan kerjaya Malaysia');
 if(context.status!=='available')return `<details class="ex-detail" data-malaysia-context><summary>${title}</summary><p>${L('Local evidence temporarily unavailable; the assessment remains available. Missing values are not zero.','本地证据暂时不可用，原有测评仍可使用；缺失不当作零。','Bukti tempatan tidak tersedia buat sementara; penilaian sedia ada kekal tersedia. Nilai hilang bukan sifar.')}</p></details>`;
 const ss=new Map(context.sources.map(s=>[s.source_id,s]));
 const cite=r=>`<small>${e(r.evidence_type)} · ${e(r.last_verified)} · ${(r.source_ids||'').split(';').filter(id=>ss.has(id)).map(id=>ss.get(id).source_url?.startsWith('https://')?`<a href="${e(ss.get(id).source_url)}" target="_blank" rel="noopener noreferrer">${e(id)}</a>`:e(id)).join(' · ')}</small>`;
 const row=r=>`<article><h4>${e(r.topic)}</h4><p lang="zh-CN">${e(r.finding_zh)}</p>${r.human_responsibility?`<p lang="zh-CN">${e(r.human_responsibility)}</p>`:''}${cite(r)}<br><small>${e(r.data_period)} · ${e(r.country_region)}</small><p lang="zh-CN">${e(r.correction_note||r.limitations)}</p></article>`;
 const assumption=(p,rule)=>{
  const label=p.field==='conditions'?L('Authorised data and professional review','授权数据与专业复核','Data dibenarkan dan semakan profesional'):
   p.field==='projects'?rule.practice:(snapshot.analysis_model.skills[p.key]?.label_zh||p.key);
  const selected=p.basis==='hypothetical'?String(p.value):'unknown';
  return `<label>${e(label)}<select data-malaysia-assumption="${e(p.field)}" data-malaysia-key="${e(p.key)}">
   <option value="unknown" ${selected==='unknown'?'selected':''}>${L('Keep current evidence','保持当前证据','Kekalkan bukti semasa')}</option>
   <option value="true" ${selected==='true'?'selected':''}>${L('Assume this condition is met','假设满足此条件','Andaikan syarat dipenuhi')}</option>
   <option value="false" ${selected==='false'?'selected':''}>${L('Assume this condition is not met','假设不满足此条件','Andaikan syarat tidak dipenuhi')}</option>
  </select></label>`;
 };
 const career=c=>`<details class="ex-detail" data-malaysia-career="${e(c.occupation_id)}"><summary>${e(c.occupation[locale==='zh-CN'?'title_zh':locale==='ms'?'title_ms':'title_en'])}</summary>${c.profiles.map(row).join('')}
  <details><summary>${L('Classification and entry','分类与入门','Klasifikasi dan kemasukan')}</summary>${c.mapping.map(row).join('')}${c.salary_and_entry.map(row).join('')}${c.regions.map(row).join('')}</details>
  <details><summary>${L('Tasks and AI changes','任务与AI变化','Tugas dan perubahan AI')}</summary>${c.ai_tasks.map(row).join('')}</details>
  <details><summary>${L('Skills, paths and What If','技能、路径与情景','Kemahiran, laluan dan What If')}</summary><ul>${c.skill_gaps.map(r=>`<li>${e(r.skill_id)} · ${e(r.state)} · ${r.basis==='hypothetical'?L('Hypothetical only','仅为假设','Hipotesis sahaja'):r.state==='unknown'?L('Unknown','未知','Tidak diketahui'):L('Self-reported, unverified','自述，未经验证','Dilaporkan sendiri, belum disahkan')} · <span lang="zh-CN">${e(r.practice)}</span></li>`).join('')}</ul>${c.paths.filter(r=>r.scenario_type==='PATH').map(row).join('')}
   ${c.scenarios.map(r=>`<article><h4>What If ${e(r.id)}</h4><p lang="zh-CN">${e(r.explanation)}</p><p>${L('Temporary assumptions only; original answers and market evidence stay unchanged.','仅调整临时假设；原答案与市场证据不变。','Andaian sementara sahaja; jawapan asal dan bukti pasaran kekal.')}</p><div class="sim-controls">${r.evaluated.map(p=>assumption(p,r)).join('')}</div><p data-malaysia-rule="${e(r.id)}">${e(r.status)} · ${r.evaluated.map(p=>`${e(p.field)}.${e(p.key)}: ${p.value===null?'unknown':e(String(p.value))} (${e(p.basis)})`).join(' · ')}</p><p lang="zh-CN">${e(r.remaining_requirements||'其余技能、资格和经验仍须核实，不推断就业成功。')}</p>${r.evidence.records.map(cite).join('<br>')}</article>`).join('')}
  </details></details>`;
 const selected=new Set(context.careers.map(c=>c.occupation_id));
 return `<section data-malaysia-context><h2>${title}</h2><p>${e(context.version)} · Malaysia · 24</p><p>${L('Chinese research notes with linked Malaysian sources. Market outlook, AI changes and personal fit are separate. Unreported skills remain unknown; questionnaire answers are not converted into skills.','中文研究记录附马来西亚来源。市场前景、AI变化与个人匹配分别处理；未自述技能保持未知，不将问卷程度换算为能力。','Nota penyelidikan bahasa Cina dengan sumber Malaysia. Prospek pasaran, perubahan AI dan kesesuaian peribadi diasingkan. Kemahiran tidak dilaporkan kekal tidak diketahui; jawapan soal selidik tidak ditukar menjadi kemahiran.')}</p>${context.careers.map(career).join('')}<details><summary>${L('Explore the other original careers','探索其他原始职业','Terokai kerjaya asal lain')}</summary>${context.allCareers.filter(c=>!selected.has(c.occupation_id)).map(career).join('')}</details></section>`;
}
