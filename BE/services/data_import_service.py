import os
import json
import csv
from datetime import datetime
from database.typesense_client import TypesenseClient
from schemas.job_schema import JOB_COLLECTION_SCHEMA

class DataImportService:
    def __init__(self):
        self.typesense_client = TypesenseClient()
    
    def setup_jobs_collection(self):
        """Set up the jobs collection and import data if needed"""
        try:
            # Check if collection exists
            self.typesense_client.get_collection().retrieve()
            print(f"✅ Jobs collection 'jobs' already exists")
            return True
        except:
            print(f"📦 Creating jobs collection 'jobs'...")
            
            try:
                self.typesense_client.create_collection(JOB_COLLECTION_SCHEMA)
                print("✅ Collection created successfully")
                
                # Import job data
                self.import_job_data()
                return True
                
            except Exception as e:
                print(f"❌ Error creating collection: {e}")
                return False
    
    def import_job_data(self):
        """Import job data from CSV to Typesense"""
        csv_file = 'data/job.csv'
        
        print(f"🔍 Looking for job data file: {csv_file}")
        
        if not os.path.exists(csv_file):
            print(f"❌ Job data file not found: {csv_file}")
            return False
        
        file_size = os.path.getsize(csv_file)
        print(f"📁 Found job data file: {csv_file} ({file_size} bytes)")
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                rows = list(reader)
                print(f"📊 Found {len(rows)} rows in CSV file")
                
                if len(rows) == 0:
                    print("❌ CSV file is empty")
                    return False
                
                # Show first row for debugging
                print(f" Sample row: {dict(rows[0])}")
                
                documents = []
                line_number = 0
                
                for row in rows:
                    line_number += 1
                    
                    # Map CSV columns to schema fields
                    title = row.get('Job Title', '').strip()
                    company = row.get('Company Name', '').strip()
                    rating = row.get('Company Ratings', '')
                    location = row.get('Location', '').strip()
                    source = row.get('Salary Est', '').strip()
                    description = row.get('Description', '').strip()
                    application_method = row.get('Apply Type', '').strip()
                    
                    # Convert rating to float if possible
                    try:
                        rating_float = float(rating) if rating and rating != 'NoData' else None
                    except:
                        rating_float = None
                    
                    # Create job record
                    job_record = {
                        'job_id': line_number,
                        'title': title,
                        'company': company,
                        'rating': rating_float,
                        'location': location,
                        'source': source,
                        'description': description,
                        'application_method': application_method,
                        'posted_date': datetime.now().strftime('%Y-%m-%d')
                    }
                    
                    documents.append(json.dumps(job_record))
                    
                    # Import in batches of 100
                    if len(documents) >= 100:
                        batch_data = '\n'.join(documents)
                        self.typesense_client.import_documents(batch_data)
                        print(f"✅ Imported batch of {len(documents)} jobs")
                        documents = []
                
                # Import remaining documents
                if documents:
                    batch_data = '\n'.join(documents)
                    self.typesense_client.import_documents(batch_data)
                    print(f"✅ Imported final batch of {len(documents)} jobs")
                
                print(f"🎉 Total jobs imported: {line_number}")
                return True
                
        except Exception as e:
            print(f"❌ Error importing job data: {e}")
            import traceback
            traceback.print_exc()
            return False 