// Skill tree model: turns the report's skills and routes into ordered prerequisite chains.
// Rule: a skill only appears once its parent is lit. Nothing outside the report is invented.

const BASES = ['ai', 'ai use', 'safe ai use', 'prompting', 'summari', 'draft', '基础', 'ai 基础', 'attention', 'coordination', 'follow-through', '逻辑'];
const norm = value => String(value ?? '').trim().toLowerCase();
export const skillKey = (routeId, skill) => `${routeId}::${norm(skill)}`;

// Generic ordering used when a report supplies skills without a curated demo order.
// The stage lists are ordered: the earliest matching stage wins, so 'design' is checked before 'analysis'.
const FOUNDATIONS = ['spread', 'survey', 'method', 'analysis', 'analysis method', '研究', '方法'];
const APPLICATIONS = ['reporting', 'documentation', 'interpretation', 'presenting', 'presentation', 'workflow', 'communication', 'tracking', 'spread', 'mapping', 'measure'];
const ADVANCED = ['design', 'experiment', 'risk', 'metric', 'measure', 'review', 'analysis'];

function stage(skill) {
  const text = norm(skill);
  const test = list => list.some(word => text.includes(word)) ? 1 : 0;
  if (test(BASES)) return 0;
  if (test(APPLICATIONS)) return 1;
  if (test(FOUNDATIONS)) return 2;
  if (test(ADVANCED)) return 3;
  return 2;
}

function ordered(list, curated = []) {
  const rank = new Map(curated.map((name, index) => [norm(name), index]));
  const byRank = (a, b) => {
    const ca = rank.has(norm(a)) ? rank.get(norm(a)) : Infinity;
    const cb = rank.has(norm(b)) ? rank.get(norm(b)) : Infinity;
    return ca - cb;
  };
  return [...list].sort((a, b) => {
    if (rank.size) {
      const diff = byRank(a, b);
      if (diff) return diff;
    }
    if (stage(a) !== stage(b)) return stage(a) - stage(b);
    return a.localeCompare(b);
  });
}

export function buildSkillTree(model) {
  const report = model.report;
  const curated = report?.scenario?.skillTree ?? {};
  const available = new Set(model.skills.map(norm));
  const routes = model.paths.map(path => {
    const listed = [...new Set([...(path.strengths ?? []), ...(path.gaps ?? []), ...(path.matches ?? [])])];
    const missing = listed.filter(skill => !model.profileSkills.some(s => norm(s) === norm(skill)));
    // A curated demo order names only the gaps, so it is stretched over the remaining route skills.
    const leading = missing.filter(skill => curated[path.id]?.some(name => norm(name) === norm(skill)));
    const rest = missing.filter(skill => !leading.includes(skill));
    const needs = rankOnly(leading, curated[path.id] ?? []).concat(ordered(rest));
    const all = ordered(listed, curated[path.id] ?? []);
    const held = new Set(model.profileSkills.map(norm));
    const chain = all.map(name => ({ name, held: held.has(norm(name)) }));
    const open = chain.filter(entry => !entry.held);
    const transferable = chain.filter(entry => entry.held);
    const itemsOf = list => list.map((entry, index) => ({
      routeId: path.id, skill: entry.name, key: skillKey(path.id, entry.name),
      parentKey: index === 0 ? 'core' : skillKey(path.id, list[index - 1].name),
      next: index > 0 ? list[index - 1].name : null, depth: index + 1, gap: (path.gaps ?? []).some(g => norm(g) === norm(entry.name))
    }));
    return { id: path.id, title: path.title, subtitle: path.reason || '', needs: needs.map(x => x.name ?? x), transferable: transferable.map(x => x.name), items: itemsOf(open) };
  });
  const known = routes.flatMap(route => route.items).map(item => item.skill);
  const unmatched = model.skills.filter(skill => !model.profileSkills.some(s => norm(s) === norm(skill)) && !known.some(s => norm(s) === norm(skill)));
  const items = routes.flatMap(route => route.items);
  const initials = String(report?.profile?.background || '你').trim().slice(0, 1);
  return {
    initials, background: report?.profile?.background || '你',
    profileSkills: model.profileSkills, routes, items, unmatched, available,
    curated: Object.keys(curated).length > 0
  };
}

function rankOnly(list, curated) {
  const rank = new Map(curated.map((name, index) => [norm(name), index]));
  return list.map(name => ({ name })).sort((a, b) => (rank.get(norm(a.name)) ?? 0) - (rank.get(norm(b.name)) ?? 0)).map(x => x.name);
}

export function defaultLit(tree) {
  const lit = new Set(['core']);
  tree.profileSkills.forEach(skill => lit.add(skillKey('core', skill)));
  return lit;
}

export function itemState(item, lit, tree) {
  if (lit.has(item.key)) return 'lit';
  // Every item in a route is directly selectable. The prerequisite chain only
  // orders the display, so a learner can start at any step they already need.
  return 'available';
}

// Only the lowest unlit skill of each route is offered next, so the tree reads as one ordered path.
export function nextTarget(tree, lit) {
  const pending = tree.items.filter(item => !lit.has(item.key)).sort((a, b) => a.depth - b.depth)[0];
  if (!pending) return null;
  return itemState(pending, lit, tree) === 'available' ? pending : null;
}

export function litCount(tree, lit) {
  return tree.routes.reduce((total, route) => total + route.items.filter(item => lit.has(item.key)).length, 0);
}

export function sanitizeLit(tree, values) {
  const allowed = new Set(['core', ...tree.profileSkills.map(skill => skillKey('core', skill)), ...tree.routes.flatMap(r => r.items.map(i => i.key))]);
  const lit = new Set();
  for (const value of Array.isArray(values) ? values : []) if (allowed.has(value)) lit.add(value);
  return lit;
}
