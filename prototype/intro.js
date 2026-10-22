/** Presentation only: no profile processing, scoring, network requests or AI. */
export const INTRO_KEY = 'career-introduction-v1';
export const SCENES = Object.freeze([
  { duration: 3500, name: 'The change' },
  { duration: 4000, name: 'The questions' },
  { duration: 3500, name: 'The solution' },
  { duration: 4500, name: 'The intelligence' },
  { duration: 4500, name: 'The possibilities' },
  { duration: 4000, name: 'The beginning' },
]);
export const INTRO_DURATION = SCENES.reduce((sum, scene) => sum + scene.duration, 0);
export function sceneAt(elapsed) {
  let end = 0;
  return SCENES.findIndex(scene => (end += scene.duration) > elapsed);
}
export function shouldPlayIntro(storage, search = '') {
  const mode = new URLSearchParams(search).get('intro');
  if (mode === 'replay') return true;
  if (mode === 'off') return false;
  try { return storage.getItem(INTRO_KEY) !== 'seen'; } catch { return true; }
}
export function rememberIntro(storage) {
  try { storage.setItem(INTRO_KEY, 'seen'); } catch { /* Storage is optional. */ }
}
export function consumeIntroParameter() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('intro')) return;
  url.searchParams.delete('intro');
  window.history.replaceState(window.history.state, '', url);
}

// Reuse the product's existing three-circle mark rather than a separate intro identity.
const mark = `<span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>`;
function environmentMarkup() {
  return `<div class="cine-environment" aria-hidden="true"><div class="cine-halo cine-halo-a"></div><div class="cine-halo cine-halo-b"></div></div>
    <div class="cine-visual" aria-hidden="true"><div class="cine-grid"></div><span class="cine-visual-caption">YOUR CAREER, IN CONTEXT</span>
      <div class="cine-orbit"><div class="cine-ring cine-ring-one"></div><div class="cine-ring cine-ring-two"></div>
        <svg class="cine-routes" viewBox="0 0 500 500" fill="none"><path d="M30 170Q250 250 470 130M250 250Q370 270 460 380M250 250Q210 350 70 420"/></svg>
        <div class="cine-orbit-center"><span>YOU</span><strong>More than<br>a job title.</strong></div>
        <span class="cine-node cine-node-a"><span class="cine-node-default">Skills</span><span class="cine-node-source">O*NET</span></span>
        <span class="cine-node cine-node-b"><span class="cine-node-default">AI + work</span><span class="cine-node-source">ESCO</span></span>
        <span class="cine-node cine-node-c"><span class="cine-node-default">Possibilities</span><span class="cine-node-source">MYFutureJobs<small>Awaiting permission</small></span></span>
      </div><div class="cine-visual-bottom"><span>✳</span><span>From uncertainty<br>to informed choices.</span><span>↗</span></div>
    </div>`;
}
function sceneMarkup() {
  return [
    `<span class="cine-kicker">A new chapter of work</span><h1>The world of work<br>is changing.<br><em>Where do you fit in?</em></h1><p>AI is redefining how we learn, work, and grow.</p>`,
    `<span class="cine-kicker">Change brings questions</span><h1 class="cine-questions"><span>Which careers will evolve?</span><span>Which skills will matter?</span><span>What should you do next?</span></h1>`,
    `<span class="cine-kicker">Clarity starts here</span><h1>Meet <em>AI Career<br>Navigator.</em></h1><p>Your guide to career decisions in the age of AI.</p>`,
    `<span class="cine-kicker">Career intelligence, with context</span><h1>Grounded in data.<br><em>Built for what's next.</em></h1><div class="cine-sources"><span>O*NET<small>US · imported snapshot</small></span><i>·</i><span>ESCO<small>EU · imported snapshot</small></span><i>·</i><span class="cine-pending">MYFutureJobs<small>MY · awaiting permission</small></span></div><p>Career and skills intelligence, with dated, source-linked insights.</p><small class="cine-disclosure">14-day refresh workflow prepared; not yet activated.</small>`,
    `<span class="cine-kicker">More than a single answer</span><h1>Understand the shifts.<br><em>Discover your strengths.</em></h1><p>Explore career fit. Test your skills.<br>Simulate different paths. Build your growth roadmap.</p><small class="cine-disclosure">Exploratory self-report and practice plans, not a certified skills test.</small>`,
    `<span class="cine-kicker">Your next chapter</span><h1>You can't predict<br>every change.<br><em>But you can prepare<br>for what's next.</em></h1><div class="cine-final-brand">${mark}<span>AI Career Navigator</span></div>`,
  ].map((content, index) => `<section class="cine-scene" data-cine-scene="${index}" aria-hidden="true" aria-label="${SCENES[index].name}"><div class="cine-copy">${content}</div></section>`).join('');
}

