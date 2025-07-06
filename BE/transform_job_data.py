import csv
import json
import os
from datetime import datetime

# Configuration
DATA_FILE = os.getenv('DATA_FILE', 'data/job.csv')
OUTPUT_FILE = os.getenv('OUTPUT_FILE', 'data/transformed_jobs.json')

def clean_text(text):
    """Simple text cleaning"""
    if not text:
        return ""
    return text.strip()

print('Processing job records:')

with open(OUTPUT_FILE, 'w', encoding='utf-8') as output_file:
    line_number = 0
    
    with open(DATA_FILE, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            line_number += 1
            
            # Clean and process the data
            title = clean_text(row.get('title', ''))
            company = clean_text(row.get('company', ''))
            rating = row.get('rating', '')
            location = clean_text(row.get('location', ''))
            source = clean_text(row.get('source', ''))
            description = clean_text(row.get('description', ''))
            application_method = clean_text(row.get('application_method', ''))
            
            # Convert rating to float if possible
            try:
                rating_float = float(rating) if rating and rating != 'NoData' else None
            except:
                rating_float = None
            
            # Create job record - keeping it simple
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
            
            # Write to output file
            output_file.write(json.dumps(job_record) + '\n')
            
            if line_number % 100 == 0:
                print(f"Processed {line_number} jobs ✅")

print(f"Transformation complete! Output saved to {OUTPUT_FILE}")
print(f"Total jobs processed: {line_number}")

# Print some statistics
print("\nJob Statistics:")
print(f"Input file: {DATA_FILE}")
print(f"Output file: {OUTPUT_FILE}")
print(f"Total jobs: {line_number}")

# Show sample of processed data
print("\n📋 Sample Job Record:")
with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
    first_line = f.readline()
    if first_line:
        sample_job = json.loads(first_line)
        print(f"Title: {sample_job['title']}")
        print(f"Company: {sample_job['company']}")
        print(f"Location: {sample_job['location']}")
        print(f"Rating: {sample_job['rating']}")
        print(f"Source: {sample_job['source']}")
