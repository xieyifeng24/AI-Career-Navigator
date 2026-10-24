"""Add reviewed Malaysian desk research to the preserved pilot, deterministically.

Run after build_malaysia_pilot.py. No network, generated market scores or silent
substitution for missing statistics. Research inputs are edited explicitly.
"""
import copy
import csv
import hashlib
import json
from pathlib import Path
from malaysia_research_specs import SPECS, PILOT_TASKS, MASCO

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT/'data/malaysia_intelligence'
DATE = '2026-10-23'
data = json.loads((DEST/'current.json').read_text(encoding='utf-8'))
if data.get('stage') != 'PILOT_LOGIC_VALIDATION':
    raise SystemExit('Start from the lossless pilot bridge; refusing to append twice')
tables = data['tables']
notes = json.loads((DEST/'research-notes.json').read_text(encoding='utf-8'))
for sid, name, url, typ, published, period, limitation in notes['sources']:
    tables['Evidence & Sources'].append(dict(source_id=sid,source_name=name,source_url=url,
        published_date=published,data_period=period,country_region='Malaysia',evidence_type=typ,
        last_verified=DATE,limitations=limitation,access_status='Web text / indexed primary material; see limitations'))
tables['Evidence & Sources'].append(dict(source_id='S03-FULL',source_name='TalentCorp MyCOL 2024/2025 full PDF verification',
    source_url=next(s['source_url'] for s in tables['Evidence & Sources'] if s['source_id']=='S03'),
    published_date='Unknown',data_period='2024/2025',country_region='Malaysia',evidence_type='MY-OFFICIAL',
    last_verified=DATE,limitations='Full 212 PDF pages downloaded; text extracted where available. Some spread headings are image-only. Nominated titles and experience are bounded survey evidence, not all vacancies or all graduates.',
    access_status='PDF downloaded and selected occupation narrative pages read; not all image headings OCR verified'))
sources={s['source_id']:s for s in tables['Evidence & Sources']}
model=data['analysis_model']
def add(table, occ, topic, finding, refs, typ='INFERENCE', **extra):
    refs=list(dict.fromkeys(refs)); ss=[sources[s] for s in refs]
    row=dict(record_id=f'EXT-{table[:2].upper()}-{len(tables[table])+1:04}',occupation_id=occ,
        topic=topic,finding_zh=finding,evidence_type=typ,source_ids=';'.join(refs),masco_code='',
        last_verified=DATE,limitations='桌面研究快照；职业映射、任务选择与建议为条件分析，不是就业预测或个人评分。',
        source_name=' ; '.join(s['source_name'] for s in ss),source_url=' ; '.join(s['source_url'] for s in ss),
        published_date=' ; '.join(str(s['published_date'] or 'Unknown') for s in ss),
        data_period=' ; '.join(s['data_period'] for s in ss),country_region=' ; '.join(dict.fromkeys(s['country_region'] for s in ss)))
    row.update(extra);tables[table].append(row)
    return {'table':table,'record_id':row['record_id']}

# Source notes are raw bounded observations, separate from career interpretation.
for sid,_,_,typ,_,_,note in notes['sources']:
    add('Raw Observations','ALL','source_observation',note,[sid],typ,
        value=None,unit='qualitative source observation',observation_period=sources[sid]['data_period'],
        measured_population='Source-specific occupational group / employer / programme; see note',
        relation_kind='not an occupation-level vacancy total')

