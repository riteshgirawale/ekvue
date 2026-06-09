import '../help-chatbot.js';

/**
 * Shared localStorage helpers + simple CRUD model for dashboards.
 */

const LS_KEYS = {
  accounts: 'ekvueAccounts',
  // Canonical session key used across signup + login + dashboards.
  // Shape: { email: string, role: 'Candidate'|'Interviewer'|'Company', name: string }
  currentUser: 'ekvueSession',

  // per-role entity buckets
  candidateItems: 'ekvueCandidateItems',
  interviewerItems: 'ekvueInterviewerItems',
  companyItems: 'ekvueCompanyItems',
};

function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function getCurrentUser() {
  // Try sessionStorage first to isolate tabs sessions (avoid candidate/interviewer dashboard collisions)
  let raw = sessionStorage.getItem(LS_KEYS.currentUser);
  if (raw) {
    const parsed = safeParse(raw, null);
    if (parsed && typeof parsed === 'object') return parsed;
  }

  // Fallback to localStorage and migrate to sessionStorage for this tab
  raw = localStorage.getItem(LS_KEYS.currentUser);
  if (raw) {
    const parsed = safeParse(raw, null);
    if (parsed && typeof parsed === 'object') {
      sessionStorage.setItem(LS_KEYS.currentUser, JSON.stringify(parsed));
      return parsed;
    }
  }

  // Legacy migration (older builds used ekvueCurrentUser and/or ekvueUser).
  const legacyCurrent = localStorage.getItem('ekvueCurrentUser');
  if (legacyCurrent) {
    const parsed = safeParse(legacyCurrent, null);
    if (parsed && typeof parsed === 'object' && parsed.role) {
      const migrated = { email: '', role: parsed.role, name: parsed.name ?? '' };
      sessionStorage.setItem(LS_KEYS.currentUser, JSON.stringify(migrated));
      localStorage.setItem(LS_KEYS.currentUser, JSON.stringify(migrated));
      return migrated;
    }
  }

  const legacyUser = localStorage.getItem('ekvueUser');
  if (legacyUser) {
    const parsed = safeParse(legacyUser, null);
    if (parsed && typeof parsed === 'object' && parsed.email) {
      const migrated = { email: parsed.email ?? '', role: parsed.role ?? '', name: parsed.name ?? '' };
      sessionStorage.setItem(LS_KEYS.currentUser, JSON.stringify(migrated));
      localStorage.setItem(LS_KEYS.currentUser, JSON.stringify(migrated));
      return migrated;
    }
  }

  return null;
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    // No user session; force back to login flow.
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
  // Remove legacy keys too (to avoid split-brain sessions).
  localStorage.removeItem('ekvueCurrentUser');
  localStorage.removeItem('ekvueUser');
}

