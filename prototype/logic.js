import {validateAnswers} from './questionnaire.js';
import { cases, steps } from './data.js';

export function emptyProfile() {
  return { scenario: '', background: '', experience: '', tasks: '', skills: '', aiUse: '', concerns: '', goal: '', hours: '', constraints: '', additionalContext: '' };
}

export function sampleProfile(scenario) {
  const p={ ...emptyProfile(), ...cases[scenario].sample, scenario };
  const marketing=scenario==='marketing';
  p.answers={background:marketing?'marketing':'admin',experience:marketing?'3to5':'1to2',tasks:marketing?['write','data','communicate']:['coordinate','data','communicate'],skills:marketing?['writing','analysis','communication']:['coordination','time','communication'],aiUsage:'occasional',concerns:['automation','skills'],goal:marketing?'upgrade':'explore',constraints:['time','budget'],custom:{}};
  p.assessment=marketing?{analysis:3,communication:4,planning:3,technical:2,aiCollaboration:2,research:4,people:4,creative:5,structure:3,autonomy:4}:{analysis:2,communication:3,planning:4,technical:2,aiCollaboration:2,research:2,people:5,creative:2,structure:5,autonomy:2};p.education='diploma';
  p.additionalContext=['tasks','skills','aiUse','concerns','goal','constraints'].map(key=>`${key}: ${p[key]}`).join('\n');
  return p;
}

export function validateStep(profile, index, mode='demo') {
  const errors = validateAnswers(profile,index);
  for (const field of steps[index].fields) {
    if(field==='scenario' && mode==='live') continue;
    if (field==='scenario' && !profile.scenario) errors.scenario='Please complete this field.';
  }
  if (index === 3 && profile.hours) {
    const n = Number(profile.hours);
    if (!Number.isFinite(n) || n < 1 || n > 40) errors.hours = 'Choose 1–40 hours per week.';
  }
  if(index===3 && mode==='live' && profile.synthetic!==true) errors.synthetic='Confirm that the profile is fictional before sending it.';
  return errors;
}

export function makeReport(profile) {
  if (!cases[profile.scenario]) throw new Error('Choose a supported demo scenario.');
  const scenario = cases[profile.scenario];
  const weeklyHours = Math.max(1, Math.min(40, Number(profile.hours) || 2));
  return { scenario, weeklyHours, profile: { ...profile }, evidenceLimit: 'Based on your self-report and a scripted demo scenario. No work samples, employer data or labour-market sources were verified.' };
}

export function recommendedPath(profile) {
  const text = `${profile.goal} ${profile.concerns}`.toLowerCase();
  return /transition|switch|change career|new career|explore|move into|转型|转行|探索/.test(text) ? 'B' : 'A';
}
