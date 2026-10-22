"""A transparent heuristic, not an employment probability or validated aptitude test."""
import re

ALIASES = {'writing':['copywriting','content writing','write'], 'speaking':['presentation','present','communication'], 'coordination':['scheduling','coordinate','planning'], 'mathematics':['statistics','statistical','analysis'], 'time management':['scheduling','prioritisation'], 'critical thinking':['evaluate','review','critical thinking']}

def tokens(value):
    return set(re.findall(r'[a-z]{3,}', value.lower())) - {'the','and','for','with','from','that','this','into','work','tasks'}

def growth_points(growth):
    text = growth.lower()
    if 'decline' in text: return 0
    if 'little or no change' in text: return 2
    if 'much faster' in text: return 10
    if 'faster than' in text: return 8
    if 'slower than' in text: return 3
    if 'average' in text: return 5
    return 0

def rank_roles(profile, roles):
    results=[]
    for role in roles:
        matched=[]
        for skill in role['skills']:
            terms=[skill.lower(), *ALIASES.get(skill.lower(), [])]
            if any(re.search(r'\b'+re.escape(t)+r'\b', profile.skills.lower()) for t in terms):
                matched.append(skill)
        skill_points=round(70*len(matched)/max(1,len(role['skills'])))
        task_tokens=tokens(' '.join(role['tasks']))
        input_tokens=tokens(profile.background+' '+profile.tasks+' '+profile.goal)
        overlap=sorted(input_tokens & task_tokens)
        task_points=round(20*len(overlap)/max(1,len(input_tokens)))
        trend_points=growth_points(role['growth'])
        results.append({**role,'score':skill_points+task_points+trend_points,
                        'components':{'skill_overlap':skill_points,'task_context':task_points,'published_trend':trend_points},
                        'matched_skills':matched,'gaps':[x for x in role['skills'] if x not in matched], 'overlap_terms':overlap,
                        'sdg':{'target':'8.2','rationale':f"Explore a measurable workflow improvement in {role['title']}; a proposed productivity contribution, not measured impact."}})
    return sorted(results,key=lambda r:(-r['score'],r['id']))