function loadList(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderEmptyState(container, message) {
  container.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = message;
  p.style.color = '#64748b';
  container.appendChild(p);
}

function normalizeText(s) {
  return String(s ?? '').trim();
}

// ==========================================
// REAL-TIME MULTI-LAPTOP SYNC SYSTEM (WS RELAY)
// ==========================================
let syncSocket = null;
let isSyncingState = false;
const SYNC_CHANNEL = 'ekvue_global_live_interviews';

// Generic list merging algorithm (merges by unique item 'id' or 'meetingId' based on timestamps)
function mergeGenericLists(localList, remoteList) {
  if (!Array.isArray(localList)) return Array.isArray(remoteList) ? remoteList : [];
  if (!Array.isArray(remoteList)) return localList;
  
  const merged = [...localList];
  remoteList.forEach((remoteItem) => {
    const remoteId = remoteItem.id || remoteItem.meetingId;
    if (!remoteId) return;
    
    const localIdx = merged.findIndex(m => (m.id === remoteId || m.meetingId === remoteId));
    if (localIdx > -1) {
      const localItem = merged[localIdx];
      // Compare lastUpdated or createdAt timestamps (fallback to 0 if not defined)
      const localTime = new Date(localItem.lastUpdated || localItem.createdAt || 0).getTime();
      const remoteTime = new Date(remoteItem.lastUpdated || remoteItem.createdAt || 0).getTime();
      
      if (remoteTime >= localTime) {
        merged[localIdx] = remoteItem;
      }
    } else {
      merged.push(remoteItem);
    }
  });
  
  return merged;
}

// Special legacy merge for live interviews
function mergeMeetings(localList, remoteList) {
  if (!Array.isArray(localList)) return Array.isArray(remoteList) ? remoteList : [];
  if (!Array.isArray(remoteList)) return localList;
  
  const merged = [...localList];
  remoteList.forEach((remoteMeeting) => {
    const localIdx = merged.findIndex(m => m.meetingId === remoteMeeting.meetingId);
    if (localIdx > -1) {
      const localMeeting = merged[localIdx];
      const localTime = new Date(localMeeting.lastUpdated || 0).getTime();
      const remoteTime = new Date(remoteMeeting.lastUpdated || 0).getTime();
      
      if (remoteTime > localTime) {
        merged[localIdx] = remoteMeeting;
      }
    } else {
      merged.push(remoteMeeting);
    }
  });
  
  return merged;
}

// Generic state broadcaster
function broadcastNetworkState(key, rawStateValue) {
  if (isSyncingState) return;
  
  // 1. WebSocket Broadcaster (Fast but unreliable free tier)
  if (syncSocket && syncSocket.readyState === WebSocket.OPEN) {
    try {
      const payload = JSON.parse(rawStateValue);
      syncSocket.send(JSON.stringify({
        type: 'KEY_STATE_UPDATE',
        key: key,
        payload: payload
      }));
      console.log(`[NetworkSync] Broadcasted active key "${key}" state update to network relay.`);
    } catch (err) {
      console.warn('[NetworkSync] Broadcast parse failed:', err);
    }
  }

  // 2. HTTP Backend Broadcaster (Slow but 100% reliable fallback for cross-laptop sync)
  try {
    const payload = JSON.parse(rawStateValue);
    fetch(`/api/global-state/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (err) {}
}

// Legacy compatibility broadcaster
function broadcastLiveInterviewsState(rawStateValue) {
  broadcastNetworkState('ekvueLiveInterviews', rawStateValue);
}

function initNetworkSync() {
  const wsUrl = `wss://free.piesocket.com/v3/${SYNC_CHANNEL}?api_key=VCXCEuvhGcBDP7XhiJJ2th20z4F5YfsCVPGsDfpj&notify_self=0`;
  console.log(`[NetworkSync] Activating multi-laptop synchronization via: ${wsUrl}`);
  
  const connectSocket = () => {
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('[NetworkSync] Established socket connection with zero-config relay.');
      // Request remote state catch-up on join
      socket.send(JSON.stringify({ type: 'SYNC_REQUEST' }));
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'KEY_STATE_UPDATE') {
          isSyncingState = true;
          const targetKey = data.key;
          const remotePayload = data.payload;
          
          if (targetKey && Array.isArray(remotePayload)) {
            let localList = [];
            try {
              localList = JSON.parse(localStorage.getItem(targetKey) || '[]');
            } catch {}
            
            const merged = mergeGenericLists(localList, remotePayload);
            localStorage.setItem(targetKey, JSON.stringify(merged));
            console.log(`[NetworkSync] Replicated key "${targetKey}" from network stream successfully.`);
          }
          
          isSyncingState = false;
          window.dispatchEvent(new Event('storage'));
        } 
        else if (data.type === 'STATE_UPDATE') {
          // Backward compatibility for legacy streams
          isSyncingState = true;
          let localMeetings = [];
          try {
            localMeetings = JSON.parse(localStorage.getItem('ekvueLiveInterviews') || '[]');
          } catch {}
          
          const mergedMeetings = mergeMeetings(localMeetings, data.payload);
          localStorage.setItem('ekvueLiveInterviews', JSON.stringify(mergedMeetings));
          
          isSyncingState = false;
          window.dispatchEvent(new Event('storage'));
        } 
        else if (data.type === 'SYNC_REQUEST') {
          // Send all key states for sync catch-up!
          const keysToSync = ['ekvueLiveInterviews', 'ekvueCompanySchedules', 'ekvueCompanyItems', 'ekvueTeamRegistry', 'ekvueAccounts', 'ekvueInterviewerScorecards', 'ekvueNotifications', 'ekvueJobApplications'];
          keysToSync.forEach(key => {
            const rawVal = localStorage.getItem(key);
            if (rawVal && socket.readyState === WebSocket.OPEN) {
              try {
                socket.send(JSON.stringify({
                  type: 'KEY_STATE_UPDATE',
                  key: key,
                  payload: JSON.parse(rawVal)
                }));
              } catch {}
            }
          });
        }
      } catch (err) {
        console.warn('[NetworkSync] Error handling message:', err);
      }
    };
    
    socket.onclose = () => {
      console.warn('[NetworkSync] Relayer disconnected. Reconnecting in 4 seconds...');
      setTimeout(connectSocket, 4000);
    };
    
    syncSocket = socket;
  };
  
  connectSocket();
}

// Global setItem Interceptor to broadcast local updates instantly
try {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    
    // Broadcast all core recruiter + interviewer + candidate lists instantly!
    const keysToBroadcast = ['ekvueLiveInterviews', 'ekvueCompanySchedules', 'ekvueCompanyItems', 'ekvueTeamRegistry', 'ekvueAccounts', 'ekvueJobApplications'];
    if (keysToBroadcast.includes(key)) {
      broadcastNetworkState(key, value);
    }
  };
} catch (e) {
  console.warn('[NetworkSync] Failed to intercept localStorage.setItem:', e);
}

// Auto-run connection on module import inside client browser
if (typeof window !== 'undefined') {
  // Delay slightly to let page initialization bind local listeners first
  setTimeout(initNetworkSync, 1000);
}

function addNotification(candidateEmail, title, message, type, metadata = {}) {
  const notifId = uid('notif');
  const notificationPayload = {
    id: notifId,
    candidateEmail: String(candidateEmail || '').toLowerCase().trim(),
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
    metadata
  };

  // Save to MongoDB
  fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationPayload)
  }).catch(() => {});

  // For backward compatibility while components finish migrating
  const notifications = loadList('ekvueNotifications') || [];
  notifications.push(notificationPayload);
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

export {
  LS_KEYS,
  getCurrentUser,
  requireAuth,
  setCurrentUser,
  clearCurrentUser,
  loadList,
  saveList,
  uid,
  escapeHtml,
  renderEmptyState,
  normalizeText,
  addNotification,
};