mycol = {
 'data':('confirmed_related_titles',138,'Data Analyst/Data Scientist等被提名；CfE受访者以1–3年为主，银行保险反馈缺行业经验。不能把单一受访者扩为所有企业。'),
 'security':('confirmed_related_titles',140,'明确提名Cybersecurity Specialist/Analyst等；银行保险缺技术、系统和行业经验，中级3–4年、高级超过8年为咨询反馈。'),
 'finance':('confirmed_related_titles',118,'Financial Analyst/Risk Analyst等被提名；1–3年junior较多，保险IFRS17与银行信用风险/ALM知识有缺口。'),
 'marketing':('confirmed_related_titles',122,'Marketing Executive/数字营销等被提名；以1–3年junior为主；数字技能、行业知识和经验不可由职称替代。'),
 'energy':('conditional_broader_group',92,'Electrical Engineer相关组入选，以1–3年junior较多；不是所有Renewable Energy细分岗位短缺的证据。'),
 'game':('conditional_broader_group',144,'Digital Games/E-Sports相关叙述及CG/Sound Artist提名；不能据CG艺术样本判断所有游戏设计/程序岗位。'),
 'creative':('conditional_broader_group',146,'Graphic Designer相关提名，1–3年junior较多；不同视觉、美术分支需单独核对。'),
 'ux':('unconfirmed_specific_title',146,'相关创意组有Graphic Designer等提名，但本次未核实UX/accessibility专门短缺，不自动转用。'),
 'business-analysis':('conditional_ict_branch',124,'Computer Systems Analyst组偏超过5年经验；适用于ICT分析分支，不直接说明所有运营分析紧缺。'),
 'health':('conditional_ict_branch',124,'系统分析相关组可作技术分支背景；没有核实Health Informatics同名职业入选。'),
}
salary_unknown='Unknown：未获得可比、明确年限/地区/统计群体的本地该职业工资分布。RM金额、月/年周期、年份和群体缺失时不以0替代。'
tables['Occupation Tasks']=[]
for occ,spec in SPECS.items():
    refs=spec['sources']
    for code in spec['codes']:
        en,ms,sid=MASCO[code]
        reason='按实际任务条件映射，非产品名称与官方职业的一一等价。'
        if occ=='agri':reason+='2132只覆盖农艺咨询；食品科学分支的精确MASCO仍需按实际JD核查。'
        if occ=='social-impact':reason+='2825仅适用社会工作职责；项目协调可用2425，不推断咨询执业资格。'
        if occ=='health':reason+='2511为系统分支、2524为数据分支，不映射为临床执业。'
        if occ=='education':reason+='2424为企业培训；2391为教育方法，学校教师需另查对应分类。'
        add('MASCO Occupation Mapping',occ,'任务条件映射',reason,[sid],masco_code=code,
            official_title_en=en,official_title_ms=ms,official_code_evidence='MY-OFFICIAL',
            mapping_status='Conditional task-based research mapping',
            onet_context='Unknown：未新增未经核实的O*NET等价代码',local_job_titles='见本地招聘样本与成长路线；职称不作为统计口径')
    demandref=add('Malaysia Job Demand',occ,'本地市场证据与解释',spec['demand'],refs,
        demand_measure='bounded employer example / group statistic / programme context',national_vacancies=None,
        market_trend='Unknown：没有可比职业时间序列，不估算未来增长率')
    status,page,shortage=mycol.get(occ,('not_confirmed',None,'Unknown：本次未确认该产品职业精确对应MyCOL 2024/25入选职称。未确认不等于未入选或没有前景；不从其他经理/行业组转借短缺。'))
    shortref=add('Malaysia Job Demand',occ,'MyCOL 2024/25核查',shortage,['S03-FULL'],
        mycol_status=status,source_locator=f'PDF file page {page}' if page else 'Selected relevant narratives; exact product title unresolved')
    salaryref=add('Malaysia Salary & Skills',occ,'本地薪资边界',salary_unknown,['S19'],'UNKNOWN',
        salary_min=None,salary_max=None,currency='RM',pay_period='Unknown',salary_year=None,
        salary_statistic='Unknown: occupation distribution not established')
    entryref=add('Malaysia Salary & Skills',occ,'入门、进阶与资格',spec['entry'],refs)
    regionref=add('Malaysia Regional Opportunities',occ,'地区证据与不可推断范围',spec['region'],refs,
        regional_shares=None,location_kind='employer workplace / project / event distinguished in finding')
    airef=add('Malaysia AI Transformation',occ,'本地AI证据适用边界',spec['ai_context'],refs,
        automation_exposure='未估算职业替代概率',human_responsibility='见逐任务记录',
        rising_skills=';'.join(t['skill_id'] for t in spec['tasks']),malaysia_conditions=spec['ai_context'],
        international_boundary='S20为国际任务暴露研究，不能当Malaysia实际采用/失业数据；本职业应用为条件推断。',
        record_kind='context_not_task')
    taskrefs=[]
    for i,t in enumerate(spec['tasks'],1):
        skill=t['skill_id']; model['skills'].setdefault(skill,{'label_zh':t['task']})
        taskref=add('Occupation Tasks',occ,t['task'],t['task'],refs,
            task_id=f'{occ}:task:{i}',skill_ids=skill,task_basis='research selection supported by cited Malaysian task family; not universal JD')
        ar=add('Malaysia AI Transformation',occ,t['task'],t['assist'],refs+['S20'],
            task_id=f'{occ}:task:{i}',record_kind='task',automation_exposure='可缩短初稿、分类或记录步骤；自动执行须验证，未证明岗位整体被替代。',
            human_responsibility=t['human'],rising_skills=skill,malaysia_conditions=spec['ai_context']+' 需授权数据、工具许可、质量基线和专业审核；中小企业的系统/预算约束可能影响实施，程度Unknown。',
            international_boundary='国际暴露研究仅说明任务可能变化；不导入美国就业增长或采用率。')
        taskrefs.append(ar)
        model['requirements'].append(dict(id=occ+':'+skill,occupation_id=occ,skill_id=skill,
            practice=t['task']+'；提交过程、复核与修改证据。',evidence_type='INFERENCE',
            scope='task-based development requirement; not universal licence or personal ability',
            record_refs=[taskref,entryref],priority='core_task',task_ids=[f'{occ}:task:{i}']))
    pathrefs=[]
    for stage,action in [('基础','学习本职业任务表中的专业基础，选择一个分支并解释核心术语。'),
                         ('初级实践',spec['project']),('中级与进阶','在专业督导下承担完整任务链、复核错误和跨团队交付，再争取领域专门化或项目责任；具体年限以岗位要求为准。')]:
        pathrefs.append(add('Career Paths & What If',occ,'成长路线 '+stage,action,refs+['S24','S25'],
            scenario_type='PATH',action_project=spec['project'],target_occupation_id=occ,
            entry_role_type='岗位检索与样本见入门记录；建议类型不是保证在招',
            eligibility='Unknown：国际学生、国籍、实习项目、就业准证与许可须按个人和具体岗位单独核实。'))
    primary=spec['tasks'][0]['skill_id'];secondary=spec['tasks'][1]['skill_id']
    scenarios=[('A','skills','ai_tool',primary,occ,f'假设会使用AI，可尝试{spec["tasks"][0]["assist"]}；仍须{spec["tasks"][0]["human"]}。'),
        ('B','skills',secondary,primary,occ,f'假设掌握{secondary}，有助于完成“{spec["tasks"][1]["task"]}”；其余专业任务与资格仍须核实。'),
        ('C','projects',occ+'_practice_project',secondary,spec['target'],f'假设完成“{spec["project"]}”，可进一步探索{spec["target"]}。{spec["transition_gap"]}')]
    for tag,field,trigger,prereq,target,text in scenarios:
        sr=add('Career Paths & What If',occ,'What If '+tag,text,refs,
            scenario_type=tag,action_project=spec['project'],target_occupation_id=target,
            eligibility='不判断就业资格，不提供成功概率')
        model['scenarios'].append(dict(id=occ+':'+tag,occupation_id=occ,
            all_of=[dict(field=field,key=trigger),dict(field='skills',key=prereq),
                    dict(field='conditions',key='authorised_data_and_review')],
            skills=[prereq],explanation=text,practice=spec['project'],target_occupation_id=target,
            evidence_type='INFERENCE',record_refs=[sr,taskrefs['ABC'.index(tag)],entryref],
            remaining_requirements='其他核心技能、领域经验、申请资格和目标职业要求不会因这一假设自动满足。',
            limitations='Conditions are transparent planning rules, not empirically calibrated predictors.'))
    topics=[('1 分类','; '.join(spec['codes'])+'；一对多条件及官方名称见映射表。',refs),
            ('2 招聘需求',spec['demand'],refs),('3 人才短缺',shortage,['S03-FULL']),
            ('4 薪资与门槛',spec['entry']+' '+salary_unknown,refs+['S19']),
            ('5 地区差异',spec['region'],refs),('6 AI任务变化',spec['ai_context'],refs+['S20']),
            ('7 前景判断',spec['outlook'],refs+['S03-FULL']),
            ('8 学生成长',spec['project']+' 可核查e-LATiH、MyNext资源；课程/实习资格和当前开放状态须复核。',refs+['S24','S25']),
            ('9 What If',f'A：AI辅助且人工复核；B：掌握{secondary}后检验具体任务；C：用项目探索{spec["target"]}。'+spec['transition_gap'],refs)]
    for topic,text,rr in topics:add('Malaysia Career Profiles',occ,topic,text,rr)

