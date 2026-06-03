/* ==========================================
   EKVUE GLOBAL INTERACTIVE SYSTEM ASSISTANT
   ========================================== */

import { findAnswer } from './chatbot-database.js';

const chatbotStyles = `
/* Help Chatbot CSS */
#ekvue-help-bot-trigger {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(79, 70, 229, 0.4), 0 0 15px rgba(79, 70, 229, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 999999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
#ekvue-help-bot-trigger:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 12px 40px rgba(79, 70, 229, 0.6), 0 0 25px rgba(79, 70, 229, 0.3);
}
#ekvue-help-bot-trigger svg {
  width: 24px;
  height: 24px;
  fill: white;
  transition: all 0.3s ease;
}
#ekvue-help-bot-window {
  position: fixed;
  bottom: 92px;
  right: 24px;
  width: 360px;
  height: 520px;
  border-radius: 16px;
  background: rgba(10, 15, 30, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 999999;
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
#ekvue-help-bot-window.open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
.help-bot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: rgba(6, 9, 20, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.help-bot-profile {
  display: flex;
  align-items: center;
  gap: 10px;
}
.help-bot-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 15px;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}
.help-bot-info {
  display: flex;
  flex-direction: column;
}
.help-bot-title {
  font-size: 13.5px;
  font-weight: 700;
  color: white;
  margin: 0;
}
.help-bot-status {
  font-size: 10px;
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 4px;
}
.help-bot-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}
.help-bot-close {
  background: none;
  border: none;
  color: #64748b;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s ease;
}
.help-bot-close:hover {
  color: #f43f5e;
}
.help-bot-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
}
.help-bot-body::-webkit-scrollbar {
  width: 4px;
}
.help-bot-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
}
.help-bot-msg {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.45;
  box-sizing: border-box;
  animation: fadeIn 0.25s ease-out forwards;
}
.help-bot-msg.bot {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  align-self: flex-start;
  border-bottom-left-radius: 2px;
}
.help-bot-msg.user {
  background: #4f46e5;
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 2px;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}
.help-bot-chips-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
  margin-bottom: 4px;
  align-self: flex-start;
}
.help-bot-chip {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 6px 10px;
  font-size: 11px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}
.help-bot-chip:hover {
  background: rgba(79, 70, 229, 0.15);
  border-color: #6366f1;
  color: white;
}
.help-bot-input-area {
  padding: 12px;
  background: rgba(6, 9, 20, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  gap: 8px;
  align-items: center;
}
.help-bot-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 12px;
  color: white;
  outline: none;
  transition: all 0.2s ease;
}
.help-bot-input:focus {
  border-color: #6366f1;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.15);
}
.help-bot-send {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4f46e5;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.help-bot-send:hover {
  background: #6366f1;
  transform: scale(1.05);
}
.help-bot-send svg {
  width: 14px;
  height: 14px;
  fill: white;
}
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
}
.typing-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #94a3b8;
  animation: typingBounce 1.4s infinite ease-in-out both;
}
.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }
.typing-dot:nth-child(3) { animation-delay: 0s; }

@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
// Chatbot Q&A database and logic are imported from ./chatbot-database.js


// Build and Inject DOM Chatbot
function setupChatbot() {
  if (document.getElementById('ekvue-help-bot-trigger')) return;

  // 1. Inject Styles
  const styleEl = document.createElement('style');
  styleEl.textContent = chatbotStyles;
  document.head.appendChild(styleEl);

  // 2. Inject HTML Containers
  const container = document.createElement('div');
  container.innerHTML = `
    <div id="ekvue-help-bot-trigger" title="Help Assistant">
      <!-- Robot chat icon SVG -->
      <svg viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2a8 8 0 0 0-8 8c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8zm-2 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm4 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-6 6.5c1.2-1.5 2.8-2.5 4-2.5s2.8 1 4 2.5a6 6 0 0 1-8 0z" />
      </svg>
    </div>
    <div id="ekvue-help-bot-window">
      <div class="help-bot-header">
        <div class="help-bot-profile">
          <div class="help-bot-avatar">🤖</div>
          <div class="help-bot-info">
            <h4 class="help-bot-title">EkVue Assistant</h4>
            <span class="help-bot-status"><span class="help-bot-status-dot"></span>Online</span>
          </div>
        </div>
        <button class="help-bot-close" id="ekvue-help-bot-close">&times;</button>
      </div>
      <div class="help-bot-body" id="ekvue-help-bot-body">
        <div class="help-bot-msg bot">
          Hi! I'm the <strong>EkVue System Assistant</strong>. I am here to help you resolve any questions, troubleshoot setups, or explain the dashboards.
          <br><br>
          Select a quick topic below or type your custom support question!
        </div>
        <div class="help-bot-chips-wrapper">
          <div class="help-bot-chip" data-q="AI Resume Analyzer">🤖 AI Resume Check</div>
          <div class="help-bot-chip" data-q="Recommended problems">🎯 Recommended Problems</div>
          <div class="help-bot-chip" data-q="Dashboard navigation">🖥️ Dashboard Nav</div>
          <div class="help-bot-chip" data-q="How to create a student">👨‍🎓 Create Student</div>
          <div class="help-bot-chip" data-q="Syncing two separate laptops">🌐 Laptop Network Sync</div>
          <div class="help-bot-chip" data-q="Face proctoring and alerts">⚠️ AI Proctoring checks</div>
          <div class="help-bot-chip" data-q="Camera not turning on">📷 Webcam permissions</div>
          <div class="help-bot-chip" data-q="Hide code editor and maximize screen">🖥️ Hide Code Editor</div>
        </div>
      </div>
      <div class="help-bot-input-area">
        <input type="text" class="help-bot-input" id="ekvue-help-bot-input" placeholder="Ask a support question..." autocomplete="off">
        <button class="help-bot-send" id="ekvue-help-bot-send">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // 3. Event Listeners setup
  const trigger = document.getElementById('ekvue-help-bot-trigger');
  const win = document.getElementById('ekvue-help-bot-window');
  const closeBtn = document.getElementById('ekvue-help-bot-close');
  const sendBtn = document.getElementById('ekvue-help-bot-send');
  const input = document.getElementById('ekvue-help-bot-input');
  const body = document.getElementById('ekvue-help-bot-body');

  if (trigger && win) {
    trigger.onclick = () => {
      win.classList.toggle('open');
    };
  }

  if (closeBtn && win) {
    closeBtn.onclick = () => {
      win.classList.remove('open');
    };
  }

  // Handle Question Submission
  function submitQuestion(text) {
    const query = text.trim();
    if (!query) return;

    // Append User message
    const userMsg = document.createElement('div');
    userMsg.className = 'help-bot-msg user';
    userMsg.textContent = query;
    body.appendChild(userMsg);
    body.scrollTop = body.scrollHeight;

    if (input) input.value = '';

    // Append Typing Indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'help-bot-msg bot typing-wrapper';
    typingIndicator.innerHTML = `
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    body.appendChild(typingIndicator);
    body.scrollTop = body.scrollHeight;

    // Process Answer after delay
    setTimeout(() => {
      // Remove typing indicator
      typingIndicator.remove();

      // Append Bot answer
      const botMsg = document.createElement('div');
      botMsg.className = 'help-bot-msg bot';
      botMsg.innerHTML = findAnswer(query);
      body.appendChild(botMsg);
      body.scrollTop = body.scrollHeight;
    }, 750);
  }

  if (sendBtn && input) {
    sendBtn.onclick = () => submitQuestion(input.value);
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitQuestion(input.value);
      }
    };
  }

  // Handle suggested chips clicks
  body.addEventListener('click', (e) => {
    if (e.target.classList.contains('help-bot-chip')) {
      const question = e.target.getAttribute('data-q');
      submitQuestion(question);
    }
  });
}

// Automatically instantiate on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupChatbot);
} else {
  setupChatbot();
}
