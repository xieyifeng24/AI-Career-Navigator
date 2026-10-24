import {fresh,completeAssessment} from './combined/model.js';
import {newStartingPoint,startingQuestions,updateStartingPoint,advanceStartingPoint} from './combined/starting-point.js';
import {newSession,chooseTrack,questionsFor,selectAnswer,advance} from './v3/engine.js';
export const personaInputs={
 freshman:{Q01:'B',Q02:{selected:['B','C'],primary:'B'},Q04:['I'],Q06:['A'],Q07:['A','B','F'],Q08:['A','D'],Q12:['SW','DATA'],Q13:['none'],matrix:'untried',scale:4,answers:{G03:1,G04:4,SW01:6,SW02:5,SW05:1,SW06:1,SW07:2,SW08:4}},
 intern:{Q01:'B',Q02:{selected:['C','E'],primary:'E'},Q04:['A','C'],Q06:['B','D','E'],Q07:['H','F'],Q08:['C','D'],Q12:['SW','PM'],Q13:['learn','draft','check'],matrix:'examples',scale:5,answers:{G03:6,G04:6,SW05:4,SW06:4,SW07:3,SW08:5}},
 coder:{Q01:'B',Q02:{selected:['D','H'],primary:'H'},Q04:['A'],Q06:['C','D'],Q07:['D','H'],Q08:['C','G'],Q12:['SW','DATA'],Q13:['understand','learn','code','check','workflow','api','automate'],matrix:'independent',scale:6},
 transition:{Q01:'E',Q02:{selected:['F','G','D'],primary:'F'},Q04:['C','H'],Q06:['W','F'],Q07:['A','C','G'],Q08:['E','F'],Q12:['SW','PM','DATA'],Q13:['learn','draft'],matrix:'independent',scale:4,answers:{G03:7,G04:5,SW01:5,SW05:2,SW06:2,SW07:2,SW08:4}},
 uncertain:{Q01:'F',Q02:{selected:['I'],primary:'I'},Q04:['I'],Q06:['A'],Q07:['I'],Q08:['H'],Q12:['unsure'],Q13:['none'],matrix:'untried',scale:4,answers:{G03:1}},
 multiple:{Q01:'B',Q02:{selected:['B','E','H'],primary:'B'},Q04:['D','F'],Q06:['B','C'],Q07:['E','H'],Q08:['A','C','G'],Q12:['DES','MKT','EDU'],Q13:['learn','draft','analyze','check'],matrix:'examples',scale:5,track:'DES'}
};
export function intakeFor(config={}){
 const c={Q01:'B',Q02:{selected:['A','C'],primary:'A'},Q03:'B',Q04:['A'],Q06:['B'],Q07:['A','E'],Q08:['A','D'],Q09:{selected:['A','B'],primary:'A'},Q12:['SW','DATA'],Q13:['learn'],matrix:'examples',...config};
 let s=advanceStartingPoint(newStartingPoint());
 while(s.screen!=='bridge'){
  const q=startingQuestions(s.answers)[s.index];
  if(q.kind==='story')s=updateStartingPoint(s,'story','');
  else if(q.kind==='priority'){for(const id of c[q.id].selected)s=updateStartingPoint(s,q.id,id);s=updateStartingPoint(s,q.id+'.primary',c[q.id].primary);}
  else if(q.kind==='matrix')for(const row of q.rows)s=updateStartingPoint(s,q.id+'.'+row.id,c.matrix);
  else if(q.kind==='multi')for(const id of c[q.id])s=updateStartingPoint(s,q.id,id);
  else s=updateStartingPoint(s,q.id,c[q.id]||q.options[0].id);
  s=advanceStartingPoint(s);
 }
 return s;
}
export function persona(id='freshman',locale='en',trackOverride){
 const c=personaInputs[id],track=trackOverride||c.track||'SW';let v3=chooseTrack({...newSession(),language:locale},track);
 for(const q of questionsFor(track))v3=advance(selectAnswer(v3,q.id,c.answers?.[q.id]??c.scale));
 return completeAssessment({...fresh(locale),startingPoint:intakeFor(c),v3});
}
