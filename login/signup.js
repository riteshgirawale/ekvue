/**
 * EKVUE Signup (localStorage-based)
 * Supports Candidate, Interviewer, and Company.
 */

console.log('login/signup.js loaded');

const ACCOUNTS_KEY = 'ekvueAccounts';
const signupMessage = document.getElementById('signup-message');

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
    console.warn('Failed to parse stored accounts:', err);
    localStorage.removeItem(ACCOUNTS_KEY);
    return [];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function validateEmail(email) {
  return typeof email === 'string' && email.includes('@') && email.includes('.');
}

function validateUrl(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

function getVal(id) {
  return (document.getElementById(id)?.value ?? '').trim();
}

function showMessage(message, isError = false) {
  if (!signupMessage) return;
  signupMessage.textContent = message || '';
  signupMessage.classList.toggle('error', !!isError);
  signupMessage.style.display = message ? 'block' : 'none';
}

function setLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.textContent = isLoading ? 'Creating Account...' : btn.dataset.defaultText || btn.textContent || 'Create Account';
}

function setInputError(inputId, errorId, message) {
  const inputEl = document.getElementById(inputId);
  const errorEl = document.getElementById(errorId);
  if (errorEl) errorEl.textContent = message;
  if (inputEl) {
    inputEl.classList.add('error');
    setTimeout(() => inputEl.classList.remove('error'), 2500);
  }
}

