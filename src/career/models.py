"""The public API and model contracts. No permissive parsing of model output."""
import re
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Text = Annotated[str, Field(min_length=1, max_length=1600)]
Short = Annotated[str, Field(min_length=1, max_length=180)]

class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)

# Shared option IDs and canonical analysis labels. UI translations never affect matching.
import json
from pathlib import Path as FilePath
OPTIONS = json.loads((FilePath(__file__).resolve().parents[2] / 'prototype/questionnaire.json').read_text())

class Answers(StrictModel):
    background: str
    experience: str
    tasks: Annotated[list[str], Field(min_length=2, max_length=10)]
    skills: Annotated[list[str], Field(min_length=1, max_length=10)]
    aiUsage: str
    concerns: Annotated[list[str], Field(min_length=1, max_length=6)]
    goal: str
    constraints: Annotated[list[str], Field(min_length=1, max_length=6)]
    custom: dict[str, Annotated[str, Field(max_length=500)]] = Field(default_factory=dict)

    @model_validator(mode='after')
    def validate_options(self):
        for key, rows in OPTIONS.items():
            values = getattr(self, key)
            values = values if isinstance(values, list) else [values]
            if len(set(values)) != len(values) or not set(values) <= {row[0] for row in rows}:
                raise ValueError('Invalid option IDs')
            if 'none' in values and len(values) != 1:
                raise ValueError('No concerns/constraints must be exclusive')
            custom = self.custom.get(key, '').strip()
            if 'other' in values and not custom:
                raise ValueError('Describe the other option')
        if not set(self.custom) <= set(OPTIONS):
            raise ValueError('Unknown custom field')
        for value in self.custom.values():
            if re.search(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?\d[\s()-]*){9,}', value):
                raise ValueError('Use fictional details without identifiers')
        return self

    def canonical(self):
        result = {}
        for key, rows in OPTIONS.items():
            values = getattr(self, key)
            values = values if isinstance(values, list) else [values]
            labels = {row[0]: row[1] for row in rows}
            result['aiUse' if key == 'aiUsage' else key] = '; '.join(
                self.custom[key].strip() if value == 'other' else labels[value] for value in values)
        return result

class Profile(StrictModel):
    language: Literal['zh-CN', 'en', 'ms'] = 'en'
    answers: Answers | None = None

    @model_validator(mode='before')
    @classmethod
    def structured_answers_are_authoritative(cls, data):
        if isinstance(data, dict) and data.get('answers') is not None:
            answers = Answers.model_validate(data['answers'])
            data = {**data, **answers.canonical(), 'answers': answers}
        return data

    background: Short
    experience: Short
    tasks: Text
    skills: Text
    aiUse: Text
    concerns: Text
    goal: Text
    hours: Annotated[float, Field(ge=1, le=40, allow_inf_nan=False)]
    constraints: Text
    synthetic: Literal[True]

    @field_validator('background', 'experience', 'tasks', 'skills', 'aiUse', 'concerns', 'goal', 'constraints')
    @classmethod
    def reject_contact_details(cls, value):
        if re.search(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?\d[\s()-]*){9,}', value):
            raise ValueError('Use a fictional profile without contact details or identifiers.')
        return value

class Claim(StrictModel):
    text: Text
    source_ids: Annotated[list[Short], Field(min_length=1, max_length=5)]

class Capability(StrictModel):
    lens: Literal['independent', 'collaboration', 'extended']
    assessment: Claim
    evidence_quote: Short
    verify_next: Claim

class TaskAssessment(StrictModel):
    input_quote: Short
    category: Literal['assist', 'automate', 'human', 'develop']
    assessment: Claim
    human_check: Claim

class SDGLink(StrictModel):
    target: Literal['4.4', '8.2', '8.5']
    rationale: Text
    measure: Annotated[str, Field(min_length=20, max_length=500)]

class SkillAdvice(StrictModel):
    skill: Short
    advice: Claim
    sdg: SDGLink

class Week(StrictModel):
    week: Annotated[int, Field(ge=1, le=4)]
    hours: Annotated[float, Field(gt=0, le=40, allow_inf_nan=False)]
    action: Claim
    deliverable: Text
    validation: Text
    resource_id: Short

class ToolChoice(StrictModel):
    resource_id: Literal['learn-ai','learn-data','learn-python','learn-sheets']
    purpose: Claim

class Path(StrictModel):
    kind: Literal['A', 'B']
    role_id: Short
    why: Claim
    transferable: Annotated[list[SkillAdvice], Field(min_length=1, max_length=4)]
    gaps: Annotated[list[SkillAdvice], Field(min_length=1, max_length=4)]
    challenge: Claim
    next_step: Claim
    sdg: SDGLink
    tools: Annotated[list[ToolChoice], Field(min_length=1, max_length=3)]
    weeks: Annotated[list[Week], Field(min_length=4, max_length=4)]
    day30_review: Claim

class Scenario(StrictModel):
    pace: Literal['moderate', 'fast']
    assumption: Text
    implication: Claim
    watch_for: Claim

class RadarItem(StrictModel):
    skill: Short
    direction: Literal['rising hypothesis', 'declining hypothesis', 'uncertain']
    reasoning: Claim
    sdg: SDGLink

class Analysis(StrictModel):
    summary: Claim
    capabilities: Annotated[list[Capability], Field(min_length=3, max_length=3)]
    tasks: Annotated[list[TaskAssessment], Field(min_length=2, max_length=6)]
    radar: Annotated[list[RadarItem], Field(min_length=2, max_length=5)]
    paths: Annotated[list[Path], Field(min_length=2, max_length=2)]
    scenarios: Annotated[list[Scenario], Field(min_length=2, max_length=2)]
    uncertainties: Annotated[list[Text], Field(min_length=2, max_length=6)]
