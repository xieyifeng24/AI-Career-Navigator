const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL = value => typeof value === 'string' && value.startsWith('https://') ? value : '';
const claimText = value => typeof value === 'string' ? value : value?.text ?? '';
const skillName = item => typeof item === 'string' ? item : item?.skill ?? '';
const skillsOf = items => (items ?? []).map(skillName).filter(Boolean);

function sourceLink(source, label) {
  const url = safeURL(source?.url);
  return url ? `<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label || source.title || 'Source')} ↗</a>` : '';
}

export function buildCareerExplorerModel(report) {
  const live = report?.mode === 'real-ai' && report?.analysis;
  const sources = report?.evidence?.sources ?? {};
  const ranking = report?.ranking ?? [];
  const paths = [];
  if (live) {
    for (const path of report.analysis.paths ?? []) {
      const role = ranking.find(item => item.id === path.role_id);
      const roleSource = sources[role?.source_id];
      paths.push({
        id: path.kind, title: role?.title || path.role_id, roleId: path.role_id,
        reason: claimText(path.why), strengths: skillsOf(path.transferable), gaps: skillsOf(path.gaps), matches: role?.matched_skills ?? [],
        strengthItems: path.transferable ?? [], gapItems: path.gaps ?? [], next: claimText(path.next_step),
        constraint: claimText(path.challenge), task: role?.tasks?.[0] ?? '', tasks: role?.tasks ?? [],
        market: role?.growth && role?.period && safeURL(roleSource?.url) ? {
          growth: role.growth, period: role.period, geography: report.evidence?.geography || 'Geography unspecified',
          source: roleSource, url: roleSource.url
        } : null,
        sdg: path.sdg ?? null, roleSource, evidenceKind: 'AI-assisted path; occupational facts from cited source',
        comparisonNote: 'Path analysis is a model interpretation. Role facts and outlook come from the linked occupational source.'
      });
    }
    // A third route is a transparent source-based candidate, not a fabricated model path.
    for (const role of ranking) {
      if (paths.length >= 3) break;
      if (paths.some(path => path.roleId === role.id)) continue;
      const source = sources[role.source_id];
      paths.push({
        id: String.fromCharCode(65 + paths.length), title: role.title, roleId: role.id,
        reason: `Additional source-based candidate from the matching list. The matching score is an editorial heuristic, not a validated fit measure.`,
        strengths: role.matched_skills ?? [], gaps: role.gaps ?? [], matches: role.matched_skills ?? [], strengthItems: [], gapItems: [],
        next: role.tasks?.[0] ? `Review this cited task: “${role.tasks[0]}” and decide whether it matches your stated goal. Record one fictional work sample to test the fit.` : 'Review the cited occupational profile and record one fictional work sample to test the fit.',
        constraint: 'This candidate has not received the full AI path analysis or a generated four-week plan.',
        task: role.tasks?.[0] ?? '', tasks: role.tasks ?? [],
        market: role.growth && role.period && safeURL(source?.url) ? { growth: role.growth, period: role.period, geography: report.evidence?.geography || 'Geography unspecified', source, url: source.url } : null,
        sdg: null, roleSource: source, evidenceKind: 'Source-based candidate · not fully analyzed',
        comparisonNote: 'Role skills and tasks are from the linked source. Fit details are not inferred for this candidate.'
      });
    }
  } else {
    const demoPaths = report?.scenario?.paths ?? {};
    for (const id of ['A', 'B', 'C']) {
      const path = demoPaths[id];
      if (!path) continue;
      paths.push({
        id, title: path.subtitle || path.title, roleId: id, reason: path.why || '',
        strengths: skillsOf(path.strengths), gaps: skillsOf(path.gaps), matches: [], strengthItems: [], gapItems: [],
        next: path.next || '', constraint: path.constraints || '', task: path.tasks?.[0] || '', tasks: path.tasks ?? [],
        market: null, sdg: path.sdg ?? (path.sdgMapping ? {target:path.sdgMapping.target,rationale:path.sdgMapping.rationale,measure:path.sdgMapping.measure,relationship:path.sdgMapping.relationship} : null), sdgMapping: path.sdgMapping ?? null, roleSource: null, evidenceKind: 'DEMO / MOCK · scripted route',
        comparisonNote: 'Illustrative route only. No verified labor-market or SDG evidence is supplied in demo mode.'
      });
    }
  }
  const profileSkills = String(report?.profile?.skills ?? '').split(/[,;|\n]+/).map(x => x.trim()).filter(Boolean);
  const allSkills = [...new Set([...profileSkills, ...paths.flatMap(p => [...p.strengths, ...p.gaps, ...(p.matches ?? [])])])];
  const tasks = live ? (report.analysis.tasks ?? []).map(item => ({
    name: item.input_quote, assessment: claimText(item.assessment), category: item.category,
    sourceIds: item.assessment?.source_ids ?? []
  })) : (report?.scenario?.tasks ?? []).map(item => ({ name: item.name, assessment: item.note, category: item.type, sourceIds: [] }));
  return { live: !!live, report, sources, paths, skills: allSkills, profileSkills, tasks, ranking };
}

