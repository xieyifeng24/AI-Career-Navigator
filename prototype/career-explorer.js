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
  const card = (path, chosen) => `<article class="compare-card ${chosen ? 'compare-primary' : ''}"><div class="compare-card-top"><span>PATH ${e(path.id)}</span><span class="evidence-tag">${e(path.evidenceKind)}</span></div><h2>${e(path.title)}</h2><p>${e(path.reason)}</p><div class="compare-facts"><div><b>Transferable / matched skills</b><span>${e(path.strengths.join(' · ') || 'No skills identified in this report')}</span></div><div><b>Skills to develop / verify</b><span>${e(path.gaps.join(' · ') || 'No gap list available')}</span></div><div><b>Next experiment</b><span>${e(path.next || 'No experiment supplied')}</span></div><div><b>Trade-off</b><span>${e(path.constraint || path.comparisonNote)}</span></div></div>${path.market ? `<div class="market-fact"><strong>${e(path.market.growth)}</strong><span>${e(path.market.geography)} · ${e(path.market.period)}</span>${roleSourceLinks(path)}</div>` : `<p class="data-limit">No verified market outlook is available for this route.</p>`}<button type="button" class="button ${chosen ? 'primary' : 'secondary'}" data-action="route-select:${e(path.id)}">${selectedPath === path.id ? 'Current focus ✓' : 'Use this route'}</button></article>`;
  return `<section class="explorer-page"><div class="explorer-heading"><span class="kicker">CAREER MULTIVERSE · SIDE-BY-SIDE</span><h1>Compare paths without locking one in.</h1><p>Compare source-backed role details and report interpretations. Scores and job outcomes are not guarantees.</p></div><div class="compare-picker"><div><span>PATH ${e(current.id)}</span><strong>${e(current.title)}</strong></div><span class="compare-vs">VS</span><div class="compare-picker-target"><span>COMPARE WITH</span><div class="compare-options">${options(current)}</div></div></div><div class="compare-grid">${card(current, true)}${compare ? card(compare, false) : ''}</div><p class="truth-note">${model.live ? 'Occupational sources are United States-oriented in this report. Matching scores are heuristic; path explanations are model interpretations.' : 'DEMO / MOCK. Scripted routes and examples are not market forecasts.'}</p></section>`;
}

