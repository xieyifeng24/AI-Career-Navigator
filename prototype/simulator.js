import {answerText} from './questionnaire.js';
// Local planning arithmetic over an existing report. No inference or rescoring.
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = value => Number(value.toFixed(2));
const copy = {
  en: {
    title:'What-if Career Simulator', intro:'Explore another plan using the same report. No new AI call; original scores and recommendations stay unchanged.',
    language:'Simulator language', hours:'Learning hours per week', priority:'Decision priority', balanced:'Balance goals and constraints', interest:'Explore personal interests', salary:'Prioritize salary research',
    direction:'Career direction', path:'Path', upgrade:'Upgrade current career', explore:'Explore an adjacent career', review:'First application-readiness review', weeks:'weeks', week:'Week', reset:'Reset to original plan',
    original:'Selected path · original pacing', scenario:'What-if schedule', effort:'Same listed work', complete:'Weeks to schedule that work', originalScore:'Original match score', unchanged:'unchanged',
    explanation:(hours,base,weeks,total)=>`${hours}h/week instead of ${base}h/week schedules the same ${total}h of listed work across ${weeks} weeks. This does not mean you gained skills or became more suitable.`,
    horizon:(weeks,used,left)=>`At your week-${weeks} review: ${used}h can be scheduled; ${left}h remains afterward. This is a review checkpoint, not a prediction of employment or readiness.`,
    budget:'Weekly capacity', allocated:'scheduled', continuation:'continues across weeks', deliver:'Existing deliverable', validate:'Check progress', resource:'Original learning resource',
    decision:'What to check first', salaryNote:'This snapshot has no salary figures. Salary priority cannot justify a new ranking. Check official pay information, location, currency and date before comparing offers.',
    interestNote:'Try the first existing practice task and reflect on whether you enjoy the work. Compare that experience with your stated goal; interest is not inferred from a slider.',
    balancedNote:'Compare this path with your goal and constraints before investing more time. Use the existing deliverables to gather evidence.',
    goal:'Your stated goal', constraints:'Your existing constraints', gaps:'Skills to verify in this path', next:'Existing next experiment', official:'Check official occupational information',
    limits:'Scheduling assumes the report’s effort estimates are usable and work can be split. It does not shorten prerequisites, verify skills, predict salary or guarantee a job. Original explanations and source links remain below.',
    context:'Goal, constraints and existing next step', later:'Further work remains in the full plan below.', none:'Not specified', hrs:'h', perWeek:'week', available:'Available before the review', noWeeks:'No scheduled work in this report.',
  },
  zh: {
    title:'职业假设模拟器', intro:'基于同一份报告探索不同计划。不新增 AI 调用；原始评分与推荐保持不变。',
    language:'模拟器语言', hours:'每周学习小时数', priority:'决策优先事项', balanced:'平衡目标与现实限制', interest:'探索个人兴趣', salary:'优先核实薪资',
    direction:'职业方向', path:'路线', upgrade:'升级当前职业', explore:'探索相邻职业', review:'首次求职准备复盘', weeks:'周', week:'第', reset:'恢复原始计划',
    original:'所选模拟路线 · 原始排期', scenario:'假设情景安排', effort:'相同的现有任务', complete:'安排这些任务所需周数', originalScore:'原始匹配分数', unchanged:'保持不变',
    explanation:(hours,base,weeks,total)=>`每周 ${hours} 小时（原为 ${base} 小时），将同样的 ${total} 小时现有任务安排在 ${weeks} 周内。这不代表已掌握技能或职业适合度提高。`,
    horizon:(weeks,used,left)=>`第 ${weeks} 周复盘前可安排 ${used} 小时，之后尚余 ${left} 小时。这是复盘时间点，不是就业时间或求职能力预测。`,
    budget:'每周可用时间', allocated:'已安排', continuation:'跨周继续', deliver:'原有交付物', validate:'验证进展', resource:'原有学习资源',
    decision:'优先核实什么', salaryNote:'当前数据快照没有薪资数字，因此薪资优先不能作为重新排名的依据。比较机会前，请在官方来源核实薪资、地区、币种与日期。',
    interestNote:'尝试现有计划的第一项实践任务，再判断自己是否喜欢这类工作，并与已填写的目标比较。滑块不会推断你的真实兴趣。',
    balancedNote:'投入更多时间前，先对照目标和现实限制。通过原有交付物收集实际证据。',
    goal:'已填写的目标', constraints:'原有现实限制', gaps:'此路线待验证的技能', next:'原有下一步实践', official:'核实官方职业信息',
    limits:'排期假设报告中的工时估计可用且任务可以拆分；不会缩短先修要求、证明掌握技能、预测薪资或保证就业。原始解释和来源链接完整保留在下方。',
    context:'目标、现实限制及原有下一步', later:'其余任务仍保留在下方的完整计划中。', none:'未提供', hrs:'小时', perWeek:'周', available:'复盘前可用时间', noWeeks:'报告中没有可安排的任务。',
  },
  ms: {
    title:'Simulator Senario Kerjaya', intro:'Terokai pelan lain daripada laporan yang sama. Tiada panggilan AI baharu; skor dan cadangan asal tidak berubah.',
    language:'Bahasa simulator', hours:'Jam pembelajaran seminggu', priority:'Keutamaan keputusan', balanced:'Seimbangkan matlamat dan kekangan', interest:'Terokai minat peribadi', salary:'Utamakan semakan gaji',
    direction:'Hala tuju kerjaya', path:'Laluan', upgrade:'Tingkatkan kerjaya semasa', explore:'Terokai kerjaya bersebelahan', review:'Semakan awal persediaan permohonan', weeks:'minggu', week:'Minggu', reset:'Kembali ke pelan asal',
    original:'Laluan senario · jadual asal', scenario:'Jadual senario', effort:'Kerja disenaraikan yang sama', complete:'Minggu untuk menjadualkan kerja', originalScore:'Skor padanan asal', unchanged:'tidak berubah',
    explanation:(hours,base,weeks,total)=>`${hours} jam/minggu berbanding ${base} jam/minggu menjadualkan kerja ${total} jam yang sama dalam ${weeks} minggu. Ini tidak membuktikan peningkatan kemahiran atau kesesuaian kerjaya.`,
    horizon:(weeks,used,left)=>`Menjelang semakan minggu ${weeks}: ${used} jam boleh dijadualkan; ${left} jam masih berbaki. Ini titik semakan, bukan ramalan pekerjaan atau kesediaan.`,
    budget:'Kapasiti mingguan', allocated:'dijadualkan', continuation:'bersambung antara minggu', deliver:'Hasil kerja asal', validate:'Semak kemajuan', resource:'Sumber pembelajaran asal',
    decision:'Perkara untuk disemak dahulu', salaryNote:'Petikan data ini tiada angka gaji. Keutamaan gaji tidak membenarkan kedudukan baharu. Semak maklumat gaji rasmi, lokasi, mata wang dan tarikh sebelum membandingkan tawaran.',
    interestNote:'Cuba tugasan latihan pertama yang sedia ada dan nilai sama ada anda menyukainya. Bandingkan pengalaman itu dengan matlamat anda; minat tidak disimpulkan daripada pelaras.',
    balancedNote:'Bandingkan laluan ini dengan matlamat dan kekangan anda sebelum melabur lebih banyak masa. Gunakan hasil kerja sedia ada sebagai bukti.',
    goal:'Matlamat anda', constraints:'Kekangan sedia ada', gaps:'Kemahiran untuk disahkan', next:'Eksperimen seterusnya yang asal', official:'Semak maklumat pekerjaan rasmi',
    limits:'Jadual mengandaikan anggaran usaha laporan boleh digunakan dan kerja boleh dibahagi. Ia tidak memendekkan prasyarat, mengesahkan kemahiran, meramal gaji atau menjamin pekerjaan. Penjelasan dan pautan asal kekal di bawah.',
    context:'Matlamat, kekangan dan langkah asal', later:'Kerja selebihnya kekal dalam pelan penuh di bawah.', none:'Tidak dinyatakan', hrs:'j', perWeek:'minggu', available:'Kapasiti sebelum semakan', noWeeks:'Tiada kerja berjadual dalam laporan ini.',
  },
};