function roleSourceLinks(path) {
  return sourceLink(path.roleSource, path.roleSource?.title || 'Occupational source');
}

export function renderCareerComparison(report, selectedPath = 'A', comparePath = 'B') {
  const model = buildCareerExplorerModel(report);
  const paths = model.paths;
  const current = paths.find(p => p.id === selectedPath) || paths[0];
  const compare = paths.find(p => p.id === comparePath && p.id !== current?.id) || paths.find(p => p.id !== current?.id);
  if (!current) return '<p class="empty-panel">No career routes are available in this report.</p>';
  const options = path => paths.filter(p => p.id !== path.id).map(p => `<button type="button" class="compare-option ${compare?.id === p.id ? 'active' : ''}" data-action="compare-select:${e(p.id)}" aria-pressed="${compare?.id === p.id}">PATH ${e(p.id)} · ${e(p.title)}</button>`).join('');
  const card = (path, chosen) => `<article class="compare-card ${chosen ? 'compare-primary' : ''}"><div class="compare-card-top"><span>PATH ${e(path.id)}</span><span class="evidence-tag">${e(path.evidenceKind)}</span></div><h2>${e(path.title)}</h2><p><span data-user-content>${e(path.reason)}</span></p><div class="compare-facts"><div><b>Transferable / matched skills</b><span>${e(path.strengths.join(' · ') || 'No skills identified in this report')}</span></div><div><b>Skills to develop / verify</b><span>${e(path.gaps.join(' · ') || 'No gap list available')}</span></div><div><b>Next experiment</b><span><span data-user-content>${e(path.next || 'No experiment supplied')}</span></span></div><div><b>Trade-off</b><span><span data-user-content>${e(path.constraint || path.comparisonNote)}</span></span></div></div>${path.market ? `<div class="market-fact"><strong>${e(path.market.growth)}</strong><span>${e(path.market.geography)} · ${e(path.market.period)}</span>${roleSourceLinks(path)}</div>` : `<p class="data-limit">No verified market outlook is available for this route.</p>`}<button type="button" class="button ${chosen ? 'primary' : 'secondary'}" data-action="route-select:${e(path.id)}">${selectedPath === path.id ? 'Current focus ✓' : 'Use this route'}</button></article>`;
  return `<section class="explorer-page"><div class="explorer-heading"><span class="kicker">CAREER MULTIVERSE · SIDE-BY-SIDE</span><h1>Compare paths without locking one in.</h1><p>Compare source-backed role details and report interpretations. Scores and job outcomes are not guarantees.</p></div><div class="compare-picker"><div><span>PATH ${e(current.id)}</span><strong>${e(current.title)}</strong></div><span class="compare-vs">VS</span><div class="compare-picker-target"><span>COMPARE WITH</span><div class="compare-options">${options(current)}</div></div></div><div class="compare-grid">${card(current, true)}${compare ? card(compare, false) : ''}</div><p class="truth-note">${model.live ? 'Occupational sources are United States-oriented in this report. Matching scores are heuristic; path explanations are model interpretations.' : 'DEMO / MOCK. Scripted routes and examples are not market forecasts.'}</p></section>`;
}

