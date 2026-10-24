// Prerequisite skill tree over a role's official O*NET requirements.
// Ordering is a product planning aid, not a validated prerequisite standard.
// Progress is a session note only; it never certifies proficiency.
import {pick} from './engine.js';
import {language} from '../i18n.js';

const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const L = (en, zh, ms) => pick([en, zh, ms], language);
const P = value => pick(value, language);

export const SKILL_STAGES = [
  {id: 'foundations', label: ['Foundations', '基础', 'Asas'], hint: ['Understand the work before building it', '先理解再做', 'Fahami kerja sebelum membinanya']},
  {id: 'practice', label: ['Practice', '实践', 'Amalan'], hint: ['Produce a small, reviewable sample', '完成一个可复核的小样本', 'Hasilkan sampel kecil yang boleh disemak']},
  {id: 'verification', label: ['Verification', '核验', 'Pengesahan'], hint: ['Check your work against an independent test', '用独立标准核验成果', 'Semak kerja anda dengan ujian bebas']},
  {id: 'portfolio', label: ['Portfolio', '作品案例', 'Kes portfolio'], hint: ['Combine and explain real cases', '整合并说明真实案例', 'Gabung dan terangkan kes sebenar']},
];

const KEYWORDS = {
  foundations: ['reading comprehension', 'active listening', 'active learning', 'learning strategies', 'critical thinking', 'mathematics', 'complex problem solving', 'judgment'],
  practice: ['programming', 'writing', 'speaking', 'technology design', 'operations analysis', 'systems analysis', 'equipment selection', 'science'],
  verification: ['quality control', 'monitoring', 'judgment and decision making', 'systems evaluation', 'troubleshooting', 'inspection', 'audit', 'testing'],
  portfolio: ['coordination', 'persuasion', 'negotiation', 'instructing', 'service orientation', 'social perceptiveness', 'management of', 'installation'],
};

function matches(text, words) {
  const t = String(text ?? '').toLowerCase();
  return words.some(word => t.includes(word));
}

export function stageOf(label) {
  if (matches(label, KEYWORDS.foundations)) return 0;
  if (matches(label, KEYWORDS.verification)) return 2;
  if (matches(label, KEYWORDS.portfolio)) return 3;
  if (matches(label, KEYWORDS.practice)) return 1;
  return 1;
}

export function buildSkillTree(assessment, roleId) {
  const role = assessment?.roles?.find(item => item.id === roleId) || assessment?.roles?.[0];
  if (!role) return null;
  const stages = SKILL_STAGES.map(stage => ({...stage, items: []}));
  const ordered = [...role.requirements].sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0) || String(a.label).localeCompare(String(b.label)));
  for (const requirement of ordered) {
    const index = stageOf(requirement.label);
    stages[index].items.push({...requirement, stageIndex: index});
  }
  const shared = new Set();
  for (const other of assessment.roles) {
    if (other.id === role.id) continue;
    for (const item of other.requirements) if (role.requirements.some(r => r.label === item.label)) shared.add(item.label);
  }
  let depth = 0;
  const flattened = [];
  for (const stage of stages) for (const item of stage.items) { flattened.push({...item, depth: depth++}); }
  return {
    roleId: role.id,
    title: role.title,
    project: role.project,
    readiness: assessment.dimensions?.experience ?? null,
    stages,
    flattened,
    shared: [...shared],
    total: role.requirements.length,
    sourceId: role.sourceId,
  };
}

export function defaultProgress() { return {}; }

export function sanitizeProgress(tree, values) {
  const progress = {};
  if (!tree) return progress;
  const total = tree.flattened.length;
  for (const [key, list] of Object.entries(values ?? {})) {
    if (key !== tree.roleId) continue;
    const indexes = Array.isArray(list) ? list.filter(value => Number.isInteger(value) && value >= 0 && value < total) : [];
    progress[key] = [...new Set(indexes)].sort((a, b) => a - b);
  }
  return progress;
}

export function nextStepIndex(tree, progress) {
  const done = new Set(progress?.[tree?.roleId] ?? []);
  return tree?.flattened?.findIndex((item, index) => !done.has(index)) ?? -1;
}

