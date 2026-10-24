"""Lossless import plus manually reviewed, additive decision links."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('pilot',type=Path);a=p.parse_args()
raw=a.pilot.read_bytes(); data=json.loads(raw)
data['version']='malaysia-intelligence-2026-10-23-pilot-bridge-1'
data['parent_schema_version']=data['schema_version']
data['import_provenance']={'sha256':hashlib.sha256(raw).hexdigest(),'source_filename':a.pilot.name,'base_commit':'337abca0848a03c2092061b572f705035c8b127d'}
data['stage']='PILOT_LOGIC_VALIDATION'
def ref(table,id):return {'table':table,'record_id':id}
requirements=[];skills={}
specs={
 'software':[('programming','编程','04-008','提交能解释并运行的小功能'),('sql','SQL','04-008','设计数据表并验证查询结果'),('testing','软件测试','04-011','编写边界测试及错误复现记录'),('api','API设计','07-005','解释鉴权、异常处理与服务接口')],
 'ai-research':[('python','Python','04-009','完成可复现数据处理脚本'),('sql','SQL','04-009','构建可检查的数据管线'),('model_evaluation','模型评估','04-013','给出基线、验证集与数据泄漏检查'),('deployment','部署监控','04-013','部署模型API并演练告警和回滚')],
 'environment':[('environmental_monitoring','环境监测','04-010','记录采样、单位和质量检查'),('data_quality','数据质量','04-015','建立带来源与边界的环境数据台账'),('gis','GIS','07-014','提交含采样偏差说明的空间分析'),('statistics','统计','07-013','解释监测数据异常与不确定性')]
}
for occ,items in specs.items():
 for skill,label,rid,practice in items:
  skills[skill]={'label_zh':label}
  table='Career Paths & What If' if rid.startswith('07') else 'Malaysia Salary & Skills'
  requirements.append({'id':occ+':'+skill,'occupation_id':occ,'skill_id':skill,'practice':practice,'evidence_type':'INFERENCE','scope':'task practice suggestion; not universal legal entry requirement','record_refs':[ref(table,rid)]})
scenarios=[]
prereqs={
 'software':[('ai_tool','testing'),('sql','api'),('model_api_project','model_evaluation')],
 'ai-research':[('ai_tool','model_evaluation'),('sql','deployment'),('environment_prediction_project','environmental_monitoring')],
 'environment':[('ai_tool','data_quality'),('gis','statistics'),('environment_dashboard_project','sql')]
}
skills['ai_tool']={'label_zh':'AI工具使用'}
for r in data['tables']['Career Paths & What If']:
 if r['scenario_type'] not in ['A','B','C']:continue
 trigger,skill=prereqs[r['occupation_id']]['ABC'.index(r['scenario_type'])]
 field='projects' if trigger.endswith('_project') else 'skills'
 predicates=[{'field':field,'key':trigger},{'field':'skills','key':skill},{'field':'conditions','key':'authorised_data_and_review'}]
 refs=[ref('Career Paths & What If',r['record_id'])]
 refs+= [x for q in requirements if q['occupation_id'] in [r['occupation_id'],r['target_occupation_id']] and q['skill_id']==skill for x in q['record_refs']]
 if r['record_id']=='07-012':refs.append(ref('Malaysia Salary & Skills','04-010'))
 scenarios.append({'id':r['occupation_id']+':'+r['scenario_type'],'occupation_id':r['occupation_id'],'all_of':predicates,'skills':[skill],
                   'explanation':r['finding_zh'],'practice':r['action_project'],'target_occupation_id':r['target_occupation_id'],
                   'evidence_type':'INFERENCE','record_refs':refs,'limitations':'Predicates are explicit research planning conditions, not validated predictors. Target career may not yet have complete research.'})
data['analysis_model']={'version':'1-additive','skills':skills,'requirements':requirements,'scenarios':scenarios,
 'boundaries':['No Likert-to-skill conversion','No fit, outlook or exposure scores','Missing user skill means unknown','Assumptions are hypothetical and do not alter observations'],
 'research_coverage':{'complete_profiles':['software','ai-research','environment'],'remaining':21}}
dest=ROOT/'data/malaysia_intelligence';dest.mkdir(parents=True,exist_ok=True)
(dest/'current.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
(dest/'pilot-original.json').write_bytes(raw)
print('Imported pilot unchanged; additive model: 12 requirements, 9 scenarios')