export function renderSkillDNA(report, selectedPath = 'A', selectedSkill = '') {
  const model = buildCareerExplorerModel(report);
  const focused = selectedSkill || model.profileSkills[0] || model.skills[0] || '';
  const linkedSkills = path => [...path.strengths, ...path.gaps, ...(path.matches ?? [])];
  const related = model.paths.filter(path => linkedSkills(path).some(s => s.toLowerCase() === focused.toLowerCase()));
  const nodes = model.skills.map((skill, i) => {
    const kind = model.profileSkills.some(x => x.toLowerCase() === skill.toLowerCase()) ? 'current' : 'develop';
    const paths = model.paths.filter(path => linkedSkills(path).some(s => s.toLowerCase() === skill.toLowerCase()));
    return `<div class="dna-graph-row ${focused.toLowerCase() === skill.toLowerCase() ? 'is-focused' : ''}"><button type="button" class="dna-skill-node dna-${kind} ${focused.toLowerCase() === skill.toLowerCase() ? 'is-focused' : ''}" data-action="skill-select:${encodeURIComponent(skill)}" aria-pressed="${focused.toLowerCase() === skill.toLowerCase()}" aria-label="${e(skill)}, ${kind === 'current' ? 'self-reported skill' : 'skill to develop'}, linked to ${paths.map(p => `path ${p.id}`).join(', ') || 'no route recorded'}">${e(skill)}<small>${kind === 'current' ? 'SELF-REPORTED' : 'TO DEVELOP / VERIFY'}</small></button><span class="dna-edge" aria-hidden="true"></span><div class="dna-edge-targets">${paths.map(path => `<button type="button" class="dna-route-node ${selectedPath === path.id ? 'active' : ''}" data-action="route-select:${e(path.id)}">PATH ${e(path.id)} · ${e(path.title)}</button>`).join('') || '<span class="dna-unmapped">No route connection recorded</span>'}</div></div>`;
  }).join('');
  const relatedCards = related.map(path => `<button type="button" class="dna-route ${selectedPath === path.id ? 'active' : ''}" data-action="route-select:${e(path.id)}"><span>PATH ${e(path.id)}</span><strong>${e(path.title)}</strong><small>${linkedSkills(path).some(x => x.toLowerCase() === focused.toLowerCase()) && (path.strengths.includes(focused) || (path.matches ?? []).includes(focused)) ? 'Transferable / matched skill' : 'Skill to develop or verify'}</small></button>`).join('');
  const skillNote = model.profileSkills.some(x => x.toLowerCase() === focused.toLowerCase()) ? 'You listed this skill in your profile. The report does not independently verify proficiency.' : 'This skill appears as a route requirement or gap. Its absence from your profile is not evidence that you lack it.';
  return `<section class="explorer-page"><div class="explorer-heading"><span class="kicker">SKILL DNA · INTERACTIVE NETWORK</span><h1>See what connects your skills to each route.</h1><p>Select any skill to highlight the routes where it appears. Skill state reflects the report, not a validated aptitude score.</p></div><div class="dna-layout"><div class="dna-network" aria-label="Skill to career connections"><div class="dna-origin">${e(model.report?.profile?.background || 'Your starting point')}</div><div class="dna-graph">${nodes || '<p>No skills are available in this report.</p>'}</div></div><aside class="dna-detail" aria-live="polite"><span class="kicker">SELECTED SKILL</span><h2>${e(focused || 'Choose a skill')}</h2><p>${e(skillNote)}</p><h3>Related routes</h3><div class="dna-route-list">${relatedCards || '<p class="data-limit">No route connections are recorded for this skill.</p>'}</div><p class="truth-note">There is no percentage proficiency score in this view. Use a sample task or portfolio item to test a skill.</p></aside></div><div class="skill-state-legend"><span><i class="legend-current"></i> Self-reported</span><span><i class="legend-develop"></i> Develop / verify</span><span>Connections are derived from exact report skill labels.</span></div></section>`;
}