export function renderSkillDNA(report, selectedPath = 'A', selectedSkill = '', progressByPath = {}) {
  const model = buildCareerExplorerModel(report);
  const normalized = value => String(value ?? '').trim().toLowerCase();
  const paths = model.paths;
  const selected = paths.find(path => path.id === selectedPath) || paths[0];
  if (!selected) return '<section class="explorer-page"><div class="explorer-heading"><span class="kicker">SKILL CONSTELLATION</span><h1>No career branches yet.</h1><p>Complete an assessment with skills and a career direction to build your personalized skill tree.</p></div></section>';
  const currentSkills = new Set(model.profileSkills.map(normalized));
  const pathSkills = path => [...new Map([...path.strengths, ...(path.matches ?? []), ...path.gaps].filter(Boolean).map(skill => [normalized(skill), skill])).values()];
  const learningSteps = path => {
    const baseline = new Set([...model.profileSkills, ...path.strengths, ...(path.matches ?? [])].map(normalized));
    return [...new Map(path.gaps.filter(Boolean).filter(skill => !baseline.has(normalized(skill))).map(skill => [normalized(skill), skill])).values()];
  };
  const selectedSteps = learningSteps(selected);
  const completed = new Set(progressByPath[selected.id] ?? []);
  const nextIndex = selectedSteps.findIndex((_, index) => !completed.has(index));
  const selectedPathSkills = pathSkills(selected);
  const focused = [...model.skills, ...selectedPathSkills].some(skill => normalized(skill) === normalized(selectedSkill)) ? selectedSkill : selectedPathSkills.find(skill => currentSkills.has(normalized(skill))) || selectedSteps[nextIndex] || selectedPathSkills[0] || model.profileSkills[0] || '';
  const focusedIsCurrent = currentSkills.has(normalized(focused));
  const focusedIndex = selectedSteps.findIndex(skill => normalized(skill) === normalized(focused));
  const focusedDone = focusedIndex >= 0 && completed.has(focusedIndex);
  const focusedIsTransferable = !focusedIsCurrent && (selected.strengths.some(skill => normalized(skill) === normalized(focused)) || (selected.matches ?? []).some(skill => normalized(skill) === normalized(focused)));
  const focusPath = paths.find(path => [...path.strengths, ...(path.matches ?? []), ...path.gaps].some(skill => normalized(skill) === normalized(focused))) || selected;
  const focusGapIndex = learningSteps(focusPath).findIndex(skill => normalized(skill) === normalized(focused));
  const focusDone = new Set(progressByPath[focusPath.id] ?? []).has(focusGapIndex);
  const detailText = focusedIsCurrent ? 'Self-reported in your assessment. This is a starting signal, not a verified proficiency score.'
    : focusedIsTransferable ? 'This report lists the skill as transferable or matched to the selected career path. The match is an AI-assisted interpretation.'
    : focusDone ? 'You marked this step as practiced or verified in this browser session. This does not certify proficiency.'
    : 'Listed as a skill to develop or verify for a route in this report. Its absence from your profile does not prove that you lack it.';
  const routePositions = paths.length === 1 ? [[500,150]] : paths.length === 2 ? [[340,175],[660,425]] : [[500,150],[300,385],[700,385]];
  const svgLines = paths.map((path,index) => {
    const [x,y] = routePositions[index] ?? [500 + Math.cos((-90+index*360/paths.length)*Math.PI/180)*185,300 + Math.sin((-90+index*360/paths.length)*Math.PI/180)*185];
    const angle = Math.atan2(y-300,x-500);
    const startX=500+Math.cos(angle)*57,startY=300+Math.sin(angle)*57;
    const raw=pathSkills(path), shown=raw.slice(0,8), stepList=learningSteps(path), progress=new Set(progressByPath[path.id] ?? []), next=stepList.findIndex((_,i)=>!progress.has(i));
    const fan=shown.length===1?[0]:shown.map((_,i)=>-50+i*(100/(shown.length-1)));
    const leaves=shown.map((skill,i)=>{const a=angle+fan[i]*Math.PI/180, radius=i%2?136:119;const sx=x+Math.cos(a)*radius,sy=y+Math.sin(a)*radius;const current=currentSkills.has(normalized(skill)),match=path.strengths.some(x=>normalized(x)===normalized(skill))||(path.matches??[]).some(x=>normalized(x)===normalized(skill));const gi=stepList.findIndex(x=>normalized(x)===normalized(skill)),done=gi>=0&&progress.has(gi),isNext=gi>=0&&gi===next;const kind=current?'self':match?'match':done?'done':isNext?'next':'locked';const glyph=current?'✓':match?'✦':done?'✓':`${gi+1}`;const selectedSkillState=normalized(focused)===normalized(skill);return {skill,sx,sy,kind,glyph,selectedSkillState,gi,done,isNext,current,match,path};});
    const connector=`<path class="dna-link dna-link-role ${path.id===selected.id?'active':''}" d="M${startX} ${startY} Q${(startX+x)/2} ${(startY+y)/2-20} ${x} ${y}"/>`+leaves.map(leaf=>`<path class="dna-link dna-link-skill ${path.id===selected.id?'active':''}" d="M${x} ${y} Q${(x+leaf.sx)/2} ${(y+leaf.sy)/2} ${leaf.sx} ${leaf.sy}"/>`).join('');
    const role=`<button type="button" class="dna-role-node ${path.id===selected.id?'active':''}" style="left:${x/10}%;top:${y/6.2}%" data-action="route-select:${e(path.id)}" data-search-text="${e(path.title.toLowerCase())}" aria-pressed="${path.id===selected.id}" aria-label="Select path ${e(path.id)}, ${e(path.title)}"><span aria-hidden="true">${index===0?'◇':index===1?'⌘':'✧'}</span><small>PATH ${e(path.id)}</small><strong>${e(path.title)}</strong></button>`;
    const skillButtons=leaves.map(leaf=>`<button type="button" class="dna-map-node dna-node-${leaf.kind} ${leaf.selectedSkillState&&path.id===selected.id?'is-focused':''}" style="left:${leaf.sx/10}%;top:${leaf.sy/6.2}%" data-action="skill-select:${encodeURIComponent(leaf.skill)}" data-search-text="${e(leaf.skill.toLowerCase())}" aria-pressed="${leaf.selectedSkillState&&path.id===selected.id}" aria-label="${e(leaf.skill)}, ${leaf.current?'self-reported':leaf.match?'transferable or matched':leaf.done?'marked practiced':leaf.isNext?'next suggested step':'visible preview'} on path ${e(path.title)}"><span class="dna-map-icon" aria-hidden="true">${leaf.glyph}</span><span class="dna-map-label">${e(leaf.skill)}</span></button>`).join('');
    return { connector, role, skillButtons, overflow: Math.max(0,raw.length-shown.length), path };
  });
  const graph = `<svg class="dna-graph-lines" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="dnaPathGlow"><stop stop-color="#42dfff"/><stop offset="1" stop-color="#bc67ff"/></linearGradient></defs>${svgLines.map(item=>item.connector).join('')}</svg><div class="dna-profile-core" style="left:50%;top:48.4%"><span aria-hidden="true">♙</span><small>YOUR START</small><strong>${e(model.report?.profile?.background||'Your skills')}</strong></div>${svgLines.map(item=>item.role+item.skillButtons).join('')}`;
  const stepPercent = selectedSteps.length ? Math.round(Math.max(0, selectedSteps.length-completed.size)/selectedSteps.length*100) : 0;
  const related = paths.filter(path => [...path.strengths,...(path.matches??[]),...path.gaps].some(skill => normalized(skill)===normalized(focused)));
  const skillEvidence = [...focusPath.strengthItems,...focusPath.gapItems].find(item => normalized(skillName(item))===normalized(focused));
  const advice = claimText(skillEvidence?.advice);
  const nextAction = focusPath.next || 'No experiment is included in this route.';
  const actionButton = focusGapIndex>=0&&!focusDone ? focusGapIndex===new Set(progressByPath[focusPath.id]??[]).size
    ? `<button type="button" class="dna-action-button" data-action="skill-step-done:${e(focusPath.id)}:${focusGapIndex}">Mark practiced · light next step</button>`
    : '<p class="dna-hint">Preview any skill now. Mark the previous suggested step before advancing.</p>' : '';
  const profileChips = model.profileSkills.map(skill=>`<span class="dna-profile-chip">${e(skill)}</span>`).join('') || '<span class="dna-profile-chip empty">No skills listed in this profile</span>';
  const allSkillIndex = `<details class="dna-all-skills"><summary>Browse all ${model.skills.length} report skills</summary><div>${model.skills.map(skill=>`<button type="button" data-action="skill-select:${encodeURIComponent(skill)}">${e(skill)}<small>${paths.filter(path=>[...path.strengths,...(path.matches??[]),...path.gaps].some(item=>normalized(item)===normalized(skill))).map(path=>`Path ${path.id}`).join(' · ')||'Profile skill'}</small></button>`).join('')}</div></details>`;
  const routeLinks = related.map(path=>`<button type="button" class="dna-connected-role ${path.id===selected.id?'active':''}" data-action="route-select:${e(path.id)}"><span class="dna-connected-icon" aria-hidden="true">⌘</span><span><small>PATH ${e(path.id)}</small><strong>${e(path.title)}</strong></span><b aria-hidden="true">›</b></button>`).join('');
  const skillCount = selectedPathSkills.length;
  const gapPills = selectedSteps.map((skill,index)=>`<button type="button" class="dna-gap-pill ${index===nextIndex?'next':completed.has(index)?'done':''}" data-action="skill-select:${encodeURIComponent(skill)}">${e(skill)}</button>`).join('') || '<p>No skill gaps were supplied for this route.</p>';
  const task = selected.next || 'No next experiment is included in the report.';
  return `<section class="dna-workspace"><aside class="dna-workspace-nav"><div class="dna-brand-mark">✦</div><strong>Career Navigator</strong><small>YOUR WORKSPACE</small><nav aria-label="Skill DNA navigation"><button data-action="page:star-map"><span>⌂</span>Career roadmap</button><button data-action="edit"><span>▣</span>Assessment</button><button class="active" aria-current="page"><span>⌘</span>Skill DNA</button><button data-action="page:paths"><span>◇</span>Career paths</button><button data-action="page:plan"><span>▤</span>Action plan</button></nav><div class="dna-nav-profile"><span class="dna-avatar">${e((model.report?.profile?.background||'U').slice(0,1).toUpperCase())}</span><span><strong>${e(model.report?.profile?.background||'Your profile')}</strong><small>${model.profileSkills.length} skills listed</small></span></div></aside><div class="dna-workspace-main"><header class="dna-toolbar"><div><span class="dna-toolbar-kicker">SKILL DNA</span><p>Explore pathways, skills, and connections.</p></div><label class="dna-search"><span aria-hidden="true">⌕</span><input type="search" data-skill-search placeholder="Search skills, roles, or topics" aria-label="Search skills, roles, or topics"></label><span class="dna-live-dot" aria-label="Local report data">●</span></header><div class="dna-canvas-layout"><section class="dna-canvas-panel" aria-label="Interactive skill and career pathway graph"><div class="dna-canvas-label"><span>EXPLORATION GRAPH</span><span>PATH ${e(selected.id)} · ${e(selected.title)}</span></div><div class="dna-graph-canvas">${graph}<div class="dna-graph-title"><span>CAREER EXPLORATION</span><strong>&amp; SKILL DNA</strong></div></div><div class="dna-graph-legend"><span><i class="self"></i> Self-reported / transferable</span><span><i class="build"></i> To develop / verify</span><span><i class="dim"></i> Preview · previous step first</span><span>${paths.length} report paths · ${skillCount} skills on this path</span></div>${allSkillIndex}</section><aside class="dna-inspector" aria-live="polite"><button type="button" class="dna-inspector-close" aria-label="Selected skill">×</button><div class="dna-inspector-icon" aria-hidden="true">${focusedIsCurrent?'✦':focusedIsTransferable?'◇':'⌘'}</div><span class="dna-inspector-type">SKILL</span><h2>${e(focused||'Select a skill')}</h2><span class="dna-status-pill ${focusedIsCurrent||focusedIsTransferable?'known':focusDone?'done':'develop'}">${focusedIsCurrent?'Self-reported':focusedIsTransferable?'Transferable / matched':focusDone?'You marked practiced':'To develop / verify'}</span><p class="dna-inspector-copy">${e(advice||detailText)}</p><div class="dna-inspector-section"><h3>Connected roles</h3><p>This skill is connected to these paths in your report.</p><div class="dna-connected-list">${routeLinks||'<p class="dna-no-data">No route connection is recorded for this skill.</p>'}</div></div><div class="dna-experiment"><span>⚗ &nbsp;NEXT EXPERIMENT</span><strong>${e(focusPath.title)}</strong><p>${e(nextAction)}</p><button type="button" data-action="page:plan">Open action plan <b aria-hidden="true">→</b></button></div>${actionButton}<p class="dna-truth-note">Report interpretation only. Progress is your note and is not an independent skill assessment.</p></aside></div><div class="dna-insight-cards"><article class="dna-mini-card"><span>SKILLS YOU BROUGHT</span><strong>${model.profileSkills.length}</strong><div class="dna-mini-chips">${profileChips}</div></article><article class="dna-mini-card"><span>SKILL DEVELOPMENT GAPS · PATH ${e(selected.id)}</span><strong>${selectedSteps.length?`${completed.size} / ${selectedSteps.length} practiced`: 'No gaps listed'}</strong><div class="dna-gap-list">${gapPills}</div></article><article class="dna-mini-card dna-progress-card"><span>CAREER PATH PROGRESS</span><strong>${e(selected.title)}</strong><p>${completed.size} of ${selectedSteps.length} suggested learning steps marked</p><div class="dna-progress-track"><i style="width:${100-stepPercent}%"></i></div><button type="button" data-action="page:plan">View action plan →</button></article></div><p class="dna-footnote">Suggested sequence follows the report’s skill-gap order. It is a planning aid, not a validated prerequisite standard. DEMO / MOCK reports remain illustrative.</p></div></section>`;
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
  return `<section class="explorer-page"><div class="explorer-heading"><span class="kicker">CAREER TIME MACHINE · SCENARIO PLANNER</span><h1>Plan for checkpoints, not predictions.</h1><p>Choose a planning year and an AI adoption scenario. The controls change the view; they do not create a new labor-market forecast.</p></div><div class="time-controls"><div class="year-timeline" role="group" aria-label="Planning year">${years.map(y => `<button type="button" data-action="time-year:${y}" aria-pressed="${year === y}">${y}</button>`).join('')}</div><div class="scenario-tabs" role="group" aria-label="AI adoption scenario">${['slower','moderate','fast'].map(s => `<button type="button" data-action="time-scenario:${s}" aria-pressed="${scenario === s}">${names[s]}</button>`).join('')}</div></div><article class="time-scenario-card"><div class="time-year-label">PLANNING CHECKPOINT · ${e(year)}</div><h2>${e(names[scenario])}</h2><span class="scenario-status">${available ? (model.live ? 'MODEL SCENARIO · NOT A PREDICTION' : 'DEMO / MOCK · ILLUSTRATIVE') : 'NOT INCLUDED IN THIS REPORT'}</span><p>${e(text)}</p><div class="time-watch"><strong>What to watch</strong><p>${e(watch)}</p></div></article><h2 class="section-space">Published outlooks in this report</h2>${futureSources ? `<div class="time-sources">${futureSources}</div><p class="data-limit">These are United States occupational projections from the cited source, not year-by-year AI forecasts and not Malaysia-specific data.</p>` : '<p class="data-limit">No published occupational outlook is supplied in the scripted demo.</p>'}<p class="truth-note">The report does not contain comparable historical observations for every year above. Years are planning checkpoints, not forecast datapoints.</p></section>`;
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
  return `<section class="explorer-page"><div class="explorer-heading"><span class="kicker">SDG CAREER IMPACT MAPPER</span><h1>Trace a possible contribution to the work task.</h1><p>A job title alone does not make a career sustainable. Review the task and the proposed connection before drawing a conclusion.</p></div><div class="sdg-route-picker" role="group" aria-label="Choose career route">${model.paths.map(item => `<button type="button" data-action="route-select:${e(item.id)}" aria-pressed="${item.id === path.id}">PATH ${e(item.id)} · ${e(item.title)}</button>`).join('')}</div><div class="sdg-chain" aria-label="Skill to occupation to task to SDG mapping"><article><span>01 · SKILL</span><h2>${e(skill || 'No skill mapping in report')}</h2><p>${skill ? (path.strengths.includes(skill) ? 'Reported as transferable or matched for this route.' : 'Listed as a skill to develop or verify.') : 'No skill evidence is attached to this route.'}</p></article><i aria-hidden="true">→</i><article><span>02 · OCCUPATION</span><h2>${e(occupation)}</h2><p>${e(mapping ? 'Illustrative role-to-task example' : path.evidenceKind)}</p>${occupationSources}</article><i aria-hidden="true">→</i><article><span>03 · WORK TASK</span><h2>${e(roleTask || 'Task not available')}</h2><p>${roleTask ? 'Task text is included as occupational context; confirm that it applies to the chosen role and location.' : 'No specific occupational task is available in this report.'}</p></article><i aria-hidden="true">→</i><article class="sdg-goal-card"><span>04 · PROPOSED SDG</span><h2>${sdg ? `SDG ${e(sdg.target)}` : 'No supported link'}</h2>${sdg ? `<p>${e(sdg.rationale)}</p>${sdg.measure ? `<p><strong>Possible check:</strong> ${e(sdg.measure)}</p>` : ''}<p><strong>Relationship:</strong> ${e(mapping?.relationship || 'Not classified in report')}</p>${goalSources}<small>Proposed contribution, not measured impact or UN endorsement.</small>` : '<p>No SDG link is supplied for this route. This view will not infer one from the occupation title.</p>'}</article></div><div class="sdg-evidence-note"><strong>Evidence boundary</strong><p>${mapping ? 'Illustrative, source-linked example: O*NET supplies occupational task context and the UN defines target 8.2. The enabling relationship is a hypothesis for discussion, not proof of productivity gain or SDG impact. The occupational source is US-oriented.' : model.live ? 'The occupation and task can be checked against the cited O*NET source; the SDG relation is a proposed model interpretation and should be reviewed. O*NET coverage is US-oriented.' : 'DEMO / MOCK. This profile does not contain a verified task-level SDG link for this route.'}</p></div></section>`;
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
