const roleTabs = document.querySelectorAll('.role-tab');
const roleSections = document.querySelectorAll('.role-section');
const loginMessage = document.getElementById('role-login-message');
const signupStatusMessage = document.getElementById('signup-status-message');
const dashboardPanel = document.getElementById('role-dashboard');
const loginForms = document.querySelectorAll('.role-section .role-login-form');
const rolePortal = document.querySelector('.role-portal');
const accountToggle = document.getElementById('open-create-account');

const ACCOUNTS_KEY = 'ekvueAccounts';
const LAST_ROLE_KEY = 'ekvueLastRole';

const roleLabels = {
  candidate: 'Candidate',
  interviewer: 'Interviewer',
  company: 'Company',
};

function setActiveRole(role) {
  if (!['candidate', 'interviewer', 'company'].includes(role)) {
    role = 'candidate';
  }

  roleTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.role === role);
  });
  roleSections.forEach((section) => {
    section.classList.toggle('active', section.dataset.role === role);
  });

  localStorage.setItem(LAST_ROLE_KEY, role);

  if (loginMessage) {
    loginMessage.textContent = '';
    loginMessage.classList.remove('error');
  }
}

function getSession() {
  const session = localStorage.getItem('ekvueSession');
  return session ? JSON.parse(session) : null;
}

