import { cases, steps } from './data.js';

export function emptyProfile() {
  return { scenario: '', background: '', experience: '', tasks: '', skills: '', aiUse: '', concerns: '', goal: '', hours: '', constraints: '' };
}

export function sampleProfile(scenario) {
  return { ...emptyProfile(), ...cases[scenario].sample, scenario };
}

export function validateStep(profile, index, mode='demo') {
  const errors = {};
  for (const field of steps[index].fields) {
    if(field==='scenario' && mode==='live') continue;
    if (!String(profile[field] ?? '').trim()) errors[field] = 'Please complete this field.';
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
