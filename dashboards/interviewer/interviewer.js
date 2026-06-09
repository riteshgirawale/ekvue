// Dynamic Error Boundary for easier interviewer debugging
window.addEventListener('error', (e) => {
  console.error("EKVUE Interviewer Dashboard Error:", e.error || e.message);
  const debugEl = document.getElementById('interviewer-error-boundary') || document.createElement('div');
  debugEl.id = 'interviewer-error-boundary';
  debugEl.style.cssText = "position:fixed; bottom:15px; right:15px; background:rgba(239,68,68,0.95); color:white; padding:12px 16px; border-radius:10px; z-index:99999; font-size:12.5px; font-family:monospace; max-width:420px; word-break:break-all; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2)";
  
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  debugEl.innerHTML = `<strong>Interviewer Dashboard Error:</strong><br>${esc(e.message)}<br><small style="color:rgba(255,255,255,0.7)">at ${esc(e.filename)}:${e.lineno}</small>`;
  document.body.appendChild(debugEl);
});

import {
  requireAuth,
  clearCurrentUser,
  LS_KEYS,
  loadList,
  saveList,
  uid,
  escapeHtml,
  renderEmptyState,
  normalizeText,
  addNotification
} from '../utils.js';

// Local storage key binders
const SESSION_KEY = LS_KEYS.interviewerItems; // ekvueInterviewerItems
const COMPANY_SCHEDULES_KEY = 'ekvueCompanySchedules'; // sync with recruiters
const QUESTIONS_KEY = 'ekvueInterviewerQuestions';
const SCORECARDS_KEY = 'ekvueInterviewerScorecards';
const COMPANY_JOBS_KEY = 'ekvueCompanyItems';
const THEME_KEY = 'ekvueSelectedTheme';
const PROFILE_KEY = 'ekvueInterviewerProfile';

// Local Centralized State
const state = {
  user: null,
  activeView: 'dashboard',
  sessions: [],
  selectedSessionId: null,
  questions: [],
  selectedQuestionId: null,
  scorecards: [],
  selectedScorecardSessionId: null,
  jobs: [],
  selectedJobId: null,
  profile: {
    name: 'EkVue AI',
    role: 'Staff Software Engineer',
    dep: 'Core Platform Engineering',
    bio: 'Hi, I am EkVue AI! I have been building search architectures at EKVUE for 5 years. I love clean patterns, efficient algorithms, and robust edge-case controls. Looking forward to discussing technical engineering tradeoffs together!'
  },
  selectedTheme: 'default',
  
  // Live Room state
  liveActive: false,
  liveSessionId: null,
  liveTimerIntervalId: null,
  liveTimerSeconds: 0,
  livePaused: false,
  liveNotes: '',
  mockTypingIntervalId: null,
  liveStream: null,

  // Interviewer media state
  interviewerStream: null,
  interviewerCamOn: true,
  interviewerMicOn: true,
  interviewerScreenStream: null
};

// Candidates fetched from MongoDB for datalist and email lookup
let fetchedCandidates = [];

// --- LiveKit Global Object ---
let currentRoom = null;

// ==========================================
// CANONICAL PRE-POPULATION DEMO DATASETS
// ==========================================
const DEFAULT_QUESTIONS = [
  {
    id: 'q_demo_1',
    title: 'Validate Binary Search Tree',
    category: 'Trees',
    difficulty: 'Medium',
    timeLimit: '25 mins',
    description: 'Given the root of a binary tree, determine if it is a valid binary search tree (BST).\nA valid BST is defined as follows:\n- The left subtree of a node contains only nodes with keys less than the node\'s key.\n- The right subtree of a node contains only nodes with keys greater than the node\'s key.\n- Both the left and right subtrees must also be binary search trees.',
    codeTemplate: `function isValidBST(root) {\n  function validate(node, min, max) {\n    if (!node) return true;\n    if ((min !== null && node.val <= min) || (max !== null && node.val >= max)) {\n      return false;\n    }\n    return validate(node.left, min, node.val) && validate(node.right, node.val, max);\n  }\n  return validate(root, null, null);\n}`
  },
  {
    id: 'q_demo_2',
    title: 'Two Sum Map Optimization',
    category: 'Arrays',
    difficulty: 'Easy',
    timeLimit: '15 mins',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    codeTemplate: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}`
  },
  {
    id: 'q_demo_3',
    title: 'LRU Cache Design Strategy',
    category: 'System Design',
    difficulty: 'Hard',
    timeLimit: '40 mins',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) Cache.\nImplement the LRUCache class:\n- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.\n- int get(int key) Return the value of the key if the key exists, otherwise return -1.\n- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity, evict the least recently used key.',
    codeTemplate: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map();\n  }\n  \n  get(key) {\n    if (!this.cache.has(key)) return -1;\n    const val = this.cache.get(key);\n    this.cache.delete(key);\n    this.cache.set(key, val); // refresh order\n    return val;\n  }\n  \n  put(key, value) {\n    if (this.cache.has(key)) {\n      this.cache.delete(key);\n    } else if (this.cache.size >= this.capacity) {\n      const lruKey = this.cache.keys().next().value;\n      this.cache.delete(lruKey);\n    }\n    this.cache.set(key, value);\n  }\n}`
  },
  {
    id: 'q_demo_4',
    title: 'Proactive System Tradeoffs',
    category: 'Behavioral',
    difficulty: 'Medium',
    timeLimit: '15 mins',
    description: 'Ask the candidate to describe a scenario where they disagreed with a peer on technical architecture details.\nLook for:\n- Active listening indicators.\n- Data-driven trade-offs evaluation.\n- Proactive communication alignment.',
    codeTemplate: `// Interviewer Checklist / Expectations:\n// 1. Did candidate demonstrate ownership without friction?\n// 2. How did they evaluate constraints (cost vs. latency vs. time-to-market)?\n// 3. Did they actively suggest incremental milestones to build alignment?`
  }
];

const DEFAULT_SESSIONS = [
  {
    id: 'sess_demo_1',
    candidateName: 'Priya Sharma',
    sessionType: 'Live Coding',
    agenda: 'Trees traversal optimization algorithms & valid BST verification.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    date: new Date(Date.now() + 3600000 * 24).toISOString().split('T')[0],
    time: '14:00',
    status: 'Upcoming',
    notes: ''
  },
  {
    id: 'sess_demo_2',
    candidateName: 'Aarav Mehta',
    sessionType: 'System Design',
    agenda: 'Scale distributed message queue (Kafka architecture overview).',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    date: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0],
    time: '11:00',
    status: 'Feedback Pending',
    notes: 'Candidate completed live system diagram and discussed high-availability. Code cleanliness check completed.'
  }
];

// ==========================================
// CANONICAL STATE LOADER & MERGER
// ==========================================
function ensureRole(user) {
  if (!user || user.role !== 'Interviewer') {
    window.location.href = '../../login/index.html?forceLogin=1';
  }
}

function loadStateFromStorage() {
  state.user = requireAuth();
  if (!state.user || state.user.role !== 'Interviewer') {
    ensureRole(state.user);
    return;
  }

  // Theme
  state.selectedTheme = localStorage.getItem(THEME_KEY) || 'default';
  document.body.setAttribute('data-theme', state.selectedTheme);

  // Profile Load
  const savedProfile = localStorage.getItem(PROFILE_KEY);
  if (savedProfile) {
    try {
      state.profile = JSON.parse(savedProfile);
      // BUG FIX: If logged-in user name is different from profile name, overwrite it to align with current session!
      if (state.user && state.user.name && state.profile.name !== state.user.name) {
        state.profile.name = state.user.name;
        localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));
      }
    } catch {
      // Use fallback
    }
  } else {
    // Try migrating user details from session
    if (state.user) {
      state.profile.name = state.user.name || state.user.fullName || 'EkVue AI';
    }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));
  }

  // Load Sessions (merges interviewer private sessions + recruiter candidate schedules)
  const localSess = loadList(SESSION_KEY);
  const companySchedules = loadList(COMPANY_SCHEDULES_KEY);
  
  const merged = [...localSess];
  companySchedules.forEach((comp) => {
    // recruiter schedules map target Interviewer under fields "interviewer" or "interviewerName"
    const targetIntName = comp.interviewer || comp.interviewerName || '';
    
    // Fuzzy matching algorithm: split names into words and check for overlaps!
    const myName = (state.profile.name || '').trim().toLowerCase();
    const scheduleName = targetIntName.trim().toLowerCase();
    
    const isExactNameMatch = myName === scheduleName && myName !== '';
    const isSubstringMatch = myName !== '' && scheduleName !== '' && (myName.includes(scheduleName) || scheduleName.includes(myName));
    
    const myWords = myName.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
    const schedWords = scheduleName.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
    
    const isNameMatch = isExactNameMatch || isSubstringMatch || (myWords.length > 0 && schedWords.length > 0 && (myWords.some(w => schedWords.includes(w)) || schedWords.some(w => myWords.includes(w))));
    const isEmailMatch = comp.interviewerEmail && state.user && comp.interviewerEmail.toLowerCase() === state.user.email.toLowerCase();
    const isForMe = true; // PROTOTYPE FIX: Show all schedules so any scheduled interview appears in the dashboard
    
    const compCandidate = comp.candidate || comp.candidateName || 'Assigned Candidate';
    if (isForMe && !merged.some((s) => s.id === comp.id)) {
      merged.push({
        id: comp.id || uid('sess'),
        candidateName: comp.candidateName || comp.candidate || 'Assigned Candidate',
        sessionType: comp.sessionType || comp.role || 'Live Coding',
        agenda: comp.agenda || comp.notes || 'Recruiter Schedule Assessment',
        date: comp.date || new Date().toISOString().split('T')[0],
        time: comp.time || '10:00',
        status: comp.status || 'Upcoming',
        notes: comp.notes || ''
      });
    }
  });

  if (merged.length === 0 && localSess.length === 0) {
    saveList(SESSION_KEY, DEFAULT_SESSIONS);
    state.sessions = DEFAULT_SESSIONS;
  } else {
    state.sessions = merged;
  }

  // Load Questions Bank
  const questions = loadList(QUESTIONS_KEY);
  if (questions.length === 0) {
    saveList(QUESTIONS_KEY, DEFAULT_QUESTIONS);
    state.questions = DEFAULT_QUESTIONS;
  } else {
    state.questions = questions;
  }

  // Load Scorecards
  state.scorecards = loadList(SCORECARDS_KEY);

  // Load Active Jobs
  state.jobs = loadList(COMPANY_JOBS_KEY) || [];
}

function saveStateSessions() {
  saveList(SESSION_KEY, state.sessions);
}

function updateCompanyScheduleStatus(meetId, status, notes) {
  try {
    let schedules = JSON.parse(localStorage.getItem(COMPANY_SCHEDULES_KEY) || '[]');
    if (!Array.isArray(schedules)) return;
    const idx = schedules.findIndex(s => s.id === meetId);
    if (idx > -1) {
      schedules[idx].status = status;
      if (notes !== undefined) {
        schedules[idx].notes = notes;
      }
      schedules[idx].lastUpdated = new Date().toISOString();
      localStorage.setItem(COMPANY_SCHEDULES_KEY, JSON.stringify(schedules));
      console.log(`[NetworkSync] Updated recruiter schedule ${meetId} status to ${status}.`);
    }
  } catch (e) {
    console.warn("Failed to update company schedule:", e);
  }
}