export function renderTimeMachine(report, year = '2026', scenario = 'moderate') {
  const model = buildCareerExplorerModel(report);
  const assumptions = report?.analysis?.scenarios ?? [];
  const names = { moderate: 'Moderate adoption', fast: 'Faster adoption', slower: 'Slower adoption' };
  const choice = assumptions.find(item => item.pace === scenario);
  const available = scenario === 'slower' ? false : !!choice || !model.live;
  const text = choice ? `${claimText(choice.assumption)} ${claimText(choice.implication)}` : model.live
    ? 'This scenario was not assessed in the report. No year-specific demand forecast is available.'
    : 'Illustrative planning scenario only. This scripted demo does not contain historical demand data or a validated forecast.';
  const watch = choice ? claimText(choice.watch_for) : 'Use this year as a review checkpoint. Compare new, cited evidence before changing a career decision.';
  const years = ['2026', '2028', '2030', '2035'];
  const futureSources = model.live ? model.ranking.slice(0, 3).map(role => `<article class="time-source"><strong>${e(role.title)}</strong><span>${e(role.growth)} · ${e(role.period)} · US</span>${sourceLink(model.sources[role.source_id])}</article>`).join('') : '';
  return `<section class="explorer-page"><div class="explorer-heading"><span class="kicker">CAREER TIME MACHINE · SCENARIO PLANNER</span><h1>Plan for checkpoints, not predictions.</h1><p>Choose a planning year and an AI adoption scenario. The controls change the view; they do not create a new labor-market forecast.</p></div><div class="time-controls"><div class="year-timeline" role="group" aria-label="Planning year">${years.map(y => `<button type="button" data-action="time-year:${y}" aria-pressed="${year === y}">${y}</button>`).join('')}</div><div class="scenario-tabs" role="group" aria-label="AI adoption scenario">${['slower','moderate','fast'].map(s => `<button type="button" data-action="time-scenario:${s}" aria-pressed="${scenario === s}">${names[s]}</button>`).join('')}</div></div><article class="time-scenario-card"><div class="time-year-label">PLANNING CHECKPOINT · ${e(year)}</div><h2>${e(names[scenario])}</h2><span class="scenario-status">${available ? (model.live ? 'MODEL SCENARIO · NOT A PREDICTION' : 'DEMO / MOCK · ILLUSTRATIVE') : 'NOT INCLUDED IN THIS REPORT'}</span><p><span data-user-content>${e(text)}</span></p><div class="time-watch"><strong>What to watch</strong><p><span data-user-content>${e(watch)}</span></p></div></article><h2 class="section-space">Published outlooks in this report</h2>${futureSources ? `<div class="time-sources">${futureSources}</div><p class="data-limit">These are United States occupational projections from the cited source, not year-by-year AI forecasts and not Malaysia-specific data.</p>` : '<p class="data-limit">No published occupational outlook is supplied in the scripted demo.</p>'}<p class="truth-note">The report does not contain comparable historical observations for every year above. Years are planning checkpoints, not forecast datapoints.</p></section>`;
}

