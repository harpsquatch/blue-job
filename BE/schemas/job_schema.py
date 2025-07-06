JOB_COLLECTION_SCHEMA = {
    'name': 'jobs',
    'fields': [
        {'name': 'job_id', 'type': 'int32'},
        {'name': 'title', 'type': 'string'},
        {'name': 'company', 'type': 'string', 'facet': True},
        {'name': 'rating', 'type': 'float'},
        {'name': 'location', 'type': 'string', 'facet': True},
        {'name': 'source', 'type': 'string', 'facet': True},
        {'name': 'description', 'type': 'string'},
        {'name': 'application_method', 'type': 'string'},
        {'name': 'posted_date', 'type': 'string'}
    ],
    'default_sorting_field': 'job_id'
} 