// ==========================================
// SPA VIEW SWITCHER
// ==========================================
function switchView(viewId) {
  state.activeView = viewId;

  // Toggle active styling on navigation items
  const menuLinks = document.querySelectorAll('#sidebar-menu a, #top-menu a');
  menuLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.view === viewId);
  });

  // Toggle visible containers
  const containers = document.querySelectorAll('.view-content');
  containers.forEach((box) => {
    box.classList.toggle('active', box.id === `view-${viewId}`);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Hook view render routines — wrapped in try/catch so one failing view
  // never prevents navigation to other views
  try {
    if (viewId === 'dashboard') {
      renderDashboard();
    } else if (viewId === 'sessions') {
      renderSessionsWorkspace();
    } else if (viewId === 'live-interview') {
      renderLiveInterviewView();
    } else if (viewId === 'jobs') {
      renderJobsWorkspace();
    } else if (viewId === 'questions') {
      renderQuestionsWorkspace();
    } else if (viewId === 'scorecards') {
      renderScorecardsWorkspace();
    } else if (viewId === 'reports') {
      renderReportsWorkspace();
    } else if (viewId === 'settings') {
      renderSettings();
    }
  } catch (err) {
    console.error(`[switchView] Error rendering "${viewId}":`, err);
  }
}
window.switchView = switchView;

function bindSpaLinks() {
  console.log('[EKVUE-DEBUG] bindSpaLinks called');
  const links = document.querySelectorAll('#sidebar-menu a, #top-menu a, .action');
  console.log('[EKVUE-DEBUG] Found', links.length, 'navigation links');
  links.forEach((lnk) => {
    lnk.addEventListener('click', (e) => {
      e.preventDefault();
      const view = lnk.dataset.view || lnk.dataset.action;
      console.log('[EKVUE-DEBUG] Nav click → view:', view);
      if (view) {
        switchView(view);
      }
    });
  });
}

// ==========================================
// VIEW 1: MAIN OVERVIEW DASHBOARD
// ==========================================
function renderDashboard() {
  const name = state.profile.name || 'Interviewer';
  const welcomeLine = document.getElementById('welcomeLine');
  if (welcomeLine) welcomeLine.textContent = `Welcome back, ${name}!`;

  const avatar = document.getElementById('avatar');
  if (avatar) avatar.textContent = String(name).trim()[0].toUpperCase();

  const userPill = document.getElementById('userPill');
  if (userPill) userPill.textContent = state.profile.role || 'Interviewer';

  // Compute KPIs
  const sessionsCount = state.sessions.length;
  const upcomingCount = state.sessions.filter(s => s.status === 'Upcoming').length;
  const pendingCount = state.sessions.filter(s => s.status === 'Feedback Pending').length;
  
  // Calculate average of locked scorecards
  const scores = state.scorecards.map(s => parseFloat(s.globalScore || 0)).filter(s => s > 0);
  const avgVal = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  
  setText('kpiSessions', String(sessionsCount));
  setText('kpiUpcoming', String(upcomingCount));
  setText('kpiPending', String(pendingCount));
  setText('kpiAvg', scores.length ? `${avgVal}/5` : '—');

  // Render recent sessions list in dashboard
  const container = document.getElementById('dashboard-sessions-list');
  if (!container) return;

  container.innerHTML = '';

  if (state.sessions.length === 0) {
    renderEmptyState(container, 'No scheduled assessments. Go to Sessions to create one.');
    return;
  }

  // Sort: pending first, then upcoming, then completed
  const sorted = [...state.sessions].sort((a, b) => {
    const getWeight = (status) => {
      if (status === 'Feedback Pending') return 1;
      if (status === 'Upcoming') return 2;
      return 3;
    };
    return getWeight(a.status) - getWeight(b.status);
  });

  sorted.slice(0, 5).forEach((sess) => {
    const el = document.createElement('div');
    el.className = 'item';
    
    let statusClass = 'easy'; // default green
    if (sess.status === 'Feedback Pending') statusClass = 'medium'; // yellow
    if (sess.status === 'Upcoming') statusClass = 'hard'; // red/blue

    el.innerHTML = `
      <div class="title">
        <strong>${escapeHtml(sess.candidateName)}</strong>
        <span>Type: ${escapeHtml(sess.sessionType)} | ${escapeHtml(sess.date)} (${escapeHtml(sess.time)})</span>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="badge ${statusClass}">${escapeHtml(sess.status)}</span>
        <button class="btn small primary" id="dash-action-${sess.id}">Manage</button>
      </div>
    `;

    container.appendChild(el);

    const btn = el.querySelector(`#dash-action-${sess.id}`);
    if (btn) {
      btn.addEventListener('click', () => {
        state.selectedSessionId = sess.id;
        switchView('sessions');
      });
    }
  });
}

// ==========================================
// VIEW 2: SESSIONS & LIVE INTERVIEW ROOM
// ==========================================
function renderSessionsWorkspace() {
  renderSessionsSidebar();
  renderSessionDetails();
}


function renderSessionsSidebar() {
  const container = document.getElementById('sessions-sidebar-list');
  if (!container) return;

  container.innerHTML = '';

  const searchVal = document.getElementById('session-search')?.value?.toLowerCase() ?? '';
  const filterVal = document.getElementById('session-filter-status')?.value ?? 'all';

  const filtered = state.sessions.filter((sess) => {
    const matchesSearch = sess.candidateName.toLowerCase().includes(searchVal);
    const matchesStatus = filterVal === 'all' || sess.status === filterVal;
    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; font-size:12px; color:var(--muted)">No sessions found</div>`;
    return;
  }

  filtered.forEach((sess) => {
    const card = document.createElement('div');
    card.className = `workspace-problem-item ${state.selectedSessionId === sess.id ? 'active' : ''}`;
    
    let statusColor = '#34d399'; // green
    if (sess.status === 'Feedback Pending') statusColor = '#fbbf24'; // yellow
    if (sess.status === 'Completed') statusColor = '#94a3b8'; // gray

    card.innerHTML = `
      <div class="top">
        <span class="p-title">${escapeHtml(sess.candidateName)}</span>
        <span style="font-size:10px; color:${statusColor}; font-weight:800;">● ${escapeHtml(sess.status)}</span>
      </div>
      <div class="p-meta">
        ${escapeHtml(sess.sessionType)} | ${escapeHtml(sess.date)}
      </div>
    `;

    card.addEventListener('click', () => {
      state.selectedSessionId = sess.id;
      // Close Live room if switching sessions
      exitLiveRoom();
      renderSessionsWorkspace();
    });

    container.appendChild(card);
  });
}

function renderSessionDetails() {
  const detailsPanel = document.getElementById('session-details-panel');
  const detailsContent = document.getElementById('session-details-content');
  const placeholder = document.getElementById('session-selected-placeholder');
  
  if (!detailsPanel || !detailsContent || !placeholder) return;

  const current = state.sessions.find(s => s.id === state.selectedSessionId);

  if (!current) {
    placeholder.style.display = 'block';
    detailsContent.style.display = 'none';
    return;
  }

  placeholder.style.display = 'none';
  detailsContent.style.display = 'block';

  let statusBadgeColor = 'hard';
  if (current.status === 'Feedback Pending') statusBadgeColor = 'medium';
  if (current.status === 'Completed') statusBadgeColor = 'easy';

  detailsContent.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:14px;">
      <div>
        <h2 style="font-size:18px; margin:0 0 4px 0; color:white">${escapeHtml(current.candidateName)}</h2>
        <div class="muted">Scheduled: ${escapeHtml(current.date)} at ${escapeHtml(current.time)}</div>
      </div>
      <span class="badge ${statusBadgeColor}">${escapeHtml(current.status)}</span>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
      <div class="card" style="padding:12px; background:rgba(255,255,255,0.02)">
        <small style="color:var(--muted); font-weight:800">Assessment Type</small>
        <p style="margin:4px 0 0 0; font-size:14px; font-weight:800; color:white">${escapeHtml(current.sessionType)}</p>
      </div>
      <div class="card" style="padding:12px; background:rgba(255,255,255,0.02)">
        <small style="color:var(--muted); font-weight:800">Assigned Interviewer</small>
        <p style="margin:4px 0 0 0; font-size:14px; font-weight:800; color:white">${escapeHtml(state.profile.name)}</p>
      </div>
    </div>

    <div style="margin-bottom:14px;">
      <small style="color:var(--muted); font-weight:800">Agenda & Instructions</small>
      <div style="margin-top:6px; padding:10px; background:rgba(2,6,23,0.3); border:1px solid var(--border); border-radius:10px; font-size:13px; line-height:1.4">
        ${current.agenda ? escapeHtml(current.agenda).replaceAll('\n', '<br>') : 'No instructions added.'}
      </div>
    </div>

    ${current.notes ? `
    <div style="margin-bottom:14px;">
      <small style="color:var(--muted); font-weight:800">Interviewer Notes</small>
      <div style="margin-top:6px; padding:10px; background:rgba(2,6,23,0.3); border:1px solid var(--border); border-radius:10px; font-size:12.5px; font-family:monospace; line-height:1.4; color:#a7f3d0">
        ${escapeHtml(current.notes)}
      </div>
    </div>` : ''}

    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:14px; margin-top:14px;">
      <button class="btn" style="border-color:rgba(239, 68, 68, 0.3); background:rgba(239, 68, 68, 0.05); color:#fecaca;" id="session-delete-btn">Cancel Assessment</button>
      
      <div style="display:flex; gap:10px;">
        ${current.status === 'Completed' ? 
          `<button class="btn" id="session-scorecard-view-btn">View Report</button>` : 
          current.status === 'Feedback Pending' ? 
            `<button class="btn primary" id="session-scorecard-grade-btn">Fill Scorecard</button>` : 
            `<button class="btn primary" id="session-start-live-btn" style="background:linear-gradient(90deg, #10b981, #059669); border-color:rgba(16,185,129,0.3)">Start Live Room</button>`
        }
      </div>
    </div>
  `;

  // Bind Actions
  const delBtn = detailsContent.querySelector('#session-delete-btn');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      if (confirm(`Are you sure you want to cancel the assessment for ${current.candidateName}?`)) {
        state.sessions = state.sessions.filter(s => s.id !== current.id);
        saveStateSessions();
        state.selectedSessionId = null;
        renderSessionsWorkspace();
        renderDashboard();
      }
    });
  }

  const startBtn = detailsContent.querySelector('#session-start-live-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      enterLiveRoom(current);
    });
  }

  const gradeBtn = detailsContent.querySelector('#session-scorecard-grade-btn');
  if (gradeBtn) {
    gradeBtn.addEventListener('click', () => {
      state.selectedScorecardSessionId = current.id;
      switchView('scorecards');
    });
  }

  const reportBtn = detailsContent.querySelector('#session-scorecard-view-btn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      switchView('reports');
    });
  }
}

// ==========================================
// VIEW 2C: LIVE INTERVIEW ROOM SIMULATOR
// ==========================================
// ==========================================
// VIEW 2C: LIVE INTERVIEW ROOM SIMULATOR (LIVE SYNC)
// ==========================================
function lookupCandidateEmail(name) {
  // 1. Check candidates fetched from MongoDB first
  if (fetchedCandidates.length > 0) {
    const matched = fetchedCandidates.find(a => (a.name || a.fullName || '').toLowerCase() === name.toLowerCase());
    if (matched && matched.email) return matched.email;
  }

  // 2. Check localStorage accounts
  try {
    const accounts = loadList('ekvueAccounts');
    const matched = accounts.find(a => (a.name || a.fullName || '').toLowerCase() === name.toLowerCase() && a.role === 'Candidate');
    if (matched) return matched.email;
  } catch (e) {
    // ignore
  }

  // 3. Fallback
  return `${name.toLowerCase().replace(/\s+/g, '')}@example.com`;
}

function renderLiveInterviewView() {
  const lobbyPanel = document.getElementById('live-interview-lobby-panel');
  const simPanel = document.getElementById('session-live-simulator-panel');
  
  if (!lobbyPanel || !simPanel) return;

  if (state.liveActive) {
    lobbyPanel.style.display = 'none';
    simPanel.style.display = 'flex';
  } else {
    lobbyPanel.style.display = 'block';
    simPanel.style.display = 'none';
    
    // Render list of upcoming sessions in the lobby
    const container = document.getElementById('live-lobby-sessions-list');
    if (!container) return;

    container.innerHTML = '';
    const upcoming = state.sessions.filter(s => s.status === 'Upcoming');

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:20px 16px; color:var(--muted); font-size:13px; border:1px dashed var(--border); border-radius:12px; background:rgba(2, 6, 23, 0.2); margin-bottom: 14px;">
          <span style="font-size:24px; display:block; margin-bottom:6px;">🎙️</span>
          No upcoming scheduled candidate sessions found. 
          <br>Schedule a quick interview below or click Sessions to plan detailed slots.
        </div>
        
        <!-- Quick Schedule Form inside Lobby -->
        <div class="card" style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:12px;">
          <h3 style="margin:0 0 12px 0; font-size:13.5px; color:white; font-weight:800;">Quick Schedule & Launch</h3>
          <form id="lobbyQuickScheduleForm" style="display:grid; grid-template-columns: 1fr 1fr auto; gap:12px; align-items:end;">
            <div class="field" style="margin:0;">
              <label style="font-size:10px; margin-bottom:4px; display:block; color:var(--muted); font-weight:700;">Candidate Name</label>
              <input id="lobbyQuickName" placeholder="e.g. Priya Sharma" list="registered-candidates-datalist" required style="background:rgba(2, 6, 23, 0.4); border:1px solid var(--border); border-radius:6px; color:white; padding:8px 10px; font-size:12px; width:100%; box-sizing:border-box; outline:none;" />
            </div>
            <div class="field" style="margin:0;">
              <label style="font-size:10px; margin-bottom:4px; display:block; color:var(--muted); font-weight:700;">Assessment Type</label>
              <select id="lobbyQuickType" style="background:rgba(2, 6, 23, 0.4); border:1px solid var(--border); border-radius:6px; color:white; padding:8px 10px; font-size:12px; width:100%; box-sizing:border-box; outline:none; height:34px;">
                <option value="Live Coding">Live Coding Round</option>
                <option value="System Design">System Design Review</option>
                <option value="Technical Interview">General Interview</option>
              </select>
            </div>
            <button class="btn primary" type="submit" style="padding:8px 16px; font-size:11.5px; font-weight:800; height:34px; border-radius:6px; margin:0;">Schedule & Launch</button>
          </form>
        </div>
      `;

      // Bind quick schedule submit event
      const quickForm = document.getElementById('lobbyQuickScheduleForm');
      if (quickForm) {
        quickForm.onsubmit = (e) => {
          e.preventDefault();
          const nameInput = document.getElementById('lobbyQuickName');
          const typeSelect = document.getElementById('lobbyQuickType');
          
          const candidateName = nameInput?.value.trim() || '';
          const sessionType = typeSelect?.value || 'Live Coding';

          if (!candidateName) return;

          const candidateEmail = lookupCandidateEmail(candidateName);
          const newSess = {
            id: uid('sess'),
            candidateName,
            candidateEmail,
            sessionType,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0].substring(0, 5),
            agenda: `Quick scheduled ${sessionType} round.`,
            status: 'Upcoming',
            notes: '',
            createdAt: new Date().toISOString()
          };

          state.sessions.push(newSess);
          saveStateSessions();

          // Immediately enter live room with the new session!
          enterLiveRoom(newSess);
          renderDashboard(); // refresh stats
        };
      }
      return;
    }

    upcoming.forEach((sess) => {
      const row = document.createElement('div');
      row.className = 'item';
      row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid var(--border); border-radius:10px; background:rgba(255,255,255,0.01);";
      row.innerHTML = `
        <div>
          <strong style="color:white; font-size:14px;">${escapeHtml(sess.candidateName)}</strong>
          <div class="muted" style="font-size:11.5px; margin-top:2px;">Round: ${escapeHtml(sess.sessionType)} | Scheduled: ${escapeHtml(sess.date)} (${escapeHtml(sess.time)})</div>
        </div>
        <button class="btn primary small" id="launch-lobby-sess-${sess.id}" style="background:linear-gradient(90deg, #10b981, #059669); border-color:rgba(16,185,129,0.3); font-weight:800; font-size:11.5px; padding:6px 14px;">Launch Live Room</button>
      `;
      container.appendChild(row);

      const btn = row.querySelector(`#launch-lobby-sess-${sess.id}`);
      if (btn) {
        btn.onclick = () => {
          enterLiveRoom(sess);
        };
      }
    });
  }
}

function enterLiveRoom(session) {
  state.liveActive = true;
  state.liveSessionId = session.id;
  state.livePaused = false;
  state.liveTimerSeconds = 0;
  state.liveNotes = session.notes || '';
  state.chatLogsLength = 0;
  state.lastRenderedCode = null;

  // Switch view to dedicated live-interview instantly
  switchView('live-interview');

  // Setup DOM Visibility
  document.getElementById('live-interview-lobby-panel').style.display = 'none';
  document.getElementById('session-live-simulator-panel').style.display = 'flex';

  // Setup Candidates names
  const liveLabelEl = document.getElementById('liveCandidateLabel');
  if (liveLabelEl) liveLabelEl.textContent = `${session.candidateName} Stream`;
  const liveAvatarEl = document.getElementById('liveCandidateAvatar');
  if (liveAvatarEl) liveAvatarEl.textContent = String(session.candidateName).trim()[0].toUpperCase();
  const hostAvatarEl = document.getElementById('liveHostAvatar');
  if (hostAvatarEl) hostAvatarEl.textContent = String(state.profile.name).trim()[0].toUpperCase();

  // Load Notes
  document.getElementById('liveNotesInput').value = state.liveNotes;

  // Setup Session Info dynamically based on selected session type
  const roleVal = document.getElementById('info-val-role');
  if (roleVal) {
    roleVal.textContent = session.sessionType === 'Live Coding' ? 'Frontend Developer' : 
                         session.sessionType === 'System Design' ? 'System Architect' : 'Software Engineer';
  }

  const roundVal = document.getElementById('info-val-round');
  if (roundVal) {
    roundVal.textContent = session.sessionType || 'Technical Interview';
  }

  // Clear typing interval if any
  if (state.mockTypingIntervalId) clearInterval(state.mockTypingIntervalId);

  // Setup Question selector drop-down
  const selector = document.getElementById('liveRoomQuestionSelector');
  if (selector) {
    selector.innerHTML = `<option value="">-- Push Technical Question --</option>`;
    state.questions.forEach((q) => {
      selector.innerHTML += `<option value="${q.id}">${escapeHtml(q.title)} (${escapeHtml(q.category)})</option>`;
    });
    selector.value = '';
    
    // Bind change event
    selector.onchange = () => {
      pushQuestionToIde(selector.value);
    };
  }

  // Load IDE with starting monitor placeholder
  const ideBody = document.getElementById('liveIdeBody');
  if (ideBody) {
    ideBody.innerHTML = `<pre style="color:#64748b">// Waiting for interviewer to push a technical challenge from the dropdown above...\n// Webcam feeds are securely streaming below standard audio frequencies...</pre>`;
  }

  // Reset live chat feed
  const chatFeed = document.getElementById('liveChatFeed');
  if (chatFeed) {
    chatFeed.innerHTML = `<p style="color:var(--muted); font-style:italic; margin:0;">Waiting for candidate to connect...</p>`;
  }

  // Create Handshake meeting in localStorage
  const cEmail = session.candidateEmail || lookupCandidateEmail(session.candidateName);
  let meetings = [];
  try {
    const raw = localStorage.getItem('ekvueLiveInterviews');
    meetings = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(meetings)) meetings = [];
  } catch {
    meetings = [];
  }

  // Write new handshake session details (reinitializes call state)
  const handshakeRecord = {
    meetingId: session.id,
    candidateName: session.candidateName,
    candidateEmail: cEmail,
    interviewerName: state.profile.name,
    interviewerEmail: state.user ? state.user.email : '',
    status: "Launched",
    date: session.date,
    time: session.time,
    proctorTelemetry: {
      gazePct: 100,
      stabilityPct: 100,
      movementAlerts: 0,
      status: "Scanning..."
    },
    chatLogs: [
      {
        sender: "interviewer",
        text: `Hi ${session.candidateName}! I'm EkVue AI. Welcome to your live technical assessment round. I'll be assessing your engineering capabilities today. To kick off, please introduce yourself and outline any recent complex engineering trade-offs you balanced.`
      }
    ],
    editorCode: "",
    pushedChallenge: null,
    lastUpdated: new Date().toISOString()
  };

  const existingIndex = meetings.findIndex(m => m.meetingId === session.id);
  if (existingIndex > -1) {
    meetings[existingIndex] = handshakeRecord;
  } else {
    meetings.push(handshakeRecord);
  }
  localStorage.setItem('ekvueLiveInterviews', JSON.stringify(meetings));

  // Sync to backend server for cross-browser/cross-laptop live interview handshake
  try {
    fetch('/api/live-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(handshakeRecord)
    }).catch(err => console.warn('[LiveSync] Failed to post meeting to backend:', err));
  } catch(e) { console.warn('[LiveSync] Post error:', e); }

  // Start Clock and sync loops
  startLiveRoomTimer();
  runLiveProctorSyncLoop();

  // Initialize interviewer's camera/mic controls and start self-view
  setupInterviewerMediaControls();
  startInterviewerMedia();

  // Set interviewer avatar initial in PiP
  const selfAvatar = document.getElementById('interviewer-self-avatar');
  if (selfAvatar) {
    selfAvatar.textContent = String(state.profile.name || 'I').trim()[0].toUpperCase();
  }
}