export function renderSkillTree(assessment, options = {}) {
  const a = assessment;
  const roleId = a?.roles?.[options.path === 'B' ? 1 : 0]?.id || a?.roles?.[0]?.id;
  const tree = buildSkillTree(a, roleId);
  if (!tree) return `<section class="an-empty">${L('No requirements are available for this route.', '此路线暂无技能要求。', 'Tiada keperluan kemahiran untuk laluan ini.')}</section>`;
  const progress = sanitizeProgress(tree, options.skillProgress ?? {});
  const done = new Set(progress[tree.roleId] ?? []);
  const next = nextStepIndex(tree, progress);
  const readinessLabel = !tree.readiness || tree.readiness.status === 'unknown' ? L('No practice reported for this direction', '未自述该方向实践', 'Tiada amalan dilaporkan untuk arah ini') : tree.readiness.status === 'reported' ? L('Relevant practice reported, not yet verified per skill', '自述相关实践，尚未逐项验证', 'Amalan berkaitan dilaporkan, belum disahkan setiap kemahiran') : L('Limited or mixed reported practice', '自述实践有限或不一致', 'Amalan dilaporkan terhad atau bercampur');
  const stageMarkup = tree.stages.filter(stage => stage.items.length).map((stage, stageIndex) => {
    const items = stage.items.map(item => {
      const itemIndex = tree.flattened.indexOf(item);
      const isDone = done.has(itemIndex);
      const isNext = itemIndex === next;
      const state = isDone ? 'done' : isNext ? 'next' : 'locked';
      const shared = tree.shared.includes(item.label);
      return `<li class="skill-tree-node is-${state}" data-stage="${stageIndex}">
        <span class="skill-tree-marker" aria-hidden="true">${isDone ? '✓' : isNext ? '◆' : '·'}</span>
        <span class="skill-tree-name">${e(item.label)}${shared ? ` <small>${L('shared with the other route', '与另一路线共有', 'dikongsi dengan laluan lain')}</small>` : ''}</span>
        <span class="skill-tree-state">${isDone ? L('Marked practiced', '已标记实践', 'Ditanda diamalkan') : isNext ? L('Suggested next', '建议下一步', 'Cadangan seterusnya') : L('Unassessed requirement', '未评估要求', 'Keperluan belum dinilai')}</span>
      </li>`;
    }).join('');
    return `<section class="skill-tree-stage"><header><span class="skill-tree-stage-index">0${stageIndex + 1}</span><div><h3>${e(L(...stage.label))}</h3><p>${e(L(...stage.hint))}</p></div><span class="skill-tree-stage-count">${stage.items.length}</span></header>${items ? `<ol class="skill-tree-list">${items}</ol>` : `<p class="skill-tree-empty">${L('No requirements fall in this stage.', '此阶段暂无要求。', 'Tiada keperluan dalam peringkat ini.')}</p>`}</section>`;
  }).join('');
  const marked = done.size;
  const routeTabs = a.roles.map((role, index) => `<button type="button" class="skill-tree-role ${role.id === tree.roleId ? 'active' : ''}" data-combined-action="select:${index === 0 ? 'A' : 'B'}">${e(P(role.title))}</button>`).join('');
  return `<div class="an-skill-tree" data-rebuild="skill-tree">
    <header class="skill-tree-head">
      <span class="an-eyebrow">${L('SKILL DNA · PREREQUISITE TREE', '技能 DNA · 先修关系树', 'SKILL DNA · POKOK PRASYARAT')}</span>
      <h2>${e(P(tree.title))}</h2>
      <p>${L('These are official O*NET requirements, ordered as a planning aid. None of them is measured for you yet; your questionnaire describes habits and reported experience, not proficiency.', '以下为 O*NET 官方要求，按规划辅助顺序排列。目前均未对你测量；问卷描述的是习惯与自述经历，不是熟练度。', 'Ini keperluan rasmi O*NET, disusun sebagai bantuan perancangan. Tiada satu pun diukur untuk anda; soal selidik menerangkan amalan dan pengalaman, bukan kemahiran.')}</p>
    </header>
    <nav class="skill-tree-role-tabs" aria-label="${L('Route', '路线', 'Laluan')}">${routeTabs}</nav>
    <div class="skill-tree-status"><span>${L('Readiness', '准备度', 'Kesediaan')}</span><strong>${e(readinessLabel)}</strong><span>${marked} / ${tree.total} ${L('marked in this session', '本会话已标记', 'ditanda dalam sesi ini')}</span></div>
    <div class="skill-tree-stage-list">${stageMarkup}</div>
    <div class="skill-tree-actions">
      ${next >= 0 ? `<button type="button" class="button secondary" data-combined-action="skill-step-done:${e(tree.roleId)}:${next}">${L('Mark the suggested step as practiced', '将建议步骤标记为已实践', 'Tanda langkah cadangan sebagai diamalkan')} ↗</button>` : `<p class="skill-tree-done">${L('All requirements are marked in this session. Reset to start again.', '本会话所有要求均已标记。可重置重新开始。', 'Semua keperluan ditanda dalam sesi ini. Tetapkan semula untuk mula semula.')}</p>`}
      <button type="button" class="text-button" data-combined-action="tree-reset">${L('Reset my session marks', '重置本会话标记', 'Tetapkan semula tanda sesi')}</button>
      <button type="button" class="button primary" data-combined-action="plan:${e(tree.roleId)}">${L('Plan this in What If', '在 What If 中规划', 'Rancang ini dalam What If')} →</button>
    </div>
    <p class="skill-tree-note">${L('Ordering is a planning aid derived from requirement labels, not a validated prerequisite standard. A marked step is your own note and does not certify a skill.', '顺序是基于要求名称的规划辅助，不是经过验证的先修标准。标记步骤只是你自己的备注，不代表技能认证。', 'Susunan ialah bantuan perancangan daripada label keperluan, bukan standard prasyarat disahkan. Langkah ditanda ialah nota anda, bukan pensijilan kemahiran.')}</p>
  </div>`;
}

