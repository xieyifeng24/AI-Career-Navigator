"""Synthetic CONTRACT fixtures. These are never imported by the application."""
from src.career.models import Profile
from src.career.sources import RESOURCES, SDGS

def profile(**changes):
    return Profile(**({'background':'Marketing specialist','experience':'3 years','tasks':'Write campaign reports; review survey data.',
      'skills':'Writing, critical thinking','aiUse':'Tried summaries','concerns':'Repetitive tasks','goal':'Improve campaign research',
      'hours':3,'constraints':'Free resources only','synthetic':True}|changes))

def snapshot():
    roles=[{'id':'marketing','title':'Market Research Analysts','skills':['Writing','Critical Thinking'],
      'tasks':['Write campaign reports','Review survey data'],'growth':'Faster than average','period':'2025-2035','updated':'2026',
      'url':'https://www.onetonline.org/link/summary/13-1161.00','source_id':'onet:marketing'},
      {'id':'project','title':'Project Management Specialists','skills':['Coordination','Time Management'],
      'tasks':['Coordinate project schedules','Plan project resources'],'growth':'Average','period':'2025-2035','updated':'2026',
      'url':'https://www.onetonline.org/link/summary/13-1082.00','source_id':'onet:project'}]
    sources={r['source_id']:{'title':r['title'],'url':r['url'],'kind':'occupation','text':'SYNTHETIC TEST SOURCE','date':'2026'} for r in roles}
    sources.update({k:{**v,'kind':'learning'} for k,v in RESOURCES.items()})
    sources.update(SDGS)
    sources['ai:1']={'title':'SYNTHETIC RESEARCH FIXTURE','url':'https://arxiv.org/abs/0000.00000','date':'2026-01-01','text':'Test only','kind':'research'}
    return {'roles':roles,'sources':sources,'research':[sources['ai:1']],'warnings':[],'version':'TEST-ONLY','retrieved_at':'2026-01-01','geography':'US','attribution':'TEST FIXTURE'}

def analysis(p=None):
    p=p or profile()
    def claim(text='SYNTHETIC CONTRACT FIXTURE',source='onet:marketing'): return {'text':text,'source_ids':[source]}
    def sdg(): return {'target':'4.4','rationale':'Practice a skill using synthetic evidence.','measure':'Complete and review one sample.'}
    def skill(name,source): return {'skill':name,'advice':claim(source=source),'sdg':sdg()}
    paths=[]
    for kind,role,name in [('A','marketing','Writing'),('B','project','Coordination')]:
        source=f'onet:{role}'
        paths.append({'kind':kind,'role_id':role,'why':claim(source=source),'transferable':[skill(name,source)],'gaps':[skill(name,source)],
          'challenge':claim(source=source),'next_step':claim(source=source),'sdg':sdg(),
          'tools':[{'resource_id':'learn-ai','purpose':claim(source='learn-ai')}],
          'weeks':[{'week':i,'hours':p.hours,'action':claim(source='learn-sheets'),'deliverable':'One synthetic worksheet',
                    'validation':'Check five rows against source','resource_id':'learn-sheets'} for i in range(1,5)],'day30_review':claim(source=source)})
    return {'summary':claim(), 'capabilities':[{'lens':l,'assessment':claim(),'evidence_quote':p.skills,'verify_next':claim()} for l in ['independent','collaboration','extended']],
      'tasks':[{'input_quote':quote,'category':'assist','assessment':claim(),'human_check':claim()} for quote in p.tasks.split('; ')],
      'radar':[{'skill':x,'direction':'uncertain','reasoning':claim(source='ai:1'),'sdg':sdg()} for x in ['Writing','Coordination']],
      'paths':paths,'scenarios':[{'pace':x,'assumption':'Hypothetical adoption','implication':claim(),'watch_for':claim()} for x in ['moderate','fast']],
      'uncertainties':['Synthetic fixture, no model inference.','Source support needs human review.']}