function exitLiveRoom() {
  state.liveActive = false;
  if (state.liveTimerIntervalId) clearInterval(state.liveTimerIntervalId);
  if (state.mockTypingIntervalId) clearInterval(state.mockTypingIntervalId);
  if (state.liveSyncIntervalId) clearInterval(state.liveSyncIntervalId);

  // Reset focus view layout mode
  const grid = document.querySelector('.proctor-workspace-grid');
  if (grid) grid.classList.remove('focus-mode');
  const layoutBtn = document.getElementById('interviewer-layout-toggle-btn');
  if (layoutBtn) {
    layoutBtn.textContent = '🖥️ Focus View';
    layoutBtn.style.background = 'rgba(255, 255, 255, 0.05)';
    layoutBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  }
  const consolePanel = document.getElementById('interviewer-console-panel');
  if (consolePanel) consolePanel.style.display = 'none';

  // Cleanup live webcam stream if active
  if (state.liveStream) {
    state.liveStream.getTracks().forEach(track => track.stop());
    state.liveStream = null;
  }
  
  if (currentRoom) {
    try {
      currentRoom.disconnect();
    } catch(e){}
    currentRoom = null;
  }

  // Cleanup interviewer's own camera/mic stream
  stopInterviewerMedia();

  // Redraw Candidate Interview Lobby
  renderLiveInterviewView();
}

// ==========================================
// INTERVIEWER MEDIA CONTROLS (Camera/Mic/Screen)
// ==========================================

async function startInterviewerMedia() {
  const video = document.getElementById('interviewer-self-video');
  const avatar = document.getElementById('interviewer-self-avatar');
  const initials = String(state.profile.name || 'I').trim()[0].toUpperCase();

  state.cameraInitialized = false;

  // Try video + audio first
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    state.interviewerStream = stream;
    state.interviewerCamOn = true;
    state.interviewerMicOn = true;

    if (video) {
      video.srcObject = stream;
      video.style.display = 'block';
    }
    if (avatar) avatar.style.display = 'none';
    updateMediaButtonStates();
    state.cameraInitialized = true;
    return;
  } catch (err) {
    console.warn('Video+Audio failed, trying fallbacks:', err.message);
  }

  // Fallback: try video only
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    state.interviewerStream = stream;
    state.interviewerCamOn = true;
    state.interviewerMicOn = false;

    if (video) {
      video.srcObject = stream;
      video.style.display = 'block';
    }
    if (avatar) avatar.style.display = 'none';
    updateMediaButtonStates();
    state.cameraInitialized = true;
    return;
  } catch (err) {
    console.warn('Video-only also failed, trying audio only:', err.message);
  }

  // Fallback: try audio only
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.interviewerStream = stream;
    state.interviewerCamOn = false;
    state.interviewerMicOn = true;

    if (avatar) {
      avatar.textContent = initials;
      avatar.style.display = 'flex';
    }
    if (video) video.style.display = 'none';
    updateMediaButtonStates();
    state.cameraInitialized = true;
    return;
  } catch (err) {
    console.warn('All media requests failed:', err.message);
  }

  // Complete fallback: no media available
  state.interviewerCamOn = false;
  state.interviewerMicOn = false;
  if (avatar) {
    avatar.textContent = initials;
    avatar.style.display = 'flex';
  }
  if (video) video.style.display = 'none';
  updateMediaButtonStates();
  state.cameraInitialized = true;
}

function stopInterviewerMedia() {
  if (state.interviewerStream) {
    state.interviewerStream.getTracks().forEach(track => track.stop());
    state.interviewerStream = null;
  }
  if (state.interviewerScreenStream) {
    state.interviewerScreenStream.getTracks().forEach(track => track.stop());
    state.interviewerScreenStream = null;
  }
  state.interviewerCamOn = false;
  state.interviewerMicOn = false;

  const video = document.getElementById('interviewer-self-video');
  if (video) {
    video.srcObject = null;
    video.style.display = 'none';
  }
  const avatar = document.getElementById('interviewer-self-avatar');
  if (avatar) avatar.style.display = 'flex';
}

function toggleInterviewerCamera() {
  if (!state.interviewerStream) {
    // If no stream yet, start one
    startInterviewerMedia();
    return;
  }

  const videoTracks = state.interviewerStream.getVideoTracks();
  if (videoTracks.length === 0) return;

  state.interviewerCamOn = !state.interviewerCamOn;
  videoTracks.forEach(track => { track.enabled = state.interviewerCamOn; });

  const video = document.getElementById('interviewer-self-video');
  const avatar = document.getElementById('interviewer-self-avatar');
  if (video && avatar) {
    if (state.interviewerCamOn) {
      video.style.display = 'block';
      avatar.style.display = 'none';
      if (currentRoom) currentRoom.localParticipant.setCameraEnabled(true);
    } else {
      video.style.display = 'none';
      avatar.style.display = 'flex';
      if (currentRoom) currentRoom.localParticipant.setCameraEnabled(false);
    }
  }

  updateMediaButtonStates();
}

function toggleInterviewerMic() {
  if (!state.interviewerStream) {
    startInterviewerMedia();
    return;
  }

  const audioTracks = state.interviewerStream.getAudioTracks();
  
  if (audioTracks.length === 0) {
    // No audio tracks — try to acquire audio permission and add it
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(audioStream => {
        const audioTrack = audioStream.getAudioTracks()[0];
        if (audioTrack) {
          state.interviewerStream.addTrack(audioTrack);
          state.interviewerMicOn = true;
          updateMediaButtonStates();
        }
      })
      .catch(err => {
        console.warn('Could not acquire microphone:', err.message);
      });
    return;
  }

  state.interviewerMicOn = !state.interviewerMicOn;
  audioTracks.forEach(track => { track.enabled = state.interviewerMicOn; });
  if (currentRoom) {
    currentRoom.localParticipant.setMicrophoneEnabled(state.interviewerMicOn);
  }

  updateMediaButtonStates();
}

async function toggleInterviewerScreen() {
  if (state.interviewerScreenStream) {
    // Stop screen share
    state.interviewerScreenStream.getTracks().forEach(track => track.stop());
    state.interviewerScreenStream = null;
    if (currentRoom) currentRoom.localParticipant.setScreenShareEnabled(false);

    // Restore camera to PiP if cam was on
    const video = document.getElementById('interviewer-self-video');
    if (video && state.interviewerStream) {
      video.srcObject = state.interviewerStream;
      if (state.interviewerCamOn) video.style.display = 'block';
    }
    updateMediaButtonStates();
    return;
  }

  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    state.interviewerScreenStream = screenStream;
    if (currentRoom) currentRoom.localParticipant.setScreenShareEnabled(true);

    // Show screen share in the PiP window
    const video = document.getElementById('interviewer-self-video');
    const avatar = document.getElementById('interviewer-self-avatar');
    if (video) {
      video.srcObject = screenStream;
      video.style.display = 'block';
      video.style.transform = 'none'; // Don't mirror screen share
    }
    if (avatar) avatar.style.display = 'none';

    // When user stops sharing via browser UI
    screenStream.getVideoTracks()[0].addEventListener('ended', () => {
      state.interviewerScreenStream = null;
      if (currentRoom) currentRoom.localParticipant.setScreenShareEnabled(false);
      const vid = document.getElementById('interviewer-self-video');
      if (vid && state.interviewerStream) {
        vid.srcObject = state.interviewerStream;
        vid.style.transform = 'scaleX(-1)';
        if (state.interviewerCamOn) {
          vid.style.display = 'block';
        } else {
          vid.style.display = 'none';
          const av = document.getElementById('interviewer-self-avatar');
          if (av) av.style.display = 'flex';
        }
      }
      updateMediaButtonStates();
    });

    updateMediaButtonStates();
  } catch (err) {
    console.warn('Screen share cancelled or failed:', err.message);
  }
}

function updateMediaButtonStates() {
  const micBtn = document.getElementById('interviewerMicBtn');
  const camBtn = document.getElementById('interviewerCamBtn');
  const screenBtn = document.getElementById('interviewerScreenBtn');
  const micIndicator = document.getElementById('interviewer-mic-indicator');

  if (micBtn) {
    if (state.interviewerMicOn) {
      micBtn.innerHTML = '🎙️';
      micBtn.style.background = 'rgba(16,185,129,0.12)';
      micBtn.style.borderColor = 'rgba(16,185,129,0.4)';
      micBtn.title = 'Mute Microphone';
    } else {
      micBtn.innerHTML = '🔇';
      micBtn.style.background = 'rgba(239,68,68,0.15)';
      micBtn.style.borderColor = 'rgba(239,68,68,0.4)';
      micBtn.title = 'Unmute Microphone';
    }
  }

  if (camBtn) {
    if (state.interviewerCamOn) {
      camBtn.innerHTML = '📹';
      camBtn.style.background = 'rgba(99,102,241,0.12)';
      camBtn.style.borderColor = 'rgba(99,102,241,0.4)';
      camBtn.title = 'Turn Off Camera';
    } else {
      camBtn.innerHTML = '📷';
      camBtn.style.background = 'rgba(239,68,68,0.15)';
      camBtn.style.borderColor = 'rgba(239,68,68,0.4)';
      camBtn.title = 'Turn On Camera';
    }
  }

  if (screenBtn) {
    if (state.interviewerScreenStream) {
      screenBtn.innerHTML = '⏹️';
      screenBtn.style.background = 'rgba(251,191,36,0.2)';
      screenBtn.style.borderColor = 'rgba(251,191,36,0.5)';
      screenBtn.title = 'Stop Screen Share';
    } else {
      screenBtn.innerHTML = '🖥️';
      screenBtn.style.background = 'rgba(251,191,36,0.08)';
      screenBtn.style.borderColor = 'rgba(251,191,36,0.3)';
      screenBtn.title = 'Share Screen';
    }
  }

  // Update PiP mic indicator
  if (micIndicator) {
    if (state.interviewerMicOn) {
      micIndicator.style.background = 'rgba(16,185,129,0.2)';
      micIndicator.style.borderColor = 'rgba(16,185,129,0.4)';
      micIndicator.querySelector('span').textContent = '🎙️';
    } else {
      micIndicator.style.background = 'rgba(239,68,68,0.2)';
      micIndicator.style.borderColor = 'rgba(239,68,68,0.4)';
      micIndicator.querySelector('span').textContent = '🔇';
    }
  }
}

function setupInterviewerMediaControls() {
  const micBtn = document.getElementById('interviewerMicBtn');
  const camBtn = document.getElementById('interviewerCamBtn');
  const screenBtn = document.getElementById('interviewerScreenBtn');

  if (micBtn) {
    micBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleInterviewerMic();
    });
  }

  if (camBtn) {
    camBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleInterviewerCamera();
    });
  }

  if (screenBtn) {
    screenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleInterviewerScreen();
    });
  }

  // Make PiP draggable
  setupPipDrag();
}

function setupPipDrag() {
  const pip = document.getElementById('interviewer-pip-container');
  if (!pip) return;

  let isDragging = false;
  let startX, startY, startLeft, startTop;

  pip.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('pip-resize-handle')) return;
    isDragging = true;
    const parent = pip.parentElement;
    const rect = pip.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left - parentRect.left;
    startTop = rect.top - parentRect.top;
    pip.style.position = 'absolute';
    pip.style.transition = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    pip.style.left = (startLeft + dx) + 'px';
    pip.style.top = (startTop + dy) + 'px';
    pip.style.right = 'auto';
    pip.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      pip.style.transition = 'box-shadow 0.3s ease';
    }
  });
}