// PR #14 original Skill DNA workspace, adapted to the assessment evidence model:
// roles are the hexagonal nodes, official requirements fan out as skill leaves,
// and session progress is a note that never certifies proficiency.
export function renderSkillDna(assessment, options = {}) {
  const a = assessment;
  const roleId = a?.roles?.[options.path === 'B' ? 1 : 0]?.id || a?.roles?.[0]?.id;
  const tree = buildSkillTree(a, roleId);
  if (!tree) return `<section class="an-empty">${L('No requirements are available for this route.', '此路线暂无技能要求。', 'Tiada keperluan kemahiran untuk laluan ini.')}</section>`;
  const progress = sanitizeProgress(tree, options.skillProgress ?? {});
  const done = new Set(progress[tree.roleId] ?? []);
  const next = nextStepIndex(tree, progress);
  const readiness = !tree.readiness || tree.readiness.status === 'unknown' ? L('No practice reported', '未自述实践', 'Tiada amalan dilaporkan') : tree.readiness.status === 'reported' ? L('Practice reported · not verified per skill', '自述实践 · 未逐项验证', 'Amalan dilaporkan · belum disahkan') : L('Limited or mixed reported practice', '自述实践有限或不一致', 'Amalan dilaporkan terhad atau bercampur');
  const rolePos = [[250, 190], [750, 190]];
  const core = [500, 515];
  const roleNodes = a.roles.map((role, index) => {
    const [x, y] = rolePos[index];
    return `<button type="button" class="dna-role-node ${role.id === tree.roleId ? 'active' : ''}" style="left:${x / 10}%;top:${y / 6.2}%" data-combined-action="select:${index === 0 ? 'A' : 'B'}" data-search-text="${e(String(P(role.title)).toLowerCase())}" aria-pressed="${role.id === tree.roleId}"><span aria-hidden="true">${index === 0 ? '◇' : '⌘'}</span><small>${L('ROUTE', '路线', 'LALUAN')}</small><strong>${e(P(role.title))}</strong></button>`;
  }).join('');
  const leafButtons = [];
  const leafPaths = [];
  a.roles.forEach((role, index) => {
    const roleTree = buildSkillTree(a, role.id);
    const [x, y] = rolePos[index];
    const items = roleTree.flattened.slice(0, 8);
    const n = Math.max(1, items.length);
    items.forEach((item, j) => {
      const angle = (25 + j * (130 / n)) * Math.PI / 180;
      const lx = x + Math.cos(angle) * 155;
      const ly = y + Math.sin(angle) * 130 + 28;
      const flatIndex = roleTree.flattened.indexOf(item);
      const isDone = done.has(flatIndex);
      const isNext = role.id === tree.roleId && flatIndex === next;
      const cls = isDone ? 'dna-node-match' : isNext ? 'dna-node-next' : 'dna-node-locked';
      leafButtons.push(`<button type="button" class="dna-map-node ${cls}" style="left:${lx / 10}%;top:${ly / 6.2}%" data-combined-action="skill-select:${encodeURIComponent(item.label)}" data-search-text="${e(String(item.label).toLowerCase())}" aria-label="${e(item.label)}, ${isDone ? 'marked practiced' : isNext ? 'suggested next' : 'unassessed'}"><span class="dna-map-icon" aria-hidden="true">${isDone ? '✓' : isNext ? '◆' : '·'}</span><span class="dna-map-label">${e(item.label)}</span></button>`);
      leafPaths.push(`<path class="dna-link dna-link-skill ${role.id === tree.roleId ? 'active' : ''}" d="M${x} ${y} Q${(x + lx) / 2} ${(y + ly) / 2} ${lx} ${ly}"/>`);
    });
  });
  const coreLinks = a.roles.map((role, index) => {
    const [x, y] = rolePos[index];
    return `<path class="dna-link dna-link-role ${role.id === tree.roleId ? 'active' : ''}" d="M${core[0]} ${core[1]} Q${(core[0] + x) / 2} ${(core[1] + y) / 2 - 45} ${x} ${y}"/>`;
  }).join('');
  const labels = tree.flattened.map(item => item.label);
  const selectedLabel = labels.find(label => String(label).toLowerCase() === String(options.skill ?? '').toLowerCase()) || (next >= 0 ? tree.flattened[next].label : labels[0]);
  const selectedIndex = tree.flattened.findIndex(item => item.label === selectedLabel);
  const selectedItem = selectedIndex >= 0 ? tree.flattened[selectedIndex] : null;
  const selectedDone = selectedIndex >= 0 && done.has(selectedIndex);
  const selectedStage = selectedItem ? SKILL_STAGES[selectedItem.stageIndex] : null;
  const shared = selectedItem && tree.shared.includes(selectedItem.label);
  const treeMarkup = tree.flattened.map((item, index) => {
    const isDone = done.has(index);
    const isNext = index === next;
    return `<li class="dna-tree-skill ${isDone ? 'dna-done' : isNext ? 'dna-next' : 'dna-locked'}"><span class="dna-node-dot" aria-hidden="true">${isDone ? '✓' : isNext ? '◆' : '·'}</span><span>${e(item.label)}</span><small>${e(L(...SKILL_STAGES[item.stageIndex].label))}</small></li>`;
  }).join('');
  const nav = [['profile', '⌂', ['Personal profile', '个人画像', 'Profil peribadi']], ['capability', '▣', ['AI capability', 'AI 能力', 'Keupayaan AI']], ['galaxy', '◇', ['Career galaxy', '职业星系', 'Galaksi kerjaya']], ['whatif', '▤', ['What if', '假设未来', 'Bagaimana jika']]].map(([page, icon, label]) => `<button type="button" data-combined-action="page:${page}"><span>${icon}</span>${e(L(...label))}</button>`).join('');
  return `<div class="dna-workspace" data-rebuild="skill-tree">
    <aside class="dna-workspace-nav"><div class="dna-brand-mark" aria-hidden="true">✦</div><strong>Career Navigator</strong><small>${L('YOUR WORKSPACE', '你的工作台', 'RUANG KERJA ANDA')}</small><nav aria-label="${L('Skill DNA navigation', '技能 DNA 导航', 'Navigasi Skill DNA')}">${nav}<button type="button" class="active" aria-current="page"><span>⌘</span>${L('Skill DNA', '技能 DNA', 'Skill DNA')}</button></nav><div class="dna-nav-profile"><span class="dna-avatar">${e(String(P(tree.title)).trim().slice(0, 1).toUpperCase())}</span><span><strong>${e(P(tree.title))}</strong><small>${tree.total} ${L('requirements', '项要求', 'keperluan')}</small></span></div></aside>
    <div class="dna-workspace-main">
      <header class="dna-toolbar"><div><span class="dna-toolbar-kicker">SKILL DNA</span><p>${L('Explore the official skills behind each route, in prerequisite order.', '按先修顺序探索每条路线的官方技能。', 'Terokai kemahiran rasmi di sebalik setiap laluan, mengikut urutan prasyarat.')}</p></div><label class="dna-search"><span aria-hidden="true">⌕</span><input type="search" data-skill-search placeholder="${L('Search skills or roles', '搜索技能或职业', 'Cari kemahiran atau laluan')}" aria-label="${L('Search skills or roles', '搜索技能或职业', 'Cari kemahiran atau laluan')}"></label><span class="dna-live-dot" aria-label="${L('Local report data', '本地报告数据', 'Data laporan setempat')}">●</span></header>
      <div class="dna-canvas-layout">
        <section class="dna-canvas-panel" aria-label="${L('Interactive skill and career graph', '交互式技能与职业关系图', 'Graf kemahiran dan kerjaya interaktif')}"><div class="dna-canvas-label"><span>${L('EXPLORATION GRAPH', '探索关系图', 'GRAF PENEROKAAN')}</span><span>${e(P(tree.title))}</span></div><div class="dna-graph-canvas"><svg class="dna-graph-lines" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="dnaPathGlow" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#42dfff"/><stop offset="1" stop-color="#bc67ff"/></linearGradient></defs>${coreLinks}${leafPaths}</svg><div class="dna-profile-core" style="left:${core[0] / 10}%;top:${core[1] / 6.2}%"><span aria-hidden="true">♙</span><small>${L('YOUR START', '你的起点', 'TITIK MULA')}</small><strong>${e(readiness)}</strong></div>${roleNodes}${leafButtons.join('')}<div class="dna-graph-title"><span>CAREER EXPLORATION</span><strong>&amp; SKILL DNA</strong></div></div><div class="dna-graph-legend"><span><i></i> ${L('Marked practiced', '已标记实践', 'Ditanda diamalkan')}</span><span><i class="build"></i> ${L('Suggested next', '建议下一步', 'Cadangan seterusnya')}</span><span><i class="dim"></i> ${L('Unassessed requirement', '未评估要求', 'Keperluan belum dinilai')}</span></div><details class="dna-prereq" open><summary>${L('Prerequisite path', '先修路径', 'Laluan prasyarat')} · ${done.size} / ${tree.total} ${L('unlocked', '已解锁', 'dibuka')}</summary><ol class="dna-tree-list">${treeMarkup}</ol><p class="dna-truth-note">${L('Ordering is a planning aid derived from requirement labels, not a validated prerequisite standard.', '顺序是基于要求名称的规划辅助，不是经过验证的先修标准。', 'Susunan ialah bantuan perancangan daripada label keperluan, bukan standard prasyarat disahkan.')}</p><button type="button" class="dna-action-button" data-combined-action="tree-reset">${L('Reset my session marks', '重置本会话标记', 'Tetapkan semula tanda sesi')}</button></details></section>
        <aside class="dna-inspector" aria-live="polite"><span class="dna-inspector-icon" aria-hidden="true">${selectedDone ? '✦' : '⌘'}</span><span class="dna-inspector-type">${L('SKILL', '技能', 'KEMAHIRAN')}</span><h2>${e(selectedLabel || L('Select a skill', '选择一项技能', 'Pilih kemahiran'))}</h2><span class="dna-status-pill ${selectedDone ? 'done' : ''}">${selectedDone ? L('You marked practiced', '你标记了实践', 'Anda tanda diamalkan') : selectedItem ? L('To develop / verify', '待培养／核验', 'Untuk dibangunkan / disahkan') : L('Unassessed', '未评估', 'Belum dinilai')}</span><p class="dna-inspector-copy">${selectedItem ? (shared ? L('This requirement is shared with the other route in your direction.', '这项要求与你的方向的另一路线共有。', 'Keperluan ini dikongsi dengan laluan lain dalam arah anda.') : L('An official O*NET requirement. The questionnaire does not establish it for you; test it with a small sample.', '这是一项 O*NET 官方要求。问卷尚未为你确立它；可用小样本验证。', 'Keperluan rasmi O*NET. Soal selidik tidak menentukannya; uji dengan sampel kecil.')) : L('Select any skill node to see its role and requirement.', '选择任意技能节点查看其作用与要求。', 'Pilih mana-mana nod kemahiran untuk melihat peranan dan keperluan.')}</p>${selectedStage ? `<div class="dna-inspector-section"><h3>${L('Stage', '阶段', 'Peringkat')}</h3><p>${e(L(...selectedStage.label))}</p></div>` : ''}<div class="dna-experiment"><span>⚗ NEXT EXPERIMENT</span><strong>${e(P(tree.title))}</strong><p>${e(P(tree.project))}</p><button type="button" data-combined-action="plan:${e(tree.roleId)}">${L('Open in What If', '在 What If 中打开', 'Buka dalam What If')} <b aria-hidden="true">→</b></button></div>${next >= 0 ? `<button type="button" class="dna-action-button" data-combined-action="skill-step-done:${e(tree.roleId)}:${next}">${L('Mark suggested step as practiced', '将建议步骤标记为已实践', 'Tanda langkah cadangan sebagai diamalkan')}</button>` : `<p class="dna-truth-note">${L('All requirements are marked. This is your note, not certification.', '所有要求均已标记。这只是你的备注，不是认证。', 'Semua keperluan ditanda. Ini nota anda, bukan pensijilan.')}</p>`}<p class="dna-truth-note">${L('Progress is a session note and never certifies proficiency.', '进度只是会话备注，不代表技能认证。', 'Kemajuan ialah nota sesi dan tidak mensijilkan kemahiran.')}</p></aside>
      </div>
      <p class="dna-footnote">${L('Suggested sequence follows the report’s skill-gap order. It is a planning aid, not a validated prerequisite standard.', '建议顺序遵循报告中的技能缺口顺序，是规划辅助，不是经过验证的先修标准。', 'Urutan cadangan mengikut susunan jurang kemahiran laporan, bantuan perancangan, bukan standard prasyarat disahkan.')}</p>
    </div>
  </div>`;
}
