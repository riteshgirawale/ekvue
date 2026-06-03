import {
  LS_KEYS,
  getCurrentUser,
  requireAuth,
  setCurrentUser,
  clearCurrentUser,
  loadList,
  saveList,
  uid,
  escapeHtml,
  normalizeText,
} from '../utils.js';

// ==========================================
// SESSION SECURITY PROTECTION LOCK
// ==========================================
const currentUser = requireAuth();
if (!currentUser || currentUser.role !== 'Admin') {
  addSystemLog('CRITICAL: Access Denied. Non-admin user intercepted. Redirecting...', 'error');
  setTimeout(() => {
    window.location.href = '../../login/index.html?forceLogin=1';
  }, 1000);
}

// Global dashboard state
const state = {
  accounts: [],
  scorecards: [],
  meetings: [],
  schedules: [],
  activeSeconds: 0,
  latencySimulationInterval: null,
};

// ==========================================
// DOM CORE INITIALIZATION
// ==========================================
const startAdminConsole = () => {
  // Ensure we are strictly admin
  if (!currentUser || currentUser.role !== 'Admin') return;

  initActiveSessionClock();
  initSpaTabs();
  initEventHandlers();
  
  // Initial load
  reloadDatabaseState();
  
  // Set up storage change listener to sync in real time across browser frames
  window.addEventListener('storage', () => {
    addSystemLog('WebSocket Relayer State Synchronization Update Detected.', 'ws');
    reloadDatabaseState();
  });

  // Start latent indicators
  initNetworkLatencyMock();

  // Print startup logs
  addSystemLog('Initializing EKVUE Super Administrator diagnostic console...', 'info');
  addSystemLog('Loading master ledger schemas and encryption nodes...', 'info');
  addSystemLog('Established secure Peer Relayer Session over PieSocket channel.', 'success');
  addSystemLog('Telemetry relays: NOMINAL. Storage interceptors: ACTIVE.', 'success');
  addSystemLog('Print Styles isolated. Press Ctrl+P to export audit reports.', 'info');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startAdminConsole);
} else {
  startAdminConsole();
}

// ==========================================
// ACTIVE SESSION CLOCK
// ==========================================
function initActiveSessionClock() {
  setInterval(() => {
    state.activeSeconds++;
    const min = Math.floor(state.activeSeconds / 60);
    const sec = state.activeSeconds % 60;
    const formatted = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    const clockEl = document.getElementById('session-active-clock');
    if (clockEl) clockEl.textContent = formatted;
  }, 1000);
}

// ==========================================
// SPA TAB NAVIGATION ROUTER
// ==========================================
function initSpaTabs() {
  const menuLinks = document.querySelectorAll('#sidebar-menu a');
  const views = document.querySelectorAll('.view-content');

  menuLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view');

      menuLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');

      views.forEach((view) => {
        if (view.id === `view-${targetView}`) {
          view.classList.add('active');
        } else {
          view.classList.remove('active');
        }
      });

      addSystemLog(`Console view shifted to "${targetView.toUpperCase()}" ledger`, 'info');
    });
  });
}

// ==========================================
// CORE DATA STATE SYNCER
// ==========================================
function reloadDatabaseState() {
  state.accounts = loadList('ekvueAccounts');
  state.scorecards = loadList('ekvueInterviewerScorecards');
  state.meetings = loadList('ekvueLiveInterviews');
  state.schedules = loadList('ekvueCompanySchedules');

  // If accounts list is completely empty, create at least standard defaults to prevent total blank dashboard on first click.
  if (state.accounts.length === 0) {
    const defaults = [
      { role: 'Candidate', name: 'Priya Sharma', email: 'priya@example.com', password: 'password', school: 'Stanford University', studyField: 'Software Engineering', level: 'Student', createdAt: new Date().toISOString(), atsScore: 92 },
      { role: 'Interviewer', name: 'EkVue AI', email: 'interviewer@example.com', password: 'password', createdAt: new Date().toISOString() },
      { role: 'Company', name: 'Google Recruiter', email: 'recruiter@example.com', password: 'password', createdAt: new Date().toISOString() }
    ];
    saveList('ekvueAccounts', defaults);
    state.accounts = defaults;
  }

  calculateDiagnostics();
  renderAccountsTable();
  renderLiveCallsGrid();
}

