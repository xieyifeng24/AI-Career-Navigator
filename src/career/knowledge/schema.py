from datetime import datetime, date
from typing import Literal
from urllib.parse import urlsplit
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

class Fact(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    id: str
    label: str = Field(min_length=1)
    value: float | None = None
    scale: str | None = None
    relation: str | None = None
    url: str | None = None
    date: str | None = None

class Occupation(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    source: Literal['onet', 'esco', 'myfuturejobs']
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    classification: str = Field(min_length=1)
    classification_id: str = Field(min_length=1)
    geography: Literal['US', 'EU', 'MY']
    language: str = 'en'
    description: str = Field(min_length=1)
    skills: list[Fact] = Field(default_factory=list)
    abilities: list[Fact] = Field(default_factory=list)
    tasks: list[Fact] = Field(default_factory=list)
    education: list[Fact] = Field(default_factory=list)
    trends: list[Fact] = Field(default_factory=list)
    url: str
    published_at: date | None = None
    publication_note: str
    verified_at: datetime
    version: str = Field(min_length=1)
    license: str = Field(min_length=1)
    license_url: str
    @field_validator('url','license_url')
    @classmethod
    def official_url(cls,value):
        host=(urlsplit(value).hostname or '').lower()
        if urlsplit(value).scheme not in {'http','https'} or not any(host==h or host.endswith('.'+h) for h in ['onetcenter.org','onetonline.org','europa.eu','myfuturejobs.gov.my','perkeso.gov.my']):
            raise ValueError('An official source URL is required')
        return value
    @model_validator(mode='after')
    def regional_integrity(self):
        if self.geography != {'onet':'US','esco':'EU','myfuturejobs':'MY'}[self.source]:
            raise ValueError('Source geography mismatch')
        if self.source=='onet' and not all([self.skills,self.abilities,self.tasks,self.education]): raise ValueError('Incomplete O*NET facts')
        if self.source=='esco' and not self.skills: raise ValueError('Missing ESCO skill relationships')
        if self.trends and self.source != 'myfuturejobs':
            raise ValueError('This integration imports no US/EU market forecasts')
        if self.trends and any(not t.url or not t.date or not t.scale for t in self.trends): raise ValueError('Trends need source URL, period and metric/unit')
        if self.verified_at.tzinfo is None: raise ValueError('Use timezone-aware verification time')
        return self

class Snapshot(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    schema_version: Literal[1] = 1
    version: str
    verified_at: datetime
    records: list[Occupation]
    links: dict[str, list[str]]  # reviewed contextual links, not equivalence crosswalks
    attribution: list[str]
    @model_validator(mode='after')
    def integrity(self):
        keys=[r.source+':'+r.id for r in self.records]
        if len(keys)!=len(set(keys)): raise ValueError('Duplicate records')
        if not self.records: raise ValueError('Empty snapshot')
        if any(k not in keys for refs in self.links.values() for k in refs): raise ValueError('Dangling contextual link')
        return self
