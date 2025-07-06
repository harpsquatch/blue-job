import React, { useState, useEffect } from 'react';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [filters, setFilters] = useState({
    company: '',
    location: '',
    limit: 20
  });
  const [stats, setStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [parsedQuery, setParsedQuery] = useState(null);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  // Traditional Job Search (Typesense only - no LLM)
  const searchJobs = async (query) => {
    if (!query.trim()) return;
    setLoading(true);
    setAiInsights(null);
    setParsedQuery(null);

    try {
      let response;
      if (aiEnabled) {
        // AI-powered search
        response = await fetch(
          `http://localhost:8000/jobs/ai-search?query=${encodeURIComponent(query)}&limit=${filters.limit}&enhance=true`
        );
      } else {
        // Traditional search
        response = await fetch(
          `http://localhost:8000/jobs/?q=${encodeURIComponent(query)}&limit=${filters.limit}`
        );
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (aiEnabled) {
        setJobs(data.jobs || []);
        setAiInsights(data.ai_analysis || null);
        setParsedQuery(data.llm_parsing || null);
      } else {
        setJobs(data || []);
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Browse all jobs (no search)
  const browseAllJobs = async () => {
    setLoading(true);
    
    try {
      // Use the list_jobs endpoint without query parameter
      const response = await fetch(`http://localhost:8000/jobs/?limit=${filters.limit}&offset=0`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setJobs(data || []);
      setSearchQuery(''); // Clear search query
      
    } catch (error) {
      console.error('Error browsing jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Get stats
  const getStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    getStats();
    // Load all jobs on startup
    browseAllJobs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    searchJobs(searchQuery);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently posted';
    return new Date(dateString).toLocaleDateString();
  };

  const getRatingStars = (rating) => {
    if (!rating) return null;
    const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
    return (
      <div className="flex items-center gap-1">
        <span className="text-yellow-500">{stars}</span>
        <span className="text-sm text-muted-foreground">({rating})</span>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark bg-background text-foreground' : 'bg-background text-foreground'}`}>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">JS</span>
            </div>
            <h1 className="text-xl font-bold">Job Search</h1>
          </div>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-1/2 right-0 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-l-lg shadow-lg hover:bg-primary/90 transition"
        style={{ transform: 'translateY(-50%)' }}
      >
        Open Sidebar
      </button>

      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex items-center space-x-3 my-2">
              <span className="text-sm font-medium">Traditional</span>
              <button
                type="button"
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  aiEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aiEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm font-medium">AI Powered</span>
              {aiEnabled && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  🤖
                </span>
              )}
            </div>
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={aiEnabled
                  ? "Try: 'Remote React developer with 5+ years experience'"
                  : "Search jobs by title, company, or description..."
                }
                className="flex-1 input text-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-8 py-3 disabled:opacity-50"
              >
                {loading ? '🔍 Searching...' : (aiEnabled ? '🤖 AI Search' : '🔍 Search')}
              </button>
              <button
                type="button"
                onClick={browseAllJobs}
                disabled={loading}
                className="btn-secondary px-6 py-3 disabled:opacity-50"
              >
                📋 Browse All
              </button>
            </div>
            
            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
              <input
                type="text"
                placeholder="Company filter"
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                className="input flex-1 min-w-48"
              />
              <input
                type="text"
                placeholder="Location filter"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="input flex-1 min-w-48"
              />
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="input min-w-32"
              >
                <option value={10}>10 results</option>
                <option value={20}>20 results</option>
                <option value={50}>50 results</option>
              </select>
            </div>
          </form>
        </div>

        {/* Results Section */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Searching jobs...</p>
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {searchQuery ? `Found ${jobs.length} jobs for "${searchQuery}"` : `Showing ${jobs.length} jobs`}
                </h2>
                {stats && (
                  <div className="text-sm text-muted-foreground">
                    Total jobs in database: {stats.total_documents}
                  </div>
                )}
              </div>
              
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <div key={job.job_id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-primary">{job.title}</h3>
                      <span className="text-sm text-muted-foreground">#{job.job_id}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Company:</span>
                        <div className="font-medium">{job.company}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Location:</span>
                        <div className="font-medium">{job.location}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Posted:</span>
                        <div className="font-medium">{formatDate(job.posted_date)}</div>
                      </div>
                    </div>
                    
                    {job.description && (
                      <div>
                        <span className="text-sm text-muted-foreground">Description:</span>
                        <p className="text-sm mt-1 line-clamp-3">{job.description}</p>
                      </div>
                    )}
                    
                    {job.rating && (
                      <div className="mt-3">
                        {getRatingStars(job.rating)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : searchQuery && !loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No jobs found matching your criteria.</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms or browse all jobs.</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Job Search Platform</h2>
              <p className="text-muted-foreground mb-6">
                Search for jobs or browse all available positions
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">🔍 Search Jobs</p>
                  <p className="text-sm text-muted-foreground">Search by job title, company, or keywords</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">📋 Browse All</p>
                  <p className="text-sm text-muted-foreground">View all available job listings</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {aiEnabled && sidebarOpen && (
        <div
          className="fixed top-0 right-0 h-full w-80 bg-card border-l border-border shadow-lg z-50 flex flex-col"
          style={{ minWidth: 320, maxWidth: 400 }}
        >
          <div className="flex justify-between items-center p-4 border-b border-border">
            <h2 className="text-lg font-bold">🤖 AI Analysis</h2>
            <button onClick={() => setSidebarOpen(false)} className="text-2xl font-bold">&times;</button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {aiInsights ? (
              <div>
                {/* Parsed Query */}
                {parsedQuery && (
                  <div className="mb-4 p-4 bg-muted rounded-md">
                    <h3 className="font-medium mb-2">Query Analysis:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {parsedQuery.keywords && (
                        <div>
                          <span className="text-muted-foreground">Keywords:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {parsedQuery.keywords.map((keyword, i) => (
                              <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {parsedQuery.location && (
                        <div>
                          <span className="text-muted-foreground">Location:</span>
                          <div className="font-medium">{parsedQuery.location}</div>
                        </div>
                      )}
                      {parsedQuery.salary_expectation && (
                        <div>
                          <span className="text-muted-foreground">Salary:</span>
                          <div className="font-medium capitalize">{parsedQuery.salary_expectation}</div>
                        </div>
                      )}
                      {parsedQuery.work_arrangement && (
                        <div>
                          <span className="text-muted-foreground">Work Type:</span>
                          <div className="font-medium capitalize">{parsedQuery.work_arrangement}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Insights */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Summary:</h3>
                    <p className="text-muted-foreground">{aiInsights.summary}</p>
                  </div>
                  
                  {aiInsights.insights && aiInsights.insights.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Market Insights:</h3>
                      <ul className="space-y-1">
                        {aiInsights.insights.map((insight, i) => (
                          <li key={i} className="text-muted-foreground flex items-start">
                            <span className="mr-2">💡</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Recommendations:</h3>
                      <ul className="space-y-1">
                        {aiInsights.recommendations.map((rec, i) => (
                          <li key={i} className="text-muted-foreground flex items-start">
                            <span className="mr-2">✅</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {aiInsights.skill_demand && (
                    <div>
                      <h3 className="font-medium mb-2">In-Demand Skills:</h3>
                      <p className="text-muted-foreground">{aiInsights.skill_demand}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No AI analysis available. Run an AI search to see suggestions here.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 