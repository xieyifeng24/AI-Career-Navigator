import { buildCareerExplorerModel } from './career-explorer.js';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e = escapeHTML;
const text = value => typeof value === 'string' ? value : value?.text ?? '';
const safeURL = value => typeof value === 'string' && value.startsWith('https://') ? value : '';

function parseSkills(value) {
  return String(value ?? '').split(/[,;|\n]+/).map(item => item.trim()).filter(Boolean).slice(0, 6);
}

function sourceLinks(ids, sources) {
  return (ids ?? []).map(id => {
    const source = sources?.[id];
    const url = safeURL(source?.url);
    return url ? `<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(source.title || id)} ↗</a>` : '';
  }).filter(Boolean).join(' · ');
}

function asSkillList(items, sources) {
  return (items ?? []).map(item => typeof item === 'string'
    ? { skill: item, advice: '', sdg: null }
    : { skill: item.skill, advice: text(item.advice), adviceSources: sourceLinks(item.advice?.source_ids, sources), sdg: item.sdg ?? null });
}

export function buildCareerStarMapModel(report) {
  const profile = report?.profile ?? {};
  const live = report?.mode === 'real-ai' && report?.analysis;
  const sources = report?.evidence?.sources ?? {};
  const ids = ['A', 'B', 'C'];
  const paths = ids.map(id => {
    if (live) {
      const path = report.analysis.paths?.find(item => item.kind === id);
      if (!path) return null;
      const role = report.ranking?.find(item => item.id === path.role_id);
      const marketSource = sources[role?.source_id];
      const market = role?.growth && role?.period && safeURL(marketSource?.url)
        ? { growth: role.growth, period: role.period, geography: report.evidence?.geography || 'Geography not specified', source: marketSource.title || 'Occupational source', url: marketSource.url }
        : null;
      return {
        id,
        title: role?.title || path.role_id,
        reason: text(path.why), reasonSources: sourceLinks(path.why?.source_ids, sources),
        strengths: asSkillList(path.transferable, sources),
        gaps: asSkillList(path.gaps, sources),
        next: text(path.next_step), nextSources: sourceLinks(path.next_step?.source_ids, sources),
        constraint: text(path.challenge), constraintSources: sourceLinks(path.challenge?.source_ids, sources),
        market,
        sdg: path.sdg ?? null,
        opportunities: []
      };
    }
    const path = report?.scenario?.paths?.[id];
    if (!path) return null;
    return {
      id,
      title: path.subtitle || path.title,
      reason: path.why || '', reasonSources: '',
      strengths: asSkillList(path.strengths),
      gaps: asSkillList(path.gaps),
      next: path.next || '', nextSources: '',
      constraint: path.constraints || '', constraintSources: '',
      market: null,
      sdg: path.sdg ?? (path.sdgMapping ? {target:path.sdgMapping.target,rationale:path.sdgMapping.rationale,measure:path.sdgMapping.measure,relationship:path.sdgMapping.relationship} : null),
      opportunities: path.opportunities ?? []
    };
  }).filter(Boolean);
  const mapped = new Set(paths.map(path => path.id));
  for (const route of buildCareerExplorerModel(report).paths) {
    if (mapped.has(route.id)) continue;
    paths.push({
      id: route.id, title: route.title, reason: route.reason, reasonSources: '',
      strengths: route.strengths.map(skill => ({skill, advice:''})),
      gaps: route.gaps.map(skill => ({skill, advice:''})),
      next: route.next, nextSources: '', constraint: route.constraint, constraintSources: '',
      market: route.market, sdg: route.sdg, opportunities: [],
      evidenceKind: route.evidenceKind
    });
  }
  return {
    mode: live ? 'live' : 'demo',
    currentRole: profile.background || 'Your current role',
    experience: profile.experience || '',
    skills: parseSkills(profile.skills),
    paths,
    sources
  };
}

function renderSkillRows(label, items) {
  if (!items.length) return '';
  return `<div class="star-detail-group"><h3>${e(label)}</h3><ul>${items.map(item => `<li><strong>${e(item.skill)}</strong>${item.advice ? `<span>${e(item.advice)}</span>` : ''}${item.adviceSources ? `<small class="star-source-links">${item.adviceSources}</small>` : ''}${item.sdg ? renderSkillSDG(item.sdg) : ''}</li>`).join('')}</ul></div>`;
}

