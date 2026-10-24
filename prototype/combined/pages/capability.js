// Page 2 — AI capability. One practice band, built from two ordinal dimensions,
// followed by the task-level split and the explicit-assumption scenario.
import {renderScenario} from '../intelligence.js';
import {CAPABILITY_LEVELS} from '../report-model.js';
import {renderRegionalPanel} from '../regional-view.js';
import {language} from '../../i18n.js';
import {L,card,pageHeader,signalCards,renderSourceStatus,renderProvenance} from './shared.js';
import {escapeHTML as e} from '../../explorer-views.js';

function levelDots(level){
 return `<div class="capability-scale" role="img" aria-label="${level} / 5">${[1,2,3,4,5].map(n=>`<span class="${n<=level?'filled':''}" ${n===level?'data-current="true"':''}></span>`).join('')}</div>`;
}
function stanceLabel(stance){
 return stance==='endorsed'?['Endorsed self-report','自述认同','Disokong laporan kendiri']:stance==='mixed'?['Mixed answers','回答不一致','Jawapan bercampur']:stance==='not-endorsed'?['Not endorsed','自述不认同','Tidak disokong']:['Not answered','未回答','Tidak dijawab'];
}
export function renderCapabilityLevel(model){
 const cap=model.capability;
 const missing=cap.partial?L('Only one of the two AI dimensions was answered, so no band is assigned. A missing answer is not a low level.','两个 AI 维度中只有一个已回答，因此不指定等级。未回答不等于低水平。','Hanya satu daripada dua dimensi AI dijawab, jadi tiada jalur diberikan. Jawapan tiada bukan tahap rendah.'):L('No level is assigned because the AI-practice and AI-verification questions were not answered. A missing answer is not a low level.','AI 使用与 AI 核验题目未回答，因此不指定等级。未回答不等于低水平。','Tiada tahap diberikan kerana soalan amalan dan pengesahan AI tidak dijawab. Jawapan tiada bukan tahap rendah.');
 if(!cap.available)return card(L('Reported AI practice level','自述 AI 实践等级','Tahap amalan AI dilaporkan'),`<p><strong>—</strong> ${missing}</p><small>${L('Rule','规则','Peraturan')}: ${e(cap.rule)}</small>`);
 const basis=(label,dimension)=>`<li>${label}: ${e(L(...stanceLabel(dimension.stance)))}${dimension.ids.length?` · ${dimension.ids.map(e).join(' · ')}`:''}</li>`;
 return card(L('Reported AI practice level','自述 AI 实践等级','Tahap amalan AI dilaporkan'),`${levelDots(cap.level)}<p class="capability-value"><strong>${cap.level} / 5</strong> · ${e(L(...CAPABILITY_LEVELS[cap.level]))}</p><ul>${basis(L('Using AI','使用 AI','Menggunakan AI'),cap.practice)}${basis(L('Checking AI output','核查 AI 输出','Menyemak output AI'),cap.verification)}</ul><p>${L('This band combines two answered dimensions. It is not a competence test: the questionnaire did not observe your work, so delivery quality, model-building skill and speed remain unmeasured.','该等级由两个已作答维度组合而成，不是能力测试：问卷没有观察你的实际工作，因此交付质量、模型构建能力与速度仍未测量。','Jalur ini menggabungkan dua dimensi yang dijawab. Ia bukan ujian kecekapan: soal selidik tidak memerhati kerja anda, jadi kualiti penghantaran, kemahiran membina model dan kelajuan masih belum diukur.')}</p><small>${L('Rule','规则','Peraturan')}: ${e(cap.rule)} · ${L('Evidence','依据','Bukti')}: ${cap.evidenceIds.map(e).join(' · ')} · ${L('verified','已核验','disahkan')}: ${L('no','否','tidak')}</small>`);
}
function renderP0AI(model){
 return `<div class="local-dimensions">${model.p0.profile.filter(c=>['ai-practice','ai-verification'].includes(c.kind)).map(c=>card(e(c.kind==='ai-practice'?L('AI practice','AI 使用','Amalan AI'):L('AI verification','AI 核验','Pengesahan AI')),`<p>${e(c.text)}</p><small>${L('Basis','依据','Asas')}: ${c.evidence.map(x=>e(x.questionId)).join(' · ')}</small>`)).join('')}</div><p>${L('Task analysis below is a rule-based scenario using the cited occupational record where available, otherwise the team catalog. It is not an automation rate, hiring forecast or verified personal skill.','以下任务分析在有已审阅职业记录时使用该来源，否则使用团队目录构建规则情景；它不是自动化率、招聘预测或已验证的个人技能。','Analisis tugas ini ialah senario berasaskan peraturan menggunakan rekod pekerjaan disemak jika ada, jika tidak katalog pasukan. Ia bukan kadar automasi, ramalan pekerjaan atau kemahiran peribadi disahkan.')}</p><div class="paths-grid">${model.p0.paths.map(p=>card(p.title,`<h4>${L('AI may assist','AI 可能辅助','AI boleh membantu')}</h4><p>${e(p.aiTask)}</p><h4>${L('Human judgement remains','仍需人工判断','Pertimbangan manusia kekal')}</h4><p>${e(p.humanTask)}</p><small>${p.officialMapping?e(p.source.id):L('Editorial task scenario','团队任务情景','Senario tugas editorial')}</small>`)).join('')}</div>`;
}
export function renderCapabilityPage(model,options={}){
 return `${pageHeader('capability')}
 ${renderCapabilityLevel(model)}
 ${renderP0AI(model)}
 <div class="task-grid">${signalCards(model,['ai_practice','ai_verification'])}</div>
 ${model.background.aiPurposes?.includes('none')?`<p class="ex-local-notice">${L('Your background choices explicitly state no AI use. This describes AI use only, not an absence of professional experience.','背景选择明确报告尚未使用 AI；这只涉及 AI 使用，不代表没有专业经历。','Pilihan latar menyatakan belum menggunakan AI; ini bukan ketiadaan pengalaman profesional.')}${model.signals.items.some(i=>i.construct==='ai_practice'&&i.stance==='agreement')?L(' This conflicts with an agreement response about AI practice; review the answers before drawing a conclusion.',' 这与 AI 实践陈述的同意回答存在冲突，请先核对答案。',' Ini bercanggah dengan persetujuan tentang latihan AI; semak jawapan dahulu.'):''}</p>`:''}
 ${model.currentAnswers.trackId==='SW'?renderScenario(model,options,language):''}
 ${renderRegionalPanel(model,options,language)}
 ${renderSourceStatus(model)}
 ${renderProvenance(model)}`;
}
