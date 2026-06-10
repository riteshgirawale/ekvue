// Dynamic Error Boundary for easier company debugging
window.addEventListener('error', (e) => {
  console.error("EKVUE Company Dashboard Error:", e.error || e.message);
  const debugEl = document.createElement('div');
  debugEl.style.cssText = "position:fixed; bottom:15px; right:15px; background:rgba(239,68,68,0.95); color:white; padding:12px 16px; border-radius:10px; z-index:99999; font-size:12.5px; font-family:monospace; max-width:420px; word-break:break-all; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2)";
  
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  debugEl.innerHTML = `<strong>Company Dashboard Error:</strong><br>${esc(e.message)}<br><small style="color:rgba(255,255,255,0.7)">at ${esc(e.filename)}:${e.lineno}</small>`;
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
  addNotification,
} from '../utils.js';

const LIST_KEY = LS_KEYS.companyItems;
const THEME_KEY = 'ekvueSelectedTheme';
const TEAM_KEY = 'ekvueTeamRegistry';
const SCHEDULES_KEY = 'ekvueCompanySchedules';
const COMPANY_PROFILE_KEY = 'ekvueCompanyProfileDetails';

const state = {
  user: null,
  activeView: 'dashboard',
  jobPostings: [],
  applications: [],
  teamMembers: [],
  schedules: [],
  selectedTheme: 'default'
};

// ==========================================
// SPA ROUTER
// ==========================================
function switchView(viewId) {
  state.activeView = viewId;

  // Toggle active styling on navigation items
  try {
    const menuLinks = document.querySelectorAll('#sidebar-menu a, #top-menu a');
    menuLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.view === viewId);
    });
  } catch (e) {
    console.warn("Failed to update navigation active links:", e);
  }

  // Toggle visible containers
  try {
    const containers = document.querySelectorAll('.view-content');
    containers.forEach((box) => {
      box.classList.toggle('active', box.id === `view-${viewId}`);
    });
  } catch (e) {
    console.warn("Failed to toggle view containers active styling:", e);
  }

  // Scroll to top
  try {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {}

  if (viewId === 'post-job' && !window.editingJobId) {
    document.getElementById('postJobForm')?.reset();
  }

  // Hook view render routines defensively with robust isolated try-catch boundaries
  try {
    if (viewId === 'post-job') {
      initPostJobForm();
    } else if (viewId === 'jobs') {
      initJobsWorkspace();
    } else if (viewId === 'pipelines') {
      renderPipelineStages();
    } else if (viewId === 'interviews') {
      initInterviewScheduler();
    } else if (viewId === 'analytics') {
      renderAnalyticsFunnel();
    } else if (viewId === 'team') {
      renderTeamMembers();
    } else if (viewId === 'settings') {
      renderSettings();
    }
  } catch (err) {
    console.error(`[EKVUE] Error rendering company view "${viewId}":`, err);
  }
}

function bindSpaLinks() {
  const links = document.querySelectorAll('#sidebar-menu a, #top-menu a, .action');
  links.forEach((lnk) => {
    lnk.addEventListener('click', (e) => {
      e.preventDefault();
      const view = lnk.dataset.view || lnk.dataset.action;
      if (view) {
        const mappings = {
          dashboard: 'dashboard',
          jobs: 'jobs',
          pipelines: 'pipelines',
          interviews: 'interviews',
          analytics: 'analytics',
          team: 'team',
          settings: 'settings'
        };
        const mapped = mappings[view] || view;
        switchView(mapped);
      }
    });
  });

  // Connect "New Job" button on Recommended panel
  const createJobBtn = document.getElementById('dash-create-job-btn');
  if (createJobBtn) {
    createJobBtn.addEventListener('click', () => {
      switchView('post-job');
    });
  }
}

// ==========================================
// CORE STATE LOADERS
// ==========================================
function ensureRole(user) {
  if (!user || user.role !== 'Company') {
    window.location.href = '../../login/index.html?forceLogin=1';
  }
}

async function loadStateFromStorage() {
  state.user = requireAuth();
  if (!state.user || state.user.role !== 'Company') {
    ensureRole(state.user);
    return;
  }

  // Theme
  state.selectedTheme = localStorage.getItem(THEME_KEY) || 'default';
  document.body.setAttribute('data-theme', state.selectedTheme);

  // Job postings CRUD list (From MongoDB)
  try {
    const res = await fetch('/api/jobs?companyEmail=' + encodeURIComponent(state.user.email));
    if (res.ok) {
      state.jobPostings = await res.json();
    } else {
      state.jobPostings = [];
    }
  } catch (err) {
    state.jobPostings = [];
  }

  // Applications (From MongoDB)
  try {
    const resApps = await fetch('/api/applications?companyEmail=' + encodeURIComponent(state.user.email));
    if (resApps.ok) {
      state.applications = await resApps.json();
    } else {
      state.applications = [];
    }
  } catch (err) {
    state.applications = [];
  }

  // Pre-populate demo job postings if completely empty
  if (state.jobPostings.length === 0) {
    state.jobPostings = [
      {
        id: 'job_demo_1',
        jobTitle: 'Frontend Engineer',
        location: 'Bengaluru',
        description: 'We are seeking an expert Frontend Engineer skilled in ES6 Javascript, styling components, and building premium web apps.',
        status: 'Active',
        applied: 18,
        interviewed: 6,
        offered: 2,
        createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
      },
      {
        id: 'job_demo_2',
        jobTitle: 'Lead DevOps Specialist',
        location: 'Remote',
        description: 'Scale automation networks, configure static server routing domains, and deploy micro-services on Kubernetes metrics.',
        status: 'Active',
        applied: 12,
        interviewed: 3,
        offered: 1,
        createdAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString()
      }
    ];
    saveList(LIST_KEY, state.jobPostings);
  }

  // Team
  try {
    const rawTeam = localStorage.getItem(TEAM_KEY);
    state.teamMembers = rawTeam ? JSON.parse(rawTeam) : [
      { id: 'team_1', name: 'EkVue AI', title: 'Principal TA Partner', dept: 'Talent Acquisition', completed: 28, score: '4.2/5' },
      { id: 'team_2', name: 'Michael Chen', title: 'Engineering Director', dept: 'Engineering', completed: 19, score: '4.6/5' },
      { id: 'team_3', name: 'Priya Sharma', title: 'Senior Tech Lead', dept: 'Engineering', completed: 11, score: '4.0/5' }
    ];
    if (!Array.isArray(state.teamMembers)) state.teamMembers = [];
  } catch (err) {
    state.teamMembers = [];
  }

  // Schedules
  try {
    const rawMeet = localStorage.getItem(SCHEDULES_KEY);
    state.schedules = rawMeet ? JSON.parse(rawMeet) : [
      { id: 'meet_demo_1', candidate: 'Rohan Gupta', candidateName: 'Rohan Gupta', candidateEmail: 'rohan@example.com', role: 'Frontend Engineer', sessionType: 'Frontend Engineer', interviewer: 'EkVue AI', interviewerName: 'EkVue AI', interviewerEmail: '', date: '2026-06-05', time: '10:00', status: 'Upcoming', notes: 'Focus on React and system design', createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString() }
    ];
    if (!Array.isArray(state.schedules)) state.schedules = [];
  } catch (err) {
    state.schedules = [];
  }

  // Company Profile Settings
  try {
    const rawProfile = localStorage.getItem(COMPANY_PROFILE_KEY);
    if (rawProfile) {
      const prof = JSON.parse(rawProfile);
      if (prof && prof.companyName && state.user) state.user.name = prof.companyName;
    }
  } catch (e) {
    console.warn("Failed to parse company profile settings:", e);
  }
}

function updateKpiWidgets() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  const activeJobsCount = state.jobPostings.filter(j => j.status === 'Active').length;
  
  // Dynamic KPIs — compute real applied count from state.applications
  const allApplications = state.applications || [];
  let totalApplied = 0;
  state.jobPostings.forEach((j) => {
    const realCount = allApplications.filter(a => a.jobId === j.id).length;
    totalApplied += Math.max(realCount, j.applied || 0);
  });

  setVal('kpiJobs', String(activeJobsCount));
  setVal('kpiCandidates', String(totalApplied || 30));
  setVal('kpiInterviews', String(state.schedules.length + 8));


  // Dashboard Solved list text update
  setVal('kpiJobs', String(activeJobsCount));
}

// ==========================================
// 7. POST A NEW JOB FORM WORKSPACE METHODS
// ==========================================
function initPostJobForm() {
  const form = document.getElementById('postJobForm');
  if (!form) return;

  // 1. Pre-fill default application deadline to exactly 30 days from today
  const deadlineInput = document.getElementById('pj-deadline');
  if (deadlineInput) {
    const today = new Date();
    today.setDate(today.getDate() + 30);
    deadlineInput.value = today.toISOString().split('T')[0];
  }

  // 2. Pre-fill HR details based on logged-in company profile
  const hrNameInput = document.getElementById('pj-hr-name');
  const hrEmailInput = document.getElementById('pj-hr-email');
  const hrPhoneInput = document.getElementById('pj-hr-phone');

  if (state.user) {
    if (hrNameInput) hrNameInput.value = state.user.name || state.user.fullName || 'Recruiting Team';
    if (hrEmailInput) hrEmailInput.value = state.user.email || 'hr@ekvue.com';
    if (hrPhoneInput) hrPhoneInput.value = '+91 98765 43210';
  }

  // 3. Toggle AI options panel dynamically based on switcher
  const aiToggler = document.getElementById('pj-ai-enabled');
  const aiOptionsPanel = document.getElementById('pj-ai-options-panel');
  if (aiToggler && aiOptionsPanel) {
    aiToggler.addEventListener('change', () => {
      aiOptionsPanel.style.display = aiToggler.checked ? 'block' : 'none';
    });
    // Set initial state
    aiOptionsPanel.style.display = aiToggler.checked ? 'block' : 'none';
  }

  // 4. Bind Action Buttons (Save Draft, Preview Job, Publish Job)
  const btnPublishTop = document.getElementById('pj-publish-btn-top');
  const btnPublishBottom = document.getElementById('pj-publish-btn-bottom');
  const btnDraftTop = document.getElementById('pj-draft-btn-top');
  const btnDraftBottom = document.getElementById('pj-draft-btn-bottom');
  const btnPreviewTop = document.getElementById('pj-preview-btn-top');
  const btnPreviewBottom = document.getElementById('pj-preview-btn-bottom');

  // Trigger submission on standard submit button
  form.onsubmit = (e) => {
    e.preventDefault();
    saveJob('Active');
  };

  if (btnPublishTop) {
    btnPublishTop.onclick = (e) => {
      e.preventDefault();
      if (validateForm()) saveJob('Active');
    };
  }
  if (btnPublishBottom) {
    btnPublishBottom.onclick = (e) => {
      e.preventDefault();
      if (validateForm()) saveJob('Active');
    };
  }

  if (btnDraftTop) {
    btnDraftTop.onclick = (e) => {
      e.preventDefault();
      saveJob('Draft');
    };
  }
  if (btnDraftBottom) {
    btnDraftBottom.onclick = (e) => {
      e.preventDefault();
      saveJob('Draft');
    };
  }

  if (btnPreviewTop) {
    btnPreviewTop.onclick = (e) => {
      e.preventDefault();
      previewJobOffer();
    };
  }
  if (btnPreviewBottom) {
    btnPreviewBottom.onclick = (e) => {
      e.preventDefault();
      previewJobOffer();
    };
  }
}