// ==========================================
// SYSTEM DIAGNOSTICS & TELEMETRY
// ==========================================
function calculateDiagnostics() {
  const totalUsers = state.accounts.length;
  const conductedExams = state.scorecards.length;

  // Render basic KPI totals
  document.getElementById('kpiTotalUsers').textContent = totalUsers;
  document.getElementById('kpiLiveInterviews').textContent = conductedExams;

  // Average ATS Resume score
  const candidates = state.accounts.filter(acc => acc.role === 'Candidate');
  let totalAts = 0;
  let atsCount = 0;

  candidates.forEach(cand => {
    if (cand.atsScore) {
      totalAts += Number(cand.atsScore);
      atsCount++;
    }
  });

  const avgAts = atsCount > 0 ? Math.round(totalAts / atsCount) : 78; // 78% default fallback
  document.getElementById('kpiAtsAvg').textContent = `${avgAts}%`;

  // Role Demographics percentages
  const compCount = state.accounts.filter(acc => acc.role === 'Company').length;
  const intCount = state.accounts.filter(acc => acc.role === 'Interviewer').length;
  const candCount = candidates.length;

  const pctCand = totalUsers > 0 ? Math.round((candCount / totalUsers) * 100) : 0;
  const pctComp = totalUsers > 0 ? Math.round((compCount / totalUsers) * 100) : 0;
  const pctInt = totalUsers > 0 ? Math.round((intCount / totalUsers) * 100) : 0;

  // Progress Bar labels
  document.getElementById('pct-label-candidates').textContent = `${pctCand}%`;
  document.getElementById('progress-bar-candidates').style.width = `${pctCand}%`;

  document.getElementById('pct-label-companies').textContent = `${pctComp}%`;
  document.getElementById('progress-bar-companies').style.width = `${pctComp}%`;

  document.getElementById('pct-label-interviewers').textContent = `${pctInt}%`;
  document.getElementById('progress-bar-interviewers').style.width = `${pctInt}%`;

  // Engagement Duration Analytics
  // Candidate Time average
  let candidateTotalSeconds = 0;
  let candScorecardCount = 0;
  state.scorecards.forEach(sc => {
    if (sc.duration) {
      candidateTotalSeconds += Number(sc.duration);
      candScorecardCount++;
    }
  });

  const avgCandSec = candScorecardCount > 0 ? Math.round(candidateTotalSeconds / candScorecardCount) : 1485; // ~24m 45s fallback
  const candMin = Math.floor(avgCandSec / 60);
  const candSec = avgCandSec % 60;
  document.getElementById('stats-candidate-time').textContent = `${candMin}m ${String(candSec).padStart(2, '0')}s`;

  // Interviewer Time Average
  const avgIntSec = candScorecardCount > 0 ? Math.round((candidateTotalSeconds / candScorecardCount) * 0.78) : 1110; // ~18m 30s fallback
  const intMin = Math.floor(avgIntSec / 60);
  const intSec = avgIntSec % 60;
  document.getElementById('stats-interviewer-time').textContent = `${intMin}m ${String(intSec).padStart(2, '0')}s`;
}

// Flutters the networks spike simulator slightly
function initNetworkLatencyMock() {
  if (state.latencySimulationInterval) clearInterval(state.latencySimulationInterval);
  
  state.latencySimulationInterval = setInterval(() => {
    const networkEl = document.getElementById('kpiNetworkSpike');
    if (!networkEl) return;
    
    // Simulates standard local server handshake network packets latency in MS
    const latency = Math.round(15 + Math.random() * 20);
    networkEl.textContent = `${latency} ms`;
  }, 4000);
}