function renderSkillSDG(sdg) {
  if (!sdg?.target || !/^([1-9]|1[0-7])(?:\.\d+)?$/.test(String(sdg.target))) return '';
  const goal = String(sdg.target).split('.')[0];
  return `<div class="star-skill-sdg"><strong>Proposed SDG ${e(sdg.target)} connection</strong>${sdg.rationale ? `<span>${e(sdg.rationale)}</span>` : ''}${sdg.measure ? `<span><b>Possible measure:</b> ${e(sdg.measure)}</span>` : ''}<a href="https://sdgs.un.org/goals/goal${goal}" target="_blank" rel="noopener noreferrer">UN Goal ${goal} ↗</a><small>Proposed contribution, not measured impact.</small></div>`;
}

function renderSDG(sdg) {
  if (!sdg?.target || !/^([1-9]|1[0-7])(?:\.\d+)?$/.test(String(sdg.target))) {
    return `<p class="star-empty">No supported SDG link is available in this report.</p>`;
  }
  const goal = String(sdg.target).split('.')[0];
    return `<div class="star-sdg"><span class="star-detail-label">PROPOSED SDG CONNECTION</span><strong>SDG ${e(sdg.target)}</strong>${sdg.relationship ? `<span class="star-sdg-relation">${e(sdg.relationship)}</span>` : ''}<p>${e(sdg.rationale || 'The report suggests this connection.')}</p>${sdg.measure ? `<p><b>Possible measure:</b> ${e(sdg.measure)}</p>` : ''}<a href="https://sdgs.un.org/goals/goal${goal}" target="_blank" rel="noopener noreferrer">Explore UN Goal ${goal} ↗</a><small>A proposed contribution, not measured impact.</small></div>`;
}

function renderRouteDetail(path, selected, pathChosen) {
  const market = path.market
    ? `<div class="star-market"><span class="star-detail-label">PUBLISHED OUTLOOK</span><strong>${e(path.market.growth)}</strong><p>${e(path.market.geography)} · ${e(path.market.period)}</p><a href="${e(path.market.url)}" target="_blank" rel="noopener noreferrer">${e(path.market.source)} ↗</a></div>`
    : `<div class="star-market star-empty"><span class="star-detail-label">PUBLISHED OUTLOOK</span><p>Market trend data is not available for this route in this report.</p></div>`;
  return `<section class="star-route-detail" id="star-map-detail" aria-live="polite" aria-label="Path ${e(path.id)} details">
    <div class="star-detail-heading"><div><span class="kicker">PATH ${e(path.id)} · ${selected ? 'CURRENT FOCUS' : 'EXPLORE THIS PATH'}</span><h2>${e(path.title)}</h2></div><span class="star-route-mark" aria-hidden="true">✦</span></div>
    <div class="star-detail-grid">
      <div class="star-detail-main">
        <div class="star-detail-group"><h3>Why this path may fit</h3><p>${e(path.reason || 'No path explanation is available.')}</p>${path.reasonSources ? `<small class="star-source-links">${path.reasonSources}</small>` : ''}</div>
        ${renderSkillRows('Skills you can carry forward', path.strengths)}
        ${renderSkillRows('Skills to develop', path.gaps)}
        ${path.opportunities.length ? `<div class="star-detail-group"><h3>Potential opportunities</h3><ul>${path.opportunities.map(item => `<li>${e(item)}</li>`).join('')}</ul></div>` : ''}
        <div class="star-detail-group"><h3>Next experiment</h3><p>${e(path.next || 'No next experiment is available.')}</p>${path.nextSources ? `<small class="star-source-links">${path.nextSources}</small>` : ''}</div>
        ${path.constraint ? `<div class="star-detail-group star-constraint"><h3>Real-world constraint</h3><p>${e(path.constraint)}</p>${path.constraintSources ? `<small class="star-source-links">${path.constraintSources}</small>` : ''}</div>` : ''}
      </div>
      <aside class="star-detail-aside">${market}</aside>
    </div>
    <div class="star-detail-actions">${pathChosen ? `<button type="button" class="button secondary" data-action="page:paths">Compare route details ↗</button><button type="button" class="button primary" data-action="page:plan">Build my action plan →</button>` : `<button type="button" class="button primary" data-action="choose-path:${e(path.id)}">Choose this route and continue →</button>`}</div>
  </section>`;
}

