import spec from './behaviors.json' with {type:'json'};
export const RESPONSE_VERSION=spec.version;
export const behaviorOptions=q=>spec.constructs[q.construct]||[];
export function validResponse(q,value){return value===null||(Number.isInteger(value)&&value>=1&&value<=7);}
export function responseStrength(q,value){
 if(!validResponse(q,value))throw Error('INVALID_BEHAVIOR_RESPONSE');
 if(!Array.isArray(value))return value;
 const selected=behaviorOptions(q).filter(o=>value.includes(o.id));
 return selected.reduce((n,o)=>n+o.strength*o.weight,0)/selected.reduce((n,o)=>n+o.weight,0);
}
export function responseLabels(q,value,locale){
 return Array.isArray(value)?behaviorOptions(q).filter(o=>value.includes(o.id)).map(o=>o.label[locale]).join(' · '):null;
}
export function toggleBehavior(q,current,id,checked){
 const option=behaviorOptions(q).find(o=>o.id===id);if(!option)throw Error('INVALID_BEHAVIOR_RESPONSE');
 let next=Array.isArray(current)?current:[];
 next=checked?(option.exclusive?[id]:[...next.filter(v=>!behaviorOptions(q).find(o=>o.id===v)?.exclusive&&v!==id),id]):next.filter(v=>v!==id);
 if(next.length>spec.maxSelections)throw Error('MAX_BEHAVIORS');
 return behaviorOptions(q).filter(o=>next.includes(o.id)).map(o=>o.id);
}
