from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from routes import job_routes, admin_routes, chat_routes
from services.data_import_service import DataImportService
from services.llm_query_parser import LLMQueryParser
from services.llm_result_analyzer import LLMResultAnalyzer
from services.job_search_service import JobSearchService

app = FastAPI(
    title="AI-Powered Job Search API",
    description="A FastAPI application for intelligent job search using LLM + Typesense",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(job_routes.router)
app.include_router(admin_routes.router)
app.include_router(chat_routes.router)

# Initialize data import service
data_import_service = DataImportService()

# Initialize services
llm_parser = LLMQueryParser()
llm_analyzer = LLMResultAnalyzer()
job_search = JobSearchService()

@app.on_event("startup")
async def startup_event():
    """Set up the application on startup"""
    print("🚀 Starting AI-Powered Job Search API with LLM...")
    data_import_service.setup_jobs_collection()

@app.get('/')
def read_root():
    """Health check endpoint"""
    return {
        'status': 'ok',
        'message': 'AI-Powered Job Search API with LLM is running',
        'version': '2.0.0',
        'features': ['llm_query_parsing', 'ai_result_analysis', 'smart_filtering']
    }

@app.get('/health')
def health_check():
    """Detailed health check with Typesense connection"""
    try:
        collection = data_import_service.typesense_client.get_collection().retrieve()
        return {
            'status': 'healthy',
            'typesense_connection': 'ok',
            'collection': 'jobs',
            'total_documents': collection.get('num_documents', 0),
            'llm_available': True
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'typesense_connection': 'error',
            'error': str(e),
            'llm_available': True
        }

@app.get('/stats')
def get_stats():
    """Get collection statistics"""
    try:
        return job_search.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)