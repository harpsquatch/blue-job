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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [parsedQuery, setParsedQuery] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

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
      // Always use traditional search
      const response = await fetch(
        `http://localhost:8000/jobs/?q=${encodeURIComponent(query)}&limit=${filters.limit}`
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setJobs(data || []);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatError(null);
    const userMessage = { role: "user", content: chatInput };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatInput,
          history: chatHistory,
          context: selectedJob,
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setChatHistory((prev) => [
        ...prev,
        { role: "llm", content: data.reply }
      ]);
    } catch (error) {
      setChatError("Failed to get response from LLM.");
    } finally {
      setChatLoading(false);
      setChatInput("");
    }
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
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by title, company, or description..."
                className="flex-1 input text-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-8 py-3 disabled:opacity-50"
              >
                {loading ? '🔍 Searching...' : '🔍 Search'}
              </button>
              <button
                type="button"
                onClick={browseAllJobs}
                disabled={loading}
                className="btn-secondary px-6 py-3 disabled:opacity-50"
              >
                Browse All
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
                  <div
                    key={job.job_id}
                    className={`bg-card border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer ${selectedJob && selectedJob.job_id === job.job_id ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
                    onClick={() => {
                      setSelectedJob(job);
                      setSidebarOpen(true);
                    }}
                  >
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
                  <p className="font-medium mb-2">Search Jobs</p>
                  <p className="text-sm text-muted-foreground">Search by job title, company, or keywords</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">Browse All</p>
                  <p className="text-sm text-muted-foreground">View all available job listings</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {sidebarOpen && (
        <div
          className="fixed top-0 right-0 h-full w-80 bg-card border-l border-border shadow-lg z-50 flex flex-col"
          style={{ minWidth: 320, maxWidth: 400 }}
        >
          <div className="flex justify-between items-center p-4 border-b border-border">
            <h2 className="text-lg font-bold">Chat</h2>
            <button onClick={() => setSidebarOpen(false)} className="text-2xl font-bold">&times;</button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-2">
            {selectedJob && (
              <div className="mb-4 p-4 bg-muted rounded-lg border border-border">
                <div className="font-semibold text-primary text-lg mb-1">{selectedJob.title}</div>
                <div className="text-sm text-muted-foreground mb-1">{selectedJob.company} — {selectedJob.location}</div>
                {selectedJob.salary && (
                  <div className="text-sm mb-1">💰 <span className="font-medium">{selectedJob.salary}</span></div>
                )}
                {selectedJob.description && (
                  <div className="text-xs text-foreground mt-2 line-clamp-3">{selectedJob.description}</div>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto mb-4">
              {chatHistory.length === 0 ? (
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`p-2 rounded-md ${msg.role === 'user' ? 'bg-primary text-primary-foreground self-end' : 'bg-muted text-foreground self-start'}`}>
                      {msg.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2 mt-auto">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type your message..."
                className="input flex-1"
                disabled={chatLoading}
              />
              <button type="submit" className="btn-primary px-4" disabled={chatLoading}>
                {chatLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
            {chatError && <div className="text-red-500 text-sm mt-2">{chatError}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 