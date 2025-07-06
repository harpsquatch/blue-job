from typing import List, Optional, Dict, Any
from database.typesense_client import TypesenseClient
from models import Job
from services.llm_query_parser import LLMQueryParser
from services.llm_result_analyzer import LLMResultAnalyzer

class JobSearchService:
    def __init__(self):
        self.typesense_client = TypesenseClient()
        self.llm_parser = LLMQueryParser()
        self.llm_analyzer = LLMResultAnalyzer()
    
    def ai_search(self, query: str, limit: int = 10, enhance: bool = True) -> Dict[str, Any]:
        """
        AI-powered job search using LLM + Typesense
        """
        try:
            # Step 1: LLM parses the query
            llm_parsed = self.llm_parser.parse_query(query)
            
            # Step 2: Build Typesense search parameters
            search_params = self._build_search_params(llm_parsed, limit)
            
            # Step 3: Search with Typesense
            results = self.typesense_client.search_documents(search_params)
            
            # Step 4: Process results
            jobs = []
            for hit in results['hits']:
                try:
                    job = Job(**hit['document'])
                    job_dict = job.dict()
                    
                    # Step 5: Enhance job with LLM if requested
                    if enhance:
                        job_dict['ai_insights'] = self.llm_analyzer.enhance_job(
                            hit['document'], query
                        )
                    
                    jobs.append(job_dict)
                except Exception as e:
                    print(f"Error processing job {hit['document'].get('job_id')}: {e}")
                    continue
            
            # Step 6: Generate overall analysis
            response = {
                'query': query,
                'llm_parsing': llm_parsed,
                'total_results': len(jobs),
                'jobs': jobs,
                'search_summary': f"Found {len(jobs)} jobs matching '{query}'"
            }
            
            # Step 7: Add LLM analysis if requested
            if enhance and jobs:
                response['ai_analysis'] = self.llm_analyzer.analyze_jobs(jobs, query)
            
            return response
            
        except Exception as e:
            raise Exception(f"AI search failed: {str(e)}")
    
    def _build_search_params(self, llm_parsed: Dict, limit: int) -> Dict[str, Any]:
        """Build Typesense search parameters from LLM parsing"""
        search_params = {
            'q': llm_parsed.get('search_query', '*'),
            'query_by': 'title,company,description',
            'per_page': limit,
            'sort_by': self._get_sort_by(llm_parsed.get('sort_by', 'relevance'))
        }
        
        # Add filters if available
        filters = []
        filters_dict = llm_parsed.get('filters', {})
        
        if filters_dict.get('location'):
            location = filters_dict['location']
            if location == 'remote':
                filters.append('location:=Remote')
            elif location == 'onsite':
                filters.append('location:!=Remote')
        
        if filters_dict.get('experience_level'):
            level = filters_dict['experience_level']
            if level == 'senior':
                filters.append('title:=Senior')
            elif level == 'junior':
                filters.append('title:=Junior')
        
        if filters:
            search_params['filter_by'] = ' && '.join(filters)
        
        return search_params
    
    def _get_sort_by(self, sort_preference: str) -> str:
        """Convert LLM sort preference to Typesense sort"""
        sort_mapping = {
            'relevance': 'job_id:desc',
            'salary': 'job_id:desc',  # Would need salary field for proper sorting
            'date': 'job_id:desc',
            'company': 'company:asc'
        }
        return sort_mapping.get(sort_preference, 'job_id:desc')
    
    def traditional_search(self, query: Optional[str] = None, 
                          company: Optional[str] = None, 
                          location: Optional[str] = None,
                          limit: int = 20, 
                          offset: int = 0) -> List[Job]:
        """Traditional job search with filters (no LLM)"""
        search_params = {
            'q': query or '*',
            'query_by': 'title,company,description',
            'per_page': limit,
            'page': (offset // limit) + 1
        }
        
        filters = []
        if company:
            filters.append(f"company:={company}")
        if location:
            filters.append(f"location:={location}")
        
        if filters:
            search_params['filter_by'] = ' && '.join(filters)
        
        try:
            results = self.typesense_client.search_documents(search_params)
            return [Job(**hit['document']) for hit in results['hits']]
        except Exception as e:
            raise Exception(f"Search failed: {str(e)}")
    
    def get_job_by_id(self, job_id: int) -> Job:
        """Get a specific job by ID"""
        try:
            doc = self.typesense_client.get_document(job_id)
            return Job(**doc)
        except Exception as e:
            raise Exception(f'Job with ID {job_id} not found')
    
    def get_stats(self) -> Dict[str, Any]:
        """Get collection statistics"""
        try:
            collection = self.typesense_client.get_collection().retrieve()
            return {
                'collection_name': 'jobs',
                'total_documents': collection.get('num_documents', 0),
                'fields': [field['name'] for field in collection.get('fields', [])]
            }
        except Exception as e:
            raise Exception(f"Failed to get stats: {str(e)}") 