function startLiveRoomTimer() {
  const timerEl = document.getElementById('liveRoomTimer');
  state.liveTimerSeconds = 0;
  if (state.liveTimerIntervalId) clearInterval(state.liveTimerIntervalId);

  state.liveTimerIntervalId = setInterval(() => {
    if (state.livePaused) return;
    state.liveTimerSeconds++;
    const mins = String(Math.floor(state.liveTimerSeconds / 60)).padStart(2, '0');
    const secs = String(state.liveTimerSeconds % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

function pushQuestionToIde(qId) {
  const ideBody = document.getElementById('liveIdeBody');
  const ideStatus = document.getElementById('liveIdeStatus');
  if (!ideBody) return;

  const question = state.questions.find(q => q.id === qId);
  if (!question) {
    // Clear in shared record too
    let meetings = [];
    try {
      const raw = localStorage.getItem('ekvueLiveInterviews');
      meetings = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(meetings)) meetings = [];
    } catch {}
    const meeting = meetings.find(m => m.meetingId === state.liveSessionId);
    if (meeting) {
      meeting.pushedChallenge = null;
      meeting.lastUpdated = new Date().toISOString();
      localStorage.setItem('ekvueLiveInterviews', JSON.stringify(meetings));
    }
    ideBody.innerHTML = `<pre style="color:#64748b">// Monitor cleared. Push a challenge to monitor candidate...</pre>`;
    return;
  }

  // Update shared meeting record with pushed challenge details
  let meetings = [];
  try {
    const raw = localStorage.getItem('ekvueLiveInterviews');
    meetings = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(meetings)) meetings = [];
  } catch {}

  const meeting = meetings.find(m => m.meetingId === state.liveSessionId);
  if (meeting) {
    meeting.pushedChallenge = {
      id: question.id,
      title: question.title,
      category: question.category,
      difficulty: question.difficulty,
      desc: question.description,
      template: question.codeTemplate
    };
    meeting.lastUpdated = new Date().toISOString();
    localStorage.setItem('ekvueLiveInterviews', JSON.stringify(meetings));
  }

  if (ideStatus) {
    ideStatus.textContent = '● Pushing challenge...';
    ideStatus.style.color = '#fbbf24';
  }

  if (ideBody) {
    ideBody.innerHTML = `<pre style="color:#fbbf24">// Pushing challenge: ${escapeHtml(question.title)}...\n// Establishing candidate code editor handshake...</pre>`;
  }
}

function runLiveProctorSyncLoop() {
  if (!state.liveActive) return;

  // Ensure waiting overlay in DOM (appended directly inside liveCandidateWebcamFrame)
  const candidateFrame = document.getElementById('liveCandidateWebcamFrame');
  let waitingOverlay = document.getElementById('liveCandidateWaitingOverlay');
  if (candidateFrame && !waitingOverlay) {
    waitingOverlay = document.createElement('div');
    waitingOverlay.id = 'liveCandidateWaitingOverlay';
    waitingOverlay.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; background:#09090b; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:12px; z-index:20; color:#94a3b8; font-size:12.5px; border-radius:14px;";
    waitingOverlay.innerHTML = `
      <span class="webcam-dot" style="width:12px; height:12px; background:#f59e0b; box-shadow:0 0 10px #f59e0b; animation:pulseNeon 1s infinite alternate;"></span>
      <strong>Waiting for candidate connection...</strong>
      <span style="font-size:10.5px; color:#64748b;">Invite matches candidate registration email.</span>
    `;
    candidateFrame.appendChild(waitingOverlay);
  }

  // Ensure real-time telemetry HUD overlay
  let hud = document.getElementById('liveTelemetryHUD');
  if (candidateFrame && !hud) {
    hud = document.createElement('div');
    hud.id = 'liveTelemetryHUD';
    hud.style.cssText = "position:absolute; bottom:8px; right:8px; background:rgba(2, 6, 23, 0.85); border:1px solid rgba(16, 185, 129, 0.25); border-radius:6px; padding:4px 8px; font-size:10px; font-family:monospace; color:#10b981; display:flex; flex-direction:column; gap:2px; z-index:15; display:none;";
    hud.innerHTML = `
      <div>Focus: <span id="hudGaze">100%</span></div>
      <div>Stability: <span id="hudStability">100%</span></div>
      <div>Alerts: <span id="hudAlerts">0</span></div>
    `;
    candidateFrame.appendChild(hud);
  }

  if (state.liveSyncIntervalId) clearInterval(state.liveSyncIntervalId);

  let isLiveSyncing = false;
  state.liveSyncIntervalId = setInterval(async () => {
    if (!state.liveActive) {
      clearInterval(state.liveSyncIntervalId);
      return;
    }
    if (isLiveSyncing) return;
    isLiveSyncing = true;
    try {

    // Read meetings
    let meetings = [];
    try {
      const raw = localStorage.getItem('ekvueLiveInterviews');
      meetings = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(meetings)) meetings = [];
    } catch {
      meetings = [];
    }

    let meeting = meetings.find(m => m.meetingId === state.liveSessionId);
    if (!meeting) return;

    // --- FETCH FROM BACKEND (Cross-Browser Sync) ---
    try {
      const res = await fetch(`/api/live-meeting/${state.liveSessionId}`);
      if (res.ok) {
        const serverMeeting = await res.json();
        if (new Date(serverMeeting.lastUpdated) > new Date(meeting.lastUpdated || 0)) {
          // Merge server state into local state
          meeting = { ...meeting, ...serverMeeting };
          const idx = meetings.findIndex(m => m.meetingId === state.liveSessionId);
          meetings[idx] = meeting;
          localStorage.setItem('ekvueLiveInterviews', JSON.stringify(meetings));
        }
      }
    } catch (e) { /* silently continue offline */ }

    // Check if the candidate has completed/ended the interview!
    if (meeting.status === 'Completed') {
      clearInterval(state.liveSyncIntervalId);

      const current = state.sessions.find(s => s.id === state.liveSessionId);
      if (current && current.status !== 'Completed') {
        current.status = 'Feedback Pending';
        const notesInput = document.getElementById('liveNotesInput');
        current.notes = notesInput ? notesInput.value : state.liveNotes;
        saveStateSessions();
        updateCompanyScheduleStatus(current.id, 'Feedback Pending', current.notes);
      }

      const finishedSessionId = state.liveSessionId;
      exitLiveRoom();

      alert(`Candidate has ended the interview call. Transitioning to Scorecard evaluation page.`);

      state.selectedScorecardSessionId = finishedSessionId;
      switchView('scorecards');
      renderDashboard();
      return;
    }

    // Write real-time interviewer heartbeat to handshake record
    meeting.lastUpdated = new Date().toISOString();
    localStorage.setItem('ekvueLiveInterviews', JSON.stringify(meetings));

    // Sync heartbeat and full state to backend for cross-laptop candidate detection
    try {
      fetch('/api/live-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meeting)
      }).catch(() => {});
    } catch(e) {}

    // Check candidate connection status
    if (meeting.status === 'Active') {
      if (waitingOverlay) waitingOverlay.style.display = 'none';
      if (hud) hud.style.display = 'flex';

      // --- LiveKit Integration ---
      const localVideoContainer = document.getElementById('local-video');
      const remoteVideosContainer = document.getElementById('remote-videos');
      
      if (localVideoContainer && typeof LiveKit !== 'undefined' && !currentRoom) {
        initLiveKitRoom(state.liveSessionId);
      }

      // Stream proctor metrics to HUD
      if (meeting.proctorTelemetry) {
        const gaze = meeting.proctorTelemetry.gazePct !== undefined ? meeting.proctorTelemetry.gazePct : 100;
        const stability = meeting.proctorTelemetry.stabilityPct !== undefined ? meeting.proctorTelemetry.stabilityPct : 100;
        const alerts = meeting.proctorTelemetry.movementAlerts !== undefined ? meeting.proctorTelemetry.movementAlerts : 0;
        
        const gLabel = document.getElementById('hudGaze');
        const sLabel = document.getElementById('hudStability');
        const aLabel = document.getElementById('hudAlerts');

        if (gLabel) gLabel.textContent = `${gaze}%`;
        if (sLabel) {
          sLabel.textContent = `${stability}%`;
          sLabel.style.color = stability < 50 ? '#ef4444' : '#10b981';
        }
        if (aLabel) aLabel.textContent = String(alerts);
      }

      // Stream character-by-character editor code
      const ideBody = document.getElementById('liveIdeBody');
      const ideStatus = document.getElementById('liveIdeStatus');
      const editorTitle = document.getElementById('interviewer-editor-title');
      if (ideBody && meeting.editorCode !== undefined) {
        if (state.lastRenderedCode !== meeting.editorCode) {
          state.lastRenderedCode = meeting.editorCode;
          
          if (meeting.editorCode.trim() === '') {
            ideBody.innerHTML = `<pre style="color:#64748b">// Candidate has loaded the workspace. Ready to code...</pre>`;
          } else {
            ideBody.innerHTML = `<pre>${escapeHtml(meeting.editorCode)}<span class="webcam-dot" style="display:inline-block; width:2px; height:12px; background:white; animation:pulseNeon .5s infinite alternate; margin-left:2px"></span></pre>`;
          }
          ideBody.scrollTop = ideBody.scrollHeight;
        }
        
        if (ideStatus) {
          const lang = meeting.selectedLanguage || 'JavaScript';
          ideStatus.textContent = `● Candidate is typing in ${lang}...`;
          ideStatus.style.color = '#60a5fa';
        }

        if (editorTitle) {
          const lang = meeting.selectedLanguage || 'JavaScript (Node.js)';
          editorTitle.textContent = `Code Editor (${lang})`;
        }
      }
    } else {
      // Waiting for candidate
      if (waitingOverlay) waitingOverlay.style.display = 'flex';
      if (hud) hud.style.display = 'none';

      // Cleanup stream if status goes back to waiting
      if (currentRoom) {
        currentRoom.disconnect();
        currentRoom = null;
      }
    }

    // Sync chat logs
    if (meeting.chatLogs) {
      syncInterviewerChatLogs(meeting.chatLogs);
    }
    } finally {
      isLiveSyncing = false;
    }
  }, 800);
}

function syncInterviewerChatLogs(chatLogs) {
  const feed = document.getElementById('liveChatFeed');
  if (!feed) return;

  if (state.chatLogsLength === chatLogs.length) return;
  state.chatLogsLength = chatLogs.length;

  feed.innerHTML = '';
  chatLogs.forEach((msg) => {
    const row = document.createElement('div');
    row.style.cssText = "display:flex; flex-direction:column; gap:2px; margin-bottom:4px; max-width:85%; line-height:1.35; padding:6px 8px; border-radius:8px; font-size:11.5px;";
    
    if (msg.sender === 'interviewer') {
      row.style.alignSelf = 'flex-end';
      row.style.background = '#1e1b4b';
      row.style.border = '1px solid rgba(79, 70, 229, 0.3)';
      row.style.color = '#e0e7ff';
      row.innerHTML = `<span style="font-size:9.5px; font-weight:700; color:#818cf8; text-transform:uppercase;">You</span>${escapeHtml(msg.text)}`;
    } else {
      row.style.alignSelf = 'flex-start';
      row.style.background = 'rgba(255, 255, 255, 0.04)';
      row.style.border = '1px solid var(--border)';
      row.style.color = '#f1f5f9';
      row.innerHTML = `<span style="font-size:9.5px; font-weight:700; color:#06b6d4; text-transform:uppercase;">Candidate</span>${escapeHtml(msg.text)}`;
    }
    feed.appendChild(row);
  });
  feed.scrollTop = feed.scrollHeight;
}

function handleInterviewerSendChat() {
  const inputEl = document.getElementById('liveChatInput');
  const text = inputEl?.value.trim() || '';
  if (!text) return;

  let meetings = [];
  try {
    const raw = localStorage.getItem('ekvueLiveInterviews');
    meetings = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(meetings)) meetings = [];
  } catch {
    meetings = [];
  }

  const meeting = meetings.find(m => m.meetingId === state.liveSessionId);
  if (meeting) {
    if (!meeting.chatLogs) meeting.chatLogs = [];
    meeting.chatLogs.push({ sender: 'interviewer', text: text });
    meeting.lastUpdated = new Date().toISOString();
    localStorage.setItem('ekvueLiveInterviews', JSON.stringify(meetings));
    
    if (inputEl) inputEl.value = '';
    // The polling loop will redraw instantly!
  }
}

