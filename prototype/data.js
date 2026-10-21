export const cases = {
  marketing: {
    label: 'Marketing specialist', short: 'Marketing', color: 'violet',
    sample: {
      background: 'Marketing specialist', experience: '3–5 years',
      tasks: 'Plan campaigns, write social content, review channel performance, present recommendations to stakeholders.',
      skills: 'Campaign planning, customer research, copywriting, stakeholder communication',
      aiUse: 'Occasional experiments with ChatGPT for early copy drafts',
      concerns: 'Routine content production may become less valuable.',
      goal: 'Grow into a more strategic marketing role.',
      hours: '3', constraints: 'Full-time role; limited time for a long course.'
    },
    capabilities: [
      { title: 'Independent Professional Capability', icon: '01', summary: 'A foundation in audience thinking and campaign decisions.', evidence: 'Your described work includes planning campaigns and presenting recommendations.', examples: ['Campaign planning', 'Customer research', 'Stakeholder communication'], next: 'Add one real campaign outcome or work sample to validate depth.' },
      { title: 'AI Collaboration Capability', icon: '02', summary: 'Early use for drafting; review and measurement remain the growth area.', evidence: 'You reported occasional ChatGPT use for first copy drafts.', examples: ['Draft alternatives', 'Prompt with audience context', 'Review claims and brand voice'], next: 'Test a repeatable brief → draft → human edit workflow.' },
      { title: 'AI-Extended Capability', icon: '03', summary: 'Potential to prototype analysis and experiments beyond routine copy.', evidence: 'This is a practice opportunity, not a verified independent skill.', examples: ['Build an experiment plan', 'Compare message variants', 'Summarize qualitative feedback'], next: 'Create a small experiment and check its decisions with real results.' }
    ],
    tasks: [
      { name: 'First-draft content variations', type: 'AI can assist', note: 'Generate options quickly; a person must check claims, fit and tone.' },
      { name: 'Recurring performance report formatting', type: 'Automation potential', note: 'Structured inputs can be summarized; validate numbers and interpretation.' },
      { name: 'Campaign positioning and trade-offs', type: 'Human judgment', note: 'Requires customer context, brand responsibility and business priorities.' },
      { name: 'Experiment design and measurement', type: 'Develop further', note: 'A way to move from output volume toward decision quality.' }
    ],
    paths: {
      A: { title: 'Upgrade your current career', subtitle: 'Marketing strategist with AI-assisted delivery', why: 'Your campaign and stakeholder experience is a base for higher-value decisions.', strengths: ['Audience and campaign context', 'Communication with stakeholders'], gaps: ['Structured AI review workflow', 'Experiment design and measurement'], opportunities: ['Own campaign experiments', 'Improve content operations'], constraints: 'Needs access to a real campaign or a realistic practice brief.', next: 'Redesign one campaign workflow and document where human review changes the result.' },
      B: { title: 'Explore new opportunities', subtitle: 'Marketing operations / growth analysis', why: 'Planning and reporting skills may transfer into a more analytical adjacent role.', strengths: ['Campaign operations', 'Interpretation of customer signals'], gaps: ['Spreadsheet analysis', 'Basic experimentation methods'], opportunities: ['Marketing operations', 'Growth experimentation'], constraints: 'The new role may require stronger quantitative evidence than the profile currently provides.', next: 'Build a sample campaign dashboard with synthetic data and explain three decisions.' },
      C: { title: 'Explore another direction', subtitle: 'Market research analyst · DEMO', why: 'Customer research and campaign context could be tested in a research-focused role; this is an illustrative route, not a sourced forecast.', strengths: ['Customer research', 'Campaign context'], gaps: ['Survey methods', 'Presenting evidence clearly'], opportunities: ['Customer insight projects', 'Research portfolio sample'], constraints: 'A small practice study can test interest, but cannot establish local hiring demand.', next: 'Analyze a fictional survey, identify one limitation and present a decision the evidence can support.', tasks: ['Analyze sample customer survey responses'], sdgMapping: { skill: 'Customer research', occupation: 'Market Research Analysts and Marketing Specialists', task: 'Collect and analyze data on customer demographics, preferences, needs, and buying habits to identify potential markets and factors affecting product demand.', target: '8.2', relationship: 'Enabling hypothesis · illustrative', rationale: 'Customer and market analysis may inform product or process choices connected to productivity and innovation. The task alone does not demonstrate a productivity gain or SDG impact.', measure: 'For a fictional sample, check whether the analysis supports a documented product or process decision. This is a learning check, not an SDG indicator.', sources: [{ title: 'O*NET occupation and tasks', url: 'https://www.onetonline.org/link/summary/13-1161.00' }, { title: 'UN SDG 8 and target 8.2', url: 'https://sdgs.un.org/goals/goal8' }] } }
    },
    plan: {
      A: { skills: ['Prompting with a campaign brief', 'Checking claims and brand voice', 'Experiment design'], tools: ['ChatGPT or another accessible text assistant', 'Spreadsheet for test results'], project: 'Choose one existing campaign or practice brief. Create three audience-specific message variants, edit them, then write a one-page rationale for the final choice.', milestone: 'Complete a brief, review checklist and small test plan in 2 weeks.', proof: 'Compare your edited output with the raw AI draft; ask one colleague to review clarity and record their feedback.' },
      B: { skills: ['Spreadsheet analysis', 'Channel metric interpretation', 'Presenting a decision'], tools: ['Spreadsheet software', 'Optional AI assistant for formula explanations'], project: 'Use synthetic campaign data to build a simple dashboard. Explain which channel you would test next and why.', milestone: 'Publish one portfolio case study in 3 weeks.', proof: 'Check calculations manually and ask a marketer to challenge your recommendation.' },
      C: { skills: ['Survey analysis', 'Evidence interpretation', 'Clear presentation'], tools: ['Spreadsheet software', 'Synthetic survey data'], project: 'Analyze a fictional customer survey and present one supported finding, one uncertainty and one follow-up question.', milestone: 'Complete a short research portfolio sample in 4 weeks.', proof: 'Check the calculations and ask a peer whether the conclusion follows from the sample.' }
    }
  },
  admin: {
    label: 'Administrative coordinator', short: 'Administration', color: 'peach',
    sample: {
      background: 'Administrative coordinator', experience: '1–2 years',
      tasks: 'Coordinate meetings, manage documents, track requests, support onboarding and resolve exceptions.',
      skills: 'Scheduling, process documentation, stakeholder support, detail checking',
      aiUse: 'New to AI tools; has tried a few summaries',
      concerns: 'Repetitive coordination work may be automated.',
      goal: 'Explore a move into operations or project coordination.',
      hours: '2', constraints: 'Must keep current job; prefers low-cost learning.'
    },
    capabilities: [
      { title: 'Independent Professional Capability', icon: '01', summary: 'Reliable coordination and process knowledge can transfer.', evidence: 'Your described work includes scheduling, request tracking and exception handling.', examples: ['Coordination', 'Process documentation', 'Exception handling'], next: 'Add a concrete example showing an improvement you made.' },
      { title: 'AI Collaboration Capability', icon: '02', summary: 'A beginner stage with room to build safe review habits.', evidence: 'You reported only a few experiments with summaries.', examples: ['Summarize non-sensitive notes', 'Draft checklists', 'Check output against source'], next: 'Practice with synthetic documents before using workplace information.' },
      { title: 'AI-Extended Capability', icon: '03', summary: 'Opportunity to prototype a small process improvement.', evidence: 'This is a proposed experiment, not proof of a new professional capability.', examples: ['Map a workflow', 'Draft a standard operating procedure', 'Design a request tracker'], next: 'Test the workflow with a sample case and record exceptions.' }
    ],
    tasks: [
      { name: 'Meeting-note summaries', type: 'AI can assist', note: 'A draft may save time; confirm decisions, owners and sensitive details.' },
      { name: 'Routine scheduling and reminders', type: 'Automation potential', note: 'Repeatable steps can be automated; exceptions still need a person.' },
      { name: 'Handling unclear or sensitive requests', type: 'Human judgment', note: 'Needs context, discretion and accountability.' },
      { name: 'Process mapping and improvement', type: 'Develop further', note: 'Turns coordination experience into a transferable operations skill.' }
    ],
    paths: {
      A: { title: 'Upgrade your current career', subtitle: 'AI-enabled administrative operations', why: 'You know where requests and hand-offs actually break down.', strengths: ['Operational context', 'Attention to detail'], gaps: ['Safe AI use', 'Workflow measurement'], opportunities: ['Own a request process', 'Reduce repeat work'], constraints: 'Workplace data rules may limit AI tools; start with synthetic examples.', next: 'Map one recurring request, identify exceptions and prototype a safer checklist.' },
      B: { title: 'Explore new opportunities', subtitle: 'Project / operations coordinator', why: 'Scheduling, tracking and stakeholder support are transferable foundations.', strengths: ['Coordination', 'Follow-through'], gaps: ['Project status reporting', 'Risk and dependency tracking'], opportunities: ['Project coordinator', 'Operations associate'], constraints: 'A portfolio example is needed to show the move beyond routine administration.', next: 'Build a fictional project tracker with milestones, owners and an escalation rule.' },
      C: { title: 'Explore another direction', subtitle: 'Business operations analyst · DEMO', why: 'Process documentation and attention to detail could be tested in a simple workflow-analysis exercise; this is an illustrative route, not a sourced forecast.', strengths: ['Process documentation', 'Detail checking'], gaps: ['Spreadsheet analysis', 'Process metrics'], opportunities: ['Workflow review sample', 'Operations portfolio case'], constraints: 'The profile does not establish analytics proficiency or local hiring demand.', next: 'Map a fictional request workflow, count handoffs and suggest one change to test.', tasks: ['Map and review a routine business workflow'] }
    },
    plan: {
      A: { skills: ['Process mapping', 'AI output verification', 'Handling exceptions'], tools: ['Spreadsheet or free task board', 'Text assistant using synthetic notes only'], project: 'Map a recurring request from intake to resolution. Draft a checklist with AI, then add three exception cases by hand.', milestone: 'Finish a process map and checked procedure in 2 weeks.', proof: 'Walk through three synthetic requests; record where the checklist fails and revise it.' },
      B: { skills: ['Milestone planning', 'Dependency tracking', 'Clear status updates'], tools: ['Free task board or spreadsheet', 'Optional AI assistant for draft status notes'], project: 'Create a fictional 4-week onboarding project with owners, milestones, risks and weekly status updates.', milestone: 'Produce one portfolio-ready coordination case in 3 weeks.', proof: 'Ask a peer to use the tracker for a sample week and note any missing information.' },
      C: { skills: ['Workflow mapping', 'Spreadsheet analysis', 'Process measurement'], tools: ['Spreadsheet software', 'Synthetic process examples'], project: 'Map a fictional request workflow, count steps and handoffs, then propose one change for a small test.', milestone: 'Finish a concise process-analysis sample in 4 weeks.', proof: 'Have a peer replay the workflow and check whether the proposed measure can be reproduced.' }
    }
  }
};

export const steps = [
  { title: 'Your starting point', eyebrow: '01 / 04', fields: ['scenario', 'background', 'experience'] },
  { title: 'Work you actually do', eyebrow: '02 / 04', fields: ['tasks', 'skills'] },
  { title: 'AI and your concerns', eyebrow: '03 / 04', fields: ['aiUse', 'concerns'] },
  { title: 'Direction and reality', eyebrow: '04 / 04', fields: ['goal', 'hours', 'constraints'] }
];
