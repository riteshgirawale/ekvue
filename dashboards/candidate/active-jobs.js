// Self-Injecting Stylesheet to keep active-jobs modular and completely zero-friction
(function injectActiveJobsStyles() {
  const styles = `
    .discover-jobs-view {
      color: #e2e8f0;
      animation: fadeIn 0.4s ease-out;
    }
    
    .jobs-filter-bar {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr auto;
      gap: 12px;
      margin-bottom: 8px;
      align-items: center;
    }
    
    @media (max-width: 1024px) {
      .jobs-filter-bar {
        grid-template-columns: 1fr;
      }
    }
    
    .jobs-search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .jobs-search-icon {
      position: absolute;
      left: 14px;
      color: var(--muted);
      font-size: 15px;
      pointer-events: none;
    }
    
    .jobs-search-input {
      width: 100%;
      padding: 11px 12px 11px 40px !important;
      background: rgba(2, 6, 23, 0.4) !important;
      border: 1px solid var(--border) !important;
      color: white !important;
      border-radius: 12px !important;
      font-size: 13.5px !important;
      outline: none;
      transition: all 0.25s ease;
    }
    
    .jobs-search-input:focus {
      border-color: var(--primary) !important;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }
    
    .jobs-select-filter {
      padding: 11px 12px !important;
      background: rgba(2, 6, 23, 0.4) !important;
      border: 1px solid var(--border) !important;
      color: #cbd5e1 !important;
      border-radius: 12px !important;
      font-size: 13.5px !important;
      outline: none;
      cursor: pointer;
      width: 100%;
      transition: all 0.25s ease;
    }
    
    .jobs-select-filter:focus {
      border-color: var(--primary) !important;
    }
    
    .jobs-select-filter option {
      background: #0f172a;
      color: white;
    }
    
    .filter-btn-blue {
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      border: none;
      color: white;
      padding: 11px 24px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 13.5px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .filter-btn-blue:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
    }
    
    .jobs-found-count {
      font-size: 12.5px;
      color: var(--muted);
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    
    /* Splitscreen Grid Layout */
    .jobs-workspace-split {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 20px;
      align-items: start;
      margin-top: 16px;
    }
    
    @media (max-width: 1024px) {
      .jobs-workspace-split {
        grid-template-columns: 1fr;
      }
    }
    
    .job-card-premium {
      background: rgba(30, 41, 59, 0.15);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      border-left: 4px solid transparent;
    }
    
    .job-card-premium:hover {
      transform: translateY(-1.5px);
      border-color: rgba(99, 102, 241, 0.3);
      background: rgba(30, 41, 59, 0.22);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }
    
    .job-card-premium.active-highlight {
      border-left-color: var(--primary);
      background: rgba(99, 102, 241, 0.06);
      border-color: rgba(99, 102, 241, 0.25);
    }
    
    @media (max-width: 640px) {
      .job-card-premium {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
    }
    
    .job-card-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .job-card-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .job-card-title {
      font-size: 16.5px;
      font-weight: 800;
      color: white;
      margin: 0;
      letter-spacing: -0.2px;
    }
    
    .job-card-new-badge {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-size: 9.5px;
      font-weight: 900;
      padding: 2px 7px;
      border-radius: 50px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .job-card-meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 12px;
      color: var(--muted);
    }
    
    .job-card-meta-sep {
      color: rgba(255, 255, 255, 0.12);
    }
    
    .job-card-salary-tag {
      font-size: 13px;
      font-weight: 800;
      color: #34d399;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin: 1px 0;
    }
    
    .job-card-skills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 2px;
    }
    
    .job-card-skill-pill {
      font-size: 10.5px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 2.5px 7px;
      border-radius: 6px;
      color: #cbd5e1;
      font-weight: 600;
    }
    
    .job-card-skill-more {
      font-size: 10.5px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.2);
      padding: 2.5px 7px;
      border-radius: 6px;
      color: #a5b4fc;
      font-weight: 700;
    }
    
    .job-card-right {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
      min-width: 140px;
    }
    
    @media (max-width: 640px) {
      .job-card-right {
        align-items: flex-start;
        width: 100%;
        min-width: 100%;
      }
    }
    
    .job-card-time {
      font-size: 11px;
      color: var(--muted);
      font-weight: 600;
    }
    
    .apply-btn-solid {
      width: 100%;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      border: none;
      padding: 9px 18px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 12px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.22);
      transition: all 0.2s ease;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .apply-btn-solid:hover {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
    }
    
    .apply-btn-applied {
      width: 100%;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 12px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .save-btn-outline {
      width: 100%;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      color: #cbd5e1;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .save-btn-outline:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
      border-color: rgba(255, 255, 255, 0.2);
    }
    
    .save-btn-saved {
      width: 100%;
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fbbf24;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    /* Persistent Sticky Details Panel */
    .jobs-details-sidebar-panel {
      position: sticky;
      top: 20px;
      max-height: calc(100vh - 180px);
      overflow-y: auto;
      border-radius: 16px;
    }
    
    .job-details-card-premium {
      background: rgba(11, 17, 41, 0.6) !important;
      border: 1px solid rgba(99, 102, 241, 0.25) !important;
      box-shadow: 0 15px 35px rgba(0,0,0,0.4) !important;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    
    /* Toast success alert */
    .job-toast-alert {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(16, 185, 129, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 35px rgba(16, 185, 129, 0.35);
      z-index: 100001;
      font-weight: 800;
      font-size: 13.5px;
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .job-toast-alert.active {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
})();

// Define React Components
function ActiveJobsDashboard() {
  const [jobs, setJobs] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [jobTypeFilter, setJobTypeFilter] = React.useState('');
  const [expFilter, setExpFilter] = React.useState('');
  const [sortBy, setSortBy] = React.useState('newest');
  
  const [appliedJobIds, setAppliedJobIds] = React.useState([]);
  const [savedJobIds, setSavedJobIds] = React.useState([]);
  const [selectedJob, setSelectedJob] = React.useState(null);
  
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastActive, setToastActive] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(null);

  // Load database structures on mount
  React.useEffect(() => {
    loadJobsData();
    
    // Sync dynamically when localStorage triggers updates
    const handleStorageEvent = (e) => {
      if (
        e.key === 'ekvueCompanyItems' || 
        e.key === 'ekvueJobApplications' || 
        e.key === 'ekvueSavedJobs'
      ) {
        console.log('[ActiveJobs React] Storage synced, reloading listings...');
        loadJobsData();
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    // Custom trigger from parent SwitchView loops
    const handleViewRefresh = () => {
      loadJobsData();
    };
    window.addEventListener('ekvueRefreshActiveJobs', handleViewRefresh);
    
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('ekvueRefreshActiveJobs', handleViewRefresh);
    };
  }, []);

  const loadJobsData = () => {
    // 1. Fetch current candidate profile
    const getActiveUser = () => {
      try {
        const raw = sessionStorage.getItem('ekvueSession') || localStorage.getItem('ekvueSession') || localStorage.getItem('ekvueCurrentUser');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    };
    const user = getActiveUser();
    setCurrentUser(user);
    if (!user) return;

    // 2. Fetch applications
    const apps = JSON.parse(localStorage.getItem('ekvueJobApplications') || '[]');
    const candidateAppliedIds = apps
      .filter(app => {
        if (!app.candidateEmail || !user.email) return false;
        return app.candidateEmail.toLowerCase() === user.email.toLowerCase();
      })
      .map(app => app.jobId);
    setAppliedJobIds(candidateAppliedIds);

    // 3. Fetch bookmarks
    const saved = JSON.parse(localStorage.getItem('ekvueSavedJobs') || '[]');
    const candidateSavedIds = saved
      .filter(s => {
        if (!s.candidateEmail || !user.email) return false;
        return s.candidateEmail.toLowerCase() === user.email.toLowerCase();
      })
      .map(s => s.jobId);
    setSavedJobIds(candidateSavedIds);

    // 4. Fetch job listings from localStorage
    const rawJobs = localStorage.getItem('ekvueCompanyItems');
    let allJobs = rawJobs ? JSON.parse(rawJobs) : [];
    
    // Removed mock items injection logic here
    
    // Only display 'Active' statuses
    const activeListings = allJobs.filter(j => j.status === 'Active').map(j => ({
      ...j,
      jobTitle: j.jobTitle || j.title || 'Untitled Position',
      employmentType: j.employmentType || j.type || 'Full-time'
    }));
    setJobs(activeListings);
    
    // Set selected job dynamically if none is selected
    if (activeListings.length > 0 && !selectedJob) {
      // Find the first job, or fallback
      setSelectedJob(activeListings[0]);
    } else if (selectedJob) {
      // Refresh details of currently selected job
      const refreshed = activeListings.find(x => x.id === selectedJob.id);
      if (refreshed) {
        setSelectedJob(refreshed);
      }
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastActive(true);
    setTimeout(() => {
      setToastActive(false);
    }, 2800);
  };

  // Toggle bookmarking
  const toggleSaveJob = (job, e) => {
    e.stopPropagation();
    if (!currentUser) return;
    
    const saved = JSON.parse(localStorage.getItem('ekvueSavedJobs') || '[]');
    const isSaved = savedJobIds.includes(job.id);
    
    let updated;
    if (isSaved) {
      updated = saved.filter(x => !(x.jobId === job.id && x.candidateEmail.toLowerCase() === currentUser.email.toLowerCase()));
      showToast(`Removed "${job.jobTitle}" from saved jobs.`);
    } else {
      updated = [...saved, {
        id: 'saved_' + Date.now(),
        jobId: job.id,
        jobTitle: job.jobTitle,
        companyName: job.companyName || 'Company',
        candidateEmail: currentUser.email,
        savedAt: new Date().toISOString()
      }];
      showToast(`Saved "${job.jobTitle}" successfully!`);
    }
    
    localStorage.setItem('ekvueSavedJobs', JSON.stringify(updated));
    loadJobsData();
  };

  // Handle Application Handshake
  const applyForJob = (job, e) => {
    if (e) e.stopPropagation();
    if (!currentUser) return;

    if (appliedJobIds.includes(job.id)) {
      showToast(`You have already applied for ${job.jobTitle}!`);
      return;
    }

    // 1. Save record to ekvueJobApplications (And MongoDB)
    const apps = JSON.parse(localStorage.getItem('ekvueJobApplications') || '[]');
    const newApp = {
      id: 'app_' + Date.now(),
      jobId: job.id,
      jobTitle: job.jobTitle,
      companyName: job.companyName || 'Company',
      companyEmail: job.companyEmail || '', // Required for MongoDB routing
      candidateEmail: currentUser.email,
      candidateName: currentUser.name || 'Student Candidate',
      appliedAt: new Date().toISOString(),
      status: 'Applied',
      resumeLink: ''
    };

    fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp)
    }).catch(()=>{});

    localStorage.setItem('ekvueJobApplications', JSON.stringify([...apps, newApp]));

    // 2. Increment active job applied metrics in database (ekvueCompanyItems)
    const allJobs = JSON.parse(localStorage.getItem('ekvueCompanyItems') || '[]');
    const updatedJobs = allJobs.map(j => {
      if (j.id === job.id) {
        return { ...j, applied: (j.applied || 0) + 1 };
      }
      return j;
    });
    localStorage.setItem('ekvueCompanyItems', JSON.stringify(updatedJobs));

    // 3. Notify recruiter / company accounts about new application
    try {
      const accounts = JSON.parse(localStorage.getItem('ekvueAccounts') || '[]');
      const recruiters = accounts.filter(acc => acc.role === 'Company' || acc.role === 'Interviewer');
      const notifications = JSON.parse(localStorage.getItem('ekvueNotifications') || '[]');
      recruiters.forEach((rec) => {
        notifications.unshift({
          id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          candidateEmail: rec.email,
          title: 'New Job Application!',
          message: `📩 ${currentUser.name || 'A candidate'} has applied for "${job.jobTitle}". Review their application in Job Postings.`,
          type: 'application',
          read: false,
          createdAt: new Date().toISOString(),
          metadata: { jobId: job.id, jobTitle: job.jobTitle, applicantName: currentUser.name, applicantEmail: currentUser.email }
        });
      });
      localStorage.setItem('ekvueNotifications', JSON.stringify(notifications));
      // Dispatch storage event for cross-tab reactivity
      try {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'ekvueNotifications',
          newValue: JSON.stringify(notifications)
        }));
      } catch(e) {}
    } catch(err) {
      console.warn('[ActiveJobs] Failed to send recruiter notification:', err);
    }

    // 4. Sync changes back into local React state
    loadJobsData();
    showToast(`Successfully applied for ${job.jobTitle}! Recruiter notified.`);
  };

  // Helper to parse human-readable time gaps (e.g. "Posted 2 hours ago")
  const getRelativeTimeText = (dateString) => {
    if (!dateString) return 'Posted just now';
    
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    
    if (diffHrs < 1) return 'Posted just now';
    if (diffHrs === 1) return 'Posted 1 hour ago';
    if (diffHrs < 24) return `Posted ${diffHrs} hours ago`;
    
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Posted 1 day ago';
    return `Posted ${diffDays} days ago`;
  };

  // Filtering & Sorting Logic
  const filteredJobs = jobs.filter(job => {
    const title = (job.jobTitle || '').toLowerCase();
    const desc = (job.description || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = title.includes(query) || desc.includes(query) || (job.location || '').toLowerCase().includes(query);
    
    const matchesType = !jobTypeFilter || (job.employmentType || '').toLowerCase() === jobTypeFilter.toLowerCase();
    const matchesExp = !expFilter || (job.experienceRequired || '').toLowerCase() === expFilter.toLowerCase();
    
    return matchesSearch && matchesType && matchesExp;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'salary') {
      const getSalVal = (salStr) => {
        if (!salStr) return 0;
        const matches = salStr.match(/₹?(\d+)/);
        return matches ? parseInt(matches[1]) : 0;
      };
      return getSalVal(b.salary) - getSalVal(a.salary);
    }
    return 0;
  });

  return (
    <div className="discover-jobs-view">
      <div className="welcome" style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Discover Jobs</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
          Find the right opportunity and build your career
        </p>
      </div>

      {/* FILTER SEARCH TOOLBAR BAR */}
      <div className="card section" style={{ padding: '16px', marginBottom: '20px' }}>
        <div className="jobs-filter-bar">
          <div className="jobs-search-input-wrapper">
            <span className="jobs-search-icon">🔍</span>
            <input 
              type="text" 
              className="jobs-search-input"
              placeholder="Job title, keyword or company" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="jobs-select-filter" 
            value={jobTypeFilter}
            onChange={(e) => setJobTypeFilter(e.target.value)}
          >
            <option value="">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
          
          <select 
            className="jobs-select-filter"
            value={expFilter}
            onChange={(e) => setExpFilter(e.target.value)}
          >
            <option value="">All Experience</option>
            <option value="Entry Level">Entry Level</option>
            <option value="Mid Level">Mid Level</option>
            <option value="Senior Level">Senior Level</option>
            <option value="Lead / Principal">Lead / Principal</option>
          </select>
          
          <select 
            className="jobs-select-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort by: Newest</option>
            <option value="oldest">Sort by: Oldest</option>
            <option value="salary">Sort by: Salary</option>
          </select>
          
          <button 
            type="button" 
            className="filter-btn-blue"
            onClick={() => {
              setSearchQuery('');
              setJobTypeFilter('');
              setExpFilter('');
              setSortBy('newest');
              showToast('Filters cleared.');
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* SPLIT LAYOUT CONTAINER */}
      <div className="jobs-workspace-split">
        
        {/* LEFT COLUMN: LISTING */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="jobs-found-count">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} found
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredJobs.length === 0 ? (
              <div className="card section" style={{ padding: '36px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>💼</span>
                <h3 style={{ color: 'white', margin: '0 0 6px 0', fontSize: '15px' }}>No active vacancies match your criteria</h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)' }}>Try resetting the search filters or check back later for new openings.</p>
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isApplied = appliedJobIds.includes(job.id);
                const isSaved = savedJobIds.includes(job.id);
                const skills = (job.skillsRequired || '').split(',').map(s => s.trim()).filter(Boolean);
                const isNew = (Date.now() - new Date(job.createdAt).getTime()) < 3600000 * 24;
                const isActive = selectedJob && selectedJob.id === job.id;

                return (
                  <div 
                    key={job.id} 
                    className={`job-card-premium ${isActive ? 'active-highlight' : ''}`}
                    onClick={() => setSelectedJob(job)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* CARD DETAILS SIDE */}
                    <div className="job-card-left">
                      <div className="job-card-title-row">
                        <h3 className="job-card-title">{job.jobTitle}</h3>
                        {isNew && <span className="job-card-new-badge">New</span>}
                      </div>
                      
                      <div className="job-card-meta-row">
                        <span>📍 {job.location || 'Remote'}</span>
                        <span className="job-card-meta-sep">•</span>
                        <span>💼 {job.employmentType || 'Full-time'}</span>
                        <span className="job-card-meta-sep">•</span>
                        <span>🎓 {job.experienceRequired || 'Mid Level'}</span>
                      </div>
                      
                      <div className="job-card-salary-tag">
                        <span>💵</span>
                        <span>{job.salary || 'Competitive'}</span>
                      </div>
                      
                      {skills.length > 0 && (
                        <div className="job-card-skills-row">
                          {skills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="job-card-skill-pill">{skill}</span>
                          ))}
                          {skills.length > 4 && (
                            <span className="job-card-skill-more">+{skills.length - 4} more</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* CARD ACTION BUTTONS SIDE */}
                    <div className="job-card-right">
                      <span className="job-card-time">{getRelativeTimeText(job.createdAt)}</span>
                      {isApplied ? (
                        <div className="apply-btn-applied">
                          <span>✓</span> Applied
                        </div>
                      ) : (
                        <button 
                          type="button" 
                          className="apply-btn-solid"
                          onClick={(e) => applyForJob(job, e)}
                        >
                          Apply Now
                        </button>
                      )}
                      
                      <button 
                        type="button" 
                        className={isSaved ? "save-btn-saved" : "save-btn-outline"}
                        onClick={(e) => toggleSaveJob(job, e)}
                      >
                        <span>🔖</span> {isSaved ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY DETAILS PANEL */}
        <div className="jobs-details-sidebar-panel">
          {selectedJob ? (
            <div className="card section job-details-card-premium">
              
              {/* Header Info */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
                <span style={{ 
                  fontSize: '9.5px', 
                  background: 'rgba(99,102,241,0.15)', 
                  border: '1px solid rgba(99,102,241,0.3)', 
                  color: '#cbd5e1', 
                  fontWeight: '800', 
                  padding: '3px 10px', 
                  borderRadius: '50px', 
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '10px',
                  letterSpacing: '0.5px'
                }}>
                  {selectedJob.department || 'Engineering'}
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>{selectedJob.jobTitle}</h2>
                
                {/* Meta details as glass tags */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '3.5px 9px', borderRadius: '6px', color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>📍 {selectedJob.location}</span>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '3.5px 9px', borderRadius: '6px', color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>💼 {selectedJob.employmentType}</span>
                  <span style={{ fontSize: '11px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', padding: '3.5px 9px', borderRadius: '6px', color: '#a5b4fc', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>⚡ {selectedJob.workMode || 'Remote'}</span>
                </div>
              </div>

              {/* Compensation Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <small style={{ color: 'var(--muted)', fontWeight: '800', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px' }}>Annual CTC</small>
                  <strong style={{ color: '#34d399', fontSize: '13.5px', fontWeight: '800' }}>💵 {selectedJob.salary || 'Competitive'}</strong>
                </div>
                <div style={{ background: 'rgba(99, 102, 241, 0.02)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <small style={{ color: 'var(--muted)', fontWeight: '800', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px' }}>Experience</small>
                  <strong style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: '800' }}>🎓 {selectedJob.experienceRequired || 'Mid Level'}</strong>
                </div>
              </div>

              {/* Overview */}
              <div>
                <h4 style={{ color: 'white', fontSize: '12px', textTransform: 'uppercase', borderLeft: '3px solid var(--primary)', paddingLeft: '8px', margin: '0 0 6px 0', fontWeight: '800', letterSpacing: '0.5px' }}>Role Overview</h4>
                <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                  {selectedJob.description || 'No description provided.'}
                </p>
              </div>

              {/* Responsibilities */}
              {selectedJob.responsibilities && (
                <div>
                  <h4 style={{ color: 'white', fontSize: '12px', textTransform: 'uppercase', borderLeft: '3px solid var(--primary)', paddingLeft: '8px', margin: '0 0 6px 0', fontWeight: '800', letterSpacing: '0.5px' }}>Key Responsibilities</h4>
                  <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                    {selectedJob.responsibilities}
                  </p>
                </div>
              )}

              {/* Required Skills */}
              <div>
                <h4 style={{ color: 'white', fontSize: '12px', textTransform: 'uppercase', borderLeft: '3px solid var(--primary)', paddingLeft: '8px', margin: '0 0 6px 0', fontWeight: '800', letterSpacing: '0.5px' }}>Required Technical Skills</h4>
                <div className="job-card-skills-row" style={{ marginTop: '8px' }}>
                  {(selectedJob.skillsRequired || '').split(',').map((skill, idx) => (
                    <span key={idx} className="job-card-skill-pill" style={{ fontSize: '11px', padding: '3.5px 9px' }}>
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              {selectedJob.benefits && (
                <div>
                  <h4 style={{ color: 'white', fontSize: '12px', textTransform: 'uppercase', borderLeft: '3px solid var(--primary)', paddingLeft: '8px', margin: '0 0 6px 0', fontWeight: '800', letterSpacing: '0.5px' }}>Benefits & Perks</h4>
                  <p style={{ fontSize: '12.5px', color: '#cbd5e1', margin: 0, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', lineHeight: '1.5' }}>
                    {selectedJob.benefits}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: '4px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px' }}>
                {appliedJobIds.includes(selectedJob.id) ? (
                  <div className="apply-btn-applied" style={{ flex: 1, padding: '10.5px' }}>
                    <span>✓</span> Applied Successfully
                  </div>
                ) : (
                  <button 
                    type="button" 
                    className="apply-btn-solid" 
                    style={{ flex: 1, padding: '10.5px' }}
                    onClick={() => applyForJob(selectedJob)}
                  >
                    Apply For This Position
                  </button>
                )}
                
                <button 
                  type="button" 
                  className={savedJobIds.includes(selectedJob.id) ? "save-btn-saved" : "save-btn-outline"}
                  style={{ width: '100px', padding: '10.5px' }}
                  onClick={(e) => toggleSaveJob(selectedJob, e)}
                >
                  <span>🔖</span> {savedJobIds.includes(selectedJob.id) ? 'Saved' : 'Save'}
                </button>
              </div>

            </div>
          ) : (
            <div className="card section" style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderStyle: 'dashed', color: 'var(--muted)', borderRadius: '16px' }}>
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>👁️</span>
              <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: '800' }}>Select a Job to View Details</h4>
              <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5' }}>Click on any job posting in the list on the left to inspect its complete profile, and apply instantly.</p>
            </div>
          )}
        </div>

      </div>

      {/* COMPACT FLOATING TOAST SUCCESS ALERTS */}
      <div className={`job-toast-alert ${toastActive ? 'active' : ''}`}>
        <span>🎉</span> {toastMessage}
      </div>
    </div>
  );
}

// Bootstrap React App
const rootEl = document.getElementById('active-jobs-react-root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(<ActiveJobsDashboard />);
}
