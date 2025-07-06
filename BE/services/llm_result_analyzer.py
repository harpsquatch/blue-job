import os
import json
import openai
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

class LLMResultAnalyzer:
    def __init__(self):
        self.client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY')
        )
    
    def analyze_results(self, jobs: List[Dict], original_query: str) -> Dict[str, Any]:
        """
        Analyze job search results and provide insights using LLM
        """
        if not jobs:
            return {
                "summary": "No jobs found matching your criteria.",
                "insights": [],
                "recommendations": []
            }
        
        # Prepare job data for analysis
        job_summaries = []
        for job in jobs[:10]:  # Analyze first 10 jobs
            summary = f"Title: {job.get('title', 'N/A')}, Company: {job.get('company', 'N/A')}, Location: {job.get('location', 'N/A')}"
            job_summaries.append(summary)
        
        prompt = f"""
        Analyze these job search results for the query: "{original_query}"

        Jobs found:
        {chr(10).join(job_summaries)}

        Provide analysis in JSON format:
        {{
            "summary": "Brief summary of what was found",
            "insights": [
                "Key insight about the job market",
                "Another insight about opportunities"
            ],
            "recommendations": [
                "Recommendation for the job seeker",
                "Another recommendation"
            ],
            "salary_trends": "Any salary insights if available",
            "skill_demand": "Most in-demand skills from these jobs"
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a job market analyst. Provide helpful insights about job search results."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            # Fallback analysis
            return {
                "summary": f"Found {len(jobs)} jobs matching your search.",
                "insights": [
                    f"Search returned {len(jobs)} results",
                    "Consider refining your search terms for better matches"
                ],
                "recommendations": [
                    "Review job descriptions carefully",
                    "Apply to positions that match your skills"
                ],
                "salary_trends": "Salary information not available in this dataset",
                "skill_demand": "Check job descriptions for required skills"
            }
    
    def analyze_jobs(self, jobs: List[Dict], original_query: str) -> Dict[str, Any]:
        """
        Alias for analyze_results to match the service call
        """
        return self.analyze_results(jobs, original_query)
    
    def enhance_job(self, job: Dict, query: str) -> Dict[str, Any]:
        """
        Enhance a single job with AI insights
        """
        prompt = f"""
        Analyze this job posting for relevance to the query: "{query}"

        Job: {job.get('title', 'N/A')} at {job.get('company', 'N/A')} in {job.get('location', 'N/A')}
        Description: {job.get('description', 'N/A')[:500]}...

        Provide insights in JSON format:
        {{
            "relevance_score": "high/medium/low",
            "key_highlights": ["highlight1", "highlight2"],
            "why_good_match": "explanation",
            "potential_concerns": ["concern1", "concern2"]
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a job matching assistant. Analyze job relevance."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            # Fallback enhancement
            return {
                "relevance_score": "medium",
                "key_highlights": ["Position available", "Company hiring"],
                "why_good_match": "Job matches search criteria",
                "potential_concerns": ["Limited information available"]
            }
    
    def _fallback_analysis(self, jobs: List[Dict], user_query: str) -> Dict[str, Any]:
        """Fallback analysis when LLM fails"""
        return {
            "summary": f"Found {len(jobs)} jobs matching your search.",
            "salary_analysis": "Salary information available in job listings.",
            "market_insights": "Current job market data available.",
            "top_recommendations": [],
            "career_advice": "Review the job listings for opportunities that match your skills.",
            "search_suggestions": ["Try different keywords", "Check different locations"]
        } 