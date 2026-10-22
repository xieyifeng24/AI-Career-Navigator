// Deterministic, versioned, browser-only rules. No network, clocks, randomness or model calls.
import catalog from './explorer-catalog.json' with {type:'json'};
export {catalog};
export const fieldMap=Object.fromEntries(catalog.fields.map(f=>[f.id,f]));
const higher=['bachelor','master','doctor'];
const TIME={under10:3,'10to20':6,'20to30':8,'30to40':10,over40:12};
export function blankProfile(){
 return Object.fromEntries([...catalog.fields.map(f=>[f.id,f.multi?[]:f.optional?'undisclosed':'']),['nationality','undisclosed']]);
}
export function visibleFields(profile,index){
 return catalog.steps[index].fields.filter(key=>key!=='major'||higher.includes(profile.education)).filter(key=>key!=='stream'||profile.education==='senior').filter(key=>!['aiDuration','reliance'].includes(key)||!(Array.isArray(profile.aiPurposes)&&profile.aiPurposes.includes('none')));
}
export function updateChoice(profile,key,value,checked=true){
 if(!fieldMap[key]) return profile;
 const f=fieldMap[key];
 if(!f.options.some(o=>o.id===value)) return profile;
 if(f.multi){
  let values=profile[key].filter(v=>v!==value);
  if(checked) values.push(value);
  if(key==='aiPurposes'&&checked) values=value==='none'?['none']:values.filter(v=>v!=='none');
  profile[key]=f.options.map(o=>o.id).filter(id=>values.includes(id));
 }else profile[key]=value;
 return profile;
}
export function validateProfile(profile,index=null){
 const errors={};
 const fields=index===null?catalog.steps.flatMap((_,i)=>visibleFields(profile,i)):visibleFields(profile,index);
 for(const key of fields){
  const value=profile[key];
  if(key==='nationality'){
   if(value!=='undisclosed'&&!catalog.countries.includes(value)) errors[key]='Choose a valid country or prefer not to say.';
   continue;
  }
  const f=fieldMap[key],values=Array.isArray(value)?value:[value];
  if(!values.length||values.some(v=>!f.options.some(o=>o.id===v))||new Set(values).size!==values.length||(!f.multi&&Array.isArray(value))||(f.multi&&!Array.isArray(value)))errors[key]='Please choose an answer.';
 }
 if(Array.isArray(profile.aiPurposes)&&profile.aiPurposes.includes('none')&&profile.aiPurposes.length>1)errors.aiPurposes='Not using AI yet must be selected on its own.';
 return errors;
}
export function canonicalProfile(profile){
 const errors=validateProfile(profile);if(Object.keys(errors).length)throw new RangeError('Incomplete or invalid questionnaire');
 const active=new Set(catalog.steps.flatMap((_,i)=>visibleFields(profile,i))),result={};
 for(const f of catalog.fields){
  if(!active.has(f.id))continue;
  result[f.id]=f.multi?f.options.map(o=>o.id).filter(id=>profile[f.id].includes(id)):profile[f.id];
 }
 result.nationality=profile.nationality;
 return result;
}
function hash(value){let h=2166136261;for(const c of value)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h.toString(16).padStart(8,'0');}
export function rankCareers(p){
 return catalog.careers.map((role,index)=>{
  const interests=p.interests.filter(v=>role.interests.includes(v));
  const mindsets=p.mindsets.filter(v=>role.mindsets.includes(v));
  const purposes=p.aiPurposes.filter(v=>role.purposes.includes(v));
  const major=!!p.major&&role.majors.includes(p.major);
  const stream=!!p.stream&&role.mindsets.includes(p.stream);
  const components={interests:interests.length*4,major:major?6:0,stream:stream?2:0,mindsets:mindsets.length*2,aiPurposes:purposes.length};
  return {id:role.id,score:Object.values(components).reduce((a,b)=>a+b,0),components,reasons:{interests,mindsets,aiPurposes:purposes,major:major?p.major:null,stream:stream?p.stream:null},order:index};
 }).sort((a,b)=>b.score-a.score||a.order-b.order).map(({order,...v})=>v);
}
export function rankGoals(p,ranking){
 const leaders=ranking.slice(0,3).map(r=>catalog.careers.find(c=>c.id===r.id));
 return catalog.goals.map(g=>{
  const interests=p.interests.filter(v=>g.interests.includes(v));
  const careers=leaders.filter(r=>r.sdgs.includes(g.id)).map(r=>r.id);
  return {id:g.id,score:interests.length*2+careers.length*3,reasons:{interests,careers}};
 }).sort((a,b)=>b.score-a.score||a.id-b.id);
}
export function weeklyHours(p){
 let hours=TIME[p.weeklyTime];
 if(p.learningAbility==='support')hours=Math.max(1,Math.floor(hours*.75));
 if(p.age==='child')hours=Math.min(hours,2);
 if(p.age==='teen')hours=Math.min(hours,4);
 return hours;
}
export function buildPlan(p,roleId){
 if(!catalog.careers.some(c=>c.id===roleId))throw new RangeError('Unknown career');
 const hours=weeklyHours(p);
 // Half-hour units: the split sums exactly to the suggested weekly total.
 const units=hours*2,foundation=Math.max(1,Math.floor(units*.4)),project=Math.max(1,Math.floor(units*.4));
 return {roleId,weeklyHours:hours,totalHours:hours*4,split:{foundation:foundation/2,project:project/2,review:(units-foundation-project)/2},weeks:[1,2,3,4].map(week=>({week,hours,action:['baseline','prototype','verify','reflect'][week-1]}))};
}
export function generateOfflineReport(profile){
 const p=canonicalProfile(profile),ranking=rankCareers(p),goals=rankGoals(p,ranking);
 const stage=p.age==='child'?'stage-child':p.age==='teen'?'stage-teen':p.status==='enrolled'?'stage-student':'stage-graduate';
 const learning=[stage,...(['primary','junior','senior'].includes(p.education)?['school-foundation']:[]),...(['master','doctor'].includes(p.education)?['research-extension']:[]),`social-${p.social}`,`planning-${p.planning}`,`decision-${p.decision}`,`ability-${p.learningAbility}`,...p.learningStyles.map(x=>`style-${x}`),'mindset-note','cross-border'];
 const ai=p.aiPurposes.includes('none')?['ai-none']:[`ai-${p.reliance}`,`duration-${p.aiDuration}`,...p.aiPurposes.map(x=>`purpose-${x}`)];
 return {mode:'offline-rules',version:catalog.version,reportId:`LOCAL-${hash(JSON.stringify(p))}`,profile:p,stage,preferenceCode:`${p.social==='introvert'?'I':'E'}${p.planning==='planned'?'J':'P'}${p.decision==='rational'?'R':'F'}`,ranking,goals,learning,ai,plan:buildPlan(p,ranking[0].id)};
}
export function sampleProfile(){return {...blankProfile(),age:'young',education:'bachelor',status:'enrolled',major:'software',social:'introvert',planning:'planned',decision:'rational',interests:['tech','learning'],aiPurposes:['coding','summary'],aiDuration:'1to6',reliance:'moderate',learningAbility:'steady',weeklyTime:'under10',learningStyles:['practice','explore'],mindsets:['science']};}
export function outputInventory(){
 return {version:catalog.version,careerIds:catalog.careers.map(c=>c.id),goalIds:catalog.goals.map(g=>g.id),adviceIds:Object.keys(catalog.advice),stageIds:['stage-child','stage-teen','stage-student','stage-graduate'],planActions:['baseline','prototype','verify','reflect'],scoreWeights:{interest:4,major:6,stream:2,mindset:2,aiPurpose:1},tieBreak:'catalog order for careers; numeric goal ID for SDGs',excludedFromCareerScores:['gender','nationality','age','status','learningAbility','weeklyTime','social','planning','decision','aiDuration','reliance','learningStyles'],usesNetwork:false};
}
// Count the complete finite questionnaire state space without enumerating reports.
// Hidden fields contribute only one state, never stale values.
export function possibleProfileCount(){
 const choices=id=>BigInt(fieldMap[id].options.length);
 const subsets=id=>(1n<<choices(id))-1n;
 const educationStates=2n+choices('stream')+3n*choices('major');
 const aiStates=1n+((1n<<4n)-1n)*choices('aiDuration')*choices('reliance');
 return choices('gender')*choices('age')*BigInt(catalog.countries.length+1)*educationStates*choices('status')*choices('social')*choices('planning')*choices('decision')*subsets('interests')*aiStates*choices('learningAbility')*choices('weeklyTime')*subsets('learningStyles')*subsets('mindsets');
}