function clearErrors(errorIds) {
  errorIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

function findExisting(email, role) {
  const emailLc = String(email).toLowerCase();
  return getAccounts().find((acc) => (acc?.email ?? '').toLowerCase() === emailLc && acc?.role === role);
}

function attachHandler({ formId, role, inputMap, requiredKeys, extraBuilder, redirectTo, verifiedInputId }) {
  const formEl = document.getElementById(formId);
  if (!formEl) return;

  const submitBtn = formEl.querySelector('button[type="submit"]');
  if (submitBtn && !submitBtn.dataset.defaultText) submitBtn.dataset.defaultText = submitBtn.textContent;

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log('Signup started');
    clearErrors(requiredKeys.map((k) => inputMap[k].errorId).filter(Boolean));
    showMessage('');

    try {
      // OTP verification check
      if (verifiedInputId) {
        const verifiedEl = document.getElementById(verifiedInputId);
        if (verifiedEl && verifiedEl.value !== 'true') {
          showMessage('Please verify your email address with the OTP before creating an account.', true);
          return;
        }
      }

      const values = {};
      requiredKeys.forEach((k) => {
        values[k] = getVal(inputMap[k].id);
      });

      // required
      const missing = requiredKeys.filter((k) => !String(values[k] ?? '').trim());
      if (missing.length) {
        missing.forEach((k) => setInputError(inputMap[k].id, inputMap[k].errorId, 'This field is required.'));
        showMessage('Please fill in all required fields.', true);
        return;
      }

      // email format
      if (!validateEmail(values.email)) {
        setInputError(inputMap.email.id, inputMap.email.errorId, 'Please enter a valid email address.');
        showMessage('Please enter a valid email address.', true);
        return;
      }

      // password min 6
      if ((values.password || '').length < 6) {
        setInputError(inputMap.password.id, inputMap.password.errorId, 'Password must be at least 6 characters long.');
        showMessage('Password must be at least 6 characters long.', true);
        return;
      }

      // match
      if (values.password !== values.confirmPassword) {
        setInputError(inputMap.password.id, inputMap.password.errorId, 'Passwords do not match.');
        setInputError(inputMap.confirmPassword.id, inputMap.confirmPassword.errorId, 'Passwords do not match.');
        showMessage('Passwords do not match.', true);
        return;
      }

      // role-specific optional validation
      if (extraBuilder?.validate) {
        const vErr = extraBuilder.validate(values);
        if (vErr) {
          setInputError(vErr.inputId, vErr.errorId, vErr.message);
          showMessage(vErr.message, true);
          return;
        }
      }

      setLoading(submitBtn, true);

      // uniqueness
      const existing = findExisting(values.email, role);
      if (existing) {
        setInputError(inputMap.email.id, inputMap.email.errorId, 'An account with this email already exists.');
        showMessage('Account already exists. Please log in instead.', true);
        return;
      }

      const extra = extraBuilder?.build ? extraBuilder.build(values) : {};
      const newAccount = {
        role,
        name: values.fullName,
        email: values.email,
        password: values.password,
        createdAt: new Date().toISOString(),
        ...extra,
      };

      const accounts = getAccounts();
      accounts.push(newAccount);
      saveAccounts(accounts);

      // Canonical session used across the whole app.
      localStorage.setItem(
        'ekvueSession',
        JSON.stringify({ email: newAccount.email, role: newAccount.role, name: newAccount.name })
      );

      console.log('Account created');
      showMessage('Account created successfully! Redirecting...', false);

      setTimeout(() => {
        window.location.href = redirectTo;
      }, 900);
    } catch (error) {
      console.error('Signup failed:', error);
      showMessage('Unable to create account. Please try again.', true);
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

function setupOTPVerification(rolePrefix, emailInputId) {
  const btnSend = document.getElementById(`btnSendOtp-${rolePrefix}`);
  const otpSection = document.getElementById(`otpSection-${rolePrefix}`);
  const btnVerify = document.getElementById(`btnVerifyOtp-${rolePrefix}`);
  const hiddenVerified = document.getElementById(`emailVerified-${rolePrefix}`);
  const errorEl = document.getElementById(`otpError-${rolePrefix}`);
  const emailInput = document.getElementById(emailInputId);
  const digits = [
    document.getElementById(`otp-${rolePrefix}-1`),
    document.getElementById(`otp-${rolePrefix}-2`),
    document.getElementById(`otp-${rolePrefix}-3`),
    document.getElementById(`otp-${rolePrefix}-4`)
  ];

  if (!btnSend || !btnVerify) return;

  // Auto-advance OTP inputs
  digits.forEach((digit, idx) => {
    digit.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      if (e.target.value !== '' && idx < digits.length - 1) {
        digits[idx + 1].focus();
      }
    });
    digit.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value === '' && idx > 0) {
        digits[idx - 1].focus();
      }
    });
  });

  btnSend.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!validateEmail(email)) {
      errorEl.textContent = 'Please enter a valid email before sending OTP.';
      errorEl.style.color = '#ef4444';
      return;
    }
    
    errorEl.textContent = 'Sending...';
    errorEl.style.color = '#cbd5e1';
    btnSend.disabled = true;

    try {
      const res = await fetch('/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (data.success) {
        otpSection.classList.remove('hidden');
        errorEl.textContent = data.message || 'OTP sent! Please check your email.';
        errorEl.style.color = '#22c55e';
        digits[0].focus();
      } else {
        errorEl.textContent = data.error || 'Failed to send OTP.';
        errorEl.style.color = '#ef4444';
        btnSend.disabled = false;
      }
    } catch (err) {
      console.error('OTP Send error:', err);
      errorEl.textContent = 'Server unreachable. Ensure api/server.js is running.';
      errorEl.style.color = '#ef4444';
      btnSend.disabled = false;
    }
  });

  btnVerify.addEventListener('click', async () => {
    const otp = digits.map(d => d.value).join('');
    if (otp.length !== 4) {
      errorEl.textContent = 'Please enter all 4 digits.';
      errorEl.style.color = '#ef4444';
      return;
    }

    const email = emailInput.value.trim();
    btnVerify.disabled = true;
    errorEl.textContent = 'Verifying...';
    errorEl.style.color = '#cbd5e1';

    try {
      const res = await fetch('/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      
      if (data.success) {
        hiddenVerified.value = 'true';
        otpSection.classList.add('hidden');
        emailInput.readOnly = true;
        emailInput.style.opacity = '0.7';
        btnSend.style.display = 'none';
        
        // Add a success checkmark to the email input wrapper
        const wrapper = emailInput.closest('.email-verify-group');
        const check = document.createElement('div');
        check.innerHTML = '&#10003; Verified';
        check.style.color = '#22c55e';
        check.style.fontWeight = 'bold';
        check.style.padding = '12px';
        wrapper.appendChild(check);
      } else {
        errorEl.textContent = data.error || 'Invalid OTP.';
        errorEl.style.color = '#ef4444';
        btnVerify.disabled = false;
      }
    } catch (err) {
      console.error('OTP Verify error:', err);
      errorEl.textContent = 'Server error during verification.';
      errorEl.style.color = '#ef4444';
      btnVerify.disabled = false;
    }
  });
}