export function renderCareerStarMap(report, selectedPath = 'A', pathChosen = false) {
  const model = buildCareerStarMapModel(report);
  const paths = model.paths;
  const selected = paths.find(path => path.id === selectedPath) || paths[0];
  const skills = model.skills.length
    ? model.skills.map(skill => `<span class="star-skill-chip">${e(skill)}</span>`).join('')
    : `<span class="star-skill-chip star-skill-muted">Add skills to your profile</span>`;
  const modeNote = model.mode === 'demo'
    ? '<p class="star-map-note"><strong>DEMO / MOCK.</strong> These routes are scripted examples. No labor-market forecast is included in this demo.</p>'
    : '<p class="star-map-note">Paths are drawn from this report. Published outlooks are shown only when a matching source is available.</p>';
  const routeButtons = paths.map(path => {
    const active = pathChosen && path.id === selected?.id;
    const carry = path.strengths.slice(0, 2).map(item => item.skill);
    const build = path.gaps.slice(0, 2).map(item => item.skill);
    return `<button type="button" class="star-map-route ${active ? 'is-selected' : ''}" data-action="map-select:${e(path.id)}" aria-pressed="${active}" aria-controls="star-map-detail">
      <span class="star-route-eyebrow"><span>PATH ${e(path.id)}</span><span class="star-route-symbol" aria-hidden="true">✦</span></span>
      <strong>${e(path.title)}</strong>
        <span class="star-route-caption">${path.id === 'A' ? 'Build on your current direction' : path.id === 'B' ? 'Explore an adjacent direction' : 'Consider another source-based option'}</span>
      <span class="star-route-skills"><span><b>Carry</b> ${e(carry.join(' · ') || 'See path details')}</span><span><b>Grow</b> ${e(build.join(' · ') || 'See path details')}</span></span>
      ${path.market ? `<span class="star-route-signal">${e(path.market.growth)} · ${e(path.market.geography)}</span>` : `<span class="star-route-signal star-no-signal">No verified market signal in this report</span>`}
    </button>`;
  }).join('');
  return `<div class="star-map-page">
    <div class="report-head"><div class="report-head-top"><span class="kicker">YOUR CAREER ROADMAP</span><span class="demo-badge">${model.mode === 'demo' ? 'DEMO / MOCK' : 'BASED ON THIS REPORT'}</span></div><h1>Choose a direction for your next chapter.</h1><p>Explore the paths grounded in your assessment. Choose one to unlock its personalized action plan.</p></div>
    ${!pathChosen?'<div class="star-choice-prompt"><span aria-hidden="true">✦</span><div><strong>Start by choosing a path</strong><p>Select a route node, review its strengths and gaps, then continue to the matching action plan.</p></div></div>':''}
    <section class="star-map-stage" aria-label="Career star map">
      <svg class="star-map-edges" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true"><path d="M500 154 C500 210 170 205 170 268"/><path d="M500 154 C500 210 500 215 500 268"/><path d="M500 154 C500 210 830 205 830 268"/><circle cx="500" cy="154" r="5"/><circle cx="170" cy="268" r="5"/><circle cx="500" cy="268" r="5"/><circle cx="830" cy="268" r="5"/></svg>
      <div class="star-map-origin"><span class="star-core-icon" aria-hidden="true">◎</span><div><span class="star-detail-label">YOUR STARTING POINT · ${e(model.experience || 'EXPERIENCE NOT SPECIFIED')}</span><h2>${e(model.currentRole)}</h2><div class="star-skill-chips" aria-label="Skills you listed">${skills}</div></div></div>
      <div class="star-map-routes">${routeButtons}</div>
      <div class="star-map-legend"><span><i class="legend-current"></i> Your starting point</span><span><i class="legend-path"></i> A path from your report</span></div>
    </section>
    ${selected ? renderRouteDetail(selected, pathChosen && selected.id === selectedPath, pathChosen) : '<p class="star-empty">No career paths are available in this report yet.</p>'}
    ${modeNote}
  </div>`;
}