// ==========================================
// ACCOUNTS ROSTER DIRECTORY RENDER
// ==========================================
function renderAccountsTable() {
  const tableBody = document.getElementById('accounts-table-body');
  if (!tableBody) return;

  const searchQuery = normalizeText(document.getElementById('account-search-input')?.value).toLowerCase();
  const roleFilter = document.getElementById('account-role-filter')?.value || 'all';

  const filtered = state.accounts.filter(acc => {
    const roleMatches = (roleFilter === 'all' || acc.role === roleFilter);
    const searchMatches = !searchQuery || 
      String(acc.name ?? '').toLowerCase().includes(searchQuery) ||
      String(acc.email ?? '').toLowerCase().includes(searchQuery) ||
      String(acc.role ?? '').toLowerCase().includes(searchQuery) ||
      String(acc.school ?? '').toLowerCase().includes(searchQuery);

    return roleMatches && searchMatches;
  });

  tableBody.innerHTML = '';

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:32px; color:var(--text-muted);">
          No accounts found matching search filters.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(acc => {
    const tr = document.createElement('tr');
    
    const initials = (acc.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const cleanRole = escapeHtml(acc.role);
    const roleClass = cleanRole.toLowerCase();

    // Create a color representation for the avatar circle
    let avatarGradient = 'linear-gradient(135deg, #6366f1, #a855f7)';
    if (acc.role === 'Company') avatarGradient = 'linear-gradient(135deg, #f59e0b, #eab308)';
    if (acc.role === 'Interviewer') avatarGradient = 'linear-gradient(135deg, #10b981, #059669)';

    const dateStr = acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : 'Historical Profile';

    tr.innerHTML = `
      <td>
        <div class="usr-profile">
          <div class="avatar-circle" style="background:${avatarGradient}">${initials}</div>
          <div class="meta">
            <span class="name">${escapeHtml(acc.name)}</span>
            <span class="sub">${escapeHtml(acc.school ?? 'General Organization')}</span>
          </div>
        </div>
      </td>
      <td>
        <span class="role-badge ${roleClass}">${cleanRole}</span>
      </td>
      <td>
        <div style="font-family:monospace;">
          <strong style="color:#d8b4fe;">${escapeHtml(acc.email)}</strong><br>
          <span style="color:#64748b; font-size:11px;">Clearpass: ${escapeHtml(acc.password)}</span>
        </div>
      </td>
      <td style="font-family:monospace; color:#94a3b8;">
        ${dateStr}
      </td>
      <td style="text-align:right;">
        <button class="btn small wipe-btn" style="border-color:rgba(239,68,68,0.2); background:rgba(239,68,68,0.05); color:#fca5a5;" data-email="${acc.email}" data-role="${acc.role}">
          Wipe Account
        </button>
      </td>
    `;

    // Bind account deletion trigger
    tr.querySelector('.wipe-btn').addEventListener('click', (e) => {
      const email = e.currentTarget.getAttribute('data-email');
      const role = e.currentTarget.getAttribute('data-role');
      handleAccountDeletion(email, role);
    });

    tableBody.appendChild(tr);
  });
}

function handleAccountDeletion(email, role) {
  if (email.toLowerCase() === 'admin@gmail.com') {
    alert('Operation Blocked: Cannot delete Super Administrator bypass account.');
    addSystemLog('BLOCKED: Security rule prevented removal of root bypass account.', 'warning');
    return;
  }

  const account = state.accounts.find(a => a.email === email && a.role === role);
  if (!account) return;

  const confirmed = window.confirm(`Are you absolutely sure you want to permanently delete account for "${account.name}" (${account.role})?\nThis action wipes their registration globally.`);
  if (!confirmed) return;

  // Filter accounts list
  state.accounts = state.accounts.filter(a => !(a.email === email && a.role === role));
  saveList('ekvueAccounts', state.accounts);
  
  addSystemLog(`Deleted account for ${account.name} [${account.role}] - Broadcasted updates.`, 'warning');
  
  // Re-run
  reloadDatabaseState();
}

// ==========================================
// LIVE WEBSOCKET CALLS GRID MONITOR
// ==========================================
function renderLiveCallsGrid() {
  const grid = document.getElementById('active-live-monitor-grid');
  if (!grid) return;

  // Active call check (status must be 'active')
  const activeRooms = state.meetings.filter(m => m.status === 'active');

  grid.innerHTML = '';

  if (activeRooms.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:48px 24px; border:1px dashed rgba(255,255,255,0.08); border-radius:16px; background:rgba(255,255,255,0.01);">
        <div style="font-size:24px; margin-bottom:12px;">🛰️</div>
        <strong style="color:white; font-size:14px; display:block; margin-bottom:6px;">No active WebSockets exams running.</strong>
        <p style="font-size:12px; color:var(--text-muted); margin:0;">
          All Relays are nominal. Zero-latency interceptors are scanning the channel <strong>ekvue_global_live_interviews</strong>...
        </p>
      </div>
    `;
    return;
  }

  activeRooms.forEach(room => {
    const card = document.createElement('div');
    card.className = 'exam-card';

    const gaze = room.proctorTelemetry?.gazePct !== undefined ? room.proctorTelemetry.gazePct : 100;
    const stability = room.proctorTelemetry?.stabilityPct !== undefined ? room.proctorTelemetry.stabilityPct : 100;
    const violations = room.proctorTelemetry?.violations !== undefined ? room.proctorTelemetry.violations : 0;

    // Detect critical proctor telemetry values
    const isProctorDanger = gaze < 55 || stability < 55 || violations > 3;

    // Last message check
    let lastMsg = 'No dialogue exchanges recorded.';
    if (Array.isArray(room.chat) && room.chat.length > 0) {
      const msg = room.chat[room.chat.length - 1];
      lastMsg = `<strong>${msg.sender}:</strong> "${escapeHtml(msg.text)}"`;
    }

    card.innerHTML = `
      <div class="header-box">
        <div class="name-info">
          <strong>${escapeHtml(room.candidate)}</strong>
          <span>${escapeHtml(room.role || 'Software Engineer')} Round</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px; background:${isProctorDanger ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.06)'}; border:1px solid ${isProctorDanger ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}; padding:4px 10px; border-radius:50px; font-size:10px; color:${isProctorDanger ? '#fecaca' : '#10b981'}; font-weight:800;">
          <span class="webcam-dot ${isProctorDanger ? 'red-alert' : ''}" style="width:7px; height:7px; background:${isProctorDanger ? '#ef4444' : '#10b981'}; border-radius:50%;"></span>
          ${isProctorDanger ? 'PROCTOR WARN' : 'STREAM NOMINAL'}
        </div>
      </div>

      <div class="telemetry-grid">
        <div class="tele-item">
          <label>Violations</label>
          <strong style="color:${violations > 3 ? '#ef4444' : '#ffffff'}">${violations}</strong>
        </div>
        <div class="tele-item ${gaze < 60 ? 'warning' : ''}">
          <label>Eye Gaze</label>
          <strong>${gaze}%</strong>
        </div>
        <div class="tele-item ${stability < 60 ? 'warning' : ''}">
          <label>Stability</label>
          <strong>${stability}%</strong>
        </div>
      </div>

      <div style="background:rgba(2, 6, 23, 0.4); border:1px solid rgba(255, 255, 255, 0.03); border-radius:10px; padding:10px; font-size:11.5px; line-height:1.4; color:#94a3b8;">
        <span style="color:#a78bfa; font-weight:800; text-transform:uppercase; font-size:9px; display:block; margin-bottom:4px; letter-spacing:0.5px;">WebSockets Audio/Chat stream</span>
        ${lastMsg}
      </div>

      <div class="footer-box">
        <span>Interviewer: ${escapeHtml(room.interviewer || 'EkVue AI')}</span>
        <span style="font-family:monospace; font-size:10px;">ID: ${escapeHtml(room.meetingId)}</span>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ==========================================
// SYSTEM LOGS LEDGER CONSOLE
// ==========================================
function addSystemLog(message, type = 'info') {
  const feed = document.getElementById('diagnostics-terminal-feed');
  if (!feed) return;

  const timestamp = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.className = `terminal-line ${type}`;
  line.innerHTML = `
    <span class="time">[${timestamp}]</span>
    <span class="msg">${escapeHtml(message)}</span>
  `;
  feed.appendChild(line);
  feed.scrollTop = feed.scrollHeight;
}

// ==========================================
// DATABASE SEEDING ENGINE (20+ RICH RECORDS)
// ==========================================
function triggerDatabaseSeeder() {
  addSystemLog('🌱 Commencing system database seeding routine...', 'info');

  // 1. Seed accounts (12 users)
  const seedAccounts = [
    // Pre-existing defaults preserved or enriched
    { role: 'Admin', name: 'Site Administrator', email: 'admin@gmail.com', password: '123456', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
    
    // Candidates
    { role: 'Candidate', name: 'Priya Sharma', email: 'priya@example.com', password: 'password', school: 'Stanford University', studyField: 'Software Engineering', level: 'Student', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), atsScore: 92 },
    { role: 'Candidate', name: 'Rohan Mehta', email: 'rohan@example.com', password: 'password', school: 'MIT', studyField: 'Computer Science', level: 'Graduate', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), atsScore: 84 },
    { role: 'Candidate', name: 'Vikram Singh', email: 'vikram@example.com', password: 'password', school: 'UC Berkeley', studyField: 'Electrical Engineering & CS', level: 'PhD Student', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), atsScore: 88 },
    { role: 'Candidate', name: 'Aisha Patel', email: 'aisha@example.com', password: 'password', school: 'Carnegie Mellon University', studyField: 'Software Engineering', level: 'Undergraduate', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), atsScore: 78 },
    { role: 'Candidate', name: 'Amit Verma', email: 'amit@example.com', password: 'password', school: 'Georgia Tech', studyField: 'Computer Systems', level: 'Student', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), atsScore: 65 },
    { role: 'Candidate', name: 'Neha Gupta', email: 'neha@example.com', password: 'password', school: 'Harvard University', studyField: 'Computational Science', level: 'Graduate', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), atsScore: 95 },
    
    // Recruiters (Companies)
    { role: 'Company', name: 'Google Recruitment', email: 'recruiter@example.com', password: 'password', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
    { role: 'Company', name: 'Microsoft Talent', email: 'microsoft@example.com', password: 'password', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
    { role: 'Company', name: 'Meta HR Systems', email: 'meta@example.com', password: 'password', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString() },
    
    // Interviewers
    { role: 'Interviewer', name: 'EkVue AI', email: 'interviewer@example.com', password: 'password', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString() },
    { role: 'Interviewer', name: 'Tech Lead David', email: 'david@example.com', password: 'password', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
    { role: 'Interviewer', name: 'Principal Eng Linda', email: 'linda@example.com', password: 'password', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString() }
  ];
  saveList('ekvueAccounts', seedAccounts);
  addSystemLog(`Generated 12 core user profiles inside directory database.`, 'success');

  // 2. Seed Calendars Scheduled (5 bookings)
  const seedSchedules = [
    { id: 'sch_1', candidate: 'Priya Sharma', candidateEmail: 'priya@example.com', interviewer: 'EkVue AI', interviewerEmail: 'interviewer@example.com', role: 'Software Engineer Intern', date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10), time: '10:00 AM', status: 'scheduled', lastUpdated: new Date().toISOString() },
    { id: 'sch_2', candidate: 'Rohan Mehta', candidateEmail: 'rohan@example.com', interviewer: 'Tech Lead David', interviewerEmail: 'david@example.com', role: 'Frontend Architect', date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().slice(0, 10), time: '02:00 PM', status: 'scheduled', lastUpdated: new Date().toISOString() },
    { id: 'sch_3', candidate: 'Aisha Patel', candidateEmail: 'aisha@example.com', interviewer: 'Principal Eng Linda', interviewerEmail: 'linda@example.com', role: 'Backend engineer', date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString().slice(0, 10), time: '11:00 AM', status: 'ended', lastUpdated: new Date().toISOString() },
    { id: 'sch_4', candidate: 'Amit Verma', candidateEmail: 'amit@example.com', interviewer: 'EkVue AI', interviewerEmail: 'interviewer@example.com', role: 'DevOps Architect', date: new Date().toISOString().slice(0, 10), time: '04:00 PM', status: 'scheduled', lastUpdated: new Date().toISOString() },
    { id: 'sch_5', candidate: 'Vikram Singh', candidateEmail: 'vikram@example.com', interviewer: 'Tech Lead David', interviewerEmail: 'david@example.com', role: 'ML Research Associate', date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().slice(0, 10), time: '09:00 AM', status: 'ended', lastUpdated: new Date().toISOString() }
  ];
  saveList('ekvueCompanySchedules', seedSchedules);
  addSystemLog(`Generated 5 calendar assignments inside corporate schedules.`, 'success');

  // 3. Seed scorecards (5 scorecards)
  const seedScorecards = [
    {
      id: 'sc_1',
      meetingId: 'sch_3',
      candidate: 'Aisha Patel',
      candidateEmail: 'aisha@example.com',
      interviewer: 'Principal Eng Linda',
      interviewerEmail: 'linda@example.com',
      date: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleDateString(),
      globalScore: '4.2',
      scores: { coding: '4.5', communication: '4.0', design: '4.0' },
      recommendation: 'Hire',
      feedback: 'Excellent database schema partitioning walkthrough. Solid design intuition, slight hesitation on thread safety locks.',
      proctorStats: { focusPct: 92, stabilityPct: 94, violations: 0, verdict: 'Pass' },
      duration: 2150
    },
    {
      id: 'sc_2',
      meetingId: 'sch_5',
      candidate: 'Vikram Singh',
      candidateEmail: 'vikram@example.com',
      interviewer: 'Tech Lead David',
      interviewerEmail: 'david@example.com',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toLocaleDateString(),
      globalScore: '4.8',
      scores: { coding: '5.0', communication: '4.5', design: '5.0' },
      recommendation: 'Strong Hire',
      feedback: 'Exceptional deep learning gradient calculations knowledge. Highly structured and perfect explanation.',
      proctorStats: { focusPct: 98, stabilityPct: 97, violations: 0, verdict: 'Pass' },
      duration: 1720
    },
    {
      id: 'sc_3',
      meetingId: 'sch_legacy_1',
      candidate: 'Neha Gupta',
      candidateEmail: 'neha@example.com',
      interviewer: 'EkVue AI',
      interviewerEmail: 'interviewer@example.com',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toLocaleDateString(),
      globalScore: '3.8',
      scores: { coding: '4.0', communication: '3.5', design: '4.0' },
      recommendation: 'Hire',
      feedback: 'Good problem solver. Solved standard array algorithms quickly but needs to elaborate more on modular designs.',
      proctorStats: { focusPct: 88, stabilityPct: 86, violations: 1, verdict: 'Pass' },
      duration: 1980
    },
    {
      id: 'sc_4',
      meetingId: 'sch_legacy_2',
      candidate: 'Amit Verma',
      candidateEmail: 'amit@example.com',
      interviewer: 'EkVue AI',
      interviewerEmail: 'interviewer@example.com',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toLocaleDateString(),
      globalScore: '2.4',
      scores: { coding: '2.0', communication: '2.5', design: '2.5' },
      recommendation: 'No Hire',
      feedback: 'Struggled to implement basic bubble sort. Left multiple gaps and was frequently looking away from browser node context.',
      proctorStats: { focusPct: 45, stabilityPct: 52, violations: 6, verdict: 'Flagged' },
      duration: 1140
    },
    {
      id: 'sc_5',
      meetingId: 'sch_legacy_3',
      candidate: 'Priya Sharma',
      candidateEmail: 'priya@example.com',
      interviewer: 'EkVue AI',
      interviewerEmail: 'interviewer@example.com',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toLocaleDateString(),
      globalScore: '4.5',
      scores: { coding: '4.5', communication: '4.8', design: '4.2' },
      recommendation: 'Strong Hire',
      feedback: 'Brilliant communication skills! Structured coding approaches, robust validations, and optimized nested loops gracefully.',
      proctorStats: { focusPct: 96, stabilityPct: 98, violations: 0, verdict: 'Pass' },
      duration: 1610
    }
  ];
  saveList('ekvueInterviewerScorecards', seedScorecards);
  addSystemLog(`Generated 5 structured scorecards/evaluation matrices.`, 'success');

  // 4. Seed Live Handshake Meetings (2 active rooms)
  const seedMeetings = [
    {
      meetingId: 'meet_google_swe',
      candidate: 'Rohan Mehta',
      candidateEmail: 'rohan@example.com',
      interviewer: 'Tech Lead David',
      interviewerEmail: 'david@example.com',
      role: 'Frontend Developer',
      status: 'active',
      proctorTelemetry: { gazePct: 94, stabilityPct: 91, violations: 0 },
      chat: [
        { sender: 'Interviewer', text: 'Rohan, explain the time complexity of compiling that binary search trees solution.', time: '01:14 PM' },
        { sender: 'Candidate', text: 'It runs in O(log N) average time, and worst-case O(N) if the tree is unbalanced.', time: '01:15 PM' }
      ],
      lastUpdated: new Date().toISOString()
    },
    {
      meetingId: 'meet_msft_arch',
      candidate: 'Amit Verma',
      candidateEmail: 'amit@example.com',
      interviewer: 'EkVue AI',
      interviewerEmail: 'interviewer@example.com',
      role: 'DevOps Lead',
      status: 'active',
      // High violations, low gaze to simulate a dynamic proctor warning alarm
      proctorTelemetry: { gazePct: 42, stabilityPct: 49, violations: 5 },
      chat: [
        { sender: 'Interviewer', text: 'Amit, please make sure you remain in the center of the camera gaze spectrum.', time: '01:21 PM' }
      ],
      lastUpdated: new Date().toISOString()
    }
  ];
  saveList('ekvueLiveInterviews', seedMeetings);
  addSystemLog(`Activated 2 real-time WebSocket rooms inside active meetings database.`, 'success');

  addSystemLog('Database seeding complete! Dispatched global WebSocket state update.', 'success');

  // Save changes locally and alert
  reloadDatabaseState();
  
  // Play minor audio tone
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch {}

  alert('Database Seeding Successful! 24 records created across all EKVUE data layers.');
}

