import bundled from '../../data/knowledge/current.json' with {type:'json'};
import roles from './roles.json' with {type:'json'};
let active=bundled;
export function usableKnowledge(snapshot){
 if(snapshot?.schema_version!==1||typeof snapshot.version!=='string'||!Array.isArray(snapshot.records))return false;
 const keys=new Set();
 for(const r of snapshot.records){
  try{const u=new URL(r.url);if(u.protocol!=='https:'||!['onetonline.org','onetcenter.org','europa.eu','myfuturejobs.gov.my','perkeso.gov.my'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h))||!Number.isFinite(Date.parse(r.verified_at))||!r.version||!r.title||!Array.isArray(r.tasks)||(r.source==='onet'&&!r.tasks.length)||!Array.isArray(r.skills)||!r.skills.length||!Array.isArray(r.education)||[...r.tasks,...r.skills,...r.education].some(t=>typeof t?.label!=='string'||!t.label.trim()))return false;}catch{return false;}
  const key=r.source+':'+r.id;if(keys.has(key))return false;keys.add(key);
 }
 return roles.roles.every(r=>keys.has(r.sourceId));
}
export function resolveKnowledge(candidate){return usableKnowledge(candidate)?candidate:active;}
export const currentKnowledge=()=>active;
export function installAssessmentKnowledge(snapshot){if(!usableKnowledge(snapshot))throw Error('INVALID_ASSESSMENT_KNOWLEDGE');active=structuredClone(snapshot);return active;}
export async function refreshAssessmentKnowledge(fetcher=globalThis.fetch){
 try{const response=await fetcher('/api/knowledge/current',{signal:AbortSignal.timeout(4000)});if(!response.ok)return false;const body=await response.json(),next=body.snapshot;
  if(!usableKnowledge(next))return false;
  const date=s=>Math.max(...s.records.map(r=>Date.parse(r.verified_at)));
  if(date(next)<date(active))return false;
  installAssessmentKnowledge(next);return true;
 }catch{return false;}
}
