// Page 4 — What if. Reschedules the same fixed practice sample under an
// explicit weekly budget. Capacity arithmetic only; no completion forecast.
import {renderScenario} from '../intelligence.js';
import {renderStartingFocus,contextualPreparation} from '../starting-point-analysis.js';
import {WHATIF_HORIZONS} from '../report-model.js';
import {language} from '../../i18n.js';
import {L,card,pageHeader,renderEvidenceScenario,renderProvenance} from './shared.js';
import {escapeHTML as e} from '../../explorer-views.js';

const num=n=>String(Math.round(Number(n)||0));
const hoursLabel=()=>L('h / week','小时 / 周','jam / minggu');
const minuteLabel=m=>`${num(m)} ${L('min','分钟','min')}`;

function renderHorizon(whatIf){
 const option=(v,label)=>`<option value="${v}" ${Number(whatIf.availableHours)===v?'selected':''}>${label}</option>`;
 const budget=`<label>${L('Weekly practice budget','每周练习时间','Bajet latihan mingguan')}<select data-v2-control="planHours">${[1,2,3,5,8,10,15,20,30,40].map(v=>option(v,`${v} ${hoursLabel()}`)).join('')}</select></label>`;
 const horizon=`<label>${L('Review horizon','复盘时间范围','Tempoh semakan')}<select data-v2-control="planHorizon">${WHATIF_HORIZONS.map(v=>`<option value="${v}" ${Number(whatIf.horizon)===v?'selected':''}>${v} ${L('weeks','周','minggu')}</option>`).join('')}</select></label>`;
 const sim=whatIf.simulation;
 if(!sim.fullWeeks)return `${card(L('Reschedule the same sample','重新安排同一份练习','Jadual semula sampel sama'),`<div class="sim-controls">${budget}${horizon}</div><p class="ex-local-notice">${L('A weekly budget of zero cannot schedule the sample. Choose at least one hour per week; no capacity, progress or completion is inferred.','每周预算为 0 时无法安排练习。请选择至少每周 1 小时；这里不推断任何容量、进度或完成情况。','Bajet sifar tidak dapat menjadualkan sampel. Pilih sekurang-kurangnya satu jam seminggu; tiada kapasiti, kemajuan atau penyiapan disimpulkan.')}</p>`)}`;
 const table=`<table class="horizon-table"><caption>${L('Same sample, different budgets','同一份练习，不同预算','Sampel sama, bajet berbeza')}</caption><thead><tr><th>${L('Horizon','范围','Tempoh')}</th><th>${L('Budget hours','预算小时','Jam bajet')}</th><th>${L('Sample cycles','练习轮次','Kitaran sampel')}</th><th>${L('Position in cycle','当前轮内进度','Kedudukan kitaran')}</th></tr></thead><tbody>${whatIf.milestones.map(m=>`<tr ${m.weeks===Number(whatIf.horizon)?'class="current"':''}><td>${m.weeks} ${L('weeks','周','minggu')}</td><td>${num(m.hours)} h</td><td>${m.cycles}</td><td>${m.complete?`${L('week','第','minggu')} ${m.planWeek} / ${sim.fullWeeks}`:L('shorter than one cycle','不足一轮','kurang daripada satu kitaran')}</td></tr>`).join('')}</tbody></table>`;
 const schedule=sim.schedule.map(slot=>`<article class="plan-mini"><h3>${L('Sample week','练习周','Minggu sampel')} ${slot.week}</h3><p>${slot.items.map(item=>`${L('Part','部分','Bahagian')} ${item.source} · ${minuteLabel(item.minutes)}${item.split?` · ${L('split','拆分','dipisah')}`:''}`).join('<br>')}</p><small>${minuteLabel(slot.minutes)}</small></article>`).join('');
 return `${card(L('Reschedule the same sample','重新安排同一份练习','Jadual semula sampel sama'),`<div class="sim-controls">${budget}${horizon}</div><p>${L('The sample is a fixed amount of work designed at ','这份练习的设计节奏为 ','Sampel ini ialah jumlah kerja tetap yang direka pada ') }${whatIf.paceHours} ${hoursLabel()} · ${num(whatIf.sourceHours)} h ${L('in total','总计','jumlah')}. ${L('Your budget only changes how many calendar weeks it occupies.','你的预算只改变它占用多少个自然周。','Bajet anda hanya mengubah bilangan minggu kalendar yang digunakan.')}</p><p><strong>${num(sim.fullWeeks)}</strong> ${L('weeks','周','minggu')} · ${num(sim.scheduledMinutes)} ${L('min scheduled','分钟已安排','min dijadualkan')} · ${L('not a completion, hiring or income forecast','不是完成、招聘或收入预测','bukan ramalan penyiapan, pengambilan atau pendapatan')}</p>${sim.schedule.length?`<div class="week-list">${schedule}</div>`:''}`)}${table}<p>${L('Cycles are counted from completed sample repeats at the selected budget. A longer horizon does not imply better outcomes; it only shows how much repetition the budget allows.','轮次按所选预算下完成的练习重复次数计算。更长的时间范围不意味着结果更好，只表示该预算允许多少次重复。','Kitaran dikira daripada ulangan sampel yang siap pada bajet dipilih. Tempoh lebih panjang tidak bermakna hasil lebih baik; ia hanya menunjukkan bilangan ulangan.')}</p>`;
}

