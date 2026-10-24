"""Export existing research records and analysis rules; does not create new facts."""
import argparse
import csv
import hashlib
import json
import shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('output',type=Path);p.add_argument('--pilot-delivery',type=Path);p.add_argument('--raw-sources',type=Path)
a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
data=json.loads((ROOT/'data/malaysia_intelligence/current.json').read_text(encoding='utf-8'))
tables=data['tables'];model=data['analysis_model'];sources={s['source_id']:s for s in tables['Evidence & Sources']}
profiles=ROOT/'docs/malaysia-careers';profiles.mkdir(exist_ok=True)
def cite(row):
 return '；'.join(f'[{sid}: {sources[sid]["source_name"]}]({sources[sid]["source_url"]})' for sid in row.get('source_ids','').split(';') if sid)
def section(row):
 return f'### {row["topic"]}\n\n{row["finding_zh"]}\n\n依据：{row["evidence_type"]}；记录 `{row["record_id"]}`；{cite(row)}。\n\n范围限制：{row["limitations"]}\n\n'
status=[]
for c in tables['Career Catalog 24']:
 occ=c['occupation_id'];own=lambda table:[r for r in tables[table] if r.get('occupation_id')==occ]
 if occ in ['software','ai-research','environment'] and a.pilot_delivery:
  original=a.pilot_delivery/(occ+'_中文分析.md')
  shutil.copyfile(original,profiles/(occ+'.md'))
 else:
  text=f'# {c["title_zh"]}\n\n{c["title_en"]} / {c["title_ms"]}；稳定 ID：`{occ}`。版本：{data["version"]}。\n\n'
  text+='以下是以马来西亚证据为主的职业桌面研究，保留Unknown，不构成个人匹配评分、就业概率或许可判断。\n\n'
  text+=''.join(section(r) for r in own('Malaysia Career Profiles'))
  text+='## 分类与本地职称\n\n'
  for r in own('MASCO Occupation Mapping'):
   text+=f'- MASCO {r["masco_code"]}：{r["official_title_en"]} / {r["official_title_ms"]}。{r["finding_zh"]} {cite(r)}\n'
  text+='\n## 职业任务与AI工作重组\n\n'
  for r in own('Malaysia AI Transformation'):
   if r.get('record_kind')=='context_not_task':continue
   text+=f'### {r["topic"]}\n\nAI条件建议：{r["finding_zh"]}\n\n人工责任：{r["human_responsibility"]}\n\n可能压缩/重组：{r["automation_exposure"]}\n\n适用条件：{r["malaysia_conditions"]}\n\n国际边界：{r["international_boundary"]}\n\nINFERENCE；{cite(r)}\n\n'
  text+='## 成长路线与条件情景\n\n'+''.join(section(r) for r in own('Career Paths & What If'))
  text+='## 转型比较\n\n'+''.join(section(r) for r in own('Career Relations') if r['topic']=='transition')
  text+='## 使用边界\n\n技能要求不代表用户已经掌握。没有报告的技能是unknown，明确自述缺少才是reported_gap。情景仅调整明确假设，不修改市场事实、原问卷或SDG结果。所有实习、国籍、工作准证及职业许可条件必须按个人与具体岗位另行核查。\n'
  (profiles/(occ+'.md')).write_text(text,encoding='utf-8')
 status.append(dict(occupation_id=occ,title_zh=c['title_zh'],title_en=c['title_en'],
     research_status='DESK_RESEARCH_WITH_EXPLICIT_GAPS',profile_dimensions=len(own('Malaysia Career Profiles')),
     task_families=len(own('Occupation Tasks')),scenario_count=sum(r['occupation_id']==occ for r in model['scenarios']),
     precise_market_salary='Unknown unless a scope-labelled sample exists',state_occupation_shares='Unknown',
     local_ai_adoption_rate='Unknown',mapping_status='Conditional task-based; food and legal sub-branches require JD-specific review',
     legacy_catalog_status=c['research_status']))
if a.pilot_delivery:
 shutil.copyfile(a.pilot_delivery/'Malaysia_Career_Intelligence_Pilot.xlsx',ROOT/'data/malaysia_intelligence/pilot-original.xlsx')
 (profiles/'pilot-additions.md').write_text('# 三职业原始研究的追加记录\n\nsoftware、ai-research、environment三份中文报告逐字保留原交付；current.json追加了每职业两项任务与独立AI支持技能。旧报告描述的是原始样板阶段，当前全库状态见Research Status。原始表行与pilot-original.json完整保留。\n\n已知原记录问题及处理见current.json.release_notes.pilot_errata与集成说明，不将未经核实的O*NET关联提升为确定映射。\n',encoding='utf-8')

manifest=[]
if a.raw_sources:
 for filename,sid,url in [('mycol-2024-25.pdf','S03-FULL',sources['S03-FULL']['source_url']),('dosm-jmi-q2-2026.xlsx','S01','https://www.dosm.gov.my/portal-main/release-document-log?release_document_id=20742')]:
  raw=a.raw_sources/filename
  if raw.exists():manifest.append(dict(source_id=sid,source_url=url,filename=filename,bytes=raw.stat().st_size,
      sha256=hashlib.sha256(raw.read_bytes()).hexdigest(),verified='2026-10-23',redistribution='Raw third-party documents not republished; source locators and original values retained'))
 (ROOT/'data/malaysia_intelligence/source-file-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

book=json.loads(json.dumps(data))
for name,rows in book['tables'].items():
 for r in rows:
  r.update(data.get('record_overrides',{}).get(name+'#'+r.get('record_id',''),{}))
book['tables']['Research Status']=status
book['tables']['Skill Requirements']=[{**r,'record_refs':json.dumps(r['record_refs'],ensure_ascii=False)} for r in model['requirements']]
book['tables']['Scenario Rules']=[{k:json.dumps(v,ensure_ascii=False) if isinstance(v,(dict,list)) else v for k,v in r.items()} for r in model['scenarios']]
# Preserve original ReadMe rows; make the current release boundary explicit above them in workbook view only.
book['tables']['ReadMe']=[{'item':'当前导出版本','detail':data['version']+'；24职业桌面研究，有明确证据缺口；原样板ReadMe和Catalog旧状态为保留历史，不能作当前覆盖判断。'},
 {'item':'事实完整性','detail':'没有填补未知薪资、州级份额、AI采用率；部分产品分支MASCO、MyCOL同名状态仍未核实。测试验证程序与引用完整性，不证明所有职业事实无误。'}]+book['tables']['ReadMe']
(a.output/'workbook-data.json').write_text(json.dumps(book,ensure_ascii=False,indent=2),encoding='utf-8')
shutil.copyfile(ROOT/'data/malaysia_intelligence/current.json',a.output/'current.json')
shutil.copytree(ROOT/'data/malaysia_intelligence/csv',a.output/'csv',dirs_exist_ok=True)
shutil.copytree(profiles,a.output/'中文职业分析',dirs_exist_ok=True)
for name,rows in [('Research Status',status)]:
 with (a.output/(name+'.csv')).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
summary={'version':data['version'],'career_count':24,'task_families':len(tables['Occupation Tasks']),
 'source_count':len(sources),'requirements':len(model['requirements']),'scenarios':len(model['scenarios']),
 'tables':{name:len(rows) for name,rows in tables.items()},'research_coverage':model['research_coverage'],
 'pilot_sha256':data['import_provenance']['sha256'],'source_files':manifest}
(a.output/'research-verification.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:summary[k] for k in ['version','career_count','task_families','source_count','requirements','scenarios']},ensure_ascii=False))