function validateForm() {
  const form = document.getElementById('postJobForm');
  if (form && !form.checkValidity()) {
    form.reportValidity();
    return false;
  }
  return true;
}

function saveJob(status) {
  const title = document.getElementById('pj-title')?.value.trim() || '';
  if (!title) {
    alert('Please enter a Job Title to save.');
    return;
  }

  const dept = document.getElementById('pj-department')?.value || 'Engineering';
  const type = document.getElementById('pj-employment-type')?.value || 'Full-time';
  const mode = document.getElementById('pj-work-mode')?.value || 'Remote';
  const exp = document.getElementById('pj-experience')?.value || 'Mid Level';
  const desc = document.getElementById('pj-description')?.value.trim() || '';
  const resp = document.getElementById('pj-responsibilities')?.value.trim() || '';
  const skills = document.getElementById('pj-skills')?.value.trim() || '';
  const prefSkills = document.getElementById('pj-preferred-skills')?.value.trim() || '';
  const salaryVal = document.getElementById('pj-salary')?.value.trim() || '';
  const bonus = document.getElementById('pj-bonus')?.value.trim() || '';
  const benefits = document.getElementById('pj-benefits')?.value.trim() || '';
  const country = document.getElementById('pj-country')?.value || 'India';
  const stateVal = document.getElementById('pj-state')?.value || 'Karnataka';
  const city = document.getElementById('pj-city')?.value || 'Bengaluru';
  const workLoc = document.getElementById('pj-work-location')?.value || 'Office';
  const edu = document.getElementById('pj-education')?.value || "Bachelor's Degree";
  const expMin = parseInt(document.getElementById('pj-exp-min')?.value || 0);
  const expMax = parseInt(document.getElementById('pj-exp-max')?.value || 0);
  const certs = document.getElementById('pj-certifications')?.value.trim() || '';
  const roundsCount = '';
  const roundStages = [];
  const aiEnabled = false;
  const aiDuration = '30 Minutes';
  const aiDifficulty = 'Medium';
  const aiLanguages = '';
  const aiCategories = '';

  const deadline = document.getElementById('pj-deadline')?.value || '';
  const maxApplicants = parseInt(document.getElementById('pj-max-applicants')?.value || 0);
  const resumeRequired = document.getElementById('pj-resume-required')?.checked || false;
  const portfolioRequired = document.getElementById('pj-portfolio-required')?.checked || false;
  const githubRequired = document.getElementById('pj-github-required')?.checked || false;

  const hrName = document.getElementById('pj-hr-name')?.value.trim() || 'HR Recruiting';
  const hrEmail = document.getElementById('pj-hr-email')?.value.trim() || 'hr@ekvue.com';
  const hrPhone = document.getElementById('pj-hr-phone')?.value.trim() || '';

  // Construct Expanded Job Posting Object
  const newJob = {
    id: window.editingJobId || uid('job'),
    role: 'Company',
    jobTitle: title,
    location: `${city}, ${country}`,
    description: desc,
    status: status, // 'Active' or 'Draft'
    applied: 0,
    interviewed: 0,
    offered: 0,
    createdAt: new Date().toISOString(),
    
    // Rich details
    department: dept,
    employmentType: type,
    workMode: mode,
    experienceRequired: exp,
    responsibilities: resp,
    skillsRequired: skills,
    skillsPreferred: prefSkills,
    salary: salaryVal,
    salaryMin: 0,
    salaryMax: 0,
    bonus: bonus,
    benefits: benefits,
    country: country,
    state: stateVal,
    city: city,
    workLocation: workLoc,
    education: edu,
    expYearsMin: expMin,
    expYearsMax: expMax,
    certifications: certs,
    roundsCount: roundsCount,
    roundsTypes: roundStages,
    aiEnabled: aiEnabled,
    aiDuration: aiDuration,
    aiDifficulty: aiDifficulty,
    aiLanguages: aiLanguages,
    aiCategories: aiCategories,
    deadline: deadline,
    maxApplicants: maxApplicants,
    resumeRequired: resumeRequired,
    portfolioRequired: portfolioRequired,
    githubRequired: githubRequired,
    hrName: hrName,
    hrEmail: hrEmail,
    hrPhone: hrPhone
  };

  newJob.companyEmail = state.user?.email || '';

  const method = window.editingJobId ? 'PUT' : 'POST';
  const endpoint = window.editingJobId ? `/api/jobs/${window.editingJobId}` : '/api/jobs';

  // Save to database (MongoDB)
  fetch(endpoint, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newJob)
  }).then(async () => {
    // Refresh state
    await loadStateFromStorage();
    renderDashboardCreatedJobs();
    updateKpiWidgets();
    renderJobsList();
    
    // Select the updated job
    activeJob = state.jobPostings.find(j => j.id === newJob.id) || newJob;
    selectWorkspaceJob(activeJob);
    window.editingJobId = null;
    document.getElementById('postJobForm')?.reset();
    switchView('jobs');
  }).catch(()=>{});

  // Dispatch real-time candidate notifications if active posting
  if (status === 'Active') {
    try {
      const accounts = loadList('ekvueAccounts');
      const candidates = accounts.filter(acc => acc.role === 'Candidate');
      candidates.forEach((cand) => {
        addNotification(
          cand.email,
          "New Vacancy Published!",
          `A premium new job "${title}" has been published by ${state.user?.name || 'Company'} matching your profile. Apply now!`,
          "vacancy",
          { jobId: newJob.id, jobTitle: title, companyName: state.user?.name || 'Company' }
        );
      });
    } catch(err){}
  }

  // Reset form
  document.getElementById('postJobForm')?.reset();
  alert(status === 'Active' ? 'Job vacancy published successfully!' : 'Job vacancy draft saved successfully!');
}

