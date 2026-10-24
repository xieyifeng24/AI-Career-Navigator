// Run with the Codex workspace's @oai/artifact-tool dependency, not repo packages.
import fs from 'node:fs/promises';
import path from 'node:path';
const {Workbook,SpreadsheetFile}=await import(process.env.ARTIFACT_TOOL_MODULE||'@oai/artifact-tool');
const [input,output,previewDir]=process.argv.slice(2);
if(!input||!output||!previewDir)throw Error('Usage: node export_malaysia_workbook.mjs workbook-data.json output.xlsx preview-directory');
const data=JSON.parse(await fs.readFile(input,'utf8')),wb=Workbook.create();
const order=['Research Status','Malaysia Career Profiles','MASCO Occupation Mapping','Malaysia Job Demand','Malaysia Salary & Skills','Malaysia AI Transformation',
 'Malaysia Regional Opportunities','Career Paths & What If','Career Relations','Occupation Tasks','Skill Requirements','Scenario Rules','Career Catalog 24','Raw Observations','Evidence & Sources','ReadMe'];
const col=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
const fields={},sheets={};
for(const name of order){
 const rows=data.tables[name],all=[...new Set(rows.flatMap(Object.keys))];
 const first=['record_id','occupation_id','topic','finding_zh','evidence_type','source_ids'];
 const f=[...first.filter(k=>all.includes(k)),...all.filter(k=>!first.includes(k))];fields[name]=f;
 const sh=wb.worksheets.add(name);sheets[name]=sh;sh.showGridLines=false;
 const value=(r,k)=>{
  const v=r[k];if(v===null||v===undefined)return 'Unknown';
  if(k==='endpoint_record_refs'){return JSON.parse(v).map(x=>x.table+'#'+x.record_id).join('; ');}
  return typeof v==='object'?JSON.stringify(v):v;
 };
 const matrix=[f,...rows.map(r=>f.map(k=>value(r,k)))],end=matrix.length;
 const range=sh.getRange(`A1:${col(f.length-1)}${end}`);range.values=matrix;
 range.format.font={name:'Arial',size:10,color:'#182C3D'};range.format.wrapText=true;range.format.verticalAlignment='top';
 sh.getRange(`A1:${col(f.length-1)}1`).format={fill:'#243C55',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},rowHeight:38,wrapText:true};
 const widths=f.map(k=>['finding_zh','detail','limitations','practice','explanation','malaysia_conditions','human_responsibility','remaining_requirements'].includes(k)?76:
  ['source_url','endpoint_record_refs'].includes(k)?135:['source_name','record_refs','all_of'].includes(k)?90:
  ['record_id','source_id','evidence_type','source_ids','occupation_id','skill_id','task_id'].includes(k)?24:42);
 f.forEach((k,i)=>{sh.getRange(`${col(i)}1:${col(i)}${end}`).format.columnWidth=widths[i];});
 for(let r=1;r<end;r++){
  const lines=Math.max(...matrix[r].map((v,i)=>Math.ceil([...String(v)].reduce((n,c)=>n+(c.charCodeAt(0)>255?2:1),0)/(widths[i]-3))));
  if(lines*15+12>409)throw Error(`Review long cell layout ${name} row ${r+1}; cannot silently clip`);
  sh.getRange(`A${r+1}:${col(f.length-1)}${r+1}`).format.rowHeight=Math.max(36,lines*15+12);
  if(r%2===0)sh.getRange(`A${r+1}:${col(f.length-1)}${r+1}`).format.fill='#F0F4F7';
 }
 if(f.includes('evidence_type'))sh.getRange(`${col(f.indexOf('evidence_type'))}2:${col(f.indexOf('evidence_type'))}${end}`).conditionalFormats.add('containsText',{text:'UNKNOWN',format:{fill:'#FFF1CC',font:{color:'#9B5400'}}});
 sh.freezePanes.freezeRows(1);sh.freezePanes.freezeColumns(name==='ReadMe'?1:2);
}
// Same official occupation and adjacent quarter comparison, linked to raw observations.
const dn='Malaysia Job Demand',df=fields[dn],raw=fields['Raw Observations'];
const r=data.tables[dn].findIndex(x=>x.topic==='季度变化解释')+2;
const at=k=>`${col(df.indexOf(k))}${r}`;
for(const [key,formula] of [['q1',`='Raw Observations'!${col(raw.indexOf('value'))}2`],['q2',`='Raw Observations'!${col(raw.indexOf('value'))}3`],['change_count',`=${at('q2')}-${at('q1')}`],['change_rate',`=${at('q2')}/${at('q1')}-1`]])sheets[dn].getRange(at(key)).formulas=[[formula]];
sheets[dn].getRange(at('change_rate')).setNumberFormat('0.00%');wb.recalculate();
const scan=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:20},summary:'Formula error scan',maxChars:1500});
await fs.mkdir(previewDir,{recursive:true});
for(let i=0;i<order.length;i++){
 const name=order[i],png=await wb.render({sheetName:name,range:`A1:${col(Math.min(fields[name].length-1,5))}${Math.min(data.tables[name].length+1,3)}`,scale:1,format:'png'});
 await fs.writeFile(path.join(previewDir,`${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
}
await fs.mkdir(path.dirname(output),{recursive:true});await (await SpreadsheetFile.exportXlsx(wb)).save(output);
await fs.writeFile(path.join(previewDir,'verification.json'),JSON.stringify({sheets:order,error_scan:scan.ndjson,rendered:order.length,export:output},null,2));
console.log('Exported 16 sheets; rendered all 16; '+scan.ndjson);
