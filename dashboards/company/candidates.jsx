const { useState, useEffect, useMemo } = React;

function CandidatesView() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load candidate data
  useEffect(() => {
    const loadData = () => {
      try {
        const accounts = JSON.parse(localStorage.getItem('ekvueAccounts') || '[]');
        const candidateAccounts = accounts.filter(acc => acc.role === 'Candidate');
        
        // Enrich with stats
        const apps = JSON.parse(localStorage.getItem('ekvueJobApplications') || '[]');
        const scores = JSON.parse(localStorage.getItem('ekvueInterviewerScorecards') || '[]');
        
        // Build a unique list of candidates from BOTH accounts and applications
        const candidateMap = new Map();
        
        // 1. Add from accounts
        candidateAccounts.forEach(acc => {
          const emailStr = acc.email || '';
          candidateMap.set(emailStr.toLowerCase(), {
            name: acc.name || acc.fullName || 'Unknown Candidate',
            email: emailStr,
            isRegistered: true
          });
        });

        // 2. Add missing from applications
        apps.forEach(app => {
          const email = (app.candidateEmail || '').toLowerCase();
          if (email && !candidateMap.has(email)) {
            candidateMap.set(email, {
              name: app.candidateName || 'Unknown Candidate',
              email: email,
              isRegistered: false
            });
          }
        });
        
        const allCandidates = Array.from(candidateMap.values());
        
        const enriched = allCandidates.map(c => {
          const cEmailLower = (c.email || '').toLowerCase();
          const cApps = apps.filter(a => (a.candidateEmail || '').toLowerCase() === cEmailLower);
          const cScores = scores.filter(s => (s.candidateEmail || '').toLowerCase() === cEmailLower);
          
          return {
            ...c,
            applicationsCount: cApps.length,
            scorecardsCount: cScores.length,
            latestActivity: cApps.length > 0 ? new Date(Math.max(...cApps.map(a => new Date(a.date).getTime()))).toLocaleDateString() : 'No applications',
            avgScore: cScores.length > 0 
              ? (cScores.reduce((sum, s) => sum + parseInt(s.score || 0), 0) / cScores.length).toFixed(1) + '/5'
              : 'N/A'
          };
        });
        
        setCandidates(enriched);
      } catch (err) {
        console.error("Failed to load candidates data:", err);
      }
    };
    
    // Initial load
    loadData();
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', loadData);
    
    // We also want to poll occasionally just in case localStorage was mutated in the same window
    const interval = setInterval(loadData, 5000);
    
    return () => {
      window.removeEventListener('storage', loadData);
      clearInterval(interval);
    };
  }, []);

  const filteredCandidates = useMemo(() => {
    if (!searchQuery) return candidates;
    const lowerQ = searchQuery.toLowerCase();
    return candidates.filter(c => 
      (c.name || '').toLowerCase().includes(lowerQ) || 
      (c.email || '').toLowerCase().includes(lowerQ)
    );
  }, [candidates, searchQuery]);

  return (
    <div style={{ padding: '0px' }}>
      <div className="welcome" style={{ marginBottom: '24px' }}>
        <h1>Candidate Student Directory</h1>
        <p>Browse registered students, view their application history, and review interviewer scorecards.</p>
      </div>
      
      {/* Search and Filters */}
      <div className="card section" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', padding: '16px 24px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search candidates by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 40px', background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)', borderRadius: '10px', color: 'white',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>
          {filteredCandidates.length} {filteredCandidates.length === 1 ? 'student' : 'students'} found
        </div>
      </div>

      {/* Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="card section" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <h3 style={{ margin: '0 0 8px 0' }}>No candidates found</h3>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
            {searchQuery ? 'Try adjusting your search criteria.' : 'There are currently no students registered in the system.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredCandidates.map(cand => (
            <div key={cand.email} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.2s', cursor: 'pointer' }}
                 onClick={() => setSelectedCandidate(cand)}
                 onMouseOver={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                 onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: 'white' }}>
                  {cand.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cand.name}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cand.email}</div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 800, letterSpacing: '0.5px' }}>Applications</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#6366f1' }}>{cand.applicationsCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 800, letterSpacing: '0.5px' }}>Avg Score</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#34d399' }}>{cand.avgScore}</div>
                </div>
              </div>
              
              <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Latest Activity:</span>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{cand.latestActivity}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Modal */}
      {selectedCandidate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '20px'
        }} onClick={() => setSelectedCandidate(null)}>
          <div style={{
            background: '#1e1e2d', width: '100%', maxWidth: '600px', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column',
            maxHeight: '85vh'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                {selectedCandidate.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', color: 'white' }}>{selectedCandidate.name}</h2>
                <div style={{ fontSize: '14px', color: 'var(--muted)' }}>{selectedCandidate.email}</div>
                <div style={{ marginTop: '6px' }}>
                  <span className="badge" style={{ background: selectedCandidate.isRegistered ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)', color: selectedCandidate.isRegistered ? '#818cf8' : '#fbbf24', padding: '4px 8px', fontSize: '10px' }}>
                    {selectedCandidate.isRegistered ? 'Registered Student' : 'Guest Applicant'}
                  </span>
                </div>
              </div>
              <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '24px', cursor: 'pointer' }} onClick={() => setSelectedCandidate(null)}>×</button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', borderLeft: '3px solid #6366f1', paddingLeft: '8px' }}>Application History</h3>
                {selectedCandidate.applicationsCount === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic' }}>
                    No job applications submitted yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(() => {
                      const apps = JSON.parse(localStorage.getItem('ekvueJobApplications') || '[]');
                      return apps.filter(a => (a.candidateEmail || '').toLowerCase() === (selectedCandidate.email || '').toLowerCase()).map(app => (
                        <div key={app.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: 'white', fontSize: '14px' }}>{app.jobTitle}</div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Applied: {new Date(app.date).toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="badge" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: '10px' }}>{app.status || 'Applied'}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', borderLeft: '3px solid #fbbf24', paddingLeft: '8px' }}>Interviewer Scorecards</h3>
                {selectedCandidate.scorecardsCount === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic' }}>
                    No interview feedback available yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(() => {
                      const scores = JSON.parse(localStorage.getItem('ekvueInterviewerScorecards') || '[]');
                      return scores.filter(s => (s.candidateEmail || '').toLowerCase() === (selectedCandidate.email || '').toLowerCase()).map(sc => (
                        <div key={sc.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{sc.targetRole}</div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>Score: {sc.score}/5</div>
                          </div>
                          <div style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>Interviewer: <span style={{ color: '#e2e8f0' }}>{sc.interviewerName}</span></div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                              {sc.feedback || 'No written feedback provided.'}
                            </p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('candidates-react-root'));
root.render(<CandidatesView />);
