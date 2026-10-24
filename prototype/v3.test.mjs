import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
// Canonical LF checksums preserve author-content checks on Windows CRLF checkouts.
import {bank,VERSION,STORAGE_KEY,validateBank,questionsFor,newSession,chooseTrack,changeLanguage,selectAnswer,answeredCount,advance,previous,restoreSession,loadSession,saveSession} from './v3/engine.js';
import {renderPreview,progress} from './v3/ui.js';
import {createDraft as v2Draft} from './exploration/engine.js';
import manifest from './v3/source-manifest.json' with {type:'json'};
const encoded = text => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const stripLanguageMenu = html => html.replace(/<select id="v3-language"[\s\S]*?<\/select>/, '');
const answers = [1,2,null,4,5,6,7,3,1,2,6,null];
function memory() { const data = new Map(); return {data,getItem:key => data.get(key) ?? null,setItem:(key,value)=>data.set(key,value)}; }

test('V3 is an unchanged author file; complete 84-item, 10-track, trilingual bank validates', () => {
  assert.equal(createHash('sha256').update(fs.readFileSync(new URL('./v3/bank.json',import.meta.url)).toString('utf8').replace(/\r\n/g,'\n')).digest('hex'),manifest.sha256);
  assert.deepEqual(validateBank(bank),[]);
  assert.equal(bank.questions.length,84);assert.equal(bank.tracks.length,10);
  assert.deepEqual(bank.tracks.map(t=>t.id),['SW','DATA','FIN','PM','MKT','DES','ENG','HLT','EDU','OPS']);
  assert.equal(newSession().language,'en');
  assert.deepEqual(bank.scale.map(option=>option.value),[1,2,3,4,5,6,7]);
});
test('validation catches missing translations, duplicated IDs, bad options, help references and session counts', () => {
  const broken=structuredClone(bank);delete broken.questions[0].statement.ms;
  broken.questions[1].id=broken.questions[0].id;broken.scale[0].value=0;
  broken.questions[2].helpKey='missing';broken.questions.pop();
  const errors=validateBank(broken);
  assert.ok(errors.includes('G01.ms'));assert.ok(errors.includes('questions'));
  assert.ok(errors.includes('scale'));assert.ok(errors.includes('G03.helpKey'));assert.ok(errors.includes('OPS.count'));
});
for (const track of bank.tracks) for (const language of bank.languageCodes) {
  test(`${track.id} / ${language}: 4+8 questions complete with exact source text, 7+unknown, language/refresh preservation and review only`, () => {
    let state=changeLanguage(newSession(),language);
    const entry=renderPreview(state);assert.equal((entry.match(/data-track=/g)||[]).length,10);
    for (const item of bank.tracks) assert.ok(entry.includes(encoded(item.label[language])));
    state=chooseTrack(state,track.id);
    const questions=questionsFor(track.id);
    assert.equal(questions.length,12);assert.equal(questions.filter(q=>q.trackId==='GENERAL').length,4);
    assert.equal(questions.filter(q=>q.trackId===track.id).length,8);
    for(let index=0;index<12;index++) {
      assert.equal(state.index,index);
      const question=questions[index],before=structuredClone(state);
      let html=renderPreview(state);
      assert.equal((html.match(/data-question-id=/g)||[]).length,1);
      assert.equal((html.match(/name="v3-answer"/g)||[]).length,8);
      assert.ok(html.includes(encoded(question.statement[language])));
      assert.ok(html.includes(encoded(progress(state))));
      assert.ok(!html.includes('<textarea'));assert.ok(!html.includes('undefined'));
      for(const option of bank.scale)assert.ok(html.includes(encoded(option.label[language])));
      if(language!=='zh-CN')assert.ok(!/[\u4e00-\u9fff]/.test(stripLanguageMenu(html)));
      assert.throws(()=>advance(state),/ANSWER_REQUIRED/);
      state=selectAnswer(state,question.id,answers[index]);
      assert.deepEqual(before.answers, index===0?{}:Object.fromEntries(questions.slice(0,index).map((q,i)=>[q.id,answers[i]])));
      assert.equal(answeredCount(state),index+1);
      for (const switched of bank.languageCodes) {
        const next=changeLanguage(state,switched);
        assert.deepEqual(next.answers,state.answers);assert.equal(next.trackId,track.id);assert.equal(next.index,index);
        html=renderPreview(next);
        assert.ok(html.includes(encoded(question.statement[switched])));
        assert.equal((html.match(/ checked/g)||[]).length,1);
        if(switched!=='zh-CN')assert.ok(!/[\u4e00-\u9fff]/.test(stripLanguageMenu(html)));
      }
      assert.deepEqual(restoreSession(JSON.stringify(state)),state);
      state=advance(state);
    }
    assert.equal(state.screen,'review');assert.equal(answeredCount(state),12);
    assert.equal(Object.values(state.answers).filter(value=>value===null).length,2);
    assert.equal(state.answers[questions[3].id],4); // Neutral is a number, unknown is null.
    const review=renderPreview(state);
    assert.equal((review.match(/data-v3-edit=/g)||[]).length,12);
    for (const question of questions) assert.ok(review.includes(encoded(question.statement[language])));
    assert.ok(!review.includes(bank.uiText.submit[language])); // No misleading report action in phase one.
    assert.deepEqual(restoreSession(JSON.stringify(state)),state);
    const returned=previous(state);assert.equal(returned.index,11);assert.equal(returned.screen,'question');
    assert.deepEqual(returned.answers,state.answers);
  });
}
test('navigation preserves answers and common questions when changing tracks', () => {
  let state=chooseTrack(newSession(),'SW');state=selectAnswer(state,'G01',null);state=advance(state);
  assert.equal(state.index,1);state=previous(state);assert.equal(state.index,0);
  state=previous(state);assert.equal(state.screen,'tracks');assert.equal(state.answers.G01,null);
  state=selectAnswer(state,'SW01',7);state=chooseTrack(state,'DATA');
  assert.deepEqual(state.answers,{G01:null});assert.equal(state.index,0);assert.equal(state.trackId,'DATA');
  assert.throws(()=>questionsFor('NOT_A_TRACK'),/INVALID_TRACK/);
});
test('invalid, letter, string, out-of-range and foreign-track answers cannot enter V3 state', () => {
  const state=chooseTrack(newSession(),'SW');
  for(const bad of ['A','B','C','D','U','7',0,8,1.5,undefined,NaN,true]) assert.throws(()=>selectAnswer(state,'G01',bad),/INVALID_V3_ANSWER/);
  assert.throws(()=>selectAnswer(state,'FIN01',4),/INVALID_V3_ANSWER/);
  assert.throws(()=>changeLanguage(state,'fr'),/INVALID_LANGUAGE/);
  for (const bad of ['A','7',0,8]) assert.deepEqual(restoreSession(JSON.stringify({...state,answers:{G01:bad}})),newSession());
});
test('V2 and V3 versions/storage remain isolated; malformed and incomplete review sessions reset safely', () => {
  const storage=memory(),legacy=v2Draft('SW');legacy.exploration.answers.G01='A';
  storage.setItem('career-language','zh-CN');storage.setItem('career-questionnaire-v2',JSON.stringify(legacy));
  const before=JSON.stringify([...storage.data]);assert.deepEqual(loadSession(storage),newSession());assert.equal(JSON.stringify([...storage.data]),before);
  assert.deepEqual(restoreSession(JSON.stringify(legacy)),newSession());
  assert.throws(()=>selectAnswer(legacy,'G01',7),/INVALID_V3_VERSION/);
  assert.throws(()=>chooseTrack({version:'2.0.0',answers:{G01:'A'}},'SW'),/INVALID_V3_VERSION/);
  assert.deepEqual(restoreSession(JSON.stringify({...newSession(),version:'2.0.0'})),newSession());
  let state=selectAnswer(chooseTrack(newSession(),'SW'),'G01',null);state=changeLanguage(state,'ms');
  assert.equal(saveSession(storage,state),true);assert.deepEqual(loadSession(storage),state);
  assert.equal(storage.getItem('career-questionnaire-v2'),JSON.stringify(legacy));
  assert.equal(storage.getItem('career-language'),'zh-CN');assert.ok(storage.getItem(STORAGE_KEY));
  for (const raw of ['{bad','null','[]',JSON.stringify({...state,screen:'review'}),JSON.stringify({...state,index:12}),JSON.stringify({...state,index:7}),JSON.stringify({...state,trackId:'UNKNOWN'})]) assert.deepEqual(restoreSession(raw),newSession());
});
test('blocked storage leaves the in-memory questionnaire usable', () => {
  const storage={getItem(){throw Error('denied');},setItem(){throw Error('quota');}};
  let state=chooseTrack(loadSession(storage),'OPS');state=selectAnswer(state,'G01',7);
  assert.equal(saveSession(storage,state),false);assert.equal(state.answers.G01,7);assert.equal(advance(state).index,1);
});
test('all shared V3 UI strings come from existing trilingual catalog; preview is network-free', () => {
  const app=fs.readFileSync(new URL('./v3/app.js',import.meta.url),'utf8');
  const engine=fs.readFileSync(new URL('./v3/engine.js',import.meta.url),'utf8');
  assert.ok(!/fetch\s*\(|XMLHttpRequest|optionalAI|buildLocalReport|requestAnalysis/.test(app+engine));
  for (const language of bank.languageCodes) for (const screen of ['tracks','question']) {
    let state=changeLanguage(newSession(),language);if(screen==='question')state=chooseTrack(state,'SW');
    assert.doesNotThrow(()=>renderPreview(state,'Please choose an answer.'));
  }
});