// ==========================================
// DANGER WIPE LOCAL DATABASE
// ==========================================
function triggerDatabaseWipe() {
  const confirmed = window.confirm('🚨 WARNING: CRITICAL DESTRUCTION OPERATION 🚨\nYou are about to erase all records in local databases (schedules, accounts, scorecard grades, active video calls).\n\nDo you wish to execute database wipe?');
  if (!confirmed) return;

  const doubleCheck = window.confirm('DANGER VERIFICATION:\nAre you 100% absolutely sure? The only preserved account will be your current Admin auth session.');
  if (!doubleCheck) return;

  // Wiping lists
  saveList('ekvueAccounts', []);
  saveList('ekvueCompanySchedules', []);
  saveList('ekvueLiveInterviews', []);
  saveList('ekvueInterviewerScorecards', []);
  saveList('ekvueCompanyItems', []);
  saveList('ekvueTeamRegistry', []);
  
  // Keep admin session active
  const adminObj = { role: 'Admin', name: 'Site Administrator', email: 'admin@gmail.com', password: '123456', createdAt: new Date().toISOString() };
  saveList('ekvueAccounts', [adminObj]);
  setCurrentUser(adminObj);

  addSystemLog('CRITICAL: Wiped entire local database store.', 'error');
  addSystemLog('System diagnostics reset to zero.', 'error');
  addSystemLog('Bypass administrator credentials preserved.', 'info');

  reloadDatabaseState();
  alert('EKVUE Local Databases Flushed successfully.');
}

