// Adapter: one report model, five pages. The page modules hold the content;
// this file only assembles the shell, navigation and footer.
import {renderHeader,renderFooter,escapeHTML as e} from '../explorer-views.js';
import {bank} from '../v3/engine.js';
import {language,t} from '../i18n.js';
import {pageIds,pageLabels,pageTarget} from './page-map.js';
import {buildCompatibleReport} from './report-model.js';
import {renderProfilePage} from './pages/profile.js';
import {renderCapabilityPage} from './pages/capability.js';
import {renderGalaxyPage} from './pages/galaxy.js';
import {renderWhatIfPage} from './pages/what-if.js';
import {renderImpactPage} from './pages/impact.js';
import {L} from './pages/shared.js';

export {buildCompatibleReport};
export {pageIds as reportPages};
export {pageLabels};

function reportContext(model){
 return `${model.notes?`<section class="ex-method"><h3>${L('Additional information','补充信息','Maklumat tambahan')}</h3><p style="white-space:pre-wrap">${e(model.notes)}</p></section>`:''}<button class="text-button" data-combined-action="edit-v3">${e(t('Edit your answers ↗'))}</button>`;
}
export function renderCompatibleReport(state,options={}){
 const model=buildCompatibleReport(state,language,options.assumptions);
 const {page,section}=pageTarget(state.page,options.section??state.section);
 const nav=pageIds.map((key,index)=>`<button type="button" data-action="page:${key}" class="${page===key?'active':''}" ${page===key?'aria-current="page"':''}><span>0${index+1}</span>${e(L(...pageLabels[key]))} ↗</button>`).join('');
 let content='';
 if(page==='profile')content=renderProfilePage(model,options);
 if(page==='capability')content=renderCapabilityPage(model,options);
 if(page==='galaxy')content=renderGalaxyPage(model,options,section);
 if(page==='whatif')content=renderWhatIfPage(model,options);
 if(page==='impact')content=renderImpactPage(model,options,state);
 const track=bank.tracks.find(item=>item.id===state.v3?.trackId);
 return renderHeader({report:model.companions})+`<main class="report-page shell ex-report" data-compatible-analysis><aside class="report-sidebar"><div class="sidebar-sticky"><h2>${e(track?track.label[language]:'')}</h2><nav class="report-nav" aria-label="${e(t('Local report navigation'))}">${nav}</nav><button class="text-button" data-action="edit">${e(t('Edit your answers ↗'))}</button></div></aside><div class="report-main">${content}${reportContext(model)}<div class="ex-report-foot"><button class="button secondary" data-action="export">${e(t('Export my report'))}</button><button class="text-button" data-action="print">${e(t('Print / save PDF'))}</button><button class="text-button" data-action="reset">${e(t('Start over'))}</button></div></div></main>`+renderFooter();
}