export function simulatorDefaults(report, path='A') {
  return {hours:Number(report.weeklyHours ?? report.profile?.hours) || 3, priority:'balanced', path, reviewWeeks:4, language:'en'};
}

export function simulateCareer(report, choices={}) {
  const defaults=simulatorDefaults(report);
  const options={...defaults,...choices};
  options.hours=Math.max(1,Math.min(40,Number(options.hours)||defaults.hours));
  options.reviewWeeks=[1,2,4,8].includes(Number(options.reviewWeeks))?Number(options.reviewWeeks):4;
  options.priority=['balanced','interest','salary'].includes(options.priority)?options.priority:'balanced';
  options.language=Object.hasOwn(copy,options.language)?options.language:'en';
  const path=report.analysis.paths.find(p=>p.kind===options.path)||report.analysis.paths[0];
  options.path=path.kind;
  const role=report.ranking.find(r=>r.id===path.role_id);
  const weeklyMinutes=Math.round(options.hours*60);
  const sourceWork=path.weeks.map(w=>({week:w,minutes:Math.max(0,Math.round(w.hours*60))}));
  const totalMinutes=sourceWork.reduce((sum,w)=>sum+w.minutes,0);
  const schedule=[];
  for(const item of sourceWork){
    let remaining=item.minutes;
    while(remaining>0){
      let slot=schedule.at(-1);
      if(!slot||slot.minutes===weeklyMinutes){slot={week:schedule.length+1,minutes:0,items:[]};schedule.push(slot);}
      const minutes=Math.min(remaining,weeklyMinutes-slot.minutes);
      slot.items.push({source:item.week,minutes,split:minutes<item.minutes});
      slot.minutes+=minutes;remaining-=minutes;
    }
  }
  const visible=schedule.slice(0,options.reviewWeeks);
  const scheduledMinutes=visible.reduce((sum,w)=>sum+w.minutes,0);
  return {options,path,role,schedule,visible,totalHours:number(totalMinutes/60),
    scheduledHours:number(scheduledMinutes/60),remainingHours:number((totalMinutes-scheduledMinutes)/60),
    reviewCapacity:number(options.reviewWeeks*options.hours),fullWeeks:schedule.length,
    originalWeeks:path.weeks.length,originalHours:Number(report.weeklyHours ?? report.profile?.hours)||defaults.hours};
}