# Preserved pilot receives additional tasks only, not a replacement profile.
for occ,(refs,lines) in PILOT_TASKS.items():
    old=[r for r in tables['Malaysia AI Transformation'] if r['occupation_id']==occ and not r.get('record_kind')]
    for i,r in enumerate(old,1):
        add('Occupation Tasks',occ,r['topic'],r['finding_zh'],r['source_ids'].split(';'),
            task_id=f'{occ}:pilot-task:{i}',skill_ids=';'.join(q['skill_id'] for q in model['requirements'] if q['occupation_id']==occ),
            task_basis='Preserved pilot task family; see original task record '+r['record_id'])
    for i,line in enumerate(lines.splitlines(),4):
        skill,task,assist,human=line.split('|');model['skills'].setdefault(skill,{'label_zh':task})
        tr=add('Occupation Tasks',occ,task,task,refs.split(';'),task_id=f'{occ}:task:{i}',skill_ids=skill)
        add('Malaysia AI Transformation',occ,task,assist,refs.split(';')+['S20'],task_id=f'{occ}:task:{i}',
            record_kind='task',automation_exposure='重复资料整理可能压缩，未测量就业替代。',
            human_responsibility=human,rising_skills=skill,malaysia_conditions='需授权资料、可用记录与专业复核；具体职业采用率Unknown。',
            international_boundary='ILO国际研究不代表Malaysia实际采用或就业效果。')
        if not any(r['id']==occ+':'+skill for r in model['requirements']):
            model['requirements'].append(dict(id=occ+':'+skill,occupation_id=occ,skill_id=skill,practice=task+'；'+human,
                evidence_type='INFERENCE',scope='additional task practice',record_refs=[tr]))

