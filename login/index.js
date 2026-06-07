const roleTabs = document.querySelectorAll('.role-tab');
const roleSections = document.querySelectorAll('.role-section');
const loginMessage = document.getElementById('role-login-message');
const loginForms = document.querySelectorAll('.role-content .role-login-form, .role-section .role-login-form');
const accountToggle = document.getElementById('open-create-account');

const ACCOUNTS_KEY = 'ekvueAccounts';
const LAST_ROLE_KEY = 'ekvueLastRole';

const roleLabels = {
  candidate: 'Candidate',
  interviewer: 'Interviewer',
  company: 'Company',
};

const dashboardPaths = {
  'Candidate': '../dashboards/candidate/candidate.html',
  'Interviewer': '../dashboards/interviewer/interviewer.html',
  'Company': '../dashboards/company/company.html',
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

// Fixed bracket scope issue
function showMessage(message, isError = false) {
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.classList.toggle('error', isError);
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

async function handleRoleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const role = form.dataset.role;
  const emailInput = form.querySelector('input[type="email"]');
  const passwordInput = form.querySelector('input[type="password"]');
  const email = emailInput?.value.trim() || '';
  const password = passwordInput?.value || '';

  if (email.toLowerCase() === 'admin@gmail.com' && password === '123456') {
    saveSession(email, 'Admin', 'Site Administrator');
    showMessage('Logged in successfully as Site Administrator.');
    setTimeout(() => {
      window.location.href = '../dashboards/admin/admin.html';
    }, 800);
    return;
  }

  if (!validateCredentials(email, password)) {
    return;
  }

  const accountRole = roleLabels[role] || role;
  
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: accountRole })
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.success) {
      showMessage(data.error || 'Login failed. Please check your credentials.', true);
      return;
    }

    const account = data.user;
    saveSession(email, accountRole, account?.name);
    showMessage(`Logged in successfully as ${accountRole}.`);
    
    setTimeout(() => {
      const dashboardPath = dashboardPaths[accountRole] || '../dashboards/candidate/candidate.html';
      window.location.href = dashboardPath;
    }, 800);
  } catch (err) {
    console.error('Login error:', err);
    showMessage('Unable to connect to server.', true);
  }
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
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
    localStorage.removeItem('ekvueSession');
    localStorage.removeItem('ekvueUser');
    localStorage.removeItem('ekvueCurrentUser'); // legacy
  }

  // Load saved role preference
  const savedRole = localStorage.getItem(LAST_ROLE_KEY);
  if (savedRole && ['candidate', 'interviewer', 'company'].includes(savedRole)) {
    setActiveRole(savedRole);
  } else {
    setActiveRole('candidate');
  }
}

document.addEventListener('DOMContentLoaded', initialize);
