import release from './release.json' with {type:'json'};
document.documentElement.dataset.release=release.release;
// Phase 1 is explicitly opt-in. The stable V2 application stays intact.
const preview = new URLSearchParams(window.location.search).get('assessment') === 'v3';
if (preview) await import('./v3/app.js');
else if (new URLSearchParams(window.location.search).get('assessment') === 'offline') await import('./offline-app.js');
else await import('./app.js');