# AI literacy is a separate support requirement, not a substitute for domain skills.
for occ in list(SPECS)+list(PILOT_TASKS):
    airows=[r for r in tables['Malaysia AI Transformation'] if r['occupation_id']==occ]
    basis=airows[0]
    for skill,label,practice in [('ai_tool','AI工具使用','在授权环境中起草一项职业任务并保留输入、输出与人工修改。'),
                                 ('ai_verification','AI输出验证','以原始记录或专业基线复核AI结果，记录一次错误、拒绝理由及升级处理。')]:
        model['skills'].setdefault(skill,{'label_zh':label})
        sr=add('Malaysia Salary & Skills',occ,'AI支持技能：'+label,practice,basis['source_ids'].split(';'),
            skill_id=skill,requirement_kind='ai_support_not_domain_substitute')
        if not any(r['id']==occ+':'+skill for r in model['requirements']):
            model['requirements'].append(dict(id=occ+':'+skill,occupation_id=occ,skill_id=skill,practice=practice,
                evidence_type='INFERENCE',scope='AI support practice; professional prerequisites remain',priority='ai_support',record_refs=[sr]))

# Every relation carries both endpoint requirements as evidence, explicit gaps and no weights.
for occ,spec in SPECS.items():
    target=spec['target']; a=[r for r in model['requirements'] if r['occupation_id']==occ];b=[r for r in model['requirements'] if r['occupation_id']==target]
    shared=sorted({r['skill_id'] for r in a}&{r['skill_id'] for r in b})
    remaining=sorted({r['skill_id'] for r in b}-{r['skill_id'] for r in a})
    rr=[x for r in a+b for x in r['record_refs']]
    source_tags=next(c['original_sdg_tags'] for c in tables['Career Catalog 24'] if c['occupation_id']==occ).split(';')
    target_tags=next(c['original_sdg_tags'] for c in tables['Career Catalog 24'] if c['occupation_id']==target).split(';')
    for kind in ['skill_similarity','task_similarity','transition','ai_skill_relation','sdg_relation']:
        desc={'skill_similarity':'共同任务技能：'+(', '.join(shared) or '未识别同ID核心技能，不推断相似度'),
              'task_similarity':'对照两端任务中的'+(', '.join(shared) or '不同专业操作')+'；相同技能标签不证明任务、风险或资格等价。',
              'transition':spec['transition_gap'],
              'ai_skill_relation':'两端都需要验证AI输出，但专业审核责任与数据条件不同。',
              'sdg_relation':'沿用产品SDG标签作探索语境；不是官方职业SDG评分或个人匹配。'}[kind]
        add('Career Relations',occ,kind,desc,spec['sources'],target_id=target,directed=True,
            shared_skill_ids=';'.join(shared),remaining_skill_ids=';'.join(remaining),
            relationship_scope='24-career research; conditional explanatory edge',
            endpoint_record_refs=json.dumps(rr,ensure_ascii=False),weight=None,
            source_sdg_ids=';'.join(source_tags),target_sdg_ids=';'.join(target_tags),
            shared_sdg_ids=';'.join(sorted(set(source_tags)&set(target_tags))),
            sdg_basis='preserved product tags, not independently validated occupation-to-SDG causality')

