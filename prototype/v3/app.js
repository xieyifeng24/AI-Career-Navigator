import {loadSession,saveSession,chooseTrack,changeLanguage,selectAnswer,questionsFor,advance,previous,newSession} from './engine.js';
import {renderPreview,common} from './ui.js';
const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet'; stylesheet.href = './v3/styles.css'; document.head.append(stylesheet);
const root = document.getElementById('app');
let storage; try { storage = window.sessionStorage; } catch { storage = null; }
let state = loadSession(storage), error = '';
function render(focusHeading = false) {
  document.documentElement.lang = state.language;
  document.title = `${common('Your profile',state.language)} · V3 · AI Career Navigator`;
  root.innerHTML = renderPreview(state,error,focusHeading && !error);
  saveSession(storage,state);
  if (focusHeading) { document.getElementById('v3-heading')?.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }
}
root.addEventListener('change', event => {
  if (event.target.id === 'v3-language') {
    state = changeLanguage(state,event.target.value); render(); document.getElementById('v3-language')?.focus();
  } else if (event.target.name === 'v3-answer') {
    const value = event.target.value === 'unknown' ? null : Number(event.target.value);
    state = selectAnswer(state,questionsFor(state.trackId)[state.index].id,value);
    error = ''; render();
    root.querySelector(`input[name="v3-answer"][value="${value === null ? 'unknown' : value}"]`)?.focus({preventScroll:true});
  }
});
root.addEventListener('click', event => {
  const target = event.target.closest('[data-track],[data-v3-action],[data-v3-edit]');
  if (!target) return;
  error = '';
  if (target.dataset.track) state = chooseTrack(state,target.dataset.track);
  else if (target.dataset.v3Edit !== undefined) state = {...state,screen:'question',index:Number(target.dataset.v3Edit)};
  else if (target.dataset.v3Action === 'back') state = previous(state);
  else if (target.dataset.v3Action === 'reset') state = {...newSession(),language:state.language};
  else if (target.dataset.v3Action === 'next') {
    try { state = advance(state); } catch { error = 'Please choose an answer.'; }
  }
  render(true);
});
render();