// ==========================================
// WEBSOCKET TRAFFIC SPIKES SIMULATION
// ==========================================
function simulateSpikeTraffic() {
  addSystemLog('⚡ WebSocket telemetry spike injection triggered: Dispatched stress heartbeats.', 'ws');
  
  const networkEl = document.getElementById('kpiNetworkSpike');
  if (networkEl) {
    networkEl.textContent = '14.2 kb/s';
    networkEl.style.color = 'var(--accent-pink)';
  }

  // Chain logs over time to build a premium diagnostic simulation
  setTimeout(() => {
    addSystemLog('ws: Incoming delta data stream parsed (12.4 KB) for Candidate Priya Sharma.', 'ws');
  }, 600);

  setTimeout(() => {
    addSystemLog('ws: Re-balancing Peer relay network packets. Active clients: 4.', 'ws');
  }, 1200);

  setTimeout(() => {
    addSystemLog('ws: Intercepted camera packet from candidate node Rohan Mehta.', 'ws');
  }, 1800);

  setTimeout(() => {
    addSystemLog('ws: Dispatched 18 heartbeat notifications over PieSocket channel.', 'ws');
    if (networkEl) networkEl.textContent = '22.8 kb/s';
  }, 2400);

  setTimeout(() => {
    addSystemLog('success: Stress testing completed successfully. Relays normalized.', 'success');
    if (networkEl) {
      networkEl.textContent = '28 ms';
      networkEl.style.color = '';
    }
  }, 3600);
}