# A precisely bounded advertised pay sample, never a market wage estimate.
add('Malaysia Salary & Skills','security','混合岗位广告薪资','Kelana Jaya混合IT支持/安全/行政广告：RM2,700–3,300/月；至少一年经验。',['MYF-CYBER-PAY'],'RESEARCH',
    salary_min=2700,salary_max=3300,currency='RM',pay_period='month',salary_year=2026,
    salary_statistic='advertised range for one mixed IT support / cyber / admin role; not occupation median',
    limitations='LinkedIn副本；准确发布日期Unknown；不能用此范围代表纯Cybersecurity Analyst或应届生市场工资。')
add('Raw Observations','marketing','advertising_marketing_online_offerings','DOSM Advertising and Marketing Professionals 2026 Q2线上广告。',['S01'],'MY-OFFICIAL',
    masco_code='2431',value=40640,unit='online advertisements',observation_period='2026-Q2',
    measured_population='Advertising and Marketing Professionals, Malaysia, covered private recruitment platforms',
    relation_kind='occupation group, not hires or all actual vacancies',source_locator='release overview occupational paragraph')

model['version']='2-additive-malaysia-24'
model['research_coverage']={'profile_ids':list(SPECS)+list(PILOT_TASKS),'count':24,
    'status':'DESK_RESEARCH_WITH_EXPLICIT_GAPS','remaining_profiles':0,
    'limitations':['No national occupation wage distribution for most roles','No comparable state occupation shares',
                   'Some product branches have conditional MASCO mappings','MyCOL exact-title status unresolved for some roles',
                   'Most task-level AI effects are conditional inference; not measured local productivity']}
data['version']='malaysia-intelligence-2026-10-23-24-v1'
data['stage']='24_CAREER_DESK_RESEARCH_WITH_GAPS'
data['extension_schema_version']='2.0-additive'
data['record_overrides']={'Malaysia Salary & Skills#04-010':{
    'evidence_type':'INFERENCE','correction_note':'原样板混合官方招聘事实和学习建议；整条解释不能标为官方统计。原始行保留，读取时应用此覆盖。'},
    'MASCO Occupation Mapping#02-005':{'onet_context_status':'unverified','correction_note':'原O*NET关联待核验，不作为确定等价映射。'}}
data['extension_provenance']={'research_specs_sha256':hashlib.sha256((ROOT/'scripts/malaysia_research_specs.py').read_bytes()).hexdigest(),
    'preservation':'pilot-original.json bytes and original table rows retained; new rows appended only',
    'review_date':DATE,'published_statistics_are_not_personal_fit':True}
data['release_notes']={'coverage':'24 original IDs with nine dimensions, tasks, requirements and scenarios',
    'status':'Evidence-backed desk research; explicit UNKNOWNs and inference, not an exhaustive census or empirical career prediction model',
    'pilot_errata':[{'record':'04-010','handling':'Original mixed fact/advice retained. Derived requirements are INFERENCE.'},
                    {'record':'02-005','handling':'Pending O*NET association not promoted to verified crosswalk.'},
                    {'record':'07-018','handling':'Target data now has research; transition remains conditional.'}]}
(DEST/'current.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
export=DEST/'csv';export.mkdir(exist_ok=True)
for name,rows in tables.items():
    export_rows=[{**r,**data['record_overrides'].get(name+'#'+r.get('record_id',''),{})} for r in rows]
    fields=list(dict.fromkeys(k for r in export_rows for k in r))
    with (export/(name.replace('/','_')+'.csv')).open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(export_rows)
for key in ['requirements','scenarios']:
    rows=model[key];fields=list(dict.fromkeys(k for r in rows for k in r))
    with (export/(key+'.csv')).open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(dict,list)) else v for k,v in r.items()} for r in rows)
print(f'Extended {len(SPECS)} careers; preserved 3 pilots; {len(model["requirements"])} requirements; {len(model["scenarios"])} scenarios')
