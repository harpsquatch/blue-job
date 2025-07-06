from fastapi import APIRouter
from services.data_import_service import DataImportService

router = APIRouter(prefix="/admin", tags=["admin"])
data_import_service = DataImportService()

@router.get('/import-data')
def import_data_endpoint():
    """Manually trigger data import"""
    try:
        success = data_import_service.import_job_data()
        if success:
            return {"message": "Data import completed successfully"}
        else:
            return {"message": "Data import failed"}
    except Exception as e:
        return {"error": str(e)}

@router.get('/reset-collection')
def reset_collection():
    """Delete and recreate the collection with fresh data"""
    try:
        # Delete existing collection
        data_import_service.typesense_client.delete_collection()
        print(f"🗑️ Deleted collection 'jobs'")
        
        # Recreate and import
        success = data_import_service.setup_jobs_collection()
        if success:
            return {"message": "Collection reset and data imported successfully"}
        else:
            return {"message": "Collection reset failed"}
    except Exception as e:
        return {"error": str(e)}

@router.get('/debug-collection')
def debug_collection():
    """Debug collection information"""
    try:
        # Get collection info
        collection = data_import_service.typesense_client.get_collection().retrieve()
        
        # Try to get a sample document
        try:
            sample = data_import_service.typesense_client.search_documents({
                'q': '*',
                'per_page': 1
            })
            sample_count = len(sample['hits'])
        except Exception as e:
            sample_count = 0
            sample_error = str(e)
        
        return {
            "collection_exists": True,
            "collection_info": collection,
            "sample_search_count": sample_count,
            "total_documents": collection.get('num_documents', 0),
            "fields": [field['name'] for field in collection.get('fields', [])]
        }
    except Exception as e:
        return {
            "collection_exists": False,
            "error": str(e)
        }

@router.get('/list-collections')
def list_collections():
    """List all collections in Typesense"""
    try:
        collections = data_import_service.typesense_client.client.collections.retrieve()
        return {
            "collections": [col['name'] for col in collections],
            "total_collections": len(collections)
        }
    except Exception as e:
        return {"error": str(e)} 