import regional from '../../data/regional/current.json' with {type:'json'};
import {escapeHTML as e} from '../explorer-views.js';

const labels={
 en:{title:'Malaysia to Global · occupational evidence',intro:'Your assessment and exploration order stay the same. These tabs change the occupational and market context only.',
  my:'Malaysia',us:'United States',global:'Global skills',source:'Official source and coverage',period:'Reference period',checked:'Checked',
  software:'Software Developer',ai:'AI / Machine Learning Engineer',broader:'Broad context; not a software salary or individual career forecast.',
  related:'Related occupational context only. No exact verified AI/ML Engineer classification or salary.',missing:'No occupation-specific verified statistic for this role in this region.',
  aiButton:'Request optional AI explanation',consent:'I am using a fictional profile and agree to send these 12 answers and public source facts to RunPod.',
  idle:'The base report uses rules and source records. AI is only called when you request it.',loading:'Requesting a source-grounded explanation…',
  unavailable:'AI is not configured or is unavailable. Your base report remains available.',aiTitle:'AI-assisted explanation · interpretive, not a new score',
  overview:'Personal context',route_tradeoff:'Route trade-off',market_context:'Regional context',next_step:'Next step',
  classification:'Classification mapping',scope:'Coverage limits',bundled:'Bundled verified snapshot',published:'Published verified snapshot',last_valid:'Last valid snapshot'},
 'zh-CN':{title:'从马来西亚走向全球 · 职业证据',intro:'切换地区只改变职业与市场背景，不改变原始测评或探索顺序。',
  my:'马来西亚',us:'美国',global:'国际技能',source:'官方来源与覆盖范围',period:'统计期',checked:'核验时间',software:'软件开发工程师',ai:'AI／机器学习工程师',
  broader:'仅为职业大类背景，不是软件工程师工资或个人职业预测。',related:'仅提供相关职业背景；AI／机器学习工程师暂无核验的一一对应职业分类或薪资。',
  missing:'本地区暂缺该岗位可核验的专属统计。',aiButton:'请求可选的 AI 深度解释',consent:'我使用虚构资料，同意向 RunPod 发送这 12 道回答和公开来源资料。',
  idle:'基础报告使用规则与有来源的职业记录。只有主动请求时才调用 AI。',loading:'正在请求有来源依据的解释…',
  unavailable:'AI 未配置或暂时不可用；基础报告仍可使用。',aiTitle:'AI 辅助解释 · 不产生新评分',
  overview:'个人情况',route_tradeoff:'路线取舍',market_context:'地区背景',next_step:'下一步',classification:'职业分类映射',scope:'覆盖限制',bundled:'内置已核验快照',published:'已发布核验快照',last_valid:'上一份有效快照'},
 ms:{title:'Malaysia ke Global · bukti pekerjaan',intro:'Pertukaran wilayah hanya mengubah konteks pekerjaan dan pasaran, bukan jawapan atau susunan penerokaan.',
  my:'Malaysia',us:'Amerika Syarikat',global:'Kemahiran global',source:'Sumber rasmi dan liputan',period:'Tempoh rujukan',checked:'Disemak',
  software:'Pembangun Perisian',ai:'Jurutera AI / Pembelajaran Mesin',broader:'Konteks kumpulan pekerjaan luas; bukan gaji pembangun perisian atau ramalan kerjaya individu.',
  related:'Konteks pekerjaan berkaitan sahaja. Tiada klasifikasi atau gaji tepat yang disahkan untuk jurutera AI/ML.',
  missing:'Tiada statistik khusus pekerjaan yang disahkan untuk peranan ini di wilayah ini.',aiButton:'Minta penjelasan AI pilihan',
  consent:'Saya menggunakan profil rekaan dan bersetuju menghantar 12 jawapan ini serta fakta sumber awam kepada RunPod.',
  idle:'Laporan asas menggunakan peraturan dan rekod bersumber. AI hanya dipanggil apabila diminta.',loading:'Meminta penjelasan berdasarkan sumber…',
  unavailable:'AI belum dikonfigurasi atau tidak tersedia. Laporan asas masih tersedia.',aiTitle:'Penjelasan bantuan AI · bukan skor baharu',
  overview:'Konteks peribadi',route_tradeoff:'Perbandingan laluan',market_context:'Konteks wilayah',next_step:'Langkah seterusnya',
  classification:'Pemetaan klasifikasi',scope:'Had liputan',bundled:'Petikan terbina dalam yang disahkan',published:'Petikan diterbitkan yang disahkan',last_valid:'Petikan sah terakhir'}
};
const regionIds=['MY','US','GLOBAL'];
const important={MY:['critical_occupation_listed','median_monthly_wages_professionals','task'],
 US:['task','skill','employment_change_projection','median_annual_wage'],
 GLOBAL:['transferable_skill_reference','national_unemployment_rate']};