// Bind Live Room Pause / Complete Triggers
const QUESTION_TEST_CASES = {
  'q_demo_2': {
    funcName: 'twoSum',
    testCases: [
      { label: 'Test Case 1: [2,7,11,15], target = 9', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { label: 'Test Case 2: [3,2,4], target = 6', args: [[3, 2, 4], 6], expected: [1, 2] },
      { label: 'Test Case 3: [3,3], target = 6', args: [[3, 3], 6], expected: [0, 1] }
    ]
  },
  'q_demo_1': {
    funcName: 'isValidBST',
    testCases: [
      { label: 'Test Case 1: root = [2,1,3]', args: [[2, 1, 3]], expected: true },
      { label: 'Test Case 2: root = [5,1,4,null,null,3,6]', args: [[5, 1, 4, null, null, 3, 6]], expected: false }
    ]
  },
  'q_demo_3': {
    funcName: 'LRUCache',
    testCases: [
      { label: 'Test Case 1: cache.put(1, 1)', args: ['put', [1, 1]], expected: null },
      { label: 'Test Case 2: cache.get(1)', args: ['get', [1]], expected: 1 }
    ]
  },
  'p_longest_substring': {
    funcName: 'lengthOfLongestSubstring',
    testCases: [
      { label: 'Test Case 1: s = "abcabcbb"', args: ['abcabcbb'], expected: 3 },
      { label: 'Test Case 2: s = "bbbbb"', args: ['bbbbb'], expected: 1 }
    ]
  }
};

// ==========================================
// JUDGE0 API CODE EXECUTION
// ==========================================
function normalizeLanguage(langString) {
  if (!langString) return 'javascript';
  const ls = langString.toLowerCase();
  if (ls.includes('javascript') || ls.includes('ts-deno') || ls.includes('js') || ls.includes('typescript')) {
    return 'javascript';
  }
  if (ls.includes('python') || ls.includes('py')) {
    return 'python';
  }
  if (ls.includes('c++') || ls.includes('cpp') || ls.includes('g++')) {
    return 'cpp';
  }
  if (ls.includes('gcc') || (ls.includes(' c ') || ls === 'c')) {
    return 'c';
  }
  if (ls.includes('java')) {
    return 'java';
  }
  if (ls.includes('csharp') || ls.includes('c#')) {
    return 'csharp';
  }
  if (ls.includes('ruby')) {
    return 'ruby';
  }
  if (ls.includes('go')) {
    return 'go';
  }
  if (ls.includes('rust')) {
    return 'rust';
  }
  if (ls.includes('php')) {
    return 'php';
  }
  if (ls.includes('swift')) {
    return 'swift';
  }
  if (ls.includes('kotlin')) {
    return 'kotlin';
  }
  return ls;
}

async function executeWithJudge0Interviewer(sourceCode, language, stdin = '') {
  const langKey = normalizeLanguage(language);
  
  const ONLINE_COMPILER_LANGS = {
    'javascript': 'typescript-deno',
    'js': 'typescript-deno',
    'python': 'python-3.14',
    'python3': 'python-3.14',
    'py': 'python-3.14',
    'cpp': 'g++-15',
    'c++': 'g++-15',
    'c': 'gcc-15',
    'java': 'openjdk-25',
    'typescript': 'typescript-deno',
    'ts': 'typescript-deno',
    'ruby': 'ruby-4.0',
    'go': 'go-1.26',
    'rust': 'rust-1.93',
    'php': 'php-8.5',
    'swift': 'typescript-deno',
    'kotlin': 'openjdk-25',
    'csharp': 'dotnet-csharp-9',
    'c#': 'dotnet-csharp-9'
  };

  const compilerId = ONLINE_COMPILER_LANGS[langKey] || 'typescript-deno';
  const customApiKey = localStorage.getItem('ekvueOnlineCompilerApiKey') || localStorage.getItem('onlineCompilerApiKey');

  try {
    const response = await fetch('/run-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        compiler: compilerId,
        code: sourceCode,
        input: stdin,
        apiKey: customApiKey || undefined
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Proxy compiler error (${response.status}): ${errText}`);
    }

    const result = await response.json();
    if (!result) {
      throw new Error('No execution result returned from compiler.');
    }

    const stdout = result.output || '';
    const stderr = (result.exit_code !== 0 && result.status === 'error') ? (result.error || '') : '';
    const compile_output = (result.exit_code !== 0 && !result.output) ? (result.error || '') : '';
    const success = (result.exit_code === 0) && (result.status === 'success');
    const statusId = success ? 3 : 4;

    const timeUsed = result.time || "0.08";
    const memUsed = result.memory ? Math.round(parseInt(result.memory) / 1024) : 2048;

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      compile_output: compile_output.trim(),
      status: { id: statusId },
      time: timeUsed,
      memory: memUsed,
      success,
      error: null
    };
  } catch (err) {
    return {
      stdout: '',
      stderr: '',
      compile_output: '',
      status: { id: 0 },
      time: '0',
      memory: 0,
      success: false,
      error: err.message
    };
  }
}

async function runCandidateCodeInterviewer() {
  const consolePanel = document.getElementById('interviewer-console-panel');
  const consoleOutput = document.getElementById('interviewer-console-output');
  if (!consolePanel || !consoleOutput) return;

  consolePanel.style.display = 'block';
  consoleOutput.style.color = '#fbbf24';
  consoleOutput.textContent = '⏳ Compiling with Judge0 API...';

  // Read meeting data
  let meetings = [];
  try {
    const raw = localStorage.getItem('ekvueLiveInterviews');
    meetings = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(meetings)) meetings = [];
  } catch { meetings = []; }

  const meeting = meetings.find(m => m.meetingId === state.liveSessionId);
  if (!meeting) {
    consoleOutput.style.color = '#ef4444';
    consoleOutput.textContent = 'Error: No active live session found.';
    return;
  }

  const codeVal = meeting.editorCode || '';
  const activeLang = normalizeLanguage(meeting.selectedLanguage);
  const activeChallengeId = meeting.pushedChallenge ? meeting.pushedChallenge.id : null;
  const challengeData = activeChallengeId ? (QUESTION_TEST_CASES[activeChallengeId] || null) : null;
  const testCases = challengeData ? challengeData.testCases : [];
  const funcName = challengeData ? challengeData.funcName : '';

  if (!codeVal.trim()) {
    consoleOutput.style.color = '#fbbf24';
    consoleOutput.textContent = 'Error: Candidate has not written any code yet.';
    return;
  }

  try {
    let fullCode = codeVal;

    // Append test runner for JavaScript
    if (activeLang === 'javascript' && testCases.length > 0 && funcName) {
      fullCode += '\n\n// --- Judge0 Test Runner ---\n';
      fullCode += 'if (typeof ' + funcName + ' === "function") {\n';
      fullCode += '  const __tc = ' + JSON.stringify(testCases) + ';\n';
      fullCode += '  let __pass = true;\n';
      fullCode += '  __tc.forEach((t, i) => {\n';
      fullCode += '    const r = ' + funcName + '(...JSON.parse(JSON.stringify(t.args)));\n';
      fullCode += '    const ok = JSON.stringify(r) === JSON.stringify(t.expected);\n';
      fullCode += '    if (!ok) __pass = false;\n';
      fullCode += '    console.log((t.label||"Test "+(i+1)) + "\\nOutput: " + JSON.stringify(r) + (ok ? " ✓" : " ✗ (Expected: " + JSON.stringify(t.expected) + ")"));\n';
      fullCode += '  });\n';
      fullCode += '  console.log("\\n" + (__pass ? "ALL_PASSED" : "SOME_FAILED"));\n';
      fullCode += '} else {\n';
      fullCode += '  console.log("Error: Could not find function definition \'' + funcName + '\' in candidate\'s code.");\n';
      fullCode += '  console.log("\\nSOME_FAILED");\n';
      fullCode += '}\n';
    } else if (activeLang === 'python' && testCases.length > 0 && funcName) {
      fullCode += '\n\n# --- Python Test Runner ---\n';
      fullCode += 'import json\n';
      fullCode += 'if "' + funcName + '" in globals() or "' + funcName + '" in locals():\n';
      fullCode += '    __tc = ' + JSON.stringify(testCases) + '\n';
      fullCode += '    __pass = True\n';
      fullCode += '    for i, t in enumerate(__tc):\n';
      fullCode += '        r = ' + funcName + '(*t["args"])\n';
      fullCode += '        ok = json.dumps(r) == json.dumps(t["expected"])\n';
      fullCode += '        if not ok: __pass = False\n';
      fullCode += '        label = t.get("label", f"Test {i+1}")\n';
      fullCode += '        print(f"{label}\\nOutput: {json.dumps(r)} {\"✓\" if ok else \"✗ (Expected: \" + json.dumps(t[\"expected\"]) + \")\"}")\n';
      fullCode += '    print("\\n" + ("ALL_PASSED" if __pass else "SOME_FAILED"))\n';
      fullCode += 'else:\n';
      fullCode += '    print("Error: Could not find function definition \'' + funcName + '\' in candidate\'s code.")\n';
      fullCode += '    print("\\nSOME_FAILED")\n';
    }

    const result = await executeWithJudge0Interviewer(fullCode, activeLang);

    if (result.error) {
      consoleOutput.style.color = '#ef4444';
      consoleOutput.textContent = `API Error: ${result.error}`;
      return;
    }

    if (result.compile_output) {
      consoleOutput.style.color = '#ef4444';
      let compileErr = result.compile_output || '';
      if (compileErr.includes("Internal error: code execution failed")) {
        compileErr = "Syntax or execution error in candidate's code. The script failed to compile or run.\n\nDetail: The compiler engine encountered an unhandled exception or syntax error. Please check your syntax, brackets, and ensure the function name matches.";
      }
      consoleOutput.textContent = `COMPILATION ERROR:\n${compileErr}`;
      return;
    }

    if (result.stderr && !result.stdout) {
      consoleOutput.style.color = '#ef4444';
      let runErr = result.stderr || '';
      if (runErr.includes("Internal error: code execution failed")) {
        runErr = "Syntax or execution error in candidate's code. The script failed to compile or run.\n\nDetail: The compiler engine encountered an unhandled exception or syntax error. Please check your syntax, brackets, and ensure the function name matches.";
      }
      consoleOutput.textContent = `RUNTIME ERROR:\n${runErr}`;
      return;
    }

    const output = result.stdout || 'No output';
    const allPassed = output.includes('ALL_PASSED');

    // Save compile metrics to meeting handshake
    try {
      const raw = localStorage.getItem('ekvueLiveInterviews');
      let meetings = raw ? JSON.parse(raw) : [];
      let mItem = meetings.find(m => m.meetingId === state.liveSessionId);
      if (mItem) {
        mItem.compilerStats = {
          allPassed: allPassed,
          success: result.success,
          stdout: result.stdout,
          time: result.time,
          memory: result.memory
        };
        mItem.lastUpdated = new Date().toISOString();
        localStorage.setItem('ekvueLiveInterviews', JSON.stringify(meetings));
      }
    } catch(e){}

    const langExec = activeLang === 'javascript' ? 'node' : activeLang === 'python' ? 'python3' : 'g++';
    const displayOutput = output.replace(/\n?ALL_PASSED\n?/g, '').replace(/\n?SOME_FAILED\n?/g, '').trim();
    const stats = `(${result.time}s, ${Math.round((result.memory || 0) / 1024 * 100) / 100}MB)`;

    if (testCases.length === 0) {
      consoleOutput.style.color = '#10b981';
      consoleOutput.innerHTML = `<span style="color:#10b981">$ ${langExec} candidate_code  ${stats}</span>\n\n${displayOutput}`;
    } else if (allPassed) {
      consoleOutput.style.color = '#10b981';
      consoleOutput.innerHTML = `$ ${langExec} candidate_code  ${stats}\n\n${displayOutput}\n\n✓ All test cases passed!`;
    } else if (result.success) {
      consoleOutput.style.color = '#f43f5e';
      consoleOutput.innerHTML = `$ ${langExec} candidate_code  ${stats}\n\n${displayOutput}\n\n⚠ Some test cases failed`;
    } else {
      consoleOutput.style.color = '#f43f5e';
      const desc = result.status ? result.status.description : 'Error';
      consoleOutput.innerHTML = `$ ${langExec} candidate_code  ${stats}\n\n${desc}\n${displayOutput}${result.stderr ? '\n' + result.stderr : ''}`;
    }
  } catch (err) {
    consoleOutput.style.color = '#ef4444';
    consoleOutput.textContent = `EXECUTION ERROR: ${err.message}`;
  }
}

// Bind Live Room Pause / Complete Triggers
function setupLiveRoomListeners() {
  const pauseBtn = document.getElementById('livePauseBtn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      state.livePaused = !state.livePaused;
      pauseBtn.textContent = state.livePaused ? 'Resume' : 'Pause';
      pauseBtn.classList.toggle('primary', state.livePaused);
    });
  }

  const completeBtn = document.getElementById('liveCompleteBtn');
  if (completeBtn) {
    completeBtn.addEventListener('click', () => {
      // Save notes and mark session status as pending grade
      const current = state.sessions.find(s => s.id === state.liveSessionId);
      if (current) {
        current.status = 'Feedback Pending';
        current.notes = document.getElementById('liveNotesInput').value;
        saveStateSessions();
        updateCompanyScheduleStatus(current.id, 'Feedback Pending', current.notes);
      }

      // Update shared record state so candidate knows it's completed
      let meetings = [];
      try {
        const raw = localStorage.getItem('ekvueLiveInterviews');
        meetings = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(meetings)) meetings = [];
      } catch {
        meetings = [];
      }

      const meeting = meetings.find(m => m.meetingId === state.liveSessionId);
      if (meeting) {
        meeting.status = 'Completed';
        meeting.lastUpdated = new Date().toISOString();
        localStorage.setItem('ekvueLiveInterviews', JSON.stringify(meetings));
      }

      // Store liveSessionId as selected scorecard session before clearing live state in exitLiveRoom
      const finishedSessionId = state.liveSessionId;
      exitLiveRoom();
      
      // Auto route back to the Candidate's star scorecard evaluator sheet!
      state.selectedScorecardSessionId = finishedSessionId;
      switchView('scorecards');

      // Update dashboard state
      renderDashboard();
    });
  }

  // Real-time autosave comments to buffer
  const notesInput = document.getElementById('liveNotesInput');
  if (notesInput) {
    notesInput.addEventListener('input', () => {
      state.liveNotes = notesInput.value;
      const current = state.sessions.find(s => s.id === state.liveSessionId);
      if (current) {
        current.notes = state.liveNotes;
        saveStateSessions();
      }
    });
  }

  // Chat send buttons
  const sendBtn = document.getElementById('liveSendChatBtn');
  const chatInput = document.getElementById('liveChatInput');
  if (sendBtn) {
    sendBtn.onclick = handleInterviewerSendChat;
  }
  if (chatInput) {
    chatInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleInterviewerSendChat();
      }
    };
  }

  // Fullscreen toggle binding
  const fullscreenBtn = document.getElementById('liveCandidateFullscreenBtn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      const frame = document.getElementById('liveCandidateWebcamFrame');
      if (frame) {
        if (!document.fullscreenElement) {
          frame.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
          });
        } else {
          document.exitFullscreen();
        }
      }
    });
  }

  // Interviewer Layout Focus View Toggle Button binding
  const layoutToggleBtn = document.getElementById('interviewer-layout-toggle-btn');
  if (layoutToggleBtn) {
    layoutToggleBtn.addEventListener('click', () => {
      const grid = document.querySelector('.proctor-workspace-grid');
      if (grid) {
        const isFocus = grid.classList.toggle('focus-mode');
        if (isFocus) {
          layoutToggleBtn.textContent = '🖥️ Splitscreen View';
          layoutToggleBtn.style.background = 'rgba(79, 85, 229, 0.2)';
          layoutToggleBtn.style.borderColor = 'rgba(79, 85, 229, 0.4)';
        } else {
          layoutToggleBtn.textContent = '🖥️ Focus View';
          layoutToggleBtn.style.background = 'rgba(255, 255, 255, 0.05)';
          layoutToggleBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }
      }
    });
  }

  // Interviewer Run Candidate Code button
  const runCodeBtn = document.getElementById('btn-interviewer-run-code');
  if (runCodeBtn) {
    runCodeBtn.addEventListener('click', () => {
      runCandidateCodeInterviewer();
    });
  }

  // Close console panel button
  const closeConsoleBtn = document.getElementById('close-interviewer-console');
  if (closeConsoleBtn) {
    closeConsoleBtn.addEventListener('click', () => {
      const consolePanel = document.getElementById('interviewer-console-panel');
      if (consolePanel) {
        consolePanel.style.display = 'none';
      }
    });
  }

  // Live Monitor button closes console to revert to clean monitoring
  const liveMonitorBtn = document.getElementById('btn-interviewer-live-monitor');
  if (liveMonitorBtn) {
    liveMonitorBtn.addEventListener('click', () => {
      const consolePanel = document.getElementById('interviewer-console-panel');
      if (consolePanel) {
        consolePanel.style.display = 'none';
      }
    });
  }
}

// ==========================================
// VIEW 3: QUESTION BANK MANAGER
// ==========================================
function renderQuestionsWorkspace() {
  renderQuestionsSidebar();
  renderQuestionDetails();
}

function renderQuestionsSidebar() {
  const container = document.getElementById('questions-sidebar-list');
  if (!container) return;

  container.innerHTML = '';

  const searchVal = document.getElementById('question-search')?.value?.toLowerCase() ?? '';
  const catVal = document.getElementById('question-filter-category')?.value ?? 'all';
  const diffVal = document.getElementById('question-filter-difficulty')?.value ?? 'all';

  const filtered = state.questions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(searchVal) || q.description.toLowerCase().includes(searchVal);
    const matchesCat = catVal === 'all' || q.category === catVal;
    const matchesDiff = diffVal === 'all' || q.difficulty === diffVal;
    return matchesSearch && matchesCat && matchesDiff;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; font-size:12px; color:var(--muted)">No challenges found</div>`;
    return;
  }

  filtered.forEach((q) => {
    const card = document.createElement('div');
    card.className = `workspace-problem-item ${state.selectedQuestionId === q.id ? 'active' : ''}`;
    
    let diffBadge = 'easy';
    if (q.difficulty === 'Medium') diffBadge = 'medium';
    if (q.difficulty === 'Hard') diffBadge = 'hard';

    card.innerHTML = `
      <div class="top">
        <span class="p-title">${escapeHtml(q.title)}</span>
        <span class="badge ${diffBadge}">${escapeHtml(q.difficulty)}</span>
      </div>
      <div class="p-meta">
        ${escapeHtml(q.category)} | Time limit: ${escapeHtml(q.timeLimit || '20m')}
      </div>
    `;

    card.addEventListener('click', () => {
      state.selectedQuestionId = q.id;
      renderQuestionsWorkspace();
    });

    container.appendChild(card);
  });
}

function renderQuestionDetails() {
  const detailsPanel = document.getElementById('question-details-panel');
  const detailsContent = document.getElementById('question-details-content');
  const placeholder = document.getElementById('question-selected-placeholder');

  if (!detailsPanel || !detailsContent || !placeholder) return;

  const current = state.questions.find(q => q.id === state.selectedQuestionId);

  if (!current) {
    placeholder.style.display = 'block';
    detailsContent.style.display = 'none';
    return;
  }

  placeholder.style.display = 'none';
  detailsContent.style.display = 'block';

  let diffClass = 'easy';
  if (current.difficulty === 'Medium') diffClass = 'medium';
  if (current.difficulty === 'Hard') diffClass = 'hard';

  detailsContent.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:14px;">
      <div>
        <h2 style="font-size:18px; margin:0 0 4px 0; color:white">${escapeHtml(current.title)}</h2>
        <div class="muted">Category: ${escapeHtml(current.category)} | Recommended Target: ${escapeHtml(current.timeLimit || '20m')}</div>
      </div>
      <span class="badge ${diffClass}">${escapeHtml(current.difficulty)}</span>
    </div>

    <div style="margin-bottom:14px;">
      <small style="color:var(--muted); font-weight:800">Problem Description</small>
      <div style="margin-top:6px; padding:10px; background:rgba(2,6,23,0.3); border:1px solid var(--border); border-radius:10px; font-size:13px; line-height:1.5; color:rgba(255,255,255,0.92)">
        ${escapeHtml(current.description).replaceAll('\n', '<br>')}
      </div>
    </div>

    ${current.codeTemplate ? `
    <div style="margin-bottom:14px;">
      <small style="color:var(--muted); font-weight:800">Reference Template / Answer Solution</small>
      <pre style="margin-top:6px; padding:10px; background:rgba(10,14,39,0.55); border:1px solid var(--border); border-radius:10px; font-size:12px; font-family:monospace; line-height:1.4; color:#a7f3d0; overflow-x:auto;">${escapeHtml(current.codeTemplate)}</pre>
    </div>` : ''}

    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:14px; margin-top:14px;">
      <button class="btn" style="border-color:rgba(239, 68, 68, 0.3); background:rgba(239, 68, 68, 0.05); color:#fecaca;" id="q-delete-btn">Wipe Challenge</button>
      
      <div style="display:flex; align-items:center; gap:8px;">
        <select id="q-session-link-selector" class="workspace-select" style="padding:6px 12px; font-size:12px;">
          <option value="">-- Add to Upcoming Session --</option>
          ${state.sessions.filter(s => s.status === 'Upcoming').map(s => `<option value="${s.id}">${escapeHtml(s.candidateName)}</option>`).join('')}
        </select>
        <button class="btn primary" id="q-link-session-btn">Link</button>
      </div>
    </div>
  `;

  // Bind links
  const delBtn = detailsContent.querySelector('#q-delete-btn');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete the question: ${current.title}?`)) {
        state.questions = state.questions.filter(q => q.id !== current.id);
        saveList(QUESTIONS_KEY, state.questions);
        state.selectedQuestionId = null;
        renderQuestionsWorkspace();
      }
    });
  }

  const linkBtn = detailsContent.querySelector('#q-link-session-btn');
  const selector = detailsContent.querySelector('#q-session-link-selector');
  if (linkBtn && selector) {
    linkBtn.addEventListener('click', () => {
      const sId = selector.value;
      if (!sId) {
        alert('Please choose an upcoming candidate session first.');
        return;
      }
      
      const sess = state.sessions.find(s => s.id === sId);
      if (sess) {
        // Append question to agenda
        sess.agenda = `${sess.agenda || ''}\n\n[Assigned Question: ${current.title}] \nDifficulty: ${current.difficulty}`;
        saveStateSessions();
        alert(`Linked "${current.title}" successfully to ${sess.candidateName}'s scheduled assessment.`);
        selector.value = '';
      }
    });
  }
}

// ==========================================
// VIEW 4: EVALUATION SCORECARDS
// ==========================================
function renderScorecardsWorkspace() {
  renderScorecardSidebar();
  renderScorecardBuilder();
}

function renderScorecardSidebar() {
  const container = document.getElementById('scorecard-sidebar-list');
  if (!container) return;

  container.innerHTML = '';

  const pending = state.sessions.filter(s => s.status === 'Feedback Pending' || s.status === 'Completed');

  if (pending.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; font-size:12px; color:var(--muted)">No assessments graded or pending.</div>`;
    return;
  }

  pending.forEach((sess) => {
    const card = document.createElement('div');
    card.className = `workspace-problem-item ${state.selectedScorecardSessionId === sess.id ? 'active' : ''}`;
    
    const isGraded = state.scorecards.some(sc => sc.sessionId === sess.id);

    card.innerHTML = `
      <div class="top">
        <span class="p-title">${escapeHtml(sess.candidateName)}</span>
        <span>${isGraded ? '⭐ Graded' : '● Pending'}</span>
      </div>
      <div class="p-meta">
        ${escapeHtml(sess.sessionType)} | Status: ${escapeHtml(sess.status)}
      </div>
    `;

    card.addEventListener('click', () => {
      state.selectedScorecardSessionId = sess.id;
      renderScorecardsWorkspace();
    });

    container.appendChild(card);
  });
}

