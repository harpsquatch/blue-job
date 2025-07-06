from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models import Job
from services.job_search_service import JobSearchService

router = APIRouter(prefix="/jobs", tags=["jobs"])
job_search_service = JobSearchService()

@router.get('/ai-search')
def ai_job_search(
    query: str = Query(..., description='Natural language job search query'),
    limit: int = Query(10, ge=1, le=50, description='Number of jobs to return'),
    enhance: bool = Query(True, description='Whether to enhance results with LLM insights')
):
    """
    AI-powered job search using LLM + Typesense.
    
    Examples:
    - "Remote React roles above 120k"
    - "Senior Python developers in New York"
    - "Entry level data analyst positions"
    - "Full-time marketing jobs at Google"
    """
    try:
        return job_search_service.ai_search(query, limit, enhance)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/', response_model=List[Job])
def list_jobs(
    q: Optional[str] = Query(None, description='Search query'),
    company: Optional[str] = Query(None, description='Filter by company'),
    location: Optional[str] = Query(None, description='Filter by location'),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Traditional job search endpoint (no LLM)"""
    try:
        return job_search_service.traditional_search(q, company, location, limit, offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/{job_id}', response_model=Job)
def get_job(job_id: int):
    """Get a specific job by ID"""
    try:
        return job_search_service.get_job_by_id(job_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e)) 