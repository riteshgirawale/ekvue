/**
 * EKVUE Shared Utilities — Non-module global version
 * All functions are attached to window for use without ES module imports.
 */

(function() {
  'use strict';

  var LS_KEYS = {
    accounts: 'ekvueAccounts',
    currentUser: 'ekvueSession',
    candidateItems: 'ekvueCandidateItems',
    interviewerItems: 'ekvueInterviewerItems',
    companyItems: 'ekvueCompanyItems',
  };

  function safeParse(json, fallback) {
    try {
      var parsed = JSON.parse(json);
      return parsed != null ? parsed : fallback;
    } catch(e) {
      return fallback;
    }
  }

  function getCurrentUser() {
    var raw = sessionStorage.getItem(LS_KEYS.currentUser);
    if (raw) {
      var parsed = safeParse(raw, null);
      if (parsed && typeof parsed === 'object') return parsed;
    }
    raw = localStorage.getItem(LS_KEYS.currentUser);
    if (raw) {
      var parsed2 = safeParse(raw, null);
      if (parsed2 && typeof parsed2 === 'object') {
        sessionStorage.setItem(LS_KEYS.currentUser, JSON.stringify(parsed2));
        return parsed2;
      }
    }
    var legacyCurrent = localStorage.getItem('ekvueCurrentUser');
    if (legacyCurrent) {
      var p = safeParse(legacyCurrent, null);
      if (p && typeof p === 'object' && p.role) {
        var migrated = { email: '', role: p.role, name: p.name || '' };
        sessionStorage.setItem(LS_KEYS.currentUser, JSON.stringify(migrated));
        localStorage.setItem(LS_KEYS.currentUser, JSON.stringify(migrated));
        return migrated;
      }
    }
    var legacyUser = localStorage.getItem('ekvueUser');
    if (legacyUser) {
      var p2 = safeParse(legacyUser, null);
      if (p2 && typeof p2 === 'object' && p2.email) {
        var migrated2 = { email: p2.email || '', role: p2.role || '', name: p2.name || '' };
        sessionStorage.setItem(LS_KEYS.currentUser, JSON.stringify(migrated2));
        localStorage.setItem(LS_KEYS.currentUser, JSON.stringify(migrated2));
        return migrated2;
      }
    }
    return null;
  }

  function requireAuth() {
    var user = getCurrentUser();
    if (!user) {
      window.location.href = '../../login/index.html?forceLogin=1';
      return null;
    }
    return user;
  }

  function setCurrentUser(user) {
    sessionStorage.setItem(LS_KEYS.currentUser, JSON.stringify(user));
    localStorage.setItem(LS_KEYS.currentUser, JSON.stringify(user));
  }

  function clearCurrentUser() {
    sessionStorage.removeItem(LS_KEYS.currentUser);
    localStorage.removeItem(LS_KEYS.currentUser);
    localStorage.removeItem('ekvueCurrentUser');
    localStorage.removeItem('ekvueUser');
  }

  function loadList(key) {
    var raw = localStorage.getItem(key);
    if (!raw) return [];
    var parsed = safeParse(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function saveList(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  }

  function uid(prefix) {
    prefix = prefix || 'id';
    return prefix + '_' + Date.now() + '_' + Math.random().toString(16).slice(2);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderEmptyState(container, message) {
    container.innerHTML = '';
    var p = document.createElement('p');
    p.textContent = message;
    p.style.color = '#64748b';
    container.appendChild(p);
  }

  function normalizeText(s) {
    return String(s == null ? '' : s).trim();
  }

  function addNotification(candidateEmail, title, message, type, metadata) {
    metadata = metadata || {};
    var notifications = loadList('ekvueNotifications') || [];
    notifications.push({
      id: uid('notif'),
      candidateEmail: String(candidateEmail == null ? '' : candidateEmail).toLowerCase().trim(),
      title: title,
      message: message,
      type: type,
      read: false,
      createdAt: new Date().toISOString(),
      metadata: metadata
    });
    saveList('ekvueNotifications', notifications);

    // Send real email notification using the new Nodemailer backend
    if (candidateEmail && candidateEmail.includes('@')) {
      fetch('https://ekvue.onrender.com/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: candidateEmail, title: title, message: message })
      }).catch(function(err) {
        console.warn('Failed to send email notification:', err);
      });
    }
  }

  // Attach to window
  window.LS_KEYS = LS_KEYS;
  window.getCurrentUser = getCurrentUser;
  window.requireAuth = requireAuth;
  window.setCurrentUser = setCurrentUser;
  window.clearCurrentUser = clearCurrentUser;
  window.loadList = loadList;
  window.saveList = saveList;
  window.uid = uid;
  window.escapeHtml = escapeHtml;
  window.renderEmptyState = renderEmptyState;
  window.normalizeText = normalizeText;
  window.addNotification = addNotification;
})();