/** Returns an idempotent cleanup function. Time pauses when the tab is hidden. */
export function playIntroduction({ app, onComplete, storage = null }) {
  rememberIntro(storage);
  const overlay = document.createElement('div');
  overlay.className = 'cinematic-intro';
  overlay.lang = 'en';
  overlay.dataset.scene = '0';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'AI Career Navigator introduction');
  overlay.tabIndex = -1;
  overlay.innerHTML = `${environmentMarkup()}<div class="cine-topline"><div class="brand">${mark}<span>AI Career<br><b>Navigator</b></span></div><span class="cine-edition">YOUR SKILLS. YOUR FUTURE. YOUR CHOICE.</span></div>${sceneMarkup()}<div class="cine-bottomline"><span class="cine-chapter" aria-hidden="true">01 / 06</span><span>At your pace. On your terms.</span><button type="button" class="cine-skip">Skip intro <span aria-hidden="true">↗</span></button></div><div class="cine-progress" aria-hidden="true"><i></i></div>`;
  const wasInert = app.inert;
  const priorAria = app.getAttribute('aria-hidden');
  const priorOverflow = document.body.style.overflow;
  app.inert = true;
  app.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = 'hidden';
  document.body.append(overlay);
  overlay.focus({preventScroll: true});
  const sections = [...overlay.querySelectorAll('.cine-scene')];
  const progress = overlay.querySelector('.cine-progress i');
  const chapter = overlay.querySelector('.cine-chapter');
  let frame, fadeTimer, closed = false, finishing = false, elapsed = 0, lastTime = null, current = -1;
  function restore() {
    if (closed) return;
    closed = true;
    cancelAnimationFrame(frame);
    clearTimeout(fadeTimer);
    document.removeEventListener('visibilitychange', visibility);
    overlay.removeEventListener('keydown', keydown);
    app.inert = wasInert;
    if (priorAria === null) app.removeAttribute('aria-hidden'); else app.setAttribute('aria-hidden', priorAria);
    document.body.style.overflow = priorOverflow;
    overlay.remove();
    onComplete?.();
  }
  function finish() {
    if (finishing || closed) return;
    finishing = true;
    cancelAnimationFrame(frame);
    overlay.classList.add('is-finished');
    fadeTimer = setTimeout(restore, 650);
  }
  function tick(now) {
    if (closed || finishing) return;
    if (lastTime !== null) elapsed += now - lastTime;
    lastTime = now;
    const next = sceneAt(elapsed);
    if (next < 0) return finish();
    if (next !== current) {
      current = next;
      overlay.dataset.scene = String(next);
      chapter.textContent = `${String(next + 1).padStart(2, '0')} / 06`;
      sections.forEach((section, index) => {
        section.classList.toggle('is-active', index === next);
        section.setAttribute('aria-hidden', String(index !== next));
      });
    }
    progress.style.transform = `scaleX(${Math.min(1, elapsed / INTRO_DURATION)})`;
    frame = requestAnimationFrame(tick);
  }
  function visibility() {
    overlay.classList.toggle('is-paused', document.hidden);
    cancelAnimationFrame(frame);
    lastTime = null;
    if (!document.hidden && !finishing) frame = requestAnimationFrame(tick);
  }
  function keydown(event) {
    if (event.key === 'Escape') finish();
    // Keep keyboard focus inside the transient dialog without requiring interaction.
    if (event.key === 'Tab') { event.preventDefault(); overlay.querySelector('button').focus(); }
  }
  overlay.querySelector('.cine-skip').addEventListener('click', finish);
  overlay.addEventListener('keydown', keydown);
  document.addEventListener('visibilitychange', visibility);
  if (!document.hidden) frame = requestAnimationFrame(tick);
  return restore;
}