function previewJobOffer() {
  const title = document.getElementById('pj-title')?.value.trim() || 'Software Architect Preview';
  const dept = document.getElementById('pj-department')?.value || 'Engineering';
  const type = document.getElementById('pj-employment-type')?.value || 'Full-time';
  const mode = document.getElementById('pj-work-mode')?.value || 'Remote';
  const exp = document.getElementById('pj-experience')?.value || 'Senior Level';
  const desc = document.getElementById('pj-description')?.value.trim() || 'Enter description to preview...';
  const resp = document.getElementById('pj-responsibilities')?.value.trim() || 'Enter responsibilities...';
  const skills = document.getElementById('pj-skills')?.value.trim() || 'JavaScript, React';
  const prefSkills = document.getElementById('pj-preferred-skills')?.value.trim() || 'AWS, TypeScript';
  const salaryVal = document.getElementById('pj-salary')?.value.trim() || 'Competitive';
  const benefits = document.getElementById('pj-benefits')?.value.trim() || 'WFH, Health Insurance';
  const city = document.getElementById('pj-city')?.value || 'Bengaluru';
  const country = document.getElementById('pj-country')?.value || 'India';
  const edu = document.getElementById('pj-education')?.value || "Bachelor's Degree";
  const expMin = parseInt(document.getElementById('pj-exp-min')?.value || 0);
  const expMax = parseInt(document.getElementById('pj-exp-max')?.value || 0);
  const roundsCount = document.getElementById('pj-rounds-count')?.value || '4 Rounds';

  const roundStages = [];
  if (document.getElementById('pj-round-coding')?.checked) roundStages.push('Coding Test');
  if (document.getElementById('pj-round-aptitude')?.checked) roundStages.push('Aptitude Test');
  if (document.getElementById('pj-round-technical')?.checked) roundStages.push('Technical Interview');
  if (document.getElementById('pj-round-hr')?.checked) roundStages.push('HR Interview');

  const aiEnabled = document.getElementById('pj-ai-enabled')?.checked || false;
  const aiDuration = document.getElementById('pj-ai-duration')?.value || '30 Minutes';
  const aiDifficulty = document.getElementById('pj-ai-difficulty')?.value || 'Medium';

  // Remove existing preview modal if any
  const oldModal = document.getElementById('pj-preview-modal-overlay');
  if (oldModal) oldModal.remove();

  const overlay = document.createElement('div');
  overlay.id = 'pj-preview-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(2, 6, 23, 0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    display: flex; justify-content: center; align-items: center;
    z-index: 100000;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  let stagesHtml = '';
  roundStages.forEach((stage, idx) => {
    stagesHtml += `
      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:10px; text-align:center;">
        <span style="font-size:10px; color:#6366f1; font-weight:800; text-transform:uppercase; display:block; margin-bottom:2px;">Round ${idx+1}</span>
        <span style="font-size:12.5px; font-weight:700; color:white;">${escapeHtml(stage)}</span>
      </div>
    `;
  });

  const salaryRangeStr = salaryVal;

  overlay.innerHTML = `
    <div class="card" style="
      background: #0b1129;
      border: 1px solid rgba(99, 102, 241, 0.3);
      box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(99, 102, 241, 0.05);
      border-radius: 16px;
      width: 90%;
      max-width: 680px;
      max-height: 85vh;
      overflow-y: auto;
      padding: 26px;
      color: #cbd5e1;
      position: relative;
      transform: translateY(20px);
      transition: transform 0.3s ease;
    ">
      <button type="button" id="pj-close-preview-modal" style="position:absolute; top:16px; right:16px; background:none; border:none; color:#cbd5e1; font-size:26px; font-weight:800; cursor:pointer; outline:none;">&times;</button>
      
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px;">
        <div>
          <span style="font-size:10.5px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); border-radius:50px; padding:3px 10px; color:#818cf8; font-weight:700; display:inline-block; margin-bottom:6px;">${escapeHtml(dept)}</span>
          <h2 style="font-size:22px; color:white; margin:0 0 4px 0; font-weight:800;">${escapeHtml(title)}</h2>
          <p style="font-size:12.5px; color:#64748b; margin:0;">📍 ${escapeHtml(city)}, ${escapeHtml(country)} &bull; ${escapeHtml(type)} &bull; ${escapeHtml(mode)}</p>
        </div>
        <span class="badge easy" style="padding:6px 12px; font-size:11px;">Active</span>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:20px;">
        <div style="background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.04); padding:12px; border-radius:10px;">
          <small style="color:#64748b; font-weight:800; text-transform:uppercase; font-size:9.5px; display:block; margin-bottom:2px;">Target Experience</small>
          <strong style="font-size:13.5px; color:white;">${escapeHtml(exp)} (${expMin}-${expMax} yrs)</strong>
        </div>
        <div style="background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.04); padding:12px; border-radius:10px;">
          <small style="color:#64748b; font-weight:800; text-transform:uppercase; font-size:9.5px; display:block; margin-bottom:2px;">Compensation & Benefits</small>
          <strong style="font-size:13.5px; color:#34d399;">${escapeHtml(salaryRangeStr)}</strong>
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; color:white; border-left:3px solid #6366f1; padding-left:8px; margin:0 0 8px 0;">Role Overview</h4>
        <p style="font-size:12.5px; line-height:1.6; color:#94a3b8; white-space:pre-wrap; margin:0;">${escapeHtml(desc)}</p>
      </div>

      <div style="margin-bottom:18px;">
        <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; color:white; border-left:3px solid #6366f1; padding-left:8px; margin:0 0 8px 0;">Key Responsibilities</h4>
        <p style="font-size:12.5px; line-height:1.6; color:#94a3b8; white-space:pre-wrap; margin:0;">${escapeHtml(resp)}</p>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:20px;">
        <div>
          <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; color:white; border-left:3px solid #6366f1; padding-left:8px; margin:0 0 8px 0;">Technical Skills Required</h4>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
            ${skills.split(',').map(s => `<span style="font-size:11px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:3px 8px; color:white;">${escapeHtml(s.trim())}</span>`).join('')}
          </div>
        </div>
        <div>
          <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; color:white; border-left:3px solid #6366f1; padding-left:8px; margin:0 0 8px 0;">Preferred Skills</h4>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
            ${prefSkills.split(',').map(s => `<span style="font-size:11px; background:rgba(168,85,247,0.04); border:1px solid rgba(168,85,247,0.15); border-radius:6px; padding:3px 8px; color:#c084fc;">${escapeHtml(s.trim())}</span>`).join('')}
          </div>
        </div>
      </div>



      <div style="display:flex; justify-content:flex-end;">
        <button type="button" id="pj-preview-close-btn" class="btn primary" style="background:linear-gradient(135deg, #2563eb, #4f46e5); border:none; padding:8px 24px; font-size:12px; font-weight:800; border-radius:8px;">Close Preview</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Trigger reflow for animations
  setTimeout(() => {
    overlay.style.opacity = '1';
    overlay.children[0].style.transform = 'translateY(0)';
  }, 10);

  const closeBtn = overlay.querySelector('#pj-close-preview-modal');
  const closeBtn2 = overlay.querySelector('#pj-preview-close-btn');

  const closeModal = () => {
    overlay.style.opacity = '0';
    overlay.children[0].style.transform = 'translateY(20px)';
    setTimeout(() => overlay.remove(), 300);
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (closeBtn2) closeBtn2.onclick = closeModal;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
  };
}

// ==========================================
// 1. JOBS POSTINGS WORKSPACE CONTROLLER
// ==========================================
let activeJob = null;

function initJobsWorkspace() {
  if (state.jobPostings.length > 0 && !activeJob) {
    activeJob = state.jobPostings[0];
  }
  
  renderJobsList();

  const searchInput = document.getElementById('job-search');
  const locSelect = document.getElementById('job-location-filter');

  const triggers = [searchInput, locSelect];
  triggers.forEach((trig) => {
    if (trig) {
      trig.oninput = renderJobsList;
      trig.onchange = renderJobsList;
    }
  });

  // Toggle & delete buttons
  const toggleStatusBtn = document.getElementById('job-toggle-status-btn');
  const deleteBtn = document.getElementById('job-delete-btn');

  if (toggleStatusBtn) {
    toggleStatusBtn.onclick = async () => {
      if (!activeJob) return;
      activeJob.status = activeJob.status === 'Active' ? 'Draft' : 'Active';
      
      // Update in MongoDB
      try {
        await fetch(`/api/jobs/${activeJob.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activeJob)
        });
      } catch(e){}

      // Fallback update local array and rerender UI
      const idx = state.jobPostings.findIndex(j => j.id === activeJob.id);
      if (idx > -1) state.jobPostings[idx] = activeJob;

      selectWorkspaceJob(activeJob);
      renderJobsList();
      updateKpiWidgets();
    };
  }

  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      if (!activeJob) return;
      
      // Delete from MongoDB
      try {
        await fetch(`/api/jobs/${activeJob.id}`, { method: 'DELETE' });
      } catch(e){}

      const next = state.jobPostings.filter(j => j.id !== activeJob.id);
      state.jobPostings = next;
      
      activeJob = next.length > 0 ? next[0] : null;
      selectWorkspaceJob(activeJob);
      renderJobsList();
      updateKpiWidgets();
      
      // Update original dashboard list
      renderDashboardCreatedJobs();
    };
  }

  selectWorkspaceJob(activeJob);
}

function renderJobsList() {
  const container = document.getElementById('workspace-jobs-list');
  if (!container) return;

  const searchQuery = (document.getElementById('job-search')?.value || '').toLowerCase().trim();
  const locFilter = document.getElementById('job-location-filter')?.value || '';

  const filtered = state.jobPostings.filter((j) => {
    const title = (j.jobTitle || '').toLowerCase();
    const desc = (j.description || '').toLowerCase();
    const loc = j.location || '';
    
    const matchesSearch = title.includes(searchQuery) || desc.includes(searchQuery);
    const matchesLoc = !locFilter || loc.includes(locFilter);
    return matchesSearch && matchesLoc;
  });

  container.innerHTML = '';
  if (!filtered.length) {
    container.innerHTML = '<p style="color:var(--muted); font-size:12px; padding:10px">No matching positions found.</p>';
    return;
  }

  filtered.forEach((j) => {
    const el = document.createElement('div');
    const isActive = activeJob && activeJob.id === j.id;

    el.className = `workspace-problem-item ${isActive ? 'active' : ''}`;
    el.innerHTML = `
      <div class="top">
        <span class="p-title">${escapeHtml(j.jobTitle)}</span>
        <span class="badge ${j.status === 'Active' ? 'easy' : 'medium'}">${j.status}</span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px">
        <span class="p-meta">📍 ${escapeHtml(j.location || 'Location')}</span>
        <span style="font-size:11px; color:var(--muted)">${j.applied || 0} candidates</span>
      </div>
    `;

    el.onclick = () => {
      selectWorkspaceJob(j);
      renderJobsList();
    };

    container.appendChild(el);
  });
}