function renderP0Plan(model){
 const contextual=model.startingPointContext?renderStartingFocus(model.startingPointContext,language)+`<div class="paths-grid">${model.p0.paths.map(path=>{const prep=contextualPreparation(model.startingPointContext,model.startingPoint,path,language);return card(path.title,`<div class="starting-context-task"><p>${e(prep.task)}</p><p>${e(prep.check)}</p><small>Q02 · Q05 · Q06 · Q07 · Q08</small></div>`);}).join('')}</div>`:'';
 return contextual+`<p>${L('Now: establish a baseline. Next 30 days: collect and review a route-specific sample. Next 90 days: compare repeated evidence before committing. These are optional review windows, not completion forecasts; no time budget was supplied.','现在：建立基线。未来 30 天：收集并复核路线专属样本。未来 90 天：比较重复实践证据，再决定长期投入。这些是可选复盘窗口，不是完成预测；你尚未提供时间预算。','Sekarang: bina garis dasar. Dalam 30 hari: kumpul dan semak sampel khusus laluan. Dalam 90 hari: banding bukti berulang sebelum komitmen. Ini tempoh semakan pilihan, bukan ramalan siap; bajet masa belum diberikan.')}</p>${model.companions.plan.weeklyHours!=null&&model.background.omitLearningPreferences?`<div class="time-token"><strong>${e(String(model.companions.plan.weeklyHours))}</strong><span>${e(hoursLabel())}</span></div>`:''}<p>${L('Each route has a different artifact and quality check. Completed work can add evidence; it does not automatically change your original answers.','两条路线分别有不同的作品和验收标准。完成作品可增加证据，但不会自动改写原始回答。','Setiap laluan mempunyai hasil dan semakan kualiti berbeza. Kerja siap menambah bukti tetapi tidak mengubah jawapan asal secara automatik.')}</p><div class="week-list">${model.p0.actions.map(a=>card(a.routeId==='cross-cutting'?L('AI collaboration check','AI 协作核验','Semakan kerjasama AI'):model.p0.paths.find(p=>p.id===a.routeId)?.title||a.routeId,`<p><strong>${L('Why','原因','Sebab')}:</strong> ${e(a.why)}</p><p><strong>${L('Do','完成','Buat')}:</strong> ${e(a.task)}</p><p><strong>${L('Quality check','验收','Semakan kualiti')}:</strong> ${e(a.check)}</p><p><strong>${L('Evidence gained','新增证据','Bukti diperoleh')}:</strong> ${e(a.evidence)}</p><small>${L('Basis','依据','Asas')}: ${a.evidenceQuestions.map(e).join(' · ')||L('role requirements','职业要求','keperluan peranan')}</small>`)).join('')}</div>`;
}

export function renderWhatIfPage(model,options={}){
 const conditional=Object.values(options.assumptions||{}).includes('practiced')?`<p class="ex-local-notice">${L('Conditional practice plan: assumes completed practice; original answers are unchanged.','条件实践计划：假设已经完成相关练习；原始回答未改变。','Pelan latihan bersyarat: mengandaikan latihan siap; jawapan asal tidak berubah.')}</p>`:'';
 return `${pageHeader('whatif')}
 ${renderHorizon(model.whatIf)}
 ${conditional}
 ${renderP0Plan(model)}
 ${model.currentAnswers.trackId==='SW'?renderScenario(model,options,language):''}
 ${renderEvidenceScenario(model,options)}
 ${renderProvenance(model)}`;
}
