// Page 5 — Global impact. SDG companions stay exactly as they were; the new
// block only shows which goals the team catalog links to the chosen direction.
import {renderGoals} from '../../explorer-views.js';
import {catalog} from '../../explorer-engine.js';
import {bank} from '../../v3/engine.js';
import {L,card,pageHeader,pick,renderProvenance} from './shared.js';
import {escapeHTML as e} from '../../explorer-views.js';

const goalById=id=>catalog.goals.find(g=>g.id===id);
const roleTitle=id=>pick(catalog.careers.find(r=>r.id===id)?.title);

export function renderImpactLinks(model){
 const impact=model.impact,track=bank.tracks.find(t=>t.id===impact.direction);
 const title=track?pick(track.label):impact.direction;
 if(!impact.ranked.length)return card(L('Goals linked to your direction','与你所选方向关联的目标','Matlamat dikaitkan dengan arah anda'),`<p>${L('The team catalog records no SDG link for the roles mapped to this direction. No goal is inferred, and the companions above remain unchanged.','团队目录中，该方向映射到的职业没有记录 SDG 关联。此处不推断任何目标，上方伙伴结果保持不变。','Katalog pasukan tidak merekodkan pautan SDG bagi peranan yang dipetakan ke arah ini. Tiada matlamat disimpulkan, dan rakan di atas kekal tidak berubah.')}</p>`);
 const top=goalById(impact.ranked[0].id);
 const rows=impact.ranked.map(r=>{const goal=goalById(r.id);return `<tr><td>SDG ${goal.id} · ${e(pick(goal.code))}</td><td>${e(pick(goal.title))}</td><td>${r.reasons.careers.map(id=>e(roleTitle(id)||id)).join(' · ')}</td><td>${r.weight}</td></tr>`;}).join('');
 return `<section class="impact-links"><h2>${L('Goals linked to your direction','与你所选方向关联的目标','Matlamat dikaitkan dengan arah anda')}</h2><p>${L('How this is calculated','计算方式','Cara ini dikira')}: ${L('the direction you selected','你选择的方向','arah yang anda pilih')} <strong>${e(title)}</strong> → ${L('roles in the team catalog','团队目录中的职业','peranan dalam katalog pasukan')} → ${L('each role’s editorial SDG links','每个职业的团队 SDG 关联','pautan SDG editorial setiap peranan')}. ${L('The number is a count of catalog links, not an amount of impact, a match score or a UN assessment.','该数字是目录关联条数，不是影响大小、匹配分数或联合国评估。','Nombor itu bilangan pautan katalog, bukan jumlah impak, skor padanan atau penilaian PBB.')}</p><table class="horizon-table"><thead><tr><th>${L('Goal','目标','Matlamat')}</th><th>${L('Title','标题','Tajuk')}</th><th>${L('Linked roles','关联职业','Peranan dikaitkan')}</th><th>${L('Links','关联数','Pautan')}</th></tr></thead><tbody>${rows}</tbody></table>${card(L('An action you could test','可尝试的行动','Tindakan untuk dicuba'),`<p>${e(pick(top.action))}</p><small>${L('SDG','目标','SDG')} ${top.id} · ${e(pick(top.title))} · ${L('editorial action from the existing companion catalog; proposed connection, not measured SDG impact','来自现有伙伴目录的团队行动建议；仅为拟议关联，不代表已测量的 SDG 影响','tindakan editorial daripada katalog rakan sedia ada; pautan dicadangkan, bukan impak SDG diukur')}</small>`)}</section>`;
}

export function renderImpactPage(model,options={},state={}){
 const notice=model.startingPoint?`<p class="ex-local-notice">${L('SDG companions are an independent educational reference. The new questionnaire does not assign a personal SDG match.','SDG 行动伙伴是独立的教育参考。新版起点问卷不生成个人 SDG 匹配。','Rakan SDG ialah rujukan pendidikan bebas. Soal selidik baharu tidak menetapkan padanan SDG peribadi.')}</p>`:`<p class="ex-local-notice">${L('SDG companions use the existing background-interest rules. They are independent context, not a result of the V3 occupational comparison.','SDG 关联沿用现有背景兴趣规则，是独立参考信息，并非 V3 职业比较的计算结果。','Kaitan SDG menggunakan peraturan minat latar sedia ada. Ia konteks berasingan, bukan hasil perbandingan pekerjaan V3.')}</p>`;
 return `${pageHeader('impact')}${notice}${renderImpactLinks(model)}<p>${L('Which goals you contribute to is a long-term question the questionnaire cannot answer. Use the companions as prompts for action, not as a verdict.','你对哪些目标有贡献是长期问题，问卷无法回答。请把伙伴作为行动提示，而不是结论。','Matlamat mana yang anda sumbang ialah soalan jangka panjang yang tidak dapat dijawab soal selidik. Gunakan rakan sebagai dorongan bertindak, bukan keputusan.')}</p>${renderGoals({...state,page:'sdg',report:model.startingPoint?null:model.companions})}${renderProvenance(model)}`;
}