function getAccounts() {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) {
    const defaults = [
      {
        role: 'Candidate',
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: 'password',
        school: 'Stanford University',
        studyField: 'Software Engineering',
        level: 'Student',
        createdAt: new Date().toISOString()
      },
      {
        role: 'Interviewer',
        name: 'EkVue AI',
        email: 'interviewer@example.com',
        password: 'password',
        createdAt: new Date().toISOString()
      },
      {
        role: 'Company',
        name: 'Google Recruiter',
        email: 'recruiter@example.com',
        password: 'password',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function findAccount(email, role) {
  return getAccounts().find(
    (account) => account.email.toLowerCase() === email.toLowerCase() && account.role === role
  );
}

function saveSession(email, role, name) {
  // Canonical session used across the whole app.
  // Shape: { email, role, name }
  sessionStorage.setItem('ekvueSession', JSON.stringify({ email, role, name: name ?? '' }));
  localStorage.setItem('ekvueSession', JSON.stringify({ email, role, name: name ?? '' }));
}

function clearSession() {
  localStorage.removeItem('ekvueSession');
  window.location.reload();
}

function showMessage(message, isError = false) {
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.classList.toggle('error', isError);
}

function renderDashboard(session) {
  if (!session || !dashboardPanel || !rolePortal) return;

  const role = (session.role || '').toLowerCase();
  const roleDashboardMap = {
    candidate: 'dashboards/candidate/candidate.html',
    interviewer: 'dashboards/interviewer/interviewer.html',
    company: 'dashboards/company/company.html',
  };

  const dashboardHref = roleDashboardMap[role];

  rolePortal.classList.add('hidden');
  dashboardPanel.classList.remove('hidden');

  const roleFeatureSets = {
    candidate: [
      { title: 'Practice Live Coding', desc: 'Warm up with quick Two Sum-style challenges.', cta: 'Start Practice', href: 'dashboards/candidate/candidate.html' },
      { title: 'Interview Prep Plan', desc: 'Get a tailored week-by-week roadmap.', cta: 'View Plan', href: 'dashboards/candidate/candidate.html' },
      { title: 'AI Report Snapshot', desc: 'See strengths and improvement areas instantly.', cta: 'Open Report', href: 'dashboards/candidate/candidate.html' },
    ],
    interviewer: [
      { title: 'Run a Structured Interview', desc: 'Follow prompts, time-boxed questions, and scoring.', cta: 'Start Session', href: 'dashboards/interviewer/interviewer.html' },
      { title: 'Candidate Evaluation', desc: 'Capture notes, then generate a clean summary.', cta: 'Evaluate', href: 'dashboards/interviewer/interviewer.html' },
      { title: 'Question Bank', desc: 'Reuse and customize proven prompts.', cta: 'Browse Bank', href: 'dashboards/interviewer/interviewer.html' },
    ],
    company: [
      { title: 'Create Hiring Workflow', desc: 'Set roles, rounds, and interview schedules.', cta: 'Build Workflow', href: 'dashboards/company/company.html' },
      { title: 'Team Invitations', desc: 'Invite interviewers in one click.', cta: 'Invite Team', href: 'dashboards/company/company.html' },
      { title: 'Analytics Overview', desc: 'Track funnel health and interview outcomes.', cta: 'View Analytics', href: 'dashboards/company/company.html' },
    ],
  };

  const features = roleFeatureSets[role] || roleFeatureSets.candidate;

  dashboardPanel.innerHTML = `
    <div class="dashboard-head">
      <h3>Welcome back, ${session.role}</h3>
      <p class="dashboard-sub">
        Logged in as <strong>${session.email}</strong>. Your next best action is one click away.
      </p>
      <div class="dashboard-actions">
        <a class="button button-primary" href="${dashboardHref || 'index.html'}">Open ${session.role} dashboard</a>
        <a class="button button-secondary" href="index.html">Return to homepage</a>
        <button class="button button-secondary" id="logout-button" type="button">Sign out</button>
      </div>
    </div>

    <div class="dashboard-features">
      <div class="dashboard-features-title">Quick features</div>
      <div class="dashboard-feature-grid">
        ${features
          .map(
            (f) => `
          <div class="dashboard-feature-card">
            <div class="feature-card-glow" aria-hidden="true"></div>
            <div class="feature-card-body">
              <div class="feature-card-title">${f.title}</div>
              <div class="feature-card-desc">${f.desc}</div>
              <a class="feature-card-link" href="${f.href}">${f.cta} <span aria-hidden="true">→</span></a>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) logoutButton.addEventListener('click', clearSession);
}

function validateCredentials(email, password) {
  if (!email || !password) {
    showMessage('Please enter both email and password.', true);
    return false;
  }

  if (!email.includes('@') || password.length < 6) {
    showMessage('Enter a valid email and password with at least 6 characters.', true);
    return false;
  }

  return true;
}

function handleRoleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const role = form.dataset.role;
  const emailInput = form.querySelector('input[type="email"]');
  const passwordInput = form.querySelector('input[type="password"]');
  const email = emailInput?.value.trim() || '';
  const password = passwordInput?.value || '';

  if (!validateCredentials(email, password)) {
    return;
  }

  const accountRole = roleLabels[role] || role;
  const account = findAccount(email, accountRole);
  if (!account) {
    showMessage('No account found for this role. Please create a new account first.', true);
    return;
  }

  if (account.password !== password) {
    showMessage('Incorrect password. Please check your credentials.', true);
    return;
  }

  saveSession(email, accountRole, account?.name);
  showMessage(`Logged in successfully as ${accountRole}.`);
  setTimeout(() => {
    // Always send user to the correct dashboard page.
    // This file is used by BOTH:
    // - /get-started.html  -> dashboards live at /dashboards/*
    // - /login/index.html  -> dashboards live at ../dashboards/*
    const inLoginFolder = window.location.pathname.includes('/login/');
    const prefix = inLoginFolder ? '../' : '';
    const dashboardPaths = {
      Candidate: `${prefix}dashboards/candidate/candidate.html`,
      Interviewer: `${prefix}dashboards/interviewer/interviewer.html`,
      Company: `${prefix}dashboards/company/company.html`,
    };

    window.location.href = dashboardPaths[accountRole] || `${prefix}dashboards/candidate/candidate.html`;
  }, 800);
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function clearStoredSession() {
  localStorage.removeItem('ekvueSession');
  localStorage.removeItem('ekvueUser');
}

function showSignupStatusFromQuery() {
  if (!signupStatusMessage) return;
  const signedUp = getQueryParam('signedup');
  const role = getQueryParam('role');

  if (signedUp === '1') {
    signupStatusMessage.textContent = `Account created successfully. You can now log in as ${role || 'your role'}.`;
    signupStatusMessage.classList.remove('error');
  }
}

function getSavedRole() {
  const saved = localStorage.getItem(LAST_ROLE_KEY);
  return saved && ['candidate', 'interviewer', 'company'].includes(saved) ? saved : 'candidate';
}

function initialize() {
  roleTabs.forEach((tab) => {
    tab.addEventListener('click', () => setActiveRole(tab.dataset.role));
  });

  loginForms.forEach((form) => {
    form.addEventListener('submit', handleRoleLogin);
  });

  if (accountToggle) {
    accountToggle.addEventListener('click', () => {
      window.location.href = 'signup.html';
    });
  }

  const forceLogin = getQueryParam('forceLogin') === '1';
  if (forceLogin) {
    clearStoredSession();
  }

  let session = forceLogin ? null : getSession();

  // Fallback migration: index.html modal login stores `ekvueUser`.
  if (!session) {
    const raw = localStorage.getItem('ekvueUser');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.email) {
          session = { email: parsed.email, role: parsed.role || 'Candidate' };
          localStorage.setItem('ekvueSession', JSON.stringify(session));
        }
      } catch (e) {
        // ignore migration errors
      }
    }
  }

  if (session) {
    renderDashboard(session);
    setActiveRole(session.role?.toLowerCase() || getSavedRole());
  } else {
    // No session at all => preserve the last selected role across refreshes.
    setActiveRole(getSavedRole());
  }

  showSignupStatusFromQuery();
}

document.addEventListener('DOMContentLoaded', initialize);
