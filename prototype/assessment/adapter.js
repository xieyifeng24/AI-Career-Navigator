import {buildAssessment,simulate,pick} from './engine.js';
export function attachAssessment(model,state,locale,assumptions={},saved=null){
 const a=saved||buildAssessment(state,{generatedAt:state.reportGeneratedAt||null});model.assessment=a;model.scenario=simulate(a,assumptions);
 const why=r=>a.tied?pick(['Evidence does not establish a clear preference between these routes.','证据不能确立两条路线间的明确优先顺序。','Bukti belum menentukan keutamaan jelas antara laluan.'],locale):pick(['Explore this task association and verify it with a work sample.','探索任务偏好关联，并通过作品验证。','Terokai perkaitan tugas ini dan sahkan dengan sampel kerja.'],locale);
 const claim=text=>({text,source_ids:[]});
 model.report.ranking=a.roles.map(r=>({id:r.id,title:pick(r.title,locale),summary:pick(r.project,locale),score:null,source_id:r.sourceId,facts:r.source?[r.source]:[],tasks:r.tasks.map(t=>t.label),skills:r.requirements.map(s=>s.label),matched_skills:[],gaps:r.requirements.map(s=>s.label),growth:'',period:null}));
 model.report.analysis.paths=a.roles.map((r,i)=>({kind:String.fromCharCode(65+i),role_id:r.id,why:claim(why(r)),transferable:[],gaps:r.requirements.map(s=>({skill:s.label,advice:claim(pick(['Not assessed; verify with a work sample.','尚未评估，需通过作品核验。','Belum dinilai; semak melalui sampel kerja.'],locale))})),next_step:claim(pick(r.project,locale)),challenge:claim(pick(a.limits,locale)),sdg:null,tools:[],weeks:[]}));
 model.report.analysis.summary=claim(a.insights.map(i=>pick(i.copy,locale)).join(' '));
 for(const r of a.roles)if(r.source)model.report.evidence.sources[r.sourceId]={title:r.source.title,url:r.source.url,geography:r.source.geography,date:r.source.published_at,verified_at:r.source.verified_at};
 return model;
}

// Production report entry: does not run the superseded recommendation/score engines.
import {reportFor} from '../combined/model.js';
import {buildImpact,buildProvenance} from '../combined/report-model.js';
import {analyzeCurrentAnswers,careerContexts} from '../combined/current-analysis.js';
import {currentKnowledge} from './knowledge.js';
export function buildNavigatorReport(state,locale,assumptions={},saved=null){
 const {base,selfReport}=reportFor(state);
 const contexts=careerContexts(selfReport.trackId,currentKnowledge(),locale);
 const report={mode:'rules',profile:{background:pick(base.profile?.startingPoint?['Selected career direction','所选职业方向','Arah kerjaya dipilih']:['Your starting point','你的起点','Titik permulaan anda'],locale),experience:'',skills:''},analysis:{paths:[],tasks:[]},evidence:{sources:{}},ranking:[]};
 const model={report,companions:base,startingPoint:state.startingPoint?.completed?state.startingPoint:null,currentAnswers:selfReport,background:state.profile,notes:state.startingPoint?.completed?state.startingPoint.story:state.notes||'',impact:buildImpact(selfReport.trackId),provenance:buildProvenance(contexts),signals:analyzeCurrentAnswers(selfReport,locale),contexts};
 return attachAssessment(model,state,locale,assumptions,saved);
}