export function renderSDGMapper(report, selectedPath = 'A') {
  const model = buildCareerExplorerModel(report);
  const path = model.paths.find(item => item.id === selectedPath) || model.paths[0];
  if (!path) return '<p class="empty-panel">No route is available for an SDG exploration.</p>';
  const mapping = path.sdgMapping;
  const sdg = path.sdg ?? (mapping ? {target:mapping.target,rationale:mapping.rationale,measure:mapping.measure} : null);
  const goal = sdg?.target ? String(sdg.target).split('.')[0] : '';
  const roleTask = mapping?.task || path.task || path.tasks?.[0] || '';
  const sdgSource = model.sources[`sdg${goal}`];
  const skill = mapping?.skill || path.strengths[0] || path.gaps[0] || model.profileSkills[0] || '';
  const occupation = mapping?.occupation || path.title;
  const occupationSource = mapping?.sources?.find(source => source.url.includes('onetonline.org'));
  const goalSource = mapping?.sources?.find(source => source.url.includes('sdgs.un.org'));
  const occupationSources = sourceLink(occupationSource) || roleSourceLinks(path);
  const goalSources = sourceLink(goalSource, goalSource ? `UN Goal ${goal}` : '') || sourceLink(sdgSource, `UN Goal ${goal}`);
  return `<section class="explorer-page"><div class="explorer-heading"><span class="kicker">SDG CAREER IMPACT MAPPER</span><h1>Trace a possible contribution to the work task.</h1><p>A job title alone does not make a career sustainable. Review the task and the proposed connection before drawing a conclusion.</p></div><div class="sdg-route-picker" role="group" aria-label="Choose career route">${model.paths.map(item => `<button type="button" data-action="route-select:${e(item.id)}" aria-pressed="${item.id === path.id}">PATH ${e(item.id)} · ${e(item.title)}</button>`).join('')}</div><div class="sdg-chain" aria-label="Skill to occupation to task to SDG mapping"><article><span>01 · SKILL</span><h2>${e(skill || 'No skill mapping in report')}</h2><p>${skill ? (path.strengths.includes(skill) ? 'Reported as transferable or matched for this route.' : 'Listed as a skill to develop or verify.') : 'No skill evidence is attached to this route.'}</p></article><i aria-hidden="true">→</i><article><span>02 · OCCUPATION</span><h2>${e(occupation)}</h2><p>${e(mapping ? 'Illustrative role-to-task example' : path.evidenceKind)}</p>${occupationSources}</article><i aria-hidden="true">→</i><article><span>03 · WORK TASK</span><h2><span data-user-content>${e(roleTask || 'Task not available')}</span></h2><p>${roleTask ? 'Task text is included as occupational context; confirm that it applies to the chosen role and location.' : 'No specific occupational task is available in this report.'}</p></article><i aria-hidden="true">→</i><article class="sdg-goal-card"><span>04 · PROPOSED SDG</span><h2>${sdg ? `SDG ${e(sdg.target)}` : 'No supported link'}</h2>${sdg ? `<p><span data-user-content>${e(sdg.rationale)}</span></p>${sdg.measure ? `<p><strong>Possible check:</strong> <span data-user-content>${e(sdg.measure)}</span></p>` : ''}<p><strong>Relationship:</strong> ${e(mapping?.relationship || 'Not classified in report')}</p>${goalSources}<small>Proposed contribution, not measured impact or UN endorsement.</small>` : '<p>No SDG link is supplied for this route. This view will not infer one from the occupation title.</p>'}</article></div><div class="sdg-evidence-note"><strong>Evidence boundary</strong><p>${mapping ? 'Illustrative, source-linked example: O*NET supplies occupational task context and the UN defines target 8.2. The enabling relationship is a hypothesis for discussion, not proof of productivity gain or SDG impact. The occupational source is US-oriented.' : model.live ? 'The occupation and task can be checked against the cited O*NET source; the SDG relation is a proposed model interpretation and should be reviewed. O*NET coverage is US-oriented.' : 'DEMO / MOCK. This profile does not contain a verified task-level SDG link for this route.'}</p></div></section>`;
}

export function renderExplorationPlan(report, selectedPath = 'C') {
  const model = buildCareerExplorerModel(report);
  const path = model.paths.find(item => item.id === selectedPath) || model.paths[0];
  if (!path) return '<p class="empty-panel">No route is selected.</p>';
  const steps = [
    ['Week 1 · Understand the role', `Read the cited role profile for ${path.title}. Select one task that matches your goal and write down what evidence you would need to perform it.`, 'A one-page role/task note with the source link.'],
    ['Week 2 · Try one task', `Use fictional data to create a small sample related to: ${path.task || path.tasks?.[0] || 'one task from the cited role profile'}.`, 'A small work sample with inputs, decisions and limitations.'],
    ['Week 3 · Verify a skill', `Choose one listed skill (${path.gaps[0] || path.strengths[0] || 'a role skill'}) and ask a peer or mentor to review the sample against a simple checklist.`, 'A review checklist and notes on what to improve.'],
    ['Week 4 · Decide what to do next', 'Compare the sample with your original goal and constraints. Decide whether to continue, revise, or drop this route.', 'A short decision log; no commitment to change jobs is required.']
  ];
  return `<section class="explorer-page"><div class="explorer-heading"><span class="kicker">EXPLORATION PLAN · PATH ${e(path.id)}</span><h1>Test the route before committing.</h1><p>${e(path.title)} · a source-based exploration exercise, not an AI-generated four-week plan.</p></div><div class="plan-summary"><div><span>YOUR CHOICE · PATH ${e(path.id)}</span><h2>${e(path.title)}</h2><p>${e(path.next || path.comparisonNote)}</p></div><div class="time-token"><strong>${e(model.report?.weeklyHours || '—')}h</strong><span>per week available</span></div></div><div class="explorer-plan-grid">${steps.map(([title, action, deliverable]) => `<article class="plan-mini"><span class="kicker">${e(title)}</span><p>${e(action)}</p><p><strong>Deliverable:</strong> ${e(deliverable)}</p></article>`).join('')}</div><div class="truth-note">Adjust the weekly scope to the time and constraints in your profile. Use fictional data only. ${path.market ? roleSourceLinks(path) : ''}</div></section>`;
}
