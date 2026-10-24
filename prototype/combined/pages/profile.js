// Page 1 — Personal profile. Context and self-report only; no ability is scored.
import {renderStartingFocus,renderStartingCapabilities} from '../starting-point-analysis.js';
import {renderRegionalPanel} from '../regional-view.js';
import {language} from '../../i18n.js';
import {L,card,pageHeader,traceLine,p0Label,missingNote,renderProvenance} from './shared.js';
import {escapeHTML as e} from '../../explorer-views.js';

export function renderP0Overview(model){
 const p=model.p0;
 return `<section class="profile-summary"><h2>${L('Your integrated profile','综合个人画像','Profil bersepadu anda')}</h2><p>${model.signals.answeredCount}/${model.signals.totalQuestions} · ${L('These are exploratory interpretations of your own answers, not measured ability or career-success probabilities.','以下是基于自述回答的探索性解释，并非已测量能力或职业成功概率。','Ini tafsiran penerokaan jawapan anda, bukan kebolehan diukur atau kebarangkalian kejayaan kerjaya.')}</p></section><div class="local-dimensions">${p.profile.map(c=>card(e(p0Label(c.kind)),`<p>${e(c.text)}</p>${traceLine(c)}<details><summary>${L('View evidence and interpretation','查看证据与推断','Lihat bukti dan tafsiran')}</summary><p>${c.evidence.map(x=>e(x.questionId)+': '+e(typeof x.value==='object'?JSON.stringify(x.value):String(x.value??L('Unknown','未知','Tidak diketahui')))).join(' · ')}</p><small>${e(c.rule||c.kind)}</small></details>`)).join('')}</div>${p.conflicts.map(c=>`<p class="ex-local-notice">${e(c.text)} ${traceLine(c)}</p>`).join('')}`;
}
export function renderProfilePage(model,options={}){
 const p=model.p0;
 return `${pageHeader('profile')}
 <section class="profile-summary"><p>${L('Answered questions','已回答题目','Soalan dijawab')}: ${model.signals.answeredCount}/${model.signals.totalQuestions} · ${L('Substantive self-reports','可解释的自述回答','Laporan kendiri bermakna')}: ${model.signals.substantiveCount} · ${L('Dimensions with at least one substantive answer','至少有一项可解释回答的维度','Dimensi dengan sekurang-kurangnya satu jawapan bermakna')}: ${model.signals.coveredDimensions}/${model.signals.totalDimensions}</p><p>${L('These are response and coverage counts, not ability scores. Objective proficiency, licences and complete project history were not measured.','以上是回答与维度覆盖数量，不是能力分数。客观熟练度、职业执照与完整项目经历没有被测量。','Ini bilangan jawapan dan liputan dimensi, bukan skor kebolehan. Kemahiran objektif, lesen dan sejarah projek lengkap tidak diukur.')}</p></section>
 ${renderStartingFocus(model.startingPointContext,language)}
 ${renderStartingCapabilities(model.startingPointContext,language)}
 ${renderP0Overview(model)}
 ${missingNote(model)}
 <section class="report-next"><p>${L('Your profile is context, not a verdict. The next page examines what your answers say about working with AI.','个人画像只是背景，不是结论。下一页查看你的回答如何描述与 AI 协作。','Profil anda ialah konteks, bukan keputusan. Halaman seterusnya meneliti apa jawapan anda katakan tentang bekerja dengan AI.')}</p><button type="button" class="button secondary" data-combined-action="page:capability">${L('Continue to AI capability','继续查看 AI 能力','Teruskan ke keupayaan AI')} ↗</button></section>
 ${p.locale?renderRegionalPanel(model,options,p.locale):''}
 ${renderProvenance(model)}`;
}