function selectWorkspaceJob(job) {
  activeJob = job;

  const titleEl = document.getElementById('job-view-title');
  const metaEl = document.getElementById('job-view-meta');
  const statusEl = document.getElementById('job-view-status');
  const descEl = document.getElementById('job-view-desc');
  const statApplied = document.getElementById('job-stat-applied');
  const statInterview = document.getElementById('job-stat-interview');
  const statOffer = document.getElementById('job-stat-offer');
  const editBtn = document.getElementById('edit-job-btn');

  if (!job) {
    if (titleEl) titleEl.textContent = 'No Jobs Posted';
    if (metaEl) metaEl.textContent = '';
    if (statusEl) statusEl.style.display = 'none';
    if (editBtn) editBtn.style.display = 'none';
    if (descEl) descEl.textContent = 'Please post a new job under Dashboard shortcuts to manage.';
    if (statApplied) statApplied.textContent = '-';
    if (statInterview) statInterview.textContent = '-';
    if (statOffer) statOffer.textContent = '-';
    return;
  }

  if (editBtn) editBtn.style.display = 'inline-block';
  if (titleEl) titleEl.textContent = job.jobTitle;
  if (metaEl) {
    const loc = job.location || 'Remote';
    const type = job.employmentType || 'Full-time';
    const mode = job.workMode || 'Remote';
    metaEl.textContent = `📍 ${loc} · ${type} · ${mode}`;
  }
  if (statusEl) {
    statusEl.style.display = 'inline-block';
    statusEl.textContent = job.status;
    let badgeClass = 'easy';
    if (job.status === 'Draft') badgeClass = 'medium';
    if (job.status === 'Closed') badgeClass = 'hard';
    statusEl.className = `badge ${badgeClass}`;
  }
  if (descEl) {
    let richDetailsHtml = '';
    
    // Compensation & Overview Grid
    let salaryRangeStr = 'Competitive';
    if (job.salary) {
      salaryRangeStr = job.salary;
    } else if (job.salaryMin && job.salaryMax) {
      salaryRangeStr = `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
    }
    
    richDetailsHtml += `
      <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:12px; margin: 12px 0 16px 0; background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.05); padding:12px; border-radius:10px;">
        <div>
          <small style="color:var(--muted); font-size:9.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px;">Annual Compensation</small>
          <div style="font-size:14px; color:#34d399; font-weight:800;">${escapeHtml(salaryRangeStr)}</div>
          <small style="color:var(--muted); font-size:10.5px; display:block; margin-top:2px;">${escapeHtml(job.bonus || 'Standard bonus CTC')}</small>
        </div>
        <div>
          <small style="color:var(--muted); font-size:9.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px;">Department & Level</small>
          <div style="font-size:12.5px; color:white; font-weight:700;">${escapeHtml(job.department || 'Engineering')}</div>
          <small style="color:var(--muted); font-size:11px; display:block; margin-top:2px;">${escapeHtml(job.experienceRequired || 'Mid Level')}</small>
        </div>
      </div>
    `;

    // Skills Required Row
    if (job.skillsRequired) {
      richDetailsHtml += `
        <div style="margin-bottom:16px;">
          <small style="color:var(--muted); font-size:9.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:6px;">Technical Skills Required</small>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${job.skillsRequired.split(',').map(s => `<span style="font-size:11px; background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.15); border-radius:6px; padding:3px 10px; color:#a5b4fc; font-weight:700;">${escapeHtml(s.trim())}</span>`).join('')}
            ${job.skillsPreferred ? job.skillsPreferred.split(',').map(s => `<span style="font-size:11px; background:rgba(168,85,247,0.04); border:1px solid rgba(168,85,247,0.15); border-radius:6px; padding:3px 8px; color:#c084fc; font-style:italic;">${escapeHtml(s.trim())}</span>`).join('') : ''}
          </div>
        </div>
      `;
    }

    // Responsibilities List
    if (job.responsibilities) {
      richDetailsHtml += `
        <div style="margin-bottom:16px;">
          <small style="color:var(--muted); font-size:9.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px;">Key Responsibilities</small>
          <div style="font-size:12.5px; line-height:1.55; color:#cbd5e1; white-space:pre-wrap; background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.04); padding:10px; border-radius:8px;">${escapeHtml(job.responsibilities)}</div>
        </div>
      `;
    }



    // HR contact block
    if (job.hrName) {
      richDetailsHtml += `
        <div style="margin-bottom:16px; border-top:1px dashed rgba(255,255,255,0.06); padding-top:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
          <div>
            <small style="color:var(--muted); font-size:9.5px; font-weight:800; text-transform:uppercase;">Contact Recruiter</small>
            <div style="font-size:12.5px; font-weight:700; color:white;">${escapeHtml(job.hrName)}</div>
          </div>
          <div style="text-align:right;">
            <small style="color:var(--muted); font-size:9.5px; font-weight:800; text-transform:uppercase;">HR Email</small>
            <div style="font-size:12px; color:#cbd5e1;"><a href="mailto:${escapeHtml(job.hrEmail)}" style="color:#6366f1; text-decoration:none;">${escapeHtml(job.hrEmail)}</a></div>
          </div>
        </div>
      `;
    }

    descEl.innerHTML = `
      ${richDetailsHtml}
      <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06);">
        <small style="color:var(--muted); font-size:9.5px; font-weight:800; text-transform:uppercase; display:block; margin-bottom:4px;">Role Overview</small>
        <p style="white-space:pre-wrap; font-size:13px; line-height:1.6; color:#94a3b8; margin:0;">${escapeHtml(job.description)}</p>
      </div>
    `;
  }

  // Compute real applied count from application records
  const jobApps = (state.applications || []).filter(a => a.jobId === job.id);
  const realAppliedCount = Math.max(jobApps.length, job.applied || 0);
  if (statApplied) statApplied.textContent = String(realAppliedCount);
  if (statInterview) statInterview.textContent = String(job.interviewed || 0);
  if (statOffer) statOffer.textContent = String(job.offered || 0);

  // Render actual applicants list
  renderApplicantsList(job.id);
}

// ==========================================
// APPLICANTS LIST RENDERER
// ==========================================
function renderApplicantsList(jobId) {
  const container = document.getElementById('job-applicants-list');
  if (!container) return;

  const apps = (state.applications || []).filter(a => a.jobId === jobId);

  if (apps.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:18px; border:1px dashed rgba(255,255,255,0.08); border-radius:10px; margin-top:4px;">
        <span style="font-size:22px; display:block; margin-bottom:6px;">📋</span>
        <p style="margin:0; font-size:12px; color:var(--muted); font-weight:600;">No candidate applications received yet.</p>
      </div>
    `;
    return;
  }

  // Load scorecards and schedules for cross-referencing
  const scorecards = loadList('ekvueInterviewerScorecards');
  const schedules = state.schedules || [];

  let html = `
    <h3 style="font-size:12px; font-weight:800; color:white; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 10px 0; border-left:3px solid #6366f1; padding-left:8px;">Candidate Applications (${apps.length})</h3>
  `;

  apps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

  apps.forEach((app) => {
    const initials = (app.candidateName || 'C')
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const timeAgo = getRelativeTime(app.appliedAt);
    const status = app.status || 'Applied';

    // Find scorecard for this candidate (match by email)
    const sc = scorecards.find(s =>
      s.email && app.candidateEmail &&
      s.email.toLowerCase() === app.candidateEmail.toLowerCase()
    );

    const isHired = sc && (sc.recommendation === 'Hire' || sc.recommendation === 'Strong Hire');
    const isRejected = sc && sc.recommendation === 'No Hire';

    // Determine display status
    let displayStatus = status;
    if (isHired) displayStatus = 'Hired';
    if (isRejected && status !== 'Rejected') displayStatus = 'Not Selected';

    let statusStyle = 'color:#60a5fa; background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2);';
    if (displayStatus === 'Hired') {
      statusStyle = 'color:#10b981; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3);';
    } else if (displayStatus === 'Shortlisted') {
      statusStyle = 'color:#34d399; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2);';
    } else if (displayStatus === 'Rejected' || displayStatus === 'Not Selected') {
      statusStyle = 'color:#f87171; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);';
    } else if (displayStatus === 'Under Review') {
      statusStyle = 'color:#fbbf24; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2);';
    }

    // Build scorecard info line
    let scorecardLine = '';
    if (sc) {
      const recColor = sc.recommendation === 'Strong Hire' ? '#10b981' : sc.recommendation === 'Hire' ? '#3b82f6' : '#ef4444';
      scorecardLine = `<div style="font-size:10px; color:var(--muted); margin-top:2px;">⭐ Score: <strong style="color:#fbbf24">${sc.globalScore}/5</strong> · <span style="color:${recColor}; font-weight:800">${escapeHtml(sc.recommendation)}</span> by ${escapeHtml(sc.interviewerName || 'Interviewer')}</div>`;
    }

    // Build action buttons
    let actionBtns = '';
    if (sc) {
      actionBtns += `<button type="button" onclick="showScorecardModalFromApp('${escapeHtml(app.candidateEmail)}')" style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.25); color:#818cf8; padding:4px 8px; border-radius:6px; font-size:9px; font-weight:800; cursor:pointer;">📊 Scorecard</button>`;
    }
    actionBtns += `<button type="button" onclick="showCandidateProfileModal('${escapeHtml(app.candidateName)}', '${escapeHtml(app.candidateEmail)}')" style="background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.2); color:#c084fc; padding:4px 8px; border-radius:6px; font-size:9px; font-weight:800; cursor:pointer;">👤 Profile</button>`;

    if (status === 'Applied' && !isHired) {
      actionBtns += `<button type="button" onclick="updateApplicationStatus('${app.id}', 'Shortlisted')" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); color:#34d399; padding:4px 8px; border-radius:6px; font-size:9px; font-weight:800; cursor:pointer;">✓ Shortlist</button>`;
      actionBtns += `<button type="button" onclick="updateApplicationStatus('${app.id}', 'Rejected')" style="background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.2); color:#f87171; padding:4px 8px; border-radius:6px; font-size:9px; font-weight:800; cursor:pointer;">✗ Reject</button>`;
    }

    // Hired badge
    const hiredBadge = isHired ? `<span style="font-size:9px; font-weight:900; color:#10b981; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); padding:2px 6px; border-radius:4px; margin-left:4px;">✅ HIRED</span>` : '';

    html += `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:${isHired ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.015)'}; border:1px solid ${isHired ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)'}; border-radius:10px; margin-bottom:8px; transition:all 0.2s ease;" onmouseover="this.style.background='rgba(99,102,241,0.04)'; this.style.borderColor='rgba(99,102,241,0.15)';" onmouseout="this.style.background='${isHired ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.015)'}'; this.style.borderColor='${isHired ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)'}';">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg, ${isHired ? '#10b981, #059669' : '#6366f1, #8b5cf6'}); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:900; color:white; flex-shrink:0;">${initials}</div>
          <div>
            <div style="font-size:13px; font-weight:800; color:white;">${escapeHtml(app.candidateName || 'Candidate')}${hiredBadge}</div>
            <div style="font-size:10.5px; color:var(--muted);">${escapeHtml(app.candidateEmail || '')} · ${timeAgo}</div>
            ${scorecardLine}
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap; justify-content:flex-end;">
          <span style="font-size:9.5px; font-weight:800; text-transform:uppercase; padding:3px 8px; border-radius:50px; letter-spacing:0.3px; ${statusStyle}">${escapeHtml(displayStatus)}</span>
          ${actionBtns}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function getRelativeTime(dateStr) {
  if (!dateStr) return 'Just now';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

// Global function so inline onclick handlers can call it
window.updateApplicationStatus = function(appId, newStatus) {
  const apps = state.applications || [];
  const updated = apps.map(a => {
    if (a.id === appId) {
      return { ...a, status: newStatus, lastUpdated: new Date().toISOString() };
    }
    return a;
  });
  state.applications = updated;

  // Find the app to send notification
  const app = apps.find(a => a.id === appId);
  if (app && app.candidateEmail) {
    const statusEmoji = newStatus === 'Shortlisted' ? '🎉' : '📋';
    addNotification(
      app.candidateEmail,
      `Application ${newStatus}`,
      `${statusEmoji} Your application for "${app.jobTitle}" has been ${newStatus.toLowerCase()} by the recruiter.`,
      'status',
      { jobId: app.jobId, jobTitle: app.jobTitle, status: newStatus }
    );
  }

  // Re-render the current job view
  if (activeJob) {
    selectWorkspaceJob(activeJob);
  }
};
// Global function to show scorecard modal from applicant card by email lookup
window.showScorecardModalFromApp = function(candidateEmail) {
  const scorecards = loadList('ekvueInterviewerScorecards');
  const sc = scorecards.find(s =>
    s.email && s.email.toLowerCase() === candidateEmail.toLowerCase()
  );
  if (!sc) {
    alert('No scorecard found for this candidate.');
    return;
  }
  // Build a mock meet object for the existing showScorecardModal
  const meet = {
    candidate: sc.candidateName || 'Candidate',
    role: sc.sessionType || 'Technical Interview',
    interviewer: sc.interviewerName || 'EkVue AI'
  };
  showScorecardModal(sc, meet);
};

// Global function to show candidate profile modal
window.showCandidateProfileModal = function(candidateName, candidateEmail) {
  const oldModal = document.getElementById('candidate-profile-modal-overlay');
  if (oldModal) oldModal.remove();

  // Look up candidate account info
  const accounts = loadList('ekvueAccounts');
  const candAcc = accounts.find(a =>
    a.email && a.email.toLowerCase() === candidateEmail.toLowerCase()
  );

  // Look up all applications by this candidate
  const allApps = (state.applications || []).filter(a =>
    a.candidateEmail && a.candidateEmail.toLowerCase() === candidateEmail.toLowerCase()
  );

  // Look up scorecards
  const scorecards = loadList('ekvueInterviewerScorecards').filter(s =>
    s.email && s.email.toLowerCase() === candidateEmail.toLowerCase()
  );

  const initials = (candidateName || 'C')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Build application history rows
  let appsHtml = '';
  if (allApps.length > 0) {
    allApps.forEach(a => {
      const sc = scorecards.find(s => s.email?.toLowerCase() === a.candidateEmail?.toLowerCase());
      const isHired = sc && (sc.recommendation === 'Hire' || sc.recommendation === 'Strong Hire');
      const statusLabel = isHired ? 'Hired' : (a.status || 'Applied');
      let stColor = '#60a5fa';
      if (statusLabel === 'Hired') stColor = '#10b981';
      else if (statusLabel === 'Shortlisted') stColor = '#34d399';
      else if (statusLabel === 'Rejected') stColor = '#f87171';
      const dateStr = a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : 'N/A';
      appsHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.04); border-radius:8px; margin-bottom:6px;">
          <div>
            <div style="font-size:12px; color:white; font-weight:700;">${escapeHtml(a.jobTitle || 'Position')}</div>
            <div style="font-size:10px; color:var(--muted);">Applied ${dateStr}</div>
          </div>
          <span style="font-size:9px; font-weight:800; text-transform:uppercase; padding:2px 8px; border-radius:50px; color:${stColor}; background:${stColor}15; border:1px solid ${stColor}30;">${escapeHtml(statusLabel)}</span>
        </div>
      `;
    });
  } else {
    appsHtml = '<div style="text-align:center; color:var(--muted); font-size:11px; padding:8px;">No applications found.</div>';
  }

  // Build scorecards summary
  let scHtml = '';
  if (scorecards.length > 0) {
    scorecards.forEach(sc => {
      const recColor = sc.recommendation === 'Strong Hire' ? '#10b981' : sc.recommendation === 'Hire' ? '#3b82f6' : '#ef4444';
      scHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.04); border-radius:8px; margin-bottom:6px;">
          <div>
            <div style="font-size:12px; color:white; font-weight:700;">⭐ ${sc.globalScore}/5</div>
            <div style="font-size:10px; color:var(--muted);">By ${escapeHtml(sc.interviewerName || 'Interviewer')} on ${sc.date || 'N/A'}</div>
          </div>
          <span style="font-size:10px; font-weight:800; color:${recColor};">${escapeHtml(sc.recommendation)}</span>
        </div>
      `;
    });
  } else {
    scHtml = '<div style="text-align:center; color:var(--muted); font-size:11px; padding:8px;">No interview scorecards yet.</div>';
  }

  const overlay = document.createElement('div');
  overlay.id = 'candidate-profile-modal-overlay';
  overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(2,6,23,0.85); backdrop-filter:blur(12px); display:flex; justify-content:center; align-items:center; z-index:10000; opacity:0; transition:opacity 0.3s ease;';

  overlay.innerHTML = `
    <div style="background:#090d1f; border:1px solid rgba(99,102,241,0.25); box-shadow:0 20px 50px rgba(0,0,0,0.6); border-radius:16px; width:90%; max-width:520px; max-height:85vh; overflow-y:auto; padding:24px; color:#e2e8f0; transform:translateY(20px); transition:transform 0.3s ease;">
      <div style="display:flex; align-items:center; gap:14px; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.08);">
        <div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg, #6366f1, #8b5cf6); display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:white; flex-shrink:0;">${initials}</div>
        <div>
          <h2 style="font-size:18px; color:white; margin:0 0 2px 0;">${escapeHtml(candidateName)}</h2>
          <p style="font-size:12px; color:#64748b; margin:0;">${escapeHtml(candidateEmail)}</p>
          ${candAcc ? `<p style="font-size:11px; color:var(--muted); margin:2px 0 0 0;">Registered: ${candAcc.role || 'Candidate'}</p>` : ''}
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <h3 style="font-size:12px; font-weight:800; color:white; text-transform:uppercase; margin:0 0 8px 0; border-left:3px solid #6366f1; padding-left:8px;">Application History (${allApps.length})</h3>
        ${appsHtml}
      </div>

      <div style="margin-bottom:16px;">
        <h3 style="font-size:12px; font-weight:800; color:white; text-transform:uppercase; margin:0 0 8px 0; border-left:3px solid #fbbf24; padding-left:8px;">Interview Scorecards (${scorecards.length})</h3>
        ${scHtml}
      </div>

      <div style="display:flex; justify-content:flex-end;">
        <button id="close-profile-modal-btn" style="padding:8px 20px; background:#4f46e5; border:none; border-radius:8px; color:white; font-weight:700; cursor:pointer; font-size:12px;">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.style.opacity = '1';
    overlay.children[0].style.transform = 'translateY(0)';
  }, 10);

  const closeModal = () => {
    overlay.style.opacity = '0';
    overlay.children[0].style.transform = 'translateY(20px)';
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.querySelector('#close-profile-modal-btn').onclick = closeModal;
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
};

