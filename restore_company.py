import sys

with open('dashboards/company/company.js', 'r', encoding='utf-8') as f:
    content = f.read()

index = content.find('function initNotificationsCenter() {')
if index != -1:
    content = content[:index]

fixed_code = '''function initNotificationsCenter() {
  const bellBtn = document.getElementById('notif-bell-btn');
  const dropdown = document.getElementById('notif-dropdown');
  const markAllBtn = document.getElementById('mark-all-read-btn');

  if (bellBtn && dropdown) {
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.classList.contains('hidden') && !dropdown.contains(e.target) && e.target !== bellBtn) {
        dropdown.classList.add('hidden');
      }
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener('click', async () => {
      let myEmail = '';
      if (typeof state !== 'undefined' && state.user && state.user.email) {
          myEmail = state.user.email.toLowerCase().trim();
      } else {
          const userRaw = localStorage.getItem('ekvueCurrentUser') || sessionStorage.getItem('ekvueSession');
          if (userRaw) {
             const usr = JSON.parse(userRaw);
             myEmail = (usr.email || '').toLowerCase().trim();
          }
      }
      try {
        await fetch('/api/notifications/mark-read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateEmail: myEmail })
        });
        renderNotifications();
      } catch (err) {}
    });
  }

  renderNotifications();
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'ekvueNotifications') {
      renderNotifications();
    }
  });
}

function escapeHtmlNotif(unsafe) {
  if (!unsafe) return '';
  return unsafe
       .toString()
       .replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#039;');
}

async function renderNotifications() {
  const listContainer = document.getElementById('notif-list-container');
  const badge = document.getElementById('notif-badge');
  if (!listContainer) return;

  let myEmail = '';
  let myName = '';
  
  if (typeof state !== 'undefined' && state.user) {
      myEmail = (state.user.email || '').toLowerCase().trim();
      myName = (state.user.name || state.user.fullName || '').toLowerCase().trim();
  } else {
      const userRaw = localStorage.getItem('ekvueCurrentUser') || sessionStorage.getItem('ekvueSession');
      if (userRaw) {
         const usr = JSON.parse(userRaw);
         myEmail = (usr.email || '').toLowerCase().trim();
         myName = (usr.name || usr.fullName || '').toLowerCase().trim();
      }
  }
  
  let myNotifs = [];
  try {
    const qParams = new URLSearchParams();
    if (myEmail) qParams.append('candidateEmail', myEmail);
    if (myName) qParams.append('candidateName', myName);
    const res = await fetch('/api/notifications?' + qParams.toString());
    if (res.ok) {
      myNotifs = await res.json();
    }
  } catch (err) {}

  const unreadCount = myNotifs.filter(n => !n.read).length;
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  listContainer.innerHTML = '';

  if (myNotifs.length === 0) {
    listContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--muted); font-size: 12px;">No notifications yet.</div>`;
    return;
  }

  myNotifs.forEach(notif => {
    const item = document.createElement('div');
    item.className = 'notif-item';
    item.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      cursor: pointer;
      display: flex;
      gap: 10px;
      transition: all 0.2s ease;
      background: ${notif.read ? 'transparent' : 'rgba(168, 85, 247, 0.06)'};
    `;

    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(255, 255, 255, 0.02)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = notif.read ? 'transparent' : 'rgba(168, 85, 247, 0.06)';
    });

    const notifIcon = notif.type === 'application' ? '📩' : (notif.type === 'canceled' ? '❌' : '🔔');

    item.innerHTML = `
      <span style="font-size: 16px; flex-shrink: 0; margin-top: 2px;">${notifIcon}</span>
      <div style="display: flex; flex-direction: column; gap: 3px; flex-grow: 1;">
        <span style="font-size: 12px; font-weight: ${notif.read ? '700' : '800'}; color: ${notif.read ? '#cbd5e1' : 'white'};">${escapeHtmlNotif(notif.title)}</span>
        <span style="font-size: 11px; color: var(--muted); line-height: 1.4;">${escapeHtmlNotif(notif.message)}</span>
        <span style="font-size: 9px; color: #64748b; font-family: monospace; margin-top: 2px;">${new Date(notif.createdAt).toLocaleTimeString()}</span>
      </div>
    `;

    item.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await fetch('/api/notifications/mark-read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notif.id })
        });
      } catch (err) {}
      
      const dropdown = document.getElementById('notif-dropdown');
      if (dropdown) dropdown.classList.add('hidden');
      
      if (notif.type === 'application' && window.switchView) {
          window.switchView('jobs');
      } else if (notif.type === 'canceled' && window.switchView) {
          window.switchView('sessions');
      }
      
      renderNotifications();
    });

    listContainer.appendChild(item);
  });
}

document.addEventListener('DOMContentLoaded', initNotificationsCenter);
'''

with open('dashboards/company/company.js', 'w', encoding='utf-8') as f:
    f.write(content + fixed_code)

print('Restored company.js safely.')