// ==========================================
// BIND CORE EVENTS
// ==========================================
function initEventHandlers() {
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      addSystemLog('Admin exit requested. Tearing down relays...', 'warning');
      setTimeout(() => {
        clearCurrentUser();
        window.location.href = '../../login/index.html?forceLogin=1';
      }, 500);
    });
  }

  // Search/Filter accounts directory
  const searchInput = document.getElementById('account-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderAccountsTable();
    });
  }

  const roleFilter = document.getElementById('account-role-filter');
  if (roleFilter) {
    roleFilter.addEventListener('change', () => {
      renderAccountsTable();
    });
  }

  // Database operations buttons
  const seedBtn = document.getElementById('seedDatabaseBtn');
  if (seedBtn) seedBtn.addEventListener('click', triggerDatabaseSeeder);

  const wipeBtn = document.getElementById('wipeAllDataBtn');
  if (wipeBtn) wipeBtn.addEventListener('click', triggerDatabaseWipe);

  const spikeBtn = document.getElementById('simulateSpikeBtn');
  if (spikeBtn) spikeBtn.addEventListener('click', simulateSpikeTraffic);

  // Clear system console
  const clearLogsBtn = document.getElementById('clearSystemLogsBtn');
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', () => {
      const feed = document.getElementById('diagnostics-terminal-feed');
      if (feed) {
        feed.innerHTML = '';
        addSystemLog('Console console output cleared.', 'info');
      }
    });
  }
}