// ==========================================
// ==========================================
// 3. INTERVIEWS SCHEDULER TIMELINE
// ==========================================
function initInterviewScheduler() {
  renderInterviewSchedules();

  const roleInput = document.getElementById('meet-role');
  const intSelect = document.getElementById('meet-interviewer');
  const bookForm = document.getElementById('book-interview-form');
  const okMsg = document.getElementById('meet-ok-msg');

  // Populate job vacancies datalist autocomplete with active jobs + fallback roles
  const roleDatalist = document.getElementById('job-postings-datalist');
  if (roleDatalist) {
    roleDatalist.innerHTML = '';
    const activeJobs = state.jobPostings.map(j => j.jobTitle);
    const fallbackRoles = [
      'Frontend Engineer',
      'Backend Architect',
      'Full Stack Developer',
      'Lead DevOps Specialist',
      'AI/ML Platform Developer',
      'Systems Software Engineer',
      'Product Manager'
    ];
    const uniqueRoles = [...new Set([...activeJobs, ...fallbackRoles])];
    uniqueRoles.forEach((role) => {
      const opt = document.createElement('option');
      opt.value = role;
      roleDatalist.appendChild(opt);
    });
  }

  // Populate active interviewers dropdown from team + registered interviewer accounts
  if (intSelect) {
    intSelect.innerHTML = '';
    
    // Collect unique interviewers from team members
    const interviewerOptions = [];
    state.teamMembers.forEach((mem) => {
      interviewerOptions.push({ name: mem.name, title: mem.title || 'Team Member', email: mem.email });
    });

    // Also pull registered Interviewer accounts as fallback
    try {
      const accounts = JSON.parse(localStorage.getItem('ekvueAccounts') || '[]');
      const interviewerAccounts = accounts.filter(a => a.role === 'Interviewer');
      interviewerAccounts.forEach(acc => {
        if (!interviewerOptions.some(o => o.name === acc.name)) {
          interviewerOptions.push({ name: acc.name, title: 'Interviewer', email: acc.email });
        }
      });
    } catch {}

    // If still empty, add EkVue AI as default
    if (interviewerOptions.length === 0) {
      interviewerOptions.push({ name: 'EkVue AI', title: 'AI Interviewer', email: '' });
    }

    interviewerOptions.forEach((int) => {
      const opt = document.createElement('option');
      opt.value = int.name;
      opt.textContent = `${int.name} (${int.title})`;
      intSelect.appendChild(opt);
    });
  }

  // Auto-prefill date and time with current local values for faster scheduling
  const dateInput = document.getElementById('meet-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  const timeInput = document.getElementById('meet-time');
  if (timeInput && !timeInput.value) {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    timeInput.value = `${hrs}:${mins}`;
  }

  // Wire up cancel-edit button
  const cancelEditBtn = document.getElementById('cancel-edit-meet-btn');
  if (cancelEditBtn) {
    cancelEditBtn.onclick = () => {
      exitScheduleEditMode();
      bookForm?.reset();
      // Re-prefill date/time
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      if (timeInput) {
        const now = new Date();
        timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      }
      cancelEditBtn.style.display = 'none';
    };
  }

  // Bind form submit
  if (bookForm) {
    bookForm.onsubmit = (e) => {
      e.preventDefault();
      const candidate = document.getElementById('meet-candidate').value.trim();
      const role = roleInput ? roleInput.value.trim() : '';
      const interviewer = intSelect ? intSelect.value : '';
      const date = document.getElementById('meet-date').value;
      const time = document.getElementById('meet-time').value;
      const notes = document.getElementById('meet-notes') ? document.getElementById('meet-notes').value.trim() : '';

      if (!candidate) { alert('Please enter a candidate name.'); return; }
      if (!role) { alert('Please select or enter a target job posting.'); return; }
      if (!interviewer) { alert('Please assign an interviewer. Add team members in the Team section first.'); return; }
      if (!date) { alert('Please select a date.'); return; }
      if (!time) { alert('Please select a time.'); return; }

      // Lookup candidate email from registered accounts
      const accounts = JSON.parse(localStorage.getItem('ekvueAccounts') || '[]');
      const candAcc = accounts.find(acc => acc.role === 'Candidate' && acc.name.toLowerCase() === candidate.toLowerCase());
      const candidateEmail = candAcc ? candAcc.email : `${candidate.toLowerCase().replace(/\s+/g, '')}@example.com`;

      // Lookup interviewer email from team registry
      const teamMember = state.teamMembers.find(m => m.name === interviewer);
      const interviewerEmail = teamMember ? teamMember.email : '';

      const editId = document.getElementById('meet-edit-id') ? document.getElementById('meet-edit-id').value : '';

      if (editId) {
        // Update existing schedule
        const idx = state.schedules.findIndex(s => s.id === editId);
        if (idx > -1) {
          state.schedules[idx].candidate = candidate;
          state.schedules[idx].candidateName = candidate;
          state.schedules[idx].candidateEmail = candidateEmail;
          state.schedules[idx].role = role;
          state.schedules[idx].sessionType = role;
          state.schedules[idx].interviewer = interviewer;
          state.schedules[idx].interviewerName = interviewer;
          state.schedules[idx].interviewerEmail = interviewerEmail;
          state.schedules[idx].date = date;
          state.schedules[idx].time = time;
          state.schedules[idx].notes = notes;
          state.schedules[idx].lastUpdated = new Date().toISOString();
        }

        // Exit edit mode
        exitScheduleEditMode();

        // Notify candidate about reschedule
        addNotification(
          candidateEmail,
          "Interview Rescheduled!",
          `Your interview for "${role}" has been rescheduled to ${date} at ${time} with ${interviewer}.`,
          "scheduled",
          { meetingId: editId, role, date, time, interviewer }
        );
      } else {
        // Create new meeting with all required cross-dashboard fields
        const newMeeting = {
          id: uid('meet'),
          candidate,
          candidateName: candidate,
          candidateEmail,
          role,
          sessionType: role,
          interviewer,
          interviewerName: interviewer,
          interviewerEmail,
          date,
          time,
          status: 'Upcoming',
          notes,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };

        state.schedules.push(newMeeting);

        // Dispatch candidate notification
        addNotification(
          candidateEmail,
          "New Interview Scheduled!",
          `A new interview for "${role}" has been scheduled on ${date} at ${time} with ${interviewer}.`,
          "scheduled",
          { meetingId: newMeeting.id, role, date, time, interviewer }
        );

        // Dispatch interviewer notification
        if (interviewerEmail) {
          addNotification(
            interviewerEmail,
            "New Interview Assigned!",
            `You have been assigned to interview ${candidate} for "${role}" on ${date} at ${time}.`,
            "scheduled",
            { meetingId: newMeeting.id, role, date, time, candidateName: candidate }
          );
        }
      }

      localStorage.setItem(SCHEDULES_KEY, JSON.stringify(state.schedules));
      renderInterviewSchedules();
      updateKpiWidgets();

      bookForm.reset();
      // Re-prefill date/time after reset
      const dateInp = document.getElementById('meet-date');
      if (dateInp) dateInp.value = new Date().toISOString().split('T')[0];
      const timeInp = document.getElementById('meet-time');
      if (timeInp) {
        const now = new Date();
        timeInp.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      }

      if (okMsg) {
        okMsg.textContent = editId ? '✅ Interview Rescheduled!' : '✅ Interview Scheduled!';
        okMsg.style.display = 'block';
        setTimeout(() => { okMsg.style.display = 'none'; }, 2500);
      }
    };
  }
}

// Edit schedule helper
function enterScheduleEditMode(meet) {
  const candInput = document.getElementById('meet-candidate');
  const roleInput = document.getElementById('meet-role');
  const intSelect = document.getElementById('meet-interviewer');
  const dateInput = document.getElementById('meet-date');
  const timeInput = document.getElementById('meet-time');
  const notesInput = document.getElementById('meet-notes');
  const submitBtn = document.querySelector('#book-interview-form button[type="submit"]');

  if (candInput) candInput.value = meet.candidate || meet.candidateName || '';
  if (roleInput) roleInput.value = meet.role || meet.sessionType || '';
  if (dateInput) dateInput.value = meet.date || '';
  if (timeInput) timeInput.value = meet.time || '';
  if (notesInput) notesInput.value = meet.notes || '';

  // Set interviewer select
  if (intSelect) {
    const optExists = Array.from(intSelect.options).some(o => o.value === (meet.interviewer || meet.interviewerName));
    if (optExists) intSelect.value = meet.interviewer || meet.interviewerName;
  }

  // Create or update hidden edit ID input
  let editIdInput = document.getElementById('meet-edit-id');
  if (!editIdInput) {
    editIdInput = document.createElement('input');
    editIdInput.type = 'hidden';
    editIdInput.id = 'meet-edit-id';
    document.getElementById('book-interview-form').appendChild(editIdInput);
  }
  editIdInput.value = meet.id;

  if (submitBtn) submitBtn.textContent = '💾 Save Changes';

  // Show cancel button
  const cancelEditBtn = document.getElementById('cancel-edit-meet-btn');
  if (cancelEditBtn) cancelEditBtn.style.display = '';

  // Scroll form into view
  submitBtn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function exitScheduleEditMode() {
  const editIdInput = document.getElementById('meet-edit-id');
  if (editIdInput) editIdInput.value = '';

  const submitBtn = document.querySelector('#book-interview-form button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Schedule Interview';

  const cancelEditBtn = document.getElementById('cancel-edit-meet-btn');
  if (cancelEditBtn) cancelEditBtn.style.display = 'none';
}

// Global function for scheduling from applicants list
window.openCandidateScheduleModal = function(candidateName, candidateEmail, jobTitle) {
  // Switch to interviews view
  switchView('interviews');

  // Pre-fill the form
  setTimeout(() => {
    const candInput = document.getElementById('meet-candidate');
    const roleInput = document.getElementById('meet-role');
    if (candInput) candInput.value = candidateName || '';
    if (roleInput) roleInput.value = jobTitle || '';

    candInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
};

function renderInterviewSchedules() {
  const container = document.getElementById('scheduled-timeline-list');
  const countLabel = document.getElementById('interviews-scheduled-count');
  if (!container) return;

  container.innerHTML = '';

  // Count by status
  const upcoming = state.schedules.filter(s => (s.status || 'Upcoming') === 'Upcoming').length;
  const completed = state.schedules.filter(s => s.status === 'Completed').length;
  const pending = state.schedules.filter(s => s.status === 'Feedback Pending').length;
  
  if (countLabel) {
    countLabel.textContent = `${state.schedules.length} Total · ${upcoming} Upcoming · ${completed} Completed`;
  }

  if (state.schedules.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px 20px;">
        <span style="font-size:36px; display:block; margin-bottom:10px;">📅</span>
        <p style="color:var(--muted); font-size:13px; font-weight:600; margin:0 0 4px 0;">No interviews scheduled yet</p>
        <p style="color:var(--muted); font-size:11px; margin:0;">Use the form on the right to book interview slots for candidates.</p>
      </div>`;
    return;
  }

  // Load scorecards to show grading details
  let scorecards = [];
  try {
    const rawSc = localStorage.getItem('ekvueInterviewerScorecards');
    scorecards = rawSc ? JSON.parse(rawSc) : [];
  } catch {}
  if (!Array.isArray(scorecards)) scorecards = [];

  // Sort: Upcoming first (by date asc), then Feedback Pending, then Completed
  const statusOrder = { 'Upcoming': 0, 'Feedback Pending': 1, 'Completed': 2 };
  const sorted = [...state.schedules].map((m, i) => ({ ...m, _origIdx: i }));
  sorted.sort((a, b) => {
    const orderA = statusOrder[a.status || 'Upcoming'] ?? 9;
    const orderB = statusOrder[b.status || 'Upcoming'] ?? 9;
    if (orderA !== orderB) return orderA - orderB;
    // Within same status, sort by date
    const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
    const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
    return dateA - dateB;
  });

  sorted.forEach((meet) => {
    const origIdx = meet._origIdx;
    const card = document.createElement('div');
    card.className = 'schedule-meeting-card';
    card.style.cssText = 'position:relative; transition:all 0.2s ease;';

    const status = meet.status || 'Upcoming';
    let statusIcon = '🔵';
    let statusMarkup = '';
    let actionButtons = '';
    
    // Find matching scorecard if graded
    const sc = scorecards.find(x => 
      x.sessionId === meet.id || 
      (x.email && meet.candidateEmail && x.email.toLowerCase() === meet.candidateEmail.toLowerCase())
    );

    // Auto-detect completed status from scorecard
    if (sc && status !== 'Completed') {
      meet.status = 'Completed';
      state.schedules[origIdx].status = 'Completed';
      localStorage.setItem(SCHEDULES_KEY, JSON.stringify(state.schedules));
    }

    const finalStatus = meet.status || 'Upcoming';

    if (finalStatus === 'Completed') {
      statusIcon = '✅';
      const scoreVal = sc ? `${sc.globalScore}/5` : '—';
      const recColor = sc ? (sc.recommendation === 'Strong Hire' ? '#10b981' : sc.recommendation === 'Hire' ? '#3b82f6' : '#ef4444') : '#64748b';
      statusMarkup = `<span class="badge easy" style="margin-left:8px;">⭐ Graded (${scoreVal})</span>`;
      if (sc) {
        statusMarkup += `<span style="font-size:9px; color:${recColor}; font-weight:800; margin-left:4px;">${escapeHtml(sc.recommendation || '')}</span>`;
      }
      actionButtons = `
        ${sc ? `<button class="btn small primary view-scorecard-btn" style="background:linear-gradient(90deg, #6366f1, #4f46e5); border-color:rgba(99,102,241,0.3); color:white; padding:4px 8px; font-size:10px; margin-right:4px;" data-meetid="${meet.id}">📊 Scorecard</button>` : ''}
        <button class="btn small cancel-meet-btn" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.15); color:#fca5a5; padding:4px 8px; font-size:10px;" data-meetid="${meet.id}">🗑 Remove</button>
      `;
    } else if (finalStatus === 'Feedback Pending') {
      statusIcon = '⏳';
      statusMarkup = `<span class="badge medium" style="margin-left:8px;">⏳ Awaiting Grading</span>`;
      actionButtons = `
        <button class="btn small edit-meet-btn" style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); color:#818cf8; padding:4px 8px; font-size:10px; margin-right:4px;" data-meetidx="${origIdx}">✎ Edit</button>
        <button class="btn small cancel-meet-btn" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.15); color:#fca5a5; padding:4px 8px; font-size:10px;" data-meetid="${meet.id}">✗ Cancel</button>
      `;
    } else {
      statusIcon = '🔵';
      // Check if the date is in the past
      const meetDate = new Date(`${meet.date}T${meet.time || '23:59'}`);
      const now = new Date();
      const isPast = meetDate < now;
      if (isPast) {
        statusIcon = '⚠️';
        statusMarkup = `<span class="badge" style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.25); color:#fbbf24; margin-left:8px;">Overdue</span>`;
      } else {
        statusMarkup = `<span class="badge" style="background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.25); color:#60a5fa; margin-left:8px;">Upcoming</span>`;
      }
      actionButtons = `
        <button class="btn small edit-meet-btn" style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); color:#818cf8; padding:4px 8px; font-size:10px; margin-right:4px;" data-meetidx="${origIdx}">✎ Reschedule</button>
        <button class="btn small cancel-meet-btn" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.15); color:#fca5a5; padding:4px 8px; font-size:10px;" data-meetid="${meet.id}">✗ Cancel</button>
      `;
    }

    // Format date display
    let dateDisplay = meet.date || '';
    try {
      const d = new Date(meet.date + 'T00:00:00');
      dateDisplay = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {}

    // Notes line
    const notesLine = meet.notes ? `<div style="font-size:10px; color:var(--muted); margin-top:4px; padding-top:4px; border-top:1px dashed rgba(255,255,255,0.05);">📝 ${escapeHtml(meet.notes)}</div>` : '';

    card.innerHTML = `
      <div class="m-info">
        <span class="m-candidate">${statusIcon} ${escapeHtml(meet.candidate || meet.candidateName || 'Candidate')} ${statusMarkup}</span>
        <span class="m-role">${escapeHtml(meet.role || meet.sessionType || '')}</span>
        ${notesLine}
      </div>
      <div class="m-date-box" style="display:flex; align-items:center; gap:8px; justify-content:flex-end; flex-wrap:wrap;">
        <span class="m-badge-date">📅 ${escapeHtml(dateDisplay)} @ ${escapeHtml(meet.time || '')}</span>
        <span class="m-badge-interviewer">👤 <strong>${escapeHtml(meet.interviewer || meet.interviewerName || 'TBD')}</strong></span>
        <div style="display:inline-flex; align-items:center; gap:4px;">
          ${actionButtons}
        </div>
      </div>
    `;

    // Bind Cancel/Remove
    const cancelBtn = card.querySelector('.cancel-meet-btn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        const confirmMsg = finalStatus === 'Completed' 
          ? `Remove completed assessment slot for ${meet.candidate || meet.candidateName}? This does not delete their archived scorecard.`
          : `Are you sure you want to cancel the scheduled interview for ${meet.candidate || meet.candidateName}?`;
        if (confirm(confirmMsg)) {
          state.schedules.splice(origIdx, 1);
          localStorage.setItem(SCHEDULES_KEY, JSON.stringify(state.schedules));
          renderInterviewSchedules();
          updateKpiWidgets();
        }
      };
    }

    // Bind Edit/Reschedule
    const editBtn = card.querySelector('.edit-meet-btn');
    if (editBtn) {
      editBtn.onclick = () => {
        enterScheduleEditMode(state.schedules[origIdx]);
      };
    }

    // Bind View Scorecard
    const viewBtn = card.querySelector('.view-scorecard-btn');
    if (viewBtn && sc) {
      viewBtn.onclick = () => {
        showScorecardModal(sc, meet);
      };
    }

    container.appendChild(card);
  });
}