function sourceLink(source,label) {
  if(!source?.url?.startsWith('https://')) return '';
  return `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(label||source.title)}</a>`;
}

export function simulatorResults(report,choices) {
  const result=simulateCareer(report,choices), {options,path,role}=result,t=copy[options.language];
  const sources=report.evidence.sources;
  const priorityText={salary:t.salaryNote,interest:t.interestNote,balanced:t.balancedNote}[options.priority];
  return `<div class="sim-comparison"><article><span>${t.original}</span><strong>${result.originalHours} ${t.hrs} / ${t.perWeek}</strong><small>${result.originalWeeks} ${t.weeks} · ${result.totalHours} ${t.hrs}</small></article><article class="sim-changed"><span>${t.scenario}</span><strong>${options.hours} ${t.hrs} / ${t.perWeek}</strong><small>${t.complete}: ${result.fullWeeks} · ${result.totalHours} ${t.hrs}</small></article><article><span>${t.originalScore}</span><strong>${escape(role?.score ?? '—')}<small>/100</small></strong><small>${t.unchanged}</small></article></div>
    <p class="sim-reason" role="status" aria-live="polite">${t.explanation(options.hours,result.originalHours,result.fullWeeks,result.totalHours)}</p>
    <div class="sim-decision"><h3>${t.decision}</h3><p>${priorityText}</p><p><strong>${escape(role?.title||path.role_id)}</strong> · ${t.path} ${escape(path.kind)}</p>${sourceLink(sources[role?.source_id],t.official)}<details class="sim-context"><summary>${t.context}</summary><p><strong>${t.goal}:</strong> <span data-user-content>${escape(report.profile?answerText(report.profile,'goal')||t.none:t.none)}</span></p><p><strong>${t.constraints}:</strong> <span data-user-content>${escape(report.profile?answerText(report.profile,'constraints')||t.none:t.none)}</span></p><p><strong>${t.gaps}:</strong> ${path.gaps.map(x=>escape(x.skill)).join(', ')||t.none}</p><p><strong>${t.next}:</strong> <span data-user-content>${escape(path.next_step.text)}</span></p></details></div>
    <p>${t.horizon(options.reviewWeeks,result.scheduledHours,result.remainingHours)} ${t.available}: ${result.reviewCapacity} ${t.hrs}.</p>
    <div class="sim-schedule">${result.visible.map(slot=>`<details><summary>${t.week} ${slot.week}${options.language==='zh'?' 周':''} · ${number(slot.minutes/60)} / ${options.hours} ${t.hrs} ${t.allocated}</summary>${slot.items.map(item=>`<div class="sim-work"><p><strong>${number(item.minutes/60)} ${t.hrs}${item.split?' · '+t.continuation:''}</strong> · <span data-user-content>${escape(item.source.action.text)}</span></p><p><strong>${t.deliver}:</strong> <span data-user-content>${escape(item.source.deliverable)}</span></p><p><strong>${t.validate}:</strong> <span data-user-content>${escape(item.source.validation)}</span></p>${sourceLink(sources[item.source.resource_id],t.resource)}</div>`).join('')}</details>`).join('')||`<p>${t.noWeeks}</p>`}</div>${result.remainingHours?`<p>${t.later}</p>`:''}<p class="sim-limits">${t.limits}</p>`;
}