// Hides view wrappers styles lockouts
function renderScorecardBuilder() {
  const builderPanel = document.getElementById('scorecard-builder-panel');
  const builderContent = document.getElementById('scorecard-builder-content');
  const placeholder = document.getElementById('scorecard-selected-placeholder');

  if (!builderPanel || !builderContent || !placeholder) return;

  const current = state.sessions.find(s => s.id === state.selectedScorecardSessionId);

  if (!current) {
    placeholder.style.display = 'block';
    builderContent.style.display = 'none';
    return;
  }

  placeholder.style.display = 'none';
  builderContent.style.display = 'block';

  // Setup Names
  document.getElementById('scCandidateName').textContent = `Evaluating ${current.candidateName}`;
  document.getElementById('scMetaInfo').textContent = `${current.sessionType} Round • Scheduled ${current.date}`;

  const isGraded = state.scorecards.some(sc => sc.sessionId === current.id);
  const badge = document.getElementById('scStatusBadge');
  if (badge) {
    if (isGraded) {
      badge.textContent = 'Evaluation Graded';
      badge.className = 'badge easy';
    } else {
      badge.textContent = 'Feedback Pending';
      badge.className = 'badge medium';
    }
  }

  // Clear inputs & setup default star selection variables
  const dimensions = ['codeQuality', 'problemSolving', 'techKnowledge', 'communication', 'systemDesign'];
  
  // Find if existing scorecard exists
  const existingSc = state.scorecards.find(sc => sc.sessionId === current.id);

  // Check if we can pre-populate ratings based on compiler performance
  let prefillRatings = {};
  try {
    const raw = localStorage.getItem('ekvueLiveInterviews');
    const meetings = raw ? JSON.parse(raw) : [];
    const mItem = meetings.find(m => m.meetingId === current.id);
    if (mItem && mItem.compilerStats) {
      const stats = mItem.compilerStats;
      if (stats.allPassed) {
        // High scores for passing all test cases
        prefillRatings = { codeQuality: 5, problemSolving: 5, techKnowledge: 4, communication: 4, systemDesign: 4 };
      } else if (stats.success) {
        // Passing some test cases
        prefillRatings = { codeQuality: 3, problemSolving: 3, techKnowledge: 3, communication: 3, systemDesign: 3 };
      } else {
        // Compilation error or failed completely
        prefillRatings = { codeQuality: 2, problemSolving: 2, techKnowledge: 3, communication: 3, systemDesign: 3 };
      }
    }
  } catch(e){}

  dimensions.forEach((dim) => {
    const defaultVal = prefillRatings[dim] || 0;
    const val = existingSc ? parseInt(existingSc[dim] || 0) : defaultVal;
    const wrapper = document.querySelector(`.rating-stars-input[data-dimension="${dim}"]`);
    if (wrapper) {
      wrapper.dataset.selectedValue = val;
      const stars = wrapper.querySelectorAll('.star-btn');
      stars.forEach((s) => {
        const starVal = parseInt(s.dataset.value);
        s.classList.toggle('active', starVal <= val);
      });
    }
    const valLabel = document.getElementById(`val-${dim}`);
    if (valLabel) valLabel.textContent = `${val}/5`;
  });

  // Calculate Avg Score
  const avgInput = document.getElementById('scGlobalScore');
  if (avgInput) {
    if (existingSc) {
      avgInput.value = `${existingSc.globalScore}/5.0`;
    } else {
      // Auto-compute average if we have prefilled values
      let total = 0;
      let count = 0;
      dimensions.forEach(dim => {
        if (prefillRatings[dim]) {
          total += prefillRatings[dim];
          count++;
        }
      });
      avgInput.value = count > 0 ? `${(total / count).toFixed(1)}/5.0` : '—';
    }
  }

  // Summary descriptions
  document.getElementById('scRecommendation').value = existingSc ? existingSc.recommendation : 'Hire';
  document.getElementById('scStrengths').value = existingSc ? existingSc.strengths : '';
  document.getElementById('scImprovements').value = existingSc ? existingSc.improvements : '';
  document.getElementById('scNotes').value = existingSc ? existingSc.notes : current.notes || '';
}

function recalculateScorecardAvg() {
  const dimensions = ['codeQuality', 'problemSolving', 'techKnowledge', 'communication', 'systemDesign'];
  let total = 0;
  let count = 0;
  
  dimensions.forEach((dim) => {
    const wrapper = document.querySelector(`.rating-stars-input[data-dimension="${dim}"]`);
    if (wrapper && wrapper.dataset.selectedValue) {
      total += parseInt(wrapper.dataset.selectedValue);
      count++;
    }
  });

  const avgInput = document.getElementById('scGlobalScore');
  if (avgInput) {
    if (count > 0) {
      avgInput.value = `${(total / count).toFixed(1)}/5.0`;
    } else {
      avgInput.value = '—';
    }
  }
}

// ==========================================
// VIEW 5: PRINTABLE ATS candidate REPORTS
// ==========================================
function renderReportsWorkspace() {
  const listContainer = document.getElementById('reports-list-container');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  // Filter sessions that have a compiled locked scorecard
  const gradedSessions = state.sessions.filter(sess => 
    state.scorecards.some(sc => sc.sessionId === sess.id)
  );

  if (gradedSessions.length === 0) {
    renderEmptyState(listContainer, 'No compiled report sheets found. Submit a Candidate Scorecard to generate reports.');
    document.getElementById('report-selected-placeholder').style.display = 'block';
    document.getElementById('report-preview-sheet').style.display = 'none';
    document.getElementById('printReportBtn').disabled = true;
    return;
  }

  // Active selected report sessionId if none selected
  const activeReportSessId = state.selectedScorecardSessionId || gradedSessions[0].id;

  gradedSessions.forEach((sess) => {
    const item = document.createElement('div');
    item.className = `item ${activeReportSessId === sess.id ? 'active' : ''}`;
    if (activeReportSessId === sess.id) {
      item.style.borderColor = 'rgba(99,102,241,0.45)';
      item.style.background = 'linear-gradient(90deg, rgba(37,99,235,0.1), rgba(124,58,237,0.06))';
    }

    const sc = state.scorecards.find(x => x.sessionId === sess.id);

    item.innerHTML = `
      <div class="title">
        <strong>${escapeHtml(sess.candidateName)}</strong>
        <span>Round: ${escapeHtml(sess.sessionType)} | Score: <strong style="color:#fbbf24">${sc ? sc.globalScore : '—'}/5</strong></span>
      </div>
      <span class="badge easy">${sc ? sc.recommendation : 'Hire'}</span>
    `;

    item.addEventListener('click', () => {
      state.selectedScorecardSessionId = sess.id;
      renderReportsWorkspace();
    });

    listContainer.appendChild(item);
  });

  renderPrintReportSheet(activeReportSessId);
}

function renderPrintReportSheet(sessId) {
  const placeholder = document.getElementById('report-selected-placeholder');
  const sheet = document.getElementById('report-preview-sheet');
  const printBtn = document.getElementById('printReportBtn');

  if (!sheet || !placeholder || !printBtn) return;

  const session = state.sessions.find(s => s.id === sessId);
  const sc = state.scorecards.find(x => x.sessionId === sessId);

  if (!session || !sc) {
    placeholder.style.display = 'block';
    sheet.style.display = 'none';
    printBtn.disabled = true;
    return;
  }

  placeholder.style.display = 'none';
  sheet.style.display = 'block';
  printBtn.disabled = false;

  // Set global themes attributes to print isolation
  sheet.setAttribute('data-theme', state.selectedTheme === 'space' ? 'Creative' : state.selectedTheme === 'emerald' ? 'Creative' : 'Classic');

  // Fill in textual values
  document.getElementById('repCandidateName').textContent = session.candidateName;
  document.getElementById('repJobTitle').textContent = `${session.sessionType} Round Evaluation`;
  document.getElementById('repDate').textContent = session.date;
  document.getElementById('repInterviewer').textContent = `${state.profile.name} (${state.profile.role})`;
  document.getElementById('repAvgScore').textContent = `${sc.globalScore}/5.0`;
  
  const badge = document.getElementById('repRecommendationBadge');
  if (badge) {
    badge.textContent = sc.recommendation;
    badge.className = 'report-recommendation-badge';
    if (sc.recommendation === 'Strong Hire') badge.classList.add('strong-hire');
    if (sc.recommendation === 'Hire') badge.classList.add('hire');
    if (sc.recommendation === 'No Hire') badge.classList.add('no-hire');
  }

  document.getElementById('repAssSummary').innerHTML = escapeHtml(sc.notes).replaceAll('\n', '<br>');
  document.getElementById('repStrengths').innerHTML = escapeHtml(sc.strengths).replaceAll('\n', '<br>');
  document.getElementById('repImprovements').innerHTML = escapeHtml(sc.improvements).replaceAll('\n', '<br>');

  // Renders Score progress bar indicators
  const metersGrid = document.getElementById('report-scores-meter-grid');
  if (metersGrid) {
    metersGrid.innerHTML = '';
    const dims = [
      { key: 'codeQuality', label: 'Code Quality & Cleanliness' },
      { key: 'problemSolving', label: 'Problem-Solving Skill' },
      { key: 'techKnowledge', label: 'Technical Knowledge' },
      { key: 'communication', label: 'Communication Skill' },
      { key: 'systemDesign', label: 'System Design / Architecture' }
    ];

    dims.forEach((d) => {
      const score = sc[d.key] || 0;
      const pct = (score / 5) * 100;
      metersGrid.innerHTML += `
        <div class="report-score-bar-row">
          <span class="label">${d.label}</span>
          <div class="report-score-bar-wrapper">
            <div class="report-score-bar-fill" style="--score-pct: ${pct}%"></div>
          </div>
          <span class="count">${score}/5</span>
        </div>
      `;
    });
  }
}

// ==========================================
// VIEW 7: ACTIVE JOBS
// ==========================================
function renderJobsWorkspace() {
  // If no job is selected yet, select the first one automatically
  if (!state.selectedJobId && state.jobs.length > 0) {
    state.selectedJobId = state.jobs[0].id;
  }
  renderJobsSidebar();
  renderJobDetails();
}

function renderJobsSidebar() {
  const container = document.getElementById('jobs-sidebar-list');
  const countBadge = document.getElementById('jobs-total-badge');
  if (!container) return;

  container.innerHTML = '';

  const searchInput = document.getElementById('job-search-input');
  const statusFilter = document.getElementById('job-filter-status');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const statusVal = statusFilter ? statusFilter.value : 'all';

  const filtered = state.jobs.filter(j => {
    const matchesSearch = (j.jobTitle || '').toLowerCase().includes(query) || (j.description || '').toLowerCase().includes(query);
    const matchesStatus = statusVal === 'all' || j.status === statusVal;
    return matchesSearch && matchesStatus;
  });

  if (countBadge) {
    countBadge.textContent = filtered.length;
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; font-size:12px; color:var(--muted)">No jobs found matching criteria.</div>`;
    return;
  }

  filtered.forEach(job => {
    const card = document.createElement('div');
    const isActive = state.selectedJobId === job.id;
    card.className = `workspace-problem-item ${isActive ? 'active' : ''}`;
    
    let statusDot = '🟢';
    if (job.status === 'Draft') statusDot = '🟡';
    if (job.status === 'Closed') statusDot = '🔴';

    card.innerHTML = `
      <div class="top">
        <span class="p-title">${escapeHtml(job.jobTitle || 'Untitled Role')}</span>
        <span style="font-size:10px; font-weight:800;">${statusDot} ${escapeHtml(job.status || 'Active')}</span>
      </div>
      <div class="p-meta" style="display:flex; justify-content:space-between; margin-top:2px;">
        <span>📍 ${escapeHtml(job.location || 'Remote')}</span>
        <span>${Math.max((loadList('ekvueJobApplications').filter(a => a.jobId === job.id).length), job.applied || 0)} applied</span>
      </div>
    `;

    card.addEventListener('click', () => {
      state.selectedJobId = job.id;
      renderJobsWorkspace();
    });

    container.appendChild(card);
  });
}

function renderJobDetails() {
  const detailsPanel = document.getElementById('job-details-panel');
  const detailsContent = document.getElementById('job-details-content');
  const placeholder = document.getElementById('job-selected-placeholder');

  if (!detailsPanel || !detailsContent || !placeholder) return;

  const current = state.jobs.find(j => j.id === state.selectedJobId);

  if (!current) {
    placeholder.style.display = 'block';
    detailsContent.style.display = 'none';
    return;
  }

  placeholder.style.display = 'none';
  detailsContent.style.display = 'block';

  const dateStr = current.createdAt ? new Date(current.createdAt).toLocaleDateString() : 'N/A';

  const associatedCandidates = state.sessions.filter(sess => {
    const sType = (sess.sessionType || '').toLowerCase();
    const jTitle = (current.jobTitle || '').toLowerCase();
    return sType.includes(jTitle) || jTitle.includes(sType);
  });

  let candidatesMarkup = '';
  if (associatedCandidates.length === 0) {
    candidatesMarkup = `<div class="muted" style="font-size:12px; padding:10px 0; text-align:center;">No candidate interviews currently scheduled for this specific job role.</div>`;
  } else {
    associatedCandidates.forEach(cand => {
      let statusStyle = 'color:#60a5fa; background:rgba(59,130,246,0.06); border:1px solid rgba(59,130,246,0.15);';
      if (cand.status === 'Completed') {
        statusStyle = 'color:#34d399; background:rgba(52,211,153,0.06); border:1px solid rgba(52,211,153,0.15);';
      } else if (cand.status === 'Feedback Pending') {
        statusStyle = 'color:#fbbf24; background:rgba(251,191,36,0.06); border:1px solid rgba(251,191,36,0.15);';
      }
      candidatesMarkup += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:8px; margin-bottom:8px; transition:transform 0.2s ease;">
          <div>
            <div style="font-size:13px; font-weight:800; color:white;">${escapeHtml(cand.candidateName)}</div>
            <div style="font-size:11px; color:var(--muted)">📅 ${escapeHtml(cand.date)} @ ${escapeHtml(cand.time)}</div>
          </div>
          <span style="font-size:10px; font-weight:800; text-transform:uppercase; padding:3px 8px; border-radius:50px; ${statusStyle}">${escapeHtml(cand.status)}</span>
        </div>
      `;
    });
  }

  // Build applied candidates markup from ekvueJobApplications
  const jobApplications = loadList('ekvueJobApplications').filter(a => a.jobId === current.id);
  const allScorecards = loadList('ekvueInterviewerScorecards');
  let appliedCandidatesMarkup = '';
  if (jobApplications.length === 0) {
    appliedCandidatesMarkup = `<div class="muted" style="font-size:12px; padding:10px 0; text-align:center;">No candidate applications received for this job posting yet.</div>`;
  } else {
    jobApplications.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    jobApplications.forEach(app => {
      const initials = (app.candidateName || 'C').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const appDate = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A';

      // Find scorecard for this candidate
      const sc = allScorecards.find(s => s.email && app.candidateEmail && s.email.toLowerCase() === app.candidateEmail.toLowerCase());
      const isHired = sc && (sc.recommendation === 'Hire' || sc.recommendation === 'Strong Hire');
      const isNoHire = sc && sc.recommendation === 'No Hire';

      const displayStatus = isHired ? 'Hired' : (isNoHire ? 'Not Selected' : (app.status || 'Applied'));

      let appStatusStyle = 'color:#60a5fa; background:rgba(59,130,246,0.06); border:1px solid rgba(59,130,246,0.15);';
      if (displayStatus === 'Hired') appStatusStyle = 'color:#10b981; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25);';
      else if (displayStatus === 'Shortlisted') appStatusStyle = 'color:#34d399; background:rgba(52,211,153,0.06); border:1px solid rgba(52,211,153,0.15);';
      else if (displayStatus === 'Rejected' || displayStatus === 'Not Selected') appStatusStyle = 'color:#f87171; background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.15);';
      else if (displayStatus === 'Under Review') appStatusStyle = 'color:#fbbf24; background:rgba(251,191,36,0.06); border:1px solid rgba(251,191,36,0.15);';

      // Scorecard info line
      let scLine = '';
      if (sc) {
        const recColor = sc.recommendation === 'Strong Hire' ? '#10b981' : sc.recommendation === 'Hire' ? '#3b82f6' : '#ef4444';
        scLine = `<div style="font-size:9.5px; color:var(--muted); margin-top:2px;">⭐ ${sc.globalScore}/5 · <span style="color:${recColor}; font-weight:800">${escapeHtml(sc.recommendation)}</span></div>`;
      }

      const hiredBadge = isHired ? `<span style="font-size:8px; font-weight:900; color:#10b981; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); padding:1px 5px; border-radius:3px; margin-left:4px;">✅ HIRED</span>` : '';

      appliedCandidatesMarkup += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:${isHired ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${isHired ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)'}; border-radius:8px; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg, ${isHired ? '#10b981, #059669' : '#a855f7, #7c3aed'}); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:900; color:white;">${initials}</div>
            <div>
              <div style="font-size:13px; font-weight:800; color:white;">${escapeHtml(app.candidateName || 'Candidate')}${hiredBadge}</div>
              <div style="font-size:10.5px; color:var(--muted);">${escapeHtml(app.candidateEmail || '')} · Applied ${appDate}</div>
              ${scLine}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:10px; font-weight:800; text-transform:uppercase; padding:3px 8px; border-radius:50px; ${appStatusStyle}">${escapeHtml(displayStatus)}</span>
            ${!isHired && !isNoHire ? `<button class="btn small" style="padding:4px 10px; font-size:10px; background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid rgba(168,85,247,0.3); border-radius:6px; cursor:pointer;" onclick="openCandidateScheduleModal('${escapeHtml(app.candidateName)}', '${escapeHtml(app.candidateEmail)}', '${escapeHtml(current.jobTitle)}')">📅 Schedule</button>` : ''}
          </div>
        </div>
      `;
    });
  }

  let statusClass = 'easy';
  if (current.status === 'Draft') statusClass = 'medium';
  if (current.status === 'Closed') statusClass = 'hard';

  detailsContent.innerHTML = `
    <div class="header-row" style="border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:18px;">
      <div>
        <h2 style="font-size:22px; color:white; font-weight:800; margin-bottom:4px;">${escapeHtml(current.jobTitle || 'Untitled Position')}</h2>
        <div class="muted" style="font-size:12px;">📍 ${escapeHtml(current.location || 'Location')} • Posted on ${dateStr}</div>
      </div>
      <span class="badge ${statusClass}">${escapeHtml(current.status || 'Active')}</span>
    </div>

    <!-- Glowing Metrics Row -->
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:14px; margin-bottom:24px;">
      <div class="card" style="text-align:center; padding:16px; background:rgba(99,102,241,0.04); border:1px solid rgba(99,102,241,0.15);">
        <div style="font-size:26px; font-weight:900; color:#818cf8;">${current.applied || 0}</div>
        <div style="font-size:10px; color:var(--muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">Candidates Applied</div>
      </div>
      <div class="card" style="text-align:center; padding:16px; background:rgba(52,211,153,0.04); border:1px solid rgba(52,211,153,0.15);">
        <div style="font-size:26px; font-weight:900; color:#34d399;">${current.interviewed || 0}</div>
        <div style="font-size:10px; color:var(--muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">Interviewed</div>
      </div>
      <div class="card" style="text-align:center; padding:16px; background:rgba(251,191,36,0.04); border:1px solid rgba(251,191,36,0.15);">
        <div style="font-size:26px; font-weight:900; color:#fbbf24;">${current.offered || 0}</div>
        <div style="font-size:10px; color:var(--muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">Offers Extended</div>
      </div>
    </div>

    <!-- Role Description -->
    <div style="margin-bottom:24px;">
      <h3 style="font-size:13px; font-weight:800; text-transform:uppercase; color:white; border-left:3px solid #6366f1; padding-left:8px; margin:0 0 10px 0;">Role Details & Description</h3>
      <div style="background:rgba(2, 6, 23, 0.4); border:1px solid var(--border); border-radius:12px; padding:16px; font-size:13px; line-height:1.6; color:#e2e8f0; white-space:pre-wrap; max-height:280px; overflow-y:auto;">${escapeHtml(current.description || 'No description provided.')}</div>
    </div>

    <!-- Associated scheduled rounds -->
    <div style="margin-bottom:24px;">
      <h3 style="font-size:13px; font-weight:800; text-transform:uppercase; color:white; border-left:3px solid #10b981; padding-left:8px; margin:0 0 10px 0;">Candidate Schedules</h3>
      <div class="associated-candidates-list">
        ${candidatesMarkup}
      </div>
    </div>

    <!-- Applied Candidates from ekvueJobApplications -->
    <div>
      <h3 style="font-size:13px; font-weight:800; text-transform:uppercase; color:white; border-left:3px solid #a855f7; padding-left:8px; margin:0 0 10px 0;">Applied Candidates</h3>
      <div class="applied-candidates-list">
        ${appliedCandidatesMarkup}
      </div>
    </div>
  `;
}

