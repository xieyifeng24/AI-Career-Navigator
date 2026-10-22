// Ephemeral per-tab deduplication; no profiles or tokens written to storage.
import {requestAnalysis} from '../live.js';

export function createOptionalAI(request=requestAnalysis,{timeoutMs=90000,cooldownMs=60000}={}){
 const attempts=new Map(),pending=new Map(),complete=new Map();
 return function run(profile,locale='en'){
  const {assessment,education,...legacy}=structuredClone(profile);
  // Keep the unchanged backend profile contract; describe extra self-reports as context.
  legacy.additionalContext=((legacy.additionalContext||'')+'\nSelf-reported questionnaire levels (not verified): '+JSON.stringify({assessment,education})).slice(0,1600);
  const payload={...legacy,language:locale},key=JSON.stringify(payload);
  if(complete.has(key))return Promise.resolve(complete.get(key));
  if(pending.has(key))return pending.get(key);
  if(Date.now()-(attempts.get(key)??-Infinity)<cooldownMs)return Promise.reject(new Error('AI_COOLDOWN'));
  if(pending.size)return Promise.reject(new Error('AI_BUSY'));
  attempts.set(key,Date.now());if(attempts.size>16)attempts.delete(attempts.keys().next().value);
  const controller=new AbortController();
  const operation=(async()=>{
   let timer;
   try{
    const timedOut=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('AI_TIMEOUT'));},timeoutMs);});
    const result=await Promise.race([request(payload,controller.signal),timedOut]);
    complete.set(key,result);if(complete.size>4)complete.delete(complete.keys().next().value);
    return result;
   }finally{clearTimeout(timer);pending.delete(key);attempts.set(key,Date.now());}
  })();
  pending.set(key,operation);return operation;
 };
}
export const optionalAI=createOptionalAI();
