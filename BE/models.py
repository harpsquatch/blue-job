from pydantic import BaseModel
from typing import List, Optional

class Job(BaseModel):
    job_id: int
    title: str
    company: str
    rating: Optional[float]
    location: str
    source: str
    description: str
    application_method: str
    job_type: Optional[str] = "full-time"
    experience_level: Optional[str] = "mid"
    remote_friendly: Optional[bool] = False
    posted_date: Optional[str] = None
    skills: Optional[List[str]] = [] 