// ==========================================
// VIEW 6: INTERVIEWER SETTINGS
// ==========================================
function renderSettings() {
  // Populate form inputs from profile and user account
  document.getElementById('profileName').value = state.profile.name || '';
  document.getElementById('profileRole').value = state.profile.role || '';
  document.getElementById('profileDep').value = state.profile.dep || '';
  document.getElementById('profileBio').value = state.profile.bio || '';

  // Populate new fields from user account data
  const emailEl = document.getElementById('profileEmail');
  const companyEl = document.getElementById('profileCompany');
  const expEl = document.getElementById('profileExperience');

  if (emailEl) emailEl.value = (state.user && state.user.email) || state.profile.email || '';
  if (companyEl) companyEl.value = state.profile.company || (state.user && state.user.company) || '';
  if (expEl) expEl.value = state.profile.experience || (state.user && state.user.experience) || '';

  // Render Theme selections
  const cards = document.querySelectorAll('.theme-card-option');
  cards.forEach((card) => {
    card.classList.toggle('active', card.dataset.theme === state.selectedTheme);
  });
}

function setupSettingsListeners() {
  const profileForm = document.getElementById('profileSettingsForm');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const okMsg = document.getElementById('settingsFormOk');
      const errMsg = document.getElementById('settingsFormMsg');
      if (okMsg) okMsg.style.display = 'none';
      if (errMsg) errMsg.style.display = 'none';

      const name = document.getElementById('profileName').value.trim();
      const role = document.getElementById('profileRole').value.trim();
      const dep = document.getElementById('profileDep').value.trim();
      const bio = document.getElementById('profileBio').value.trim();
      const company = (document.getElementById('profileCompany') || {}).value || '';
      const experience = (document.getElementById('profileExperience') || {}).value || '';

      if (!name || !role) {
        if (errMsg) {
          errMsg.textContent = 'Name and Job Title are required.';
          errMsg.style.display = 'block';
        }
        return;
      }

      // Save all fields to profile
      state.profile = { name, role, dep, bio, company: company.trim(), experience: experience.trim(), email: (state.user && state.user.email) || state.profile.email || '' };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));

      // Propagate changes to user session
      if (state.user) {
        state.user.name = name;
        state.user.fullName = name;
        state.user.title = role;
        state.user.company = company.trim();
        state.user.experience = experience.trim();
        localStorage.setItem(LS_KEYS.currentUser, JSON.stringify(state.user));

        // Also update the master accounts list so changes persist across logins
        try {
          const accounts = loadList('ekvueAccounts');
          const updated = accounts.map(acc => {
            if (acc.email === state.user.email) {
              return { ...acc, name, title: role, company: company.trim(), experience: experience.trim() };
            }
            return acc;
          });
          saveList('ekvueAccounts', updated);
        } catch (e) { console.warn('Could not update master accounts:', e); }
      }

      if (okMsg) {
        okMsg.textContent = '✅ All interviewer settings saved successfully!';
        okMsg.style.display = 'block';
        setTimeout(() => { okMsg.style.display = 'none'; }, 3000);
      }

      // Update dashboard values immediately
      renderDashboard();
    });
  }

  // Bind Themes selector click triggers
  const cards = document.querySelectorAll('.theme-card-option');
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const selected = card.dataset.theme || 'default';
      state.selectedTheme = selected;
      localStorage.setItem(THEME_KEY, selected);
      
      // Update body classes attribute instantly
      document.body.setAttribute('data-theme', selected);

      renderSettings();
      renderDashboard();
    });
  });

  // Danger Reset button
  const wipeBtn = document.getElementById('wipeDataBtn');
  if (wipeBtn) {
    wipeBtn.addEventListener('click', () => {
      if (confirm('CAUTION: Wiping EKVUE databases clears interviewer profiles, logs, custom assessments questions, and candidate scorecards. Continue?')) {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(QUESTIONS_KEY);
        localStorage.removeItem(SCORECARDS_KEY);
        localStorage.removeItem(PROFILE_KEY);
        
        const msg = document.getElementById('wipeMsg');
        if (msg) {
          msg.textContent = 'EKVUE Interviewer databases successfully wiped!';
          msg.style.display = 'block';
        }

        // Wait 1.5s then trigger a page reload to draw from fallbacks
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    });
  }
}

// ==========================================
// ADDITIONAL CORE FORM CREATORS SUBMISSIONS
// ==========================================
function setupSubmissionsListeners() {
  // Quick Create Form on Dashboard
  const quickForm = document.getElementById('createForm');
  if (quickForm) {
    quickForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formOk = document.getElementById('formOk');
      const formMsg = document.getElementById('formMsg');
      if (formOk) formOk.style.display = 'none';
      if (formMsg) formMsg.style.display = 'none';

      const candidateName = document.getElementById('candidateName').value.trim();
      const sessionType = document.getElementById('sessionType').value.trim();
      const agenda = document.getElementById('agenda').value.trim();

      if (!candidateName || !sessionType) return;

      const candidateEmail = lookupCandidateEmail(candidateName);
      const newSess = {
        id: uid('sess'),
        candidateName,
        candidateEmail,
        sessionType,
        agenda,
        createdAt: new Date().toISOString(),
        date: new Date(Date.now() + 3600000 * 24).toISOString().split('T')[0], // scheduled tomorrow
        time: '12:00',
        status: 'Upcoming',
        notes: ''
      };

      state.sessions.push(newSess);
      saveStateSessions();

      // Dispatch real-time candidate notification
      addNotification(
        candidateEmail,
        "New Interview Scheduled!",
        `A new interview for "${sessionType}" has been scheduled with ${state.profile.name || 'EkVue AI'}.`,
        "scheduled",
        { meetingId: newSess.id, role: sessionType, date: newSess.date, time: newSess.time, interviewer: state.profile.name || 'EkVue AI' }
      );

      if (formOk) {
        formOk.textContent = 'Assessment scheduled successfully!';
        formOk.style.display = 'block';
      }

      quickForm.reset();
      renderDashboard();
    });
  }

  // Splitscreen Sessions Planner Form
  const creatorForm = document.getElementById('sessionCreatorForm');
  if (creatorForm) {
    creatorForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const okMsg = document.getElementById('sessFormOk');
      const errMsg = document.getElementById('sessFormMsg');
      if (okMsg) okMsg.style.display = 'none';
      if (errMsg) errMsg.style.display = 'none';

      const candidateName = document.getElementById('sessCandidateName').value.trim();
      const sessionType = document.getElementById('sessType').value;
      const date = document.getElementById('sessDate').value;
      const time = document.getElementById('sessTime').value;
      const agenda = document.getElementById('sessAgenda').value.trim();

      if (!candidateName || !date || !time) {
        if (errMsg) {
          errMsg.textContent = 'All highlighted parameters are required.';
          errMsg.style.display = 'block';
        }
        return;
      }

      const candidateEmail = lookupCandidateEmail(candidateName);
      const newSess = {
        id: uid('sess'),
        candidateName,
        candidateEmail,
        sessionType,
        date,
        time,
        agenda,
        status: 'Upcoming',
        notes: '',
        createdAt: new Date().toISOString()
      };

      state.sessions.push(newSess);
      saveStateSessions();

      // Dispatch real-time candidate notification
      addNotification(
        candidateEmail,
        "New Interview Scheduled!",
        `A new interview for "${sessionType}" has been scheduled on ${date} at ${time} with ${state.profile.name || 'EkVue AI'}.`,
        "scheduled",
        { meetingId: newSess.id, role: sessionType, date, time, interviewer: state.profile.name || 'EkVue AI' }
      );

      if (okMsg) {
        okMsg.textContent = 'New assessment queued successfully!';
        okMsg.style.display = 'block';
      }

      creatorForm.reset();
      renderSessionsWorkspace();
      renderDashboard();
    });
  }

  // Question Creator Form
  const qForm = document.getElementById('questionCreatorForm');
  if (qForm) {
    qForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const ok = document.getElementById('qFormOk');
      const err = document.getElementById('qFormMsg');
      if (ok) ok.style.display = 'none';
      if (err) err.style.display = 'none';

      const title = document.getElementById('qTitle').value.trim();
      const category = document.getElementById('qCategory').value;
      const difficulty = document.getElementById('qDifficulty').value;
      const timeLimit = document.getElementById('qTimeLimit').value.trim() || '20 mins';
      const description = document.getElementById('qDescription').value.trim();
      const codeTemplate = document.getElementById('qCodeTemplate').value.trim();

      if (!title || !description) {
        if (err) {
          err.textContent = 'Title and Description are required parameters.';
          err.style.display = 'block';
        }
        return;
      }

      const newQ = {
        id: uid('q'),
        title,
        category,
        difficulty,
        timeLimit,
        description,
        codeTemplate
      };

      state.questions.push(newQ);
      saveList(QUESTIONS_KEY, state.questions);

      if (ok) {
        ok.textContent = 'Custom challenge compiled into repository!';
        ok.style.display = 'block';
      }

      qForm.reset();
      renderQuestionsWorkspace();
    });
  }

  // Scorecards Evaluation form submit
  const scForm = document.getElementById('evaluationForm');
  if (scForm) {
    scForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const ok = document.getElementById('scFormOk');
      const err = document.getElementById('scFormMsg');
      if (ok) ok.style.display = 'none';
      if (err) err.style.display = 'none';

      // Load star selections
      const codeQuality = parseInt(document.querySelector('.rating-stars-input[data-dimension="codeQuality"]')?.dataset?.selectedValue || 0);
      const problemSolving = parseInt(document.querySelector('.rating-stars-input[data-dimension="problemSolving"]')?.dataset?.selectedValue || 0);
      const techKnowledge = parseInt(document.querySelector('.rating-stars-input[data-dimension="techKnowledge"]')?.dataset?.selectedValue || 0);
      const communication = parseInt(document.querySelector('.rating-stars-input[data-dimension="communication"]')?.dataset?.selectedValue || 0);
      const systemDesign = parseInt(document.querySelector('.rating-stars-input[data-dimension="systemDesign"]')?.dataset?.selectedValue || 0);

      if (codeQuality === 0 || problemSolving === 0 || techKnowledge === 0 || communication === 0 || systemDesign === 0) {
        if (err) {
          err.textContent = 'Please select star ratings (1 to 5) for all assessment criteria.';
          err.style.display = 'block';
        }
        return;
      }

      const recommendation = document.getElementById('scRecommendation').value;
      const strengths = document.getElementById('scStrengths').value.trim();
      const improvements = document.getElementById('scImprovements').value.trim();
      const notes = document.getElementById('scNotes').value.trim();

      // Recalculate average
      const avg = ((codeQuality + problemSolving + techKnowledge + communication + systemDesign) / 5).toFixed(1);

      // Persist Scorecard
      const index = state.scorecards.findIndex(x => x.sessionId === state.selectedScorecardSessionId);
      const existingSc = index > -1 ? state.scorecards[index] : null;
      const session = state.sessions.find(s => s.id === state.selectedScorecardSessionId);
      
      const payload = {
        id: existingSc ? existingSc.id : uid('scard'),
        sessionId: state.selectedScorecardSessionId,
        candidateName: session ? session.candidateName : (existingSc ? existingSc.candidateName : 'Candidate'),
        email: session ? (session.candidateEmail || lookupCandidateEmail(session.candidateName)) : (existingSc ? existingSc.email : ''),
        interviewerName: state.profile.name || 'EkVue AI',
        date: session ? session.date : (existingSc ? existingSc.date : new Date().toISOString().split('T')[0]),
        codeQuality,
        problemSolving,
        techKnowledge,
        communication,
        systemDesign,
        globalScore: avg,
        recommendation,
        strengths,
        improvements,
        notes
      };

      if (index > -1) {
        state.scorecards[index] = payload;
      } else {
        state.scorecards.push(payload);
      }

      saveList(SCORECARDS_KEY, state.scorecards);

      // Save to MongoDB
      payload.companyEmail = state.user?.email || '';
      fetch('/api/scorecards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(()=>{});

      // Dispatch real-time candidate notification about graded scorecard report card!
      const candEmail = payload.email || lookupCandidateEmail(payload.candidateName);
      addNotification(
        candEmail,
        "Interview Graded!",
        `Your technical assessment round has been graded by ${payload.interviewerName}. Recommendation: ${payload.recommendation}. Click here to inspect your scorecard report card!`,
        "graded",
        { scorecardId: payload.id, sessionId: payload.sessionId, role: session ? session.sessionType : 'Technical Interview', candidateName: payload.candidateName }
      );

      // Lock session status as completed
      if (session) {
        session.status = 'Completed';
        session.notes = notes;
        saveStateSessions();
        updateCompanyScheduleStatus(session.id, 'Completed', notes);
      }

      // Auto-update application status and job offered count based on hiring decision
      const appCandEmail = payload.email || (session ? session.candidateEmail : '');
      if (appCandEmail && (recommendation === 'Hire' || recommendation === 'Strong Hire')) {
        try {
          // Update application status to Hired
          const allApps = loadList('ekvueJobApplications');
          const updatedApps = allApps.map(a => {
            if (a.candidateEmail && a.candidateEmail.toLowerCase() === appCandEmail.toLowerCase()) {
              return { ...a, status: 'Hired', lastUpdated: new Date().toISOString() };
            }
            return a;
          });
          saveList('ekvueJobApplications', updatedApps);

          // Increment offered count on the matching job
          const app = allApps.find(a => a.candidateEmail && a.candidateEmail.toLowerCase() === appCandEmail.toLowerCase());
          if (app && app.jobId) {
            const jobs = loadList('ekvueCompanyItems');
            const updatedJobs = jobs.map(j => {
              if (j.id === app.jobId) {
                return { ...j, offered: (j.offered || 0) + 1, interviewed: (j.interviewed || 0) + 1, lastUpdated: new Date().toISOString() };
              }
              return j;
            });
            saveList('ekvueCompanyItems', updatedJobs);
          }

          // Notify candidate about the hiring decision
          addNotification(
            appCandEmail,
            '🎉 Congratulations! You\'re Hired!',
            `Great news! You have been selected for the "${session ? session.sessionType : 'role'}". The recruiter will reach out soon with the offer details.`,
            'status',
            { recommendation, scorecardId: payload.id }
          );
        } catch(e) { console.warn('Failed to auto-update application status:', e); }
      } else if (appCandEmail && recommendation === 'No Hire') {
        try {
          const allApps = loadList('ekvueJobApplications');
          const updatedApps = allApps.map(a => {
            if (a.candidateEmail && a.candidateEmail.toLowerCase() === appCandEmail.toLowerCase()) {
              return { ...a, status: 'Not Selected', lastUpdated: new Date().toISOString() };
            }
            return a;
          });
          saveList('ekvueJobApplications', updatedApps);
        } catch(e) { console.warn('Failed to update rejected status:', e); }
      }

      if (ok) {
        ok.textContent = 'Candidate Scorecard locked and sealed successfully!';
        ok.style.display = 'block';
      }

      // Sync and redraw workspaces
      renderScorecardsWorkspace();
      renderDashboard();
      
      // Clear out selector selected session
      setTimeout(() => {
        if (ok) ok.style.display = 'none';
        state.selectedScorecardSessionId = null;
        switchView('reports'); // auto navigate to reports preview!
      }, 1500);

    });
  }
}

