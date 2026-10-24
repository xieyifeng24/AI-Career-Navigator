import {fresh,completeAssessment} from './combined/model.js';
import {newStartingPoint,updateStartingPoint,advanceStartingPoint} from './combined/starting-point-legacy.js';
import {bank,chooseTrack,selectAnswer,advance} from './v3/engine.js';
export const intakeBase={Q01:'B','Q02.primary':'A',Q03:'C',Q04:'A','Q05.knowledge':'examples','Q05.execution':'examples','Q05.problemSolving':'examples','Q05.communication':'independent',Q06:'C',Q07:['B','F'],Q08:'B',Q09:'A',Q10:'B',Q11:'1'};
const answers={G01:6,G02:6,G03:6,G04:6,SW01:6,SW02:6,SW03:6,SW04:6,SW05:6,SW06:2,SW07:6,SW08:6};
export function fixture(changes={},v3changes={}){
 let intake=newStartingPoint();
 for(const [field,v]of Object.entries({...intakeBase,...changes}))for(const x of Array.isArray(v)?v:[v]){if(field==='Q10'&&({...intakeBase,...changes}).Q01==='F')continue;intake=updateStartingPoint(intake,field,x);}
 do{intake=advanceStartingPoint(intake);}while(intake.screen!=='bridge');
 let state={...fresh(),startingPoint:intake,v3:chooseTrack({...fresh().v3,responseVersion:'legacy-likert7'},'SW')};
 for(const q of bank.questions.filter(q=>['GENERAL','SW'].includes(q.trackId)))state.v3=advance(selectAnswer(state.v3,q.id,Object.hasOwn(v3changes,q.id)?v3changes[q.id]:answers[q.id]));
 return completeAssessment(state);
}
export const fixtures={
 A:()=>fixture(),
 B:()=>fixture({'Q02.primary':'G',Q08:'F',Q09:'B'}),
 C:()=>fixture({'Q05.execution':'untried','Q05.knowledge':'guided',Q06:'A',Q08:'A'},{SW05:2,SW06:2}),
 D:()=>fixture({Q01:'E',Q06:'F','Q05.execution':'complex','Q02.primary':'F',Q08:'E',Q10:'A'},{SW05:6,SW06:6,SW01:4}),
 E:()=>fixture({Q01:'D',Q06:'E','Q05.execution':'independent','Q02.primary':'D',Q08:'B',Q10:'A'},{SW05:6,SW06:6}),
 F:()=>fixture({Q01:'F',Q04:'I',Q06:'G','Q05.execution':'untried','Q02.primary':'I',Q08:'H',Q09:'F'},{SW01:null,SW02:null,SW03:null,SW04:null,SW05:null,SW06:null,SW07:null,SW08:null})
};
