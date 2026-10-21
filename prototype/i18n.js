// One product translation catalog, shared by every screen. English is the source locale.
import catalog from './translations.json' with {type:'json'};
export const locales = ['en', 'zh-CN', 'ms'];
export function detectLanguage(languages) {
  for (const value of languages.slice(0,1)) {
    if (/^zh(?:-|$)/i.test(value)) return 'zh-CN';
    if (/^ms(?:-|$)/i.test(value)) return 'ms';
    if (/^en(?:-|$)/i.test(value)) return 'en';
  }
  return 'en';
}
let saved; try {saved=localStorage.getItem('career-language');} catch {}
export let language = locales.includes(saved) ? saved : detectLanguage(globalThis.navigator?.languages || [globalThis.navigator?.language || 'en']);
export function setLanguage(value) {
  if (!locales.includes(value)) return;
  language=value; try {localStorage.setItem('career-language',value);} catch {}
  if(typeof document!=='undefined') document.documentElement.lang=value;
}
export function t(key, params={}) {
  const value=language==='en' ? key : catalog[key]?.[language] ?? key;
  return value.replace(/\{(\w+)\}/g, (_,name)=>String(params[name] ?? `{${name}}`));
}
// Adapt retained templates without translating user input, values, IDs, or markup.
export function localize(root) {
  document.documentElement.lang=language;
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[]; while(walk.nextNode()) nodes.push(walk.currentNode);
  for(const node of nodes) {
    if(node.parentElement.closest('textarea, input, [data-user-content]')) continue;
    const original=node.textContent, key=original.trim();
    if(catalog[key]) node.textContent=original.replace(key,t(key));
  }
  for(const el of root.querySelectorAll('[aria-label], [placeholder], [title]')) {
    for(const attr of ['aria-label','placeholder','title']) if(el.hasAttribute(attr)) el.setAttribute(attr,t(el.getAttribute(attr)));
  }
}
export function errorMessage(detail, status) {
  if(typeof detail==='string' && catalog[detail]) return detail;
  return (status===429 ? 'Too many requests. Please wait and try again.' : status===403 ? 'Your session expired. Refresh and try again.' : status===422 ? 'Check your answers and confirm the fictional profile.' : 'The service is temporarily unavailable. Your answers are preserved. Please try again.');
}
