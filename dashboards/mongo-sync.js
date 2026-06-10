/**
 * MongoDB Optimistic Sync Wrapper
 * This script intercepts localStorage and syncs data to the MongoDB backend automatically.
 */
console.log('MongoDB Sync Initialized');

const API_BASE = '/api';

// Sync from Mongo on Page Load
async function initialSync() {
  try {
    const [users, jobs, interviews, apps] = await Promise.all([
      fetch(`${API_BASE}/users`).then(r => r.json()),
      fetch(`${API_BASE}/jobs`).then(r => r.json()),
      fetch(`${API_BASE}/interviews`).then(r => r.json()),
      fetch(`${API_BASE}/applications`).then(r => r.json())
    ]);

    // Populate localStorage so the synchronous app logic works flawlessly
    if (users && users.length) localStorage.setItem('ekvueAccounts', JSON.stringify(users));
    if (jobs && jobs.length) localStorage.setItem('ekvueCompanyJobs', JSON.stringify(jobs));
    if (interviews && interviews.length) localStorage.setItem('ekvueCompanySchedules', JSON.stringify(interviews));
    if (apps && apps.length) localStorage.setItem('ekvueCandidateApplications', JSON.stringify(apps));
    
    // Dispatch event so dashboards know fresh data arrived
    window.dispatchEvent(new Event('mongo-synced'));
  } catch (err) {
    console.error('Failed to sync from MongoDB:', err);
  }
}

// Override localStorage.setItem to mirror data to MongoDB
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, arguments);

  try {
    if (key === 'ekvueAccounts') {
      const accounts = JSON.parse(value);
      const latest = accounts[accounts.length - 1]; // Naive sync for new account
      if (latest) {
        fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latest)
        }).catch(console.error);
      }
    } else if (key === 'ekvueCompanyJobs') {
      const jobs = JSON.parse(value);
      const latest = jobs[jobs.length - 1];
      if (latest && latest.id) {
         fetch(`${API_BASE}/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latest)
        }).catch(console.error);
      }
    } else if (key === 'ekvueCompanySchedules') {
      const schedules = JSON.parse(value);
      const latest = schedules[schedules.length - 1];
      if (latest && latest.id) {
         fetch(`${API_BASE}/interviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latest)
        }).catch(console.error);
      }
    }
  } catch (e) {
    console.error('MongoDB Background Sync Error:', e);
  }
};

initialSync();