// ==========================================
// EVALUATION STARS SETUP CLICKS
// ==========================================
function setupStarClicks() {
  const dimensions = ['codeQuality', 'problemSolving', 'techKnowledge', 'communication', 'systemDesign'];
  dimensions.forEach((dim) => {
    const wrapper = document.querySelector(`.rating-stars-input[data-dimension="${dim}"]`);
    if (!wrapper) return;

    const stars = wrapper.querySelectorAll('.star-btn');
    stars.forEach((star) => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.value);
        wrapper.dataset.selectedValue = val;

        stars.forEach((s) => {
          const sVal = parseInt(s.dataset.value);
          s.classList.toggle('active', sVal <= val);
        });

        const label = document.getElementById(`val-${dim}`);
        if (label) label.textContent = `${val}/5`;

        recalculateScorecardAvg();
      });
    });
  });
}

// ==========================================
// PRINT TRIGGER CALLBACKS
// ==========================================
function setupPrintListeners() {
  const printBtn = document.getElementById('printReportBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

// ==========================================
// CENTRAL INITIALIZATION
// ==========================================
function init() {
  console.log('[EKVUE-DEBUG] init() called');
  // 1. Safe Load State
  try {
    loadStateFromStorage();
  } catch (err) {
    console.error("Critical error in loadStateFromStorage:", err);
  }

  // 2. Immediate core bindings (Router & Logout)
  try {
    bindSpaLinks();
  } catch (err) {
    console.error("Critical error binding SPA links:", err);
  }

  try {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        clearCurrentUser();
        window.location.href = '../../login/index.html?forceLogin=1';
      });
    }
  } catch (err) {
    console.error("Critical error binding logout:", err);
  }

  // 3. Populate autocomplete datalists
  try {
    populateCandidatesDatalist();
  } catch (err) {
    console.warn("Failed to populate candidates datalist:", err);
  }

  // 4. Setup Star ratings handlers
  try {
    setupStarClicks();
  } catch (err) {
    console.error("Failed to setup star clicks:", err);
  }

  // 5. Setup Form creations submissions listeners
  try {
    setupSubmissionsListeners();
  } catch (err) {
    console.error("Failed to setup submissions listeners:", err);
  }

  // 6. Setup Settings Themes & Danger commands
  try {
    setupSettingsListeners();
  } catch (err) {
    console.error("Failed to setup settings listeners:", err);
  }

  // 7. Setup live room streams timers and controls
  try {
    setupLiveRoomListeners();
  } catch (err) {
    console.error("Failed to setup live room listeners:", err);
  }

  // 8. Setup print triggers
  try {
    setupPrintListeners();
  } catch (err) {
    console.error("Failed to setup print listeners:", err);
  }

  // 9. Connect sidebar search & filter inputs change hooks safely
  try {
    const sessSearch = document.getElementById('session-search');
    if (sessSearch) sessSearch.addEventListener('input', renderSessionsSidebar);
    
    const sessFilter = document.getElementById('session-filter-status');
    if (sessFilter) sessFilter.addEventListener('change', renderSessionsSidebar);

    const qSearch = document.getElementById('question-search');
    if (qSearch) qSearch.addEventListener('input', renderQuestionsSidebar);

    const qCat = document.getElementById('question-filter-category');
    if (qCat) qCat.addEventListener('change', renderQuestionsSidebar);

    const qDiff = document.getElementById('question-filter-difficulty');
    if (qDiff) qDiff.addEventListener('change', renderQuestionsSidebar);

    const jSearch = document.getElementById('job-search-input');
    if (jSearch) jSearch.addEventListener('input', renderJobsSidebar);

    const jStatus = document.getElementById('job-filter-status');
    if (jStatus) jStatus.addEventListener('change', renderJobsSidebar);
  } catch (err) {
    console.error("Failed to bind search & filter change hooks:", err);
  }

  // 10. Draw initial view safely
  try {
    switchView('dashboard');
  } catch (err) {
    console.error("Failed to render initial view:", err);
  }
}

async function populateCandidatesDatalist() {
  const datalist = document.getElementById('registered-candidates-datalist');
  if (!datalist) return;

  datalist.innerHTML = '';

  const uniqueNames = new Set();

  // 1. Fetch candidates from MongoDB backend
  try {
    const response = await fetch('/api/users');
    if (response.ok) {
      const allUsers = await response.json();
      const dbCandidates = allUsers.filter(u => u.role === 'Candidate');
      fetchedCandidates = dbCandidates;

      // Sync to localStorage for offline fallback
      const existing = loadList('ekvueAccounts');
      dbCandidates.forEach(c => {
        const name = c.name || c.fullName;
        if (name) uniqueNames.add(name);
        // Merge into localStorage if not already present
        if (c.email && !existing.some(e => e.email === c.email && e.role === 'Candidate')) {
          existing.push({ name: c.name, fullName: c.fullName, email: c.email, role: 'Candidate' });
        }
      });
      saveList('ekvueAccounts', existing);
      console.log(`[CandidateSync] Loaded ${dbCandidates.length} candidates from MongoDB.`);
    }
  } catch (err) {
    console.warn('[CandidateSync] API fetch failed, using localStorage fallback:', err);
  }

  // 2. Also merge from localStorage as fallback
  try {
    const accounts = loadList('ekvueAccounts');
    const localCandidates = accounts.filter(a => a.role === 'Candidate');
    localCandidates.forEach(c => {
      const name = c.name || c.fullName;
      if (name) uniqueNames.add(name);
    });
  } catch (err) {
    console.warn('Failed to load candidates from localStorage:', err);
  }

  // 3. Populate datalist with all unique names
  uniqueNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    datalist.appendChild(option);
  });

  console.log(`[CandidateSync] Datalist populated with ${uniqueNames.size} candidate names.`);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ==========================================
// QUICK SCHEDULE MODAL FOR APPLIED CANDIDATES
// ==========================================
window.openCandidateScheduleModal = function(candidateName, candidateEmail, jobTitle) {
  const existingModal = document.getElementById('candidate-schedule-modal');
  if (existingModal) existingModal.remove();

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const modal = document.createElement('div');
  modal.id = 'candidate-schedule-modal';
  modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:9999;';
  
  modal.innerHTML = `
    <div style="background:#0f172a; border:1px solid rgba(255,255,255,0.1); border-radius:12px; width:360px; padding:24px; box-shadow:0 10px 40px rgba(0,0,0,0.5);">
      <h3 style="margin:0 0 4px 0; color:white; font-size:16px;">Schedule Interview</h3>
      <p style="margin:0 0 20px 0; font-size:12px; color:var(--muted);">For ${escapeHtml(candidateName)} — ${escapeHtml(jobTitle)}</p>
      
      <form id="candidate-schedule-form">
        <div class="form-group" style="margin-bottom:12px;">
          <label style="font-size:11px; color:var(--muted); font-weight:600; display:block; margin-bottom:4px;">Date</label>
          <input type="date" id="csm-date" value="${tomorrow}" required style="width:100%; padding:8px 12px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; font-size:13px;" />
        </div>
        <div class="form-group" style="margin-bottom:24px;">
          <label style="font-size:11px; color:var(--muted); font-weight:600; display:block; margin-bottom:4px;">Time</label>
          <input type="time" id="csm-time" value="10:00" required style="width:100%; padding:8px 12px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; font-size:13px;" />
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" onclick="document.getElementById('candidate-schedule-modal').remove()" style="padding:8px 16px; background:transparent; border:none; color:var(--muted); cursor:pointer; font-size:13px;">Cancel</button>
          <button type="submit" style="padding:8px 16px; background:#8b5cf6; border:none; border-radius:8px; color:white; font-weight:600; cursor:pointer; font-size:13px;">Schedule Now</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('candidate-schedule-form').onsubmit = (e) => {
    e.preventDefault();
    const date = document.getElementById('csm-date').value;
    const time = document.getElementById('csm-time').value;

    const newSess = {
      id: uid('sess'),
      candidateName,
      candidateEmail,
      sessionType: jobTitle,
      date,
      time,
      agenda: 'Technical Interview',
      status: 'Upcoming',
      notes: '',
      createdAt: new Date().toISOString()
    };

    // 1. Save to interviewer sessions
    state.sessions.push(newSess);
    saveStateSessions();

    // 2. Also save to live interviews with Scheduled status for candidate dashboard
    const liveEntry = {
      meetingId: newSess.id,
      candidateEmail,
      candidateName,
      sessionType: jobTitle,
      interviewerName: state.profile?.name || 'Interviewer',
      interviewerEmail: state.user?.email || 'interviewer@ekvue.com',
      status: 'Scheduled',
      createdAt: newSess.createdAt
    };
    try {
      const liveMeetings = loadList('ekvueLiveInterviews');
      liveMeetings.push(liveEntry);
      saveList('ekvueLiveInterviews', liveMeetings);
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'ekvueLiveInterviews',
        newValue: JSON.stringify(liveMeetings)
      }));
    } catch(err) { console.error('Failed to save to live interviews', err); }

    // 3. Dispatch notification
    addNotification(
      candidateEmail,
      "New Interview Scheduled!",
      `A new interview for "${jobTitle}" has been scheduled on ${date} at ${time} with ${state.profile?.name || 'EkVue AI'}.`,
      "scheduled",
      { meetingId: newSess.id, role: jobTitle, date, time, interviewer: state.profile?.name || 'EkVue AI' }
    );

    modal.remove();
    alert('Interview scheduled successfully! Candidate has been notified.');
    
    // Refresh
    renderJobDetails();
  };
};

// Listen to local storage changes to support real-time network sync updates on separate laptops!
window.addEventListener('storage', (e) => {
  console.log('[NetworkSync] Interviewer localStorage updated, synchronizing state Views...');
  try {
    loadStateFromStorage();
    
    // Instantaneous check if the currently active live interview has been completed by the candidate!
    if (state.liveActive && state.liveSessionId) {
      let meetings = [];
      try {
        const raw = localStorage.getItem('ekvueLiveInterviews');
        meetings = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(meetings)) meetings = [];
      } catch {}
      
      const meeting = meetings.find(m => m.meetingId === state.liveSessionId);
      if (meeting && meeting.status === 'Completed') {
        console.log('[NetworkSync] Active live session completed by candidate. Triggering sync teardown...');
        
        if (state.liveSyncIntervalId) clearInterval(state.liveSyncIntervalId);
        
        const current = state.sessions.find(s => s.id === state.liveSessionId);
        if (current && current.status !== 'Completed') {
          current.status = 'Feedback Pending';
          const notesInput = document.getElementById('liveNotesInput');
          current.notes = notesInput ? notesInput.value : state.liveNotes;
          saveStateSessions();
        }
        
        const finishedSessionId = state.liveSessionId;
        exitLiveRoom();
        
        alert(`Candidate has ended the interview call. Transitioning to Scorecard evaluation page.`);
        
        state.selectedScorecardSessionId = finishedSessionId;
        switchView('scorecards');
        renderDashboard();
        return;
      }
    }
    
    if (state.activeView === 'dashboard') {
      renderDashboard();
    } else if (state.activeView === 'sessions') {
      renderSessionsWorkspace();
    } else if (state.activeView === 'live-interview') {
      renderLiveInterviewView();
    } else if (state.activeView === 'jobs') {
      renderJobsWorkspace();
    } else if (state.activeView === 'scorecards') {
      renderScorecardsWorkspace();
    } else if (state.activeView === 'reports') {
      renderReportsWorkspace();
    }
  } catch (err) {
    console.warn('[NetworkSync] Failed to redraw interviewer views:', err);
  }
});



async function initLiveKitRoom(roomId) {
  console.log('[LiveKit] Connecting to Room on Interviewer side');
  const localVideoContainer = document.getElementById('local-video');
  const remoteVideosContainer = document.getElementById('remote-videos');
  if (!localVideoContainer || !remoteVideosContainer || typeof LiveKit === 'undefined') return;

  try {
    const res = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: 'ekvue_interview_' + roomId,
        participantName: state.profile?.name || 'Interviewer'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const room = new LiveKit.Room({
      adaptiveStream: true,
      dynacast: true,
    });
    currentRoom = room;

    room.on(LiveKit.RoomEvent.TrackSubscribed, (track, publication, participant) => {
      const element = track.attach();
      element.style.width = '100%';
      element.style.height = '100%';
      element.style.objectFit = 'contain';
      element.dataset.sid = track.sid;
      
      const wrapper = document.createElement('div');
      wrapper.id = track.sid;
      wrapper.style.position = 'relative';
      wrapper.style.width = track.source === LiveKit.Track.Source.ScreenShare ? '100%' : '50%';
      wrapper.style.height = track.source === LiveKit.Track.Source.ScreenShare ? '100%' : '50%';
      wrapper.appendChild(element);
      
      remoteVideosContainer.appendChild(wrapper);
    });

    room.on(LiveKit.RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      track.detach();
      const wrapper = document.getElementById(track.sid);
      if (wrapper) wrapper.remove();
    });

    room.on(LiveKit.RoomEvent.LocalTrackPublished, (publication, participant) => {
      if (publication.track.kind === 'video' && publication.track.source === LiveKit.Track.Source.Camera) {
        const video = document.getElementById('interviewer-self-video');
        if (video) {
          publication.track.attach(video);
          video.style.display = 'block';
        }
      }
    });

    room.on(LiveKit.RoomEvent.LocalTrackUnpublished, (publication, participant) => {
      if (publication.track.kind === 'video' && publication.track.source === LiveKit.Track.Source.Camera) {
        localVideoContainer.innerHTML = '';
      }
    });

    await room.connect(data.url, data.token);
    console.log('Connected to LiveKit Room', room.name);

    // Stop manual stream so LiveKit can exclusively access camera on Windows
    if (state.interviewerStream) {
      state.interviewerStream.getTracks().forEach(t => t.stop());
      state.interviewerStream = null;
    }

    await room.localParticipant.enableCameraAndMicrophone();
    if (!state.interviewerCamOn) room.localParticipant.setCameraEnabled(false);
    if (!state.interviewerMicOn) room.localParticipant.setMicrophoneEnabled(false);
  } catch (error) {
    console.error('Failed to connect to LiveKit', error);
  }
}

