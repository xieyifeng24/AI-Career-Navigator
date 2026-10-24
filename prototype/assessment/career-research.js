// Independent career research layer. Official facts come from the bundled O*NET
// snapshot; every derived classification is labelled as team inference and never
// presented as an official statistic or a prediction.
const TASK_KINDS = {
  core: ['analyze', 'analysis', 'evaluate', 'interpret', 'recommend', 'determine', 'plan', 'design', 'develop', 'assess', 'identify'],
  auxiliary: ['enter', 'record', 'file', 'schedule', 'maintain', 'answer', 'greet', 'copy', 'process', 'order', 'update', 'track', 'compile'],
  creative: ['create', 'write', 'produce', 'design', 'innovate', 'generate', 'compose', 'draft'],
  human: ['advise', 'collaborate', 'confer', 'present', 'explain', 'negotiate', 'mentor', 'coach', 'supervise', 'communicate', 'interview', 'teach', 'solicit', 'mediate'],
  aiChanged: ['analyze data', 'generate', 'summarize', 'translate', 'draft', 'document', 'prepare reports', 'data analysis', 'model', 'software', 'process data'],
};

const SKILL_GROUPS = {
  technical: ['programming', 'software', 'technology design', 'systems analysis', 'systems evaluation', 'operations analysis', 'equipment selection', 'installation', 'science', 'mathematics'],
  people: ['coordination', 'persuasion', 'negotiation', 'instructing', 'service orientation', 'social perceptiveness', 'speaking', 'management of personnel'],
  cognitive: ['reading comprehension', 'active listening', 'writing', 'critical thinking', 'active learning', 'learning strategies', 'judgment and decision making', 'complex problem solving', 'monitoring', 'troubleshooting', 'quality control analysis', 'time management', 'management of material resources', 'management of financial resources'],
};

export const FUTURE_AXES = [
  { id: 'technical', label: ['Technical & digital', '技术与数字', 'Teknikal & digital'], keywords: SKILL_GROUPS.technical },
  { id: 'cognitive', label: ['Cognitive & analytical', '认知与分析', 'Kognitif & analitik'], keywords: SKILL_GROUPS.cognitive },
  { id: 'people', label: ['People & coordination', '人际与协调', 'Orang & koordinasi'], keywords: SKILL_GROUPS.people },
  { id: 'aiData', label: ['AI & data', 'AI 与数据', 'AI & data'], keywords: ['data', 'software', 'technology', 'system', 'programming', 'machine learning', 'model', 'analysis'] },
];

export function futureSkillAxes(requirements) {
  return FUTURE_AXES.map(axis => {
    const skills = (requirements ?? []).filter(item => axis.keywords.some(word => String(item.label).toLowerCase().includes(word)));
    return { id: axis.id, label: axis.label, count: skills.length, skills: skills.map(item => item.label) };
  });
}

function groupOfSkill(label) {
  const t = String(label ?? '').toLowerCase();
  for (const group of ['technical', 'people', 'cognitive']) if (SKILL_GROUPS[group].some(word => t.includes(word))) return group;
  return 'cognitive';
}

function classifyTask(label) {
  const t = String(label ?? '').toLowerCase();
  if (TASK_KINDS.aiChanged.some(word => t.includes(word))) return 'aiChanged';
  if (TASK_KINDS.creative.some(word => t.includes(word))) return 'creative';
  if (TASK_KINDS.human.some(word => t.includes(word))) return 'human';
  if (TASK_KINDS.auxiliary.some(word => t.includes(word))) return 'auxiliary';
  if (TASK_KINDS.core.some(word => t.includes(word))) return 'core';
  return 'core';
}

function valueShiftFor(aiImpact, requirements) {
  const labels = requirements.map(item => String(item.label).toLowerCase());
  const technical = labels.filter(label => groupOfSkill(label) === 'technical');
  const human = labels.filter(label => groupOfSkill(label) === 'people' || groupOfSkill(label) === 'cognitive');
  if (aiImpact?.path === 'ai-growth') return { rising: technical.slice(0, 3), declining: [], note: 'ai-growth' };
  if (aiImpact?.path === 'automation-pressure') return { rising: human.slice(0, 3), declining: labels.filter(label => TASK_KINDS.auxiliary.some(word => label.includes(word))).slice(0, 3), note: 'automation-pressure' };
  if (aiImpact?.path === 'limited-change') return { rising: human.slice(0, 3), declining: [], note: 'limited-change' };
  return { rising: [...technical.slice(0, 2), ...human.slice(0, 2)], declining: labels.filter(label => TASK_KINDS.auxiliary.some(word => label.includes(word))).slice(0, 2), note: 'restructuring' };
}

export function buildCareerStudy(assessment, role) {
  const source = role?.source;
  const tasks = source?.tasks ?? role?.tasks ?? [];
  const categories = { core: [], auxiliary: [], creative: [], human: [], aiChanged: [] };
  for (const task of tasks) {
    const kind = classifyTask(task.label);
    (categories[kind] = categories[kind] || []).push(task);
  }
  const groups = { technical: [], people: [], cognitive: [] };
  for (const requirement of role?.requirements ?? []) groups[groupOfSkill(requirement.label)].push(requirement);
  const adjacent = [];
  const ownLabels = new Set((role?.requirements ?? []).map(item => String(item.label).toLowerCase()));
  for (const other of assessment?.roles ?? []) {
    if (other.id === role?.id) continue;
    const shared = (other.requirements ?? []).filter(item => ownLabels.has(String(item.label).toLowerCase())).map(item => item.label);
    if (shared.length) adjacent.push({ roleId: other.id, title: other.title, shared });
  }
  adjacent.sort((a, b) => b.shared.length - a.shared.length || String(a.roleId).localeCompare(String(b.roleId)));
  return {
    roleId: role?.id,
    sourceId: role?.sourceId,
    sourceVersion: source?.version ?? 'unavailable',
    verifiedAt: source?.verified_at ?? null,
    geography: source?.geography ?? 'US',
    description: source?.description ?? '',
    education: source?.education?.map(item => item.label) ?? [],
    taskStructure: { categories, counts: Object.fromEntries(Object.entries(categories).map(([key, list]) => [key, list.length])), rule: 'task-structure-v1', inferred: true },
    aiImpact: role?.aiImpact ?? null,
    valueShift: valueShiftFor(role?.aiImpact, role?.requirements ?? []),
    skillGroups: groups,
    development: { adjacent, rule: 'shared-skill-basis-v1', inferred: true },
    marketByRegion: role?.marketByRegion ?? {},
    inferredFields: ['taskStructure', 'valueShift', 'development'],
    factualFields: ['description', 'education', 'tasks', 'skills', 'abilities', 'sourceVersion', 'verifiedAt', 'geography'],
  };
}