function display(row,locale){
 const metric={critical_occupation_listed:{en:'MyCOL critical occupation list', 'zh-CN':'MyCOL 紧缺职业名单',ms:'Senarai pekerjaan kritikal MyCOL'},
 median_monthly_wages_professionals:{en:'All professionals median monthly wage','zh-CN':'所有专业人员月工资中位数',ms:'Gaji bulanan median semua profesional'},
 employment_change_projection:{en:'US employment projection','zh-CN':'美国就业人数预测变化',ms:'Unjuran perubahan pekerjaan AS'},
 median_annual_wage:{en:'US median annual wage','zh-CN':'美国年工资中位数',ms:'Gaji tahunan median AS'},
 national_unemployment_rate:{en:'National unemployment rate (all jobs)','zh-CN':'全国失业率（所有职业）',ms:'Kadar pengangguran nasional (semua pekerjaan)'},
 task:{en:'Occupational task','zh-CN':'职业工作任务',ms:'Tugas pekerjaan'},skill:{en:'O*NET skill','zh-CN':'O*NET 技能',ms:'Kemahiran O*NET'},
 transferable_skill_reference:{en:'ESCO European skill relation','zh-CN':'ESCO 欧洲技能关联',ms:'Hubungan kemahiran ESCO Eropah'}}[row.metric]?.[locale]||row.metric;
 const v=row.value===true?({en:'Listed','zh-CN':'已列入',ms:'Tersenarai'}[locale]):row.value;
 return `${metric}: ${v===null||v===undefined?'':v}${row.unit?' '+row.unit:''}`;
}
function factList(rows,locale,word){
 return rows.map(row=>`<li><strong>${e(display(row,locale))}</strong><details><summary>${e(word.source)}</summary><p>${e(row.source_name)} · ${e(row.occupation_code||'')} · ${e(word.period)}: ${e(row.reference_period||'—')}</p><p>${e(row.granularity)} · ${e(row.mapping_status)}${row.note?' · '+e(row.note):''}</p><p>${e(word.checked)}: ${e(row.retrieved_at||'—')} · ${e(row.source_version||'')}</p><a href="${e(row.source_url)}" target="_blank" rel="noopener noreferrer">${e(row.source_url)} ↗</a></details></li>`).join('');
}
export function renderRegionalPanel(model,options={},locale='en'){
 if(model.currentAnswers.trackId!=='SW')return '';
 const word=labels[locale]||labels.en,region=regionIds.includes(options.region)?options.region:'MY';
 const active=options.regionalSnapshot||regional;
 const rows=active.facts.filter(r=>r.region===region&&important[region].includes(r.metric));
 const byRole=id=>{
  const selected=rows.filter(r=>r.role_id===id);
  const market=selected.filter(r=>!['task','skill','transferable_skill_reference'].includes(r.metric));
  const tasks=selected.filter(r=>r.metric==='task').slice(0,2);
  const skills=selected.filter(r=>['skill','transferable_skill_reference'].includes(r.metric)).slice(0,4);
  return [...market,...tasks,...skills];
 };
 const shared=rows.filter(r=>r.role_id===null);
 const ai=options.ai||{status:'idle'};
 const result=ai.status==='complete'?`<article class="plan-mini"><h3>${e(word.aiTitle)}</h3>${Object.entries(ai.result.sections).map(([k,v])=>`<h4>${e(word[k])}</h4>${v.origin==='deterministic-source-summary'?`<small>${e({en:'Source-based summary · not generated by AI','zh-CN':'来源摘要 · 非 AI 生成',ms:'Ringkasan sumber · bukan dijana AI'}[locale])}</small>`:`<small>${e({en:'AI interpretation of self-report; not observed skill','zh-CN':'基于自述的 AI 解释，并非已观察到的技能',ms:'Tafsiran AI tentang laporan kendiri; bukan kemahiran diperhatikan'}[locale])}</small>`}<p>${e(v.text)}</p>${v.evidence_ids?`<details><summary>${e({en:'Evidence and limits','zh-CN':'依据与局限',ms:'Bukti dan had'}[locale])}</summary><p>${e(v.evidence_ids.join(' · '))}</p><p>${e(v.limitations.join(' '))}</p></details>`:''}<small>${v.source_ids.map(id=>{const source=ai.result.sources[id];return source?`<a href="${e(source.source_url)}" target="_blank" rel="noopener noreferrer">${e(source.source_name)} · ${e(source.reference_period||'')} ↗</a>`:'';}).join(' · ')}</small>`).join('')}</article>`:'';
 const status=ai.status==='loading'?word.loading:ai.status==='error'?ai.message||word.unavailable:word.idle;
 return `<section class="regional-panel" aria-label="${e(word.title)}"><h2>${e(word.title)}</h2><p>${e(word.intro)}</p>
  <div class="regional-tabs" role="group" aria-label="${e(word.title)}">${regionIds.map(id=>`<button type="button" data-combined-action="region:${id}" aria-pressed="${id===region}" class="${id===region?'active':''}">${e(word[id.toLowerCase()])}</button>`).join('')}</div>
  <div class="paths-grid"><article class="plan-mini"><h3>${e(word.software)}</h3><p>${e(word.classification)}: ${region==='MY'?'MASCO 2512':region==='US'?'O*NET-SOC 15-1252.00 · SOC 15-1252':'ESCO software developer (European)'}</p><ul>${factList(byRole('software'),locale,word)}</ul>${!byRole('software').length?`<p>${e(word.missing)}</p>`:''}</article>
  <article class="plan-mini"><h3>${e(word.ai)}</h3><p>${e(word.related)}</p><ul>${factList(byRole('ai-research'),locale,word)}</ul>${!byRole('ai-research').length?`<p>${e(word.missing)}</p>`:''}</article></div>
  <article class="plan-mini"><h3>${e(word.scope)}</h3><p>${e(region==='MY'?word.broader:region==='US'?word.related:({en:'ESCO is a European skills classification; World Bank rates cover all occupations.','zh-CN':'ESCO 是欧洲技能分类；世界银行指标覆盖所有职业。',ms:'ESCO ialah klasifikasi kemahiran Eropah; kadar Bank Dunia meliputi semua pekerjaan.'}[locale]))}</p><ul>${factList(shared,locale,word)}</ul></article>
  <small>${e(active.version)} · ${e(word.checked)}: ${e(active.checked_at)} · ${e(word[options.regionalDelivery]||word.bundled)}</small>
  <div class="regional-ai"><label><input type="checkbox" data-regional-consent ${options.aiConsent?'checked':''}> ${e(model.startingPoint?({en:'I consent to sending this assessment, its structured starting-point context and cited public facts to RunPod for optional AI analysis. The free-text story is excluded unless I choose to include it below.','zh-CN':'我同意将本次测评、结构化起点信息及引用的公开资料发送给 RunPod，用于可选 AI 分析。补充文本默认不发送，除非我另行勾选。',ms:'Saya bersetuju menghantar penilaian, konteks titik permulaan berstruktur dan fakta awam bersumber kepada RunPod untuk AI pilihan. Cerita teks tidak dihantar kecuali saya memilihnya di bawah.'}[locale]):word.consent)}</label>${model.startingPoint?.story?`<label><input type="checkbox" data-regional-story-consent ${options.aiStoryConsent?'checked':''}> ${e({en:'Also include my optional story in this AI request.','zh-CN':'本次 AI 请求也包含我填写的补充内容。',ms:'Sertakan juga cerita pilihan saya dalam permintaan AI ini.'}[locale])}</label>`:''}<button class="button secondary" type="button" data-combined-action="regional-ai" ${ai.status==='loading'?'disabled':''}>${e(word.aiButton)}</button><p role="status">${e(status)}</p>${result}</div></section>`;
}
