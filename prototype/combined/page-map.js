// The report is one narrative in five pages. Legacy keys stay resolvable so
// sessions saved under the previous nine-page navigation still open.
export const pageIds=['profile','capability','galaxy','whatif','impact'];
export const pageLabels={
 profile:['Personal profile','个人画像','Profil peribadi'],
 capability:['AI capability','AI 能力','Keupayaan AI'],
 galaxy:['Career galaxy','职业星系','Galaksi kerjaya'],
 whatif:['What if','假设未来','Bagaimana jika'],
 impact:['Your global impact','你的全球影响','Impak global anda']
};
export const pageKickers={
 profile:['Understand yourself','理解自己','Fahami diri anda'],
 capability:['Discover your abilities','了解你的能力','Temui keupayaan anda'],
 galaxy:['Explore your career','探索职业方向','Terokai kerjaya anda'],
 whatif:['Simulate your future','模拟你的未来','Simulasikan masa depan anda'],
 impact:['Discover your impact','发现你的影响','Temui impak anda']
};
export const galaxySections=['paths','map','compare','skills'];
export const galaxySectionLabels={
 paths:['Career paths','职业路径','Laluan kerjaya'],
 map:['Star map','职业星图','Peta bintang'],
 compare:['Compare routes','路线对比','Banding laluan'],
 skills:['Skills and transfers','技能与迁移','Kemahiran dan peralihan']
};
const legacyPages={overview:'profile',ai:'capability',careers:'galaxy',map:'galaxy',compare:'galaxy',paths:'galaxy',tree:'galaxy',future:'whatif',plan:'whatif',sdg:'impact',catalog:'impact'};
const legacySections={careers:'paths',tree:'skills',paths:'compare',map:'map',compare:'compare',skills:'skills'};
export const legacyPageSections=legacySections;
export function canonicalPage(page){return pageIds.includes(page)?page:legacyPages[page]||'profile';}
export function canonicalGalaxySection(section){return galaxySections.includes(section)?section:legacySections[section]||'map';}
// A legacy page key also names the galaxy section it used to be.
export function pageTarget(page,section='map'){
 const target=canonicalPage(page);
 return {page:target,section:target==='galaxy'?(legacySections[page]||canonicalGalaxySection(section)):null};
}
