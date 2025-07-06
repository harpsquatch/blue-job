import os
import json
import openai
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class LLMQueryParser:
    def __init__(self):
        self.client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY')
        )
    
    def parse_query(self, user_query: str) -> Dict[str, Any]:
        """
        Parse natural language job search query into structured search parameters
        """
        prompt = f"""
        You are a job search assistant. Parse this job search query and extract structured information for a search engine.

        User Query: "{user_query}"

        Extract the following information and return as JSON:
        {{
            "keywords": ["list", "of", "key", "terms"],
            "location": "city, state, or country if mentioned",
            "salary_expectation": "low/medium/high if mentioned",
            "work_arrangement": "remote/onsite/hybrid if mentioned",
            "experience_level": "entry/mid/senior if mentioned",
            "search_query": "optimized search string for search engine"
        }}

        Only include fields that are relevant. If not mentioned, use null.
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a job search query parser. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            # Fallback to simple keyword extraction
            return {
                "keywords": user_query.split(),
                "location": None,
                "salary_expectation": None,
                "work_arrangement": None,
                "experience_level": None,
                "search_query": user_query
            } 