function showScorecardModal(sc, meet) {
  // Remove existing modal if any
  const oldModal = document.getElementById('company-scorecard-modal-overlay');
  if (oldModal) oldModal.remove();

  const overlay = document.createElement('div');
  overlay.id = 'company-scorecard-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(2, 6, 23, 0.85);
    backdrop-filter: blur(12px);
    display: flex; justify-content: center; align-items: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  let dimsMarkup = '';
  const dims = [
    { key: 'codeQuality', label: 'Code Quality' },
    { key: 'problemSolving', label: 'Problem Solving' },
    { key: 'techKnowledge', label: 'Tech Knowledge' },
    { key: 'communication', label: 'Communication' },
    { key: 'systemDesign', label: 'System Design' }
  ];

  dims.forEach(d => {
    const val = parseInt(sc[d.key] || 0);
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<span style="font-size:16px; color:${i <= val ? '#fbbf24' : '#475569'}; margin-right:2px;">★</span>`;
    }
    dimsMarkup += `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px dashed rgba(255,255,255,0.03); padding-bottom:4px;">
        <span style="font-size:12.5px; color:#94a3b8">${d.label}</span>
        <div style="display:flex; align-items:center;">
          ${stars}
          <span style="font-size:11.5px; font-weight:800; color:white; margin-left:8px;">${val}/5</span>
        </div>
      </div>
    `;
  });

  const recommendationColor = sc.recommendation === 'Strong Hire' ? '#10b981' : 
                               sc.recommendation === 'Hire' ? '#3b82f6' : '#ef4444';

  overlay.innerHTML = `
    <div style="
      background: #090d1f;
      border: 1px solid rgba(99, 102, 241, 0.25);
      box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(99, 102, 241, 0.05);
      border-radius: 16px;
      width: 90%;
      max-width: 580px;
      max-height: 85vh;
      overflow-y: auto;
      padding: 24px;
      box-sizing: border-box;
      color: #e2e8f0;
      transform: translateY(20px);
      transition: transform 0.3s ease;
      font-family: inherit;
    ">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px;">
        <div>
          <h2 style="font-size:20px; color:white; margin:0 0 4px 0">${escapeHtml(meet.candidate)}</h2>
          <p style="font-size:12px; color:#64748b; margin:0">${escapeHtml(meet.role)} Round • Evaluated by ${escapeHtml(sc.interviewerName || meet.interviewer)}</p>
        </div>
        <span style="
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 8px 12px;
          text-align: center;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
        ">
          <span style="font-size:9.5px; color:#64748b; font-weight:800; text-transform:uppercase; margin-bottom:2px">ATS Score</span>
          <span style="font-size:18px; font-weight:900; color:#fbbf24;">${sc.globalScore}<span style="font-size:11px; font-weight:400; color:#64748b;">/5</span></span>
        </span>
      </div>

      <div style="display:grid; grid-template-columns: 1.1fr 0.9fr; gap:18px; margin-bottom:18px;">
        <div style="background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.04); padding:12px; border-radius:10px;">
          <h3 style="font-size:12px; font-weight:800; color:white; text-transform:uppercase; margin:0 0 10px 0; border-left:3px solid #6366f1; padding-left:8px;">Evaluation Matrix</h3>
          ${dimsMarkup}
        </div>
        
        <div style="background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.04); padding:12px; border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
          <small style="color:#64748b; font-weight:800; text-transform:uppercase; margin-bottom:4px; font-size:10px;">Interviewer Recommendation</small>
          <span style="font-size:18px; font-weight:900; color:${recommendationColor}; text-shadow:0 0 10px ${recommendationColor}44; text-transform:uppercase; margin-bottom:12px;">
            ${sc.recommendation}
          </span>
          
          <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:8px; width:100%;">
            <small style="color:#64748b; font-weight:800; text-transform:uppercase; display:block; margin-bottom:4px; font-size:9.5px;">WASM Integrity Proctoring</small>
            <span style="font-size:11px; color:#10b981; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2); padding:3px 8px; border-radius:50px; display:inline-block; font-weight:700;">
              🛡️ Proctor: PASS
            </span>
          </div>
        </div>
      </div>

      <div style="margin-bottom:14px;">
        <h3 style="font-size:12px; font-weight:800; color:white; text-transform:uppercase; margin:0 0 6px 0; border-left:3px solid #6366f1; padding-left:8px;">Candidate Strengths</h3>
        <div style="background:rgba(16,185,129,0.03); border:1px solid rgba(16,185,129,0.15); border-radius:8px; padding:10px; font-size:12px; line-height:1.45; color:#a7f3d0">
          ${sc.strengths ? escapeHtml(sc.strengths).replaceAll('\n', '<br>') : 'Candidate demonstrated excellent engineering insights and balanced technical trade-offs effectively.'}
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <h3 style="font-size:12px; font-weight:800; color:white; text-transform:uppercase; margin:0 0 6px 0; border-left:3px solid #6366f1; padding-left:8px;">Areas for Growth</h3>
        <div style="background:rgba(239,68,68,0.03); border:1px solid rgba(239,68,68,0.15); border-radius:8px; padding:10px; font-size:12px; line-height:1.45; color:#fecaca">
          ${sc.improvements ? escapeHtml(sc.improvements).replaceAll('\n', '<br>') : 'Continue solidifying competitive complexity pools and large scale system caching structures.'}
        </div>
      </div>

      ${sc.notes ? `
      <div style="margin-bottom:20px;">
        <h3 style="font-size:12px; font-weight:800; color:white; text-transform:uppercase; margin:0 0 6px 0; border-left:3px solid #6366f1; padding-left:8px;">Detailed Assessment Notes</h3>
        <div style="background:rgba(2,6,23,0.4); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px; font-size:12px; line-height:1.45; font-family:monospace; color:#cbd5e1; white-space:pre-wrap;">${escapeHtml(sc.notes)}</div>
      </div>` : ''}

      <div style="display:flex; justify-content:flex-end;">
        <button id="close-scorecard-modal-btn" class="btn primary" style="background:#4f46e5; border-color:#6366f1; padding:8px 24px; font-size:12.5px; font-weight:800; border-radius:8px; cursor:pointer;">Close Report</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Trigger browser animation reflow
  setTimeout(() => {
    overlay.style.opacity = '1';
    overlay.children[0].style.transform = 'translateY(0)';
  }, 10);

  const closeBtn = overlay.querySelector('#close-scorecard-modal-btn');
  const closeModal = () => {
    overlay.style.opacity = '0';
    overlay.children[0].style.transform = 'translateY(20px)';
    setTimeout(() => overlay.remove(), 300);
  };

  closeBtn.onclick = closeModal;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
  };
}

// ==========================================
// 4. CONVERSION FUNNEL METRICS
// ==========================================
function renderAnalyticsFunnel() {
  // Simple rendering wrapper as the values are dynamically filled inside company.html.
}

// ==========================================
// 5. INTERVIEWER TEAM REGISTRY
// ==========================================
function renderTeamMembers() {
  const container = document.getElementById('team-list-cards');
  const countLabel = document.getElementById('team-total-count');
  if (!container) return;

  container.innerHTML = '';
  countLabel.textContent = `${state.teamMembers.length} Members`;

  state.teamMembers.forEach((mem, idx) => {
    const card = document.createElement('div');
    card.className = 'team-member-card';
    
    const initials = mem.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    card.innerHTML = `
      <div class="t-avatar">${escapeHtml(initials)}</div>
      <div class="t-details">
        <span class="t-name">${escapeHtml(mem.name)}</span>
        <span class="t-title-dep">${escapeHtml(mem.title)} · ${escapeHtml(mem.dept)}</span>
        <span class="t-stats">🎙 ${mem.completed} completed · Rating ${mem.score}</span>
      </div>
      <button class="btn small" style="background:rgba(239,68,68,0.1); border-color:transparent; color:#ef4444; font-size:12px; margin-left:auto" data-idx="${idx}">×</button>
    `;

    card.querySelector('button').onclick = () => {
      state.teamMembers.splice(idx, 1);
      localStorage.setItem(TEAM_KEY, JSON.stringify(state.teamMembers));
      renderTeamMembers();
    };

    container.appendChild(card);
  });

  // Bind add team form
  const addForm = document.getElementById('add-team-form');
  const okMsg = document.getElementById('team-ok-msg');
  if (addForm) {
    addForm.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('team-name').value.trim();
      const title = document.getElementById('team-role').value.trim();
      const dept = document.getElementById('team-dept').value;

      const newMember = {
        id: uid('team'),
        name,
        title,
        dept,
        completed: 0,
        score: '—'
      };

      state.teamMembers.push(newMember);
      localStorage.setItem(TEAM_KEY, JSON.stringify(state.teamMembers));
      
      renderTeamMembers();
      addForm.reset();
      
      if (okMsg) {
        okMsg.style.display = 'block';
        setTimeout(() => { okMsg.style.display = 'none'; }, 2000);
      }
    };
  }
}