export function renderSimulator(report,choices,path='A') {
  const result=simulateCareer(report,choices||simulatorDefaults(report,path)),o=result.options,t=copy[o.language];
  const option=(value,label,current)=>`<option value="${value}" ${value===current?'selected':''}>${escape(label)}</option>`;
  return `<section class="whatif" data-simulator lang="${o.language}" aria-labelledby="sim-title"><div class="sim-heading"><div><span class="kicker">WHAT IF?</span><h2 id="sim-title">${t.title}</h2></div><button class="text-button" data-action="sim-reset">${t.reset}</button></div><p>${t.intro}</p><div class="sim-controls">
    <label for="sim-hours">${t.hours}<output id="sim-hours-value" for="sim-hours">${o.hours} ${t.hrs}</output><input id="sim-hours" type="range" min="1" max="40" step="0.5" value="${o.hours}" data-sim-control="hours"></label>
    <label for="sim-priority">${t.priority}<select id="sim-priority" data-sim-control="priority">${['balanced','interest','salary'].map(x=>option(x,t[x],o.priority)).join('')}</select></label>
    <label for="sim-path">${t.direction}<select id="sim-path" data-sim-control="path">${report.analysis.paths.map(p=>option(p.kind,`${t.path} ${p.kind} — ${p.kind==='A'?t.upgrade:t.explore}`,o.path)).join('')}</select></label>
    <label for="sim-review">${t.review}<select id="sim-review" data-sim-control="reviewWeeks">${[1,2,4,8].map(n=>option(n,`${n} ${o.language==='en'&&n===1?'week':t.weeks}`,o.reviewWeeks)).join('')}</select></label>

    </div><div data-sim-results>${simulatorResults(report,o)}</div></section>`;
}

export function simulatorHoursLabel(choices) {return `${choices.hours} ${copy[choices.language]?.hrs||'h'}`;}