function init() {
  // Candidate
  attachHandler({
    formId: 'candidateSignupForm',
    role: 'Candidate',
    inputMap: {
      fullName: { id: 'fullName', errorId: 'fullNameError' },
      email: { id: 'email', errorId: 'emailError' },
      password: { id: 'password', errorId: 'passwordError' },
      confirmPassword: { id: 'confirmPassword', errorId: 'confirmPasswordError' },
      school: { id: 'school', errorId: 'schoolError' },
      field: { id: 'field', errorId: 'fieldError' },
      level: { id: 'level', errorId: 'levelError' },
      interests: { id: 'interests', errorId: 'interestsError' },
    },
    requiredKeys: ['fullName', 'email', 'password', 'confirmPassword', 'school', 'field', 'level', 'interests'],
    extraBuilder: {
      build: (v) => ({ school: v.school, studyField: v.field, level: v.level, interests: v.interests }),
    },
    redirectTo: '../dashboards/candidate/candidate.html',
    verifiedInputId: 'emailVerified-candidate'
  });
  setupOTPVerification('candidate', 'email');

  // Interviewer
  attachHandler({
    formId: 'interviewerSignupForm',
    role: 'Interviewer',
    inputMap: {
      fullName: { id: 'interviewerFullName', errorId: 'interviewerFullNameError' },
      email: { id: 'interviewerEmail', errorId: 'interviewerEmailError' },
      password: { id: 'interviewerPassword', errorId: 'interviewerPasswordError' },
      confirmPassword: { id: 'interviewerConfirmPassword', errorId: 'interviewerConfirmPasswordError' },
      company: { id: 'interviewerCompany', errorId: 'interviewerCompanyError' },
      title: { id: 'interviewerTitle', errorId: 'interviewerTitleError' },
      experience: { id: 'interviewerExperience', errorId: 'interviewerExperienceError' },
    },
    requiredKeys: ['fullName', 'email', 'password', 'confirmPassword', 'company', 'title', 'experience'],
    extraBuilder: {
      build: (v) => ({ company: v.company, title: v.title, experience: v.experience }),
    },
    redirectTo: '../dashboards/interviewer/interviewer.html',
    verifiedInputId: 'emailVerified-interviewer'
  });
  setupOTPVerification('interviewer', 'interviewerEmail');

  // Company
  attachHandler({
    formId: 'companySignupForm',
    role: 'Company',
    inputMap: {
      fullName: { id: 'companyName', errorId: 'companyNameError' },
      email: { id: 'companyEmail', errorId: 'companyEmailError' },
      password: { id: 'companyPassword', errorId: 'companyPasswordError' },
      confirmPassword: { id: 'companyConfirmPassword', errorId: 'companyConfirmPasswordError' },
      companyIndustry: { id: 'companyIndustry', errorId: 'companyIndustryError' },
      companySize: { id: 'companySize', errorId: 'companySizeError' },
      companyWebsite: { id: 'companyWebsite', errorId: 'companyWebsiteError' },
    },
    requiredKeys: ['fullName', 'email', 'password', 'confirmPassword', 'companyIndustry', 'companySize', 'companyWebsite'],
    extraBuilder: {
      validate: (v) => {
        const website = v.companyWebsite;
        if (website && !validateUrl(website)) {
          return { inputId: 'companyWebsite', errorId: 'companyWebsiteError', message: 'Please enter a valid website URL.' };
        }
        return null;
      },
      build: (v) => ({
        industry: v.companyIndustry,
        size: v.companySize,
        website: v.companyWebsite,
      }),
    },
    redirectTo: '../dashboards/company/company.html',
    verifiedInputId: 'emailVerified-company'
  });
  setupOTPVerification('company', 'companyEmail');
}

function bindRoleTabs() {
  const roleTabs = document.querySelectorAll('.role-tab');
  const roleSections = document.querySelectorAll('.role-section');

  const candidateForm = document.getElementById('candidateSignupForm');
  const interviewerForm = document.getElementById('interviewerSignupForm');
  const companyForm = document.getElementById('companySignupForm');

  const formsByRole = {
    candidate: candidateForm,
    interviewer: interviewerForm,
    company: companyForm,
  };

  const setVisibleRole = (role) => {
    const normalized = role && ['candidate', 'interviewer', 'company'].includes(role) ? role : 'candidate';

    // toggle tab active
    roleTabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.role === normalized);
    });

    // toggle section active
    roleSections.forEach((section) => {
      section.classList.toggle('active', section.dataset.role === normalized);
    });

    // toggle form visibility
    Object.entries(formsByRole).forEach(([r, formEl]) => {
      if (!formEl) return;
      formEl.style.display = r === normalized ? 'block' : 'none';
    });
  };

  roleTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setVisibleRole(tab.dataset.role);
    });
  });

  // initial view
  const activeTab = document.querySelector('.role-tab.active') || roleTabs[0];
  setVisibleRole(activeTab?.dataset?.role || 'candidate');
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    bindRoleTabs();
  } catch (e) {
    console.error('Failed to bind role tabs:', e);
  }
  init();
});