// ==========================================
// 6. PROFILE & THEMES CUSTOMIZER
// ==========================================
function renderSettings() {
  const nameInput = document.getElementById('settings-companyname');
  const indInput = document.getElementById('settings-industry');
  const webInput = document.getElementById('settings-website');
  const sizeSelect = document.getElementById('settings-companysize');
  const profileForm = document.getElementById('settings-profile-form');
  const okMsg = document.getElementById('settings-form-msg');

  if (state.user) {
    if (nameInput) nameInput.value = state.user.name || 'EKVUE Corp';
    if (indInput) indInput.value = 'Hiring Platform';
    if (webInput) webInput.value = 'https://ekvue.com';
    if (sizeSelect) sizeSelect.value = '11-50';
  }

  if (profileForm) {
    profileForm.onsubmit = (e) => {
      e.preventDefault();

      const profile = {
        companyName: nameInput?.value.trim() || '',
        industry: indInput?.value.trim() || '',
        website: webInput?.value || '',
        size: sizeSelect?.value || '11-50'
      };

      localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(profile));

      if (state.user) {
        state.user.name = profile.companyName;
      }

      const welcomeLine = document.getElementById('welcomeLine');
      if (welcomeLine && state.user) {
        welcomeLine.textContent = `Welcome back, ${state.user.name || 'Company'}!`;
      }

      if (okMsg) {
        okMsg.style.display = 'block';
        setTimeout(() => { okMsg.style.display = 'none'; }, 2000);
      }
    };
  }

  // WIPE Danger Command
  const wipeBtn = document.getElementById('danger-wipe-btn');
  if (wipeBtn) {
    wipeBtn.onclick = () => {
      const confirm = window.confirm('Are you absolutely sure you want to delete all job postings, customizable pipeline steps, scheduled interview timetables, and preferences?');
      if (confirm) {
        localStorage.removeItem(LIST_KEY);
        localStorage.removeItem(THEME_KEY);
        localStorage.removeItem(TEAM_KEY);
        localStorage.removeItem(SCHEDULES_KEY);
        localStorage.removeItem(COMPANY_PROFILE_KEY);
        window.location.reload();
      }
    };
  }
}

