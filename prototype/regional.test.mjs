import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,nextBackground} from './combined/model.js';
import {sampleProfile} from './explorer-engine.js';
import {bank,chooseTrack,selectAnswer,advance} from './v3/engine.js';
import {buildCompatibleReport} from './combined/v2-report.js';
import {renderRegionalPanel} from './combined/regional-view.js';
import {setLanguage} from './i18n.js';

function complete(){
 let state={...fresh('en'),profile:sampleProfile()};
 for(let i=0;i<4;i++)state=nextBackground(state).state;
 state.v3=chooseTrack(state.v3,'SW');
 for(const q of bank.questions.filter(q=>q.trackId==='GENERAL'||q.trackId==='SW'))
  state.v3=advance(selectAnswer(state.v3,q.id,q.id==='SW05'?null:5));
 return {...state,phase:'report',page:'overview'};
}

test('region and language views use the same personal analysis and original answers',()=>{
 const state=complete(),before=structuredClone(state),base=buildCompatibleReport(state,'en');
 for(const locale of bank.languageCodes){
  setLanguage(locale);
  for(const region of ['MY','US','GLOBAL']){
   const html=renderRegionalPanel(base,{region},locale);
   assert.match(html,/regional-panel/);
   assert.match(html,/https:\/\//);
   assert.ok(!html.includes('undefined'));
  }
 }
 const my=renderRegionalPanel(base,{region:'MY'},'en');
 const us=renderRegionalPanel(base,{region:'US'},'en');
 const global=renderRegionalPanel(base,{region:'GLOBAL'},'en');
 assert.match(my,/MASCO 2512/);
 assert.match(my,/all professionals/i);
 assert.match(us,/O\*NET-SOC 15-1252/);
 assert.match(us,/BLS/);
 assert.match(global,/ESCO/);
 assert.notEqual(my,us);assert.notEqual(us,global);
 assert.deepEqual(state,before);
 assert.deepEqual(buildCompatibleReport(state,'en').p0,base.p0);
});
