import os
import typesense
from dotenv import load_dotenv

load_dotenv()

class TypesenseClient:
    def __init__(self):
        self.host = os.getenv('TYPESENSE_HOST', 'localhost')
        self.port = os.getenv('TYPESENSE_PORT', '8108')
        self.protocol = os.getenv('TYPESENSE_PROTOCOL', 'http')
        self.api_key = os.getenv('TYPESENSE_API_KEY', 'xyz')
        self.collection_name = os.getenv('TYPESENSE_COLLECTION', 'jobs')
        
        self.client = typesense.Client({
            'nodes': [{
                'host': self.host,
                'port': self.port,
                'protocol': self.protocol
            }],
            'api_key': self.api_key,
            'connection_timeout_seconds': 2
        })
    
    def get_collection(self):
        """Get the jobs collection"""
        return self.client.collections[self.collection_name]
    
    def create_collection(self, schema):
        """Create a new collection"""
        return self.client.collections.create(schema)
    
    def delete_collection(self):
        """Delete the jobs collection"""
        return self.client.collections[self.collection_name].delete()
    
    def search_documents(self, search_params):
        """Search documents in the collection"""
        return self.client.collections[self.collection_name].documents.search(search_params)
    
    def get_document(self, doc_id):
        """Get a specific document by ID"""
        return self.client.collections[self.collection_name].documents[str(doc_id)].retrieve()
    
    def import_documents(self, documents, options=None):
        """Import documents into the collection"""
        if options is None:
            options = {'action': 'upsert'}
        return self.client.collections[self.collection_name].documents.import_(documents, options) 