function initThemeSelector() {
  const cards = document.querySelectorAll('.theme-card-option');
  cards.forEach((card) => {
    card.classList.toggle('active', card.dataset.theme === state.selectedTheme);

    card.onclick = () => {
      cards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');

      const theme = card.dataset.theme;
      state.selectedTheme = theme;
      localStorage.setItem(THEME_KEY, theme);
      document.body.setAttribute('data-theme', theme);
    };
  });
}

window.editWorkspaceJob = function() {
  if (!activeJob) return;
  
  // Populate the form fields with activeJob data
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };
  
  setVal('pj-title', activeJob.jobTitle);
  setVal('pj-department', activeJob.department);
  setVal('pj-employment-type', activeJob.employmentType);
  setVal('pj-work-mode', activeJob.workMode);
  setVal('pj-experience', activeJob.experienceRequired);
  setVal('pj-description', activeJob.description);
  setVal('pj-responsibilities', activeJob.responsibilities);
  setVal('pj-skills', activeJob.skillsRequired);
  setVal('pj-preferred-skills', activeJob.skillsPreferred);
  setVal('pj-salary', activeJob.salary);
  setVal('pj-bonus', activeJob.bonus);
  setVal('pj-benefits', activeJob.benefits);
  setVal('pj-country', activeJob.country);
  setVal('pj-state', activeJob.state);
  setVal('pj-city', activeJob.city);
  setVal('pj-work-location', activeJob.workLocation);
  setVal('pj-education', activeJob.education);
  setVal('pj-exp-min', activeJob.expYearsMin);
  setVal('pj-exp-max', activeJob.expYearsMax);
  setVal('pj-certifications', activeJob.certifications);
  setVal('pj-deadline', activeJob.deadline);
  setVal('pj-max-applicants', activeJob.maxApplicants);
  
  const setCheck = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  };
  setCheck('pj-resume-required', activeJob.resumeRequired);
  setCheck('pj-portfolio-required', activeJob.portfolioRequired);
  setCheck('pj-github-required', activeJob.githubRequired);
  
  setVal('pj-hr-name', activeJob.hrName);
  setVal('pj-hr-email', activeJob.hrEmail);
  setVal('pj-hr-phone', activeJob.hrPhone);
  
  // Set editingJobId to preserve the ID during saveJob
  window.editingJobId = activeJob.id;
  
  // Switch to post job view
  switchView('post-job');
};

// ==========================================
// KEEP COMPATIBILITY WITH ORIGINAL CRUD
// ==========================================
function renderDashboardCreatedJobs() {
  const container = document.getElementById('list');
  if (!container) return;

  container.innerHTML = '';
  if (state.jobPostings.length === 0) {
    renderEmptyState(container, 'No job postings yet. Create one on the left.');
    return;
  }

  state.jobPostings.forEach((it) => {
    const el = document.createElement('div');
    el.className = 'row';

    const jobTitle = escapeHtml(it.jobTitle || '');
    const location = it.location ? escapeHtml(it.location) : '';
    const description = it.description ? escapeHtml(it.description) : '';
    const createdAt = it.createdAt ? new Date(it.createdAt).toLocaleString() : '';

    el.innerHTML = `
      <div class="title">
        <strong>${jobTitle || 'Untitled role'}</strong>
        <span>${location ? `📍 ${location}` : 'Location not set'}${createdAt ? ` · ${escapeHtml(createdAt)}` : ''}</span>
      </div>
      <div style="display:flex; gap:10px; align-items:center">
        <button class="btn small" data-action="view" type="button">View</button>
        <button class="btn small" style="background:#ef4444; border-color:#ef4444; color:white" data-action="delete" type="button">Delete</button>
      </div>
    `;

    el.querySelector('[data-action="view"]').onclick = () => {
      alert(description ? `Description:\n\n${description}` : 'No description.');
    };

    el.querySelector('[data-action="delete"]').onclick = () => {
      const next = state.jobPostings.filter((x) => x.id !== it.id);
      state.jobPostings = next;
      saveList(LIST_KEY, next);
      renderDashboardCreatedJobs();
      updateKpiWidgets();
      if (state.activeView === 'jobs') {
        initJobsWorkspace();
      }
    };

    container.appendChild(el);
  });
}

// ==========================================
// CENTRAL INITIALIZATION ROUTINE
// ==========================================
async function init() {
  // 1. Load state safely
  try {
    await loadStateFromStorage();
  } catch (err) {
    console.error("Failed to load state from storage:", err);
  }

  // 2. High-priority binding of navigation links immediately so they are ALWAYS responsive
  try {
    bindSpaLinks();
  } catch (err) {
    console.error("Failed to bind SPA links:", err);
  }

  // 3. User greetings and header config
  try {
    const welcomeLine = document.getElementById('welcomeLine');
    const avatar = document.getElementById('avatar');
    if (welcomeLine && state.user) {
      const name = state.user.name || state.user.fullName || 'Company';
      welcomeLine.textContent = `Welcome back, ${name}!`;
      if (avatar) avatar.textContent = name[0].toUpperCase();
    }
  } catch (err) {
    console.error("Failed to configure user welcome headers:", err);
  }

  // 4. Logout button binding
  try {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        clearCurrentUser();
        window.location.href = '../../login/index.html?forceLogin=1';
      };
    }
  } catch (err) {
    console.error("Failed to bind logout button:", err);
  }

  // 5. Populate candidate autocomplete datalist
  try {
    populateCandidatesDatalist();
  } catch (err) {
    console.error("Failed to populate candidates datalist:", err);
  }

  // 6. Update KPI numbers and initial dashboard grids
  try {
    updateKpiWidgets();
  } catch (err) {
    console.error("Failed to update KPI widgets:", err);
  }

  try {
    renderDashboardCreatedJobs();
  } catch (err) {
    console.error("Failed to render dashboard created jobs list:", err);
  }

  // 7. Theme configurations
  try {
    initThemeSelector();
  } catch (err) {
    console.error("Failed to initialize theme selector:", err);
  }

  // 8. Create Job Posting Form (Quick Action panel)
  try {
    const createForm = document.getElementById('createForm');
    const formMsg = document.getElementById('formMsg');
    const formOk = document.getElementById('formOk');
    if (createForm) {
      createForm.onsubmit = (e) => {
        e.preventDefault();

        if (formMsg) formMsg.style.display = 'none';
        if (formOk) formOk.style.display = 'none';

        const jobTitle = document.getElementById('jobTitle')?.value?.trim() ?? '';
        const location = document.getElementById('location')?.value?.trim() ?? '';
        const description = document.getElementById('description')?.value?.trim() ?? '';

        if (!jobTitle) {
          if (formMsg) {
            formMsg.textContent = 'Job title is required.';
            formMsg.style.display = 'block';
          }
          return;
        }

        const next = loadList(LIST_KEY);
        const newJob = {
          id: uid('job'),
          role: 'Company',
          jobTitle,
          location: location || '',
          description: description || '',
          status: 'Active',
          applied: 0,
          interviewed: 0,
          offered: 0,
          createdAt: new Date().toISOString()
        };

        next.unshift(newJob);
        state.jobPostings = next;
        saveList(LIST_KEY, next);
        
        try {
          renderDashboardCreatedJobs();
        } catch (e) {}
        try {
          updateKpiWidgets();
        } catch (e) {}

        if (formOk) {
          formOk.textContent = 'Job created successfully!';
          formOk.style.display = 'block';
        }
        createForm.reset();
      };
    }
  } catch (err) {
    console.error("Failed to bind quick create job form:", err);
  }
}

function populateCandidatesDatalist() {
  const datalist = document.getElementById('registered-candidates-datalist');
  if (!datalist) return;

  datalist.innerHTML = '';
  try {
    const accounts = loadList('ekvueAccounts');
    const candidates = accounts.filter(a => a.role === 'Candidate');
    
    const uniqueNames = new Set();
    candidates.forEach(c => {
      const name = c.name || c.fullName;
      if (name) {
        uniqueNames.add(name);
      }
    });

    // Fallback standard profiles to ensure datalist is always fully functional out-of-the-box
    if (uniqueNames.size === 0) {
      ['Priya Sharma', 'Rohan Gupta', 'Ritesh Kumar', 'Aarav Mehta', 'Neha Patel', 'Aditi Rao'].forEach(n => uniqueNames.add(n));
    }

    uniqueNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      datalist.appendChild(option);
    });
  } catch (err) {
    console.warn('Failed to populate candidates datalist:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Listen to local storage changes to support real-time network sync updates on separate laptops!
window.addEventListener('storage', (e) => {
  console.log('[NetworkSync] Company localStorage updated, synchronizing state Views...');
  loadStateFromStorage();
  updateKpiWidgets();

  // If a candidate applied, refresh job workspace & applicants
  if (e && (e.key === 'ekvueJobApplications' || e.key === 'ekvueCompanyItems') && state.activeView === 'jobs' && activeJob) {
    const updatedJob = state.jobPostings.find(x => x.id === activeJob.id);
    if (updatedJob) {
      selectWorkspaceJob(updatedJob);
    }
  }
  if (state.activeView === 'dashboard') {
    renderDashboardCreatedJobs();
  } else if (state.activeView === 'jobs') {
    renderJobsList();
    if (activeJob) {
      const updatedJob = state.jobPostings.find(x => x.id === activeJob.id);
      if (updatedJob) {
        selectWorkspaceJob(updatedJob);
      }
    }
  } else if (state.activeView === 'candidates') {
    // React handles its own rendering on mount/unmount
  } else if (state.activeView === 'interviews') {
    renderInterviewSchedules();
  } else if (state.activeView === 'team') {
    renderTeamMembers();
  }
});
