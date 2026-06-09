document.addEventListener('DOMContentLoaded', () => {
  console.log('Live Coding Board loaded');
  
  // LiveKit Room Object
  let currentRoom = null;
  
  // Elements
  const mainVideo = document.getElementById('mainVideo');
  const pipVideo = document.getElementById('pipVideo');
  const bottomMic = document.getElementById('bottomMic');
  const bottomCam = document.getElementById('bottomCam');
  const endBtnTop = document.getElementById('endBtnTop');
  const endBtnBottom = document.querySelector('.end-call');
  
  // IDE Elements
  const codeEditor = document.getElementById('codeEditor');
  const lineNumbers = document.getElementById('lineNumbers');
  const runBtn = document.getElementById('runBtn');
  const resetBtn = document.getElementById('resetBtn');
  const langSelect = document.getElementById('langSelect');
  
  // Tabs & Views
  const promptTab = document.querySelector('.ide-tab[data-target="promptView"]');
  const consoleTab = document.querySelector('.ide-tab[data-target="consoleView"]');
  const promptView = document.getElementById('promptView');
  const consoleView = document.getElementById('consoleView');
  
  // Chat Elements
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatHistory = document.getElementById('chatHistory');

  // Extract meeting ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const meetingId = urlParams.get('meetingId') || 'sess_default';
  const chatStorageKey = 'ekvueChat_' + meetingId;

  // Lobby Elements
  const lobbyWrapper = document.getElementById('lobbyWrapper');
  const lobbyPreviewVideo = document.getElementById('lobbyPreviewVideo');
  const lobbyJoinBtn = document.getElementById('lobbyJoinBtn');
  const liveBoardWrapper = document.getElementById('liveBoardWrapper');

  // AI & Proctoring Variables
  let stabilityScore = 100;
  let hasWarned = false;
  let faceDetection = null;
  let camera = null;
  
  let localStream = null;
  let isVideoEnabled = true;
  let isAudioEnabled = true;
  
  const boundingBox = document.getElementById('boundingBox');
  const aiLoading = document.getElementById('aiLoading');
  const stabilityScoreText = document.getElementById('stabilityScoreText');
  const stabilityBarFill = document.getElementById('stabilityBarFill');

  // Initialize Camera
  let cameraInitPromise = null;
  async function initCamera() {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      console.warn('Video+Audio failed, trying video only:', err.message);
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true });
        isAudioEnabled = false;
      } catch (err2) {
        console.warn('Video-only failed, trying audio only:', err2.message);
        try {
          localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          isVideoEnabled = false;
        } catch (err3) {
          console.error('All media requests failed:', err3.message);
        }
      }
    }

    if (localStream) {
      if (mainVideo) mainVideo.srcObject = localStream;
      if (lobbyPreviewVideo) lobbyPreviewVideo.srcObject = localStream;
    }
  }

  // Re-acquire camera track on toggling Camera back ON (turns hardware LED back on)
  async function reacquireCamera() {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const newVideoTrack = videoStream.getVideoTracks()[0];
      
      if (localStream) {
        // Remove and stop old video tracks
        localStream.getVideoTracks().forEach(t => {
          t.stop();
          localStream.removeTrack(t);
        });
        // Add the new camera track
        localStream.addTrack(newVideoTrack);
      } else {
        localStream = videoStream;
      }
      
      // Re-bind to make sure tracks are updated
      if (mainVideo) mainVideo.srcObject = localStream;
      // if (pipVideo) pipVideo.srcObject = localStream; // Bug fix: Do not overwrite remote interviewer camera
      if (lobbyPreviewVideo) lobbyPreviewVideo.srcObject = localStream;
      
    } catch (err) {
      console.error('Failed to re-acquire camera stream', err);
    }
  }
  
  cameraInitPromise = initCamera();

  // AI Face Tracking Engine
  function initAITracking() {
    if (!window.FaceDetection || !window.Camera) {
      setTimeout(initAITracking, 500); // Wait for CDN to load
      return;
    }

    faceDetection = new FaceDetection({locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
    }});

    faceDetection.setOptions({
      model: 'short',
      minDetectionConfidence: 0.5
    });

    faceDetection.onResults(onFaceDetectionResults);

    let lastVideoTime = -1;
    async function processVideo() {
      if (!isVideoEnabled || mainVideo.paused || mainVideo.ended) {
        requestAnimationFrame(processVideo);
        return;
      }
      
      if (mainVideo.currentTime !== lastVideoTime && mainVideo.videoWidth > 0) {
        lastVideoTime = mainVideo.currentTime;
        try {
          await faceDetection.send({image: mainVideo});
        } catch (e) {}
      }
      requestAnimationFrame(processVideo);
    }
    
    // Start processing once video has data
    if (mainVideo.readyState >= 2) {
      processVideo();
    } else {
      mainVideo.addEventListener('loadeddata', processVideo);
    }
  }

  function onFaceDetectionResults(results) {
    // Hide loading once results start pouring in
    if (!aiLoading.classList.contains('hidden')) {
      aiLoading.classList.add('hidden');
    }

    if (results.detections.length > 0) {
      // Face detected!
      const detection = results.detections[0];
      const box = detection.boundingBox;
      
      // Update Bounding Box CSS (mirror coordinates because video is mirrored scaleX(-1))
      // Mediapipe returns normalized coordinates (0 to 1)
      boundingBox.classList.remove('hidden');
      boundingBox.style.top = `${box.yCenter * 100 - (box.height * 100 / 2)}%`;
      boundingBox.style.left = `${100 - (box.xCenter * 100) - (box.width * 100 / 2)}%`; // Mirrored
      boundingBox.style.width = `${box.width * 100}%`;
      boundingBox.style.height = `${box.height * 100}%`;

      // Increase stability slowly
      if (stabilityScore < 100) {
        stabilityScore = Math.min(100, stabilityScore + 2);
        hasWarned = false; // Reset warning lock when recovered
      }
    } else {
      // No face detected!
      boundingBox.classList.add('hidden');
      
      // Decrease stability
      if (stabilityScore > 0) {
        stabilityScore = Math.max(0, stabilityScore - 3);
      }
    }

    // Update UI
    updateStabilityUI();
  }

  function updateStabilityUI() {
    stabilityScoreText.innerText = `${Math.round(stabilityScore)}%`;
    stabilityBarFill.style.width = `${stabilityScore}%`;

    if (stabilityScore > 70) {
      stabilityBarFill.style.background = 'var(--color-emerald)';
    } else if (stabilityScore > 40) {
      stabilityBarFill.style.background = '#f59e0b'; // amber
    } else {
      stabilityBarFill.style.background = 'var(--color-red)';
    }

    // Fire Proctor Warning if it drops below threshold
    if (stabilityScore < 40 && !hasWarned) {
      hasWarned = true;
      const warningText = 'PROCTOR SECURITY ALERT: Candidate face not detected. Telemetry flagged.';
      
      addChatLog({
        type: 'system_alert',
        text: warningText,
        timestamp: Date.now()
      });
    }
  }

  // Lobby Join Button
  if (lobbyJoinBtn) {
    lobbyJoinBtn.addEventListener('click', async () => {
      lobbyWrapper.classList.add('hidden');
      liveBoardWrapper.classList.remove('hidden');
      
      // Connect to LiveKit Room
      initLiveKitRoom(meetingId);

      // Stop local camera to free device
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        localStream = null;
      }
    });
  }

  // Toggle Camera
  const cameraOffPlaceholder = document.getElementById('cameraOffPlaceholder');

  bottomCam.addEventListener('click', async () => {
    isVideoEnabled = !isVideoEnabled;
    
    if (!isVideoEnabled) {
      bottomCam.classList.remove('active-state');
      bottomCam.style.color = '#fff';
      if (currentRoom) currentRoom.localParticipant.setCameraEnabled(false);
      mainVideo.style.opacity = '0';
      if (cameraOffPlaceholder) cameraOffPlaceholder.classList.remove('hidden');
      if (boundingBox) boundingBox.classList.add('hidden');
    } else {
      bottomCam.classList.add('active-state');
      bottomCam.style.color = 'var(--color-emerald)';
      if (currentRoom) currentRoom.localParticipant.setCameraEnabled(true);
      mainVideo.style.opacity = '1';
      if (cameraOffPlaceholder) cameraOffPlaceholder.classList.add('hidden');
      if (boundingBox) boundingBox.classList.remove('hidden');
    }

    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = isVideoEnabled);
    } else if (isVideoEnabled) {
      // Re-request stream on turn-on if it wasn't successfully loaded initially
      await initCamera();
    }
  });

  // Toggle Mic
  const micLevelContainer = document.querySelector('.mic-level');

  bottomMic.addEventListener('click', () => {
    isAudioEnabled = !isAudioEnabled;
    
    if (!isAudioEnabled) {
      bottomMic.classList.remove('active-state');
      bottomMic.style.color = '#fff';
      if (micLevelContainer) micLevelContainer.classList.add('muted');
      if (currentRoom) currentRoom.localParticipant.setMicrophoneEnabled(false);
    } else {
      bottomMic.classList.add('active-state');
      bottomMic.style.color = 'var(--color-emerald)';
      if (micLevelContainer) micLevelContainer.classList.remove('muted');
      if (currentRoom) currentRoom.localParticipant.setMicrophoneEnabled(true);
    }

    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = isAudioEnabled);
    }
  });

  const bottomShareScreen = document.getElementById('bottomShareScreen');
  let isSharingScreen = false;
  if (bottomShareScreen) {
    bottomShareScreen.addEventListener('click', async () => {
      if (!currentRoom) return;
      try {
        if (isSharingScreen) {
          await currentRoom.localParticipant.setScreenShareEnabled(false);
          isSharingScreen = false;
          bottomShareScreen.classList.remove('active-state');
          bottomShareScreen.style.color = '#fff';
        } else {
          await currentRoom.localParticipant.setScreenShareEnabled(true);
          isSharingScreen = true;
          bottomShareScreen.classList.add('active-state');
          bottomShareScreen.style.color = 'var(--color-emerald)';
        }
      } catch (e) {
        console.error('Screen sharing error', e);
      }
    });
  }

  // End Call
  const endCall = () => {
    if (confirm('Are you sure you want to end the technical interview?')) {
      // Save candidate notes automatically
      try {
        const notesContent = document.querySelector('.notes-area').value.trim();
        if (notesContent) {
          const savedNotes = JSON.parse(localStorage.getItem('ekvueCandidateSavedNotes') || '[]');
          savedNotes.unshift({
            id: 'note_' + Date.now(),
            date: new Date().toLocaleString(),
            content: notesContent
          });
          localStorage.setItem('ekvueCandidateSavedNotes', JSON.stringify(savedNotes));
        }
      } catch (e) {
        console.error('Failed to save notes', e);
      }

      // Mark session status as completed so interviewer knows candidate left
      try {
        const raw = localStorage.getItem('ekvueLiveInterviews');
        let meetings = raw ? JSON.parse(raw) : [];
        let meeting = meetings.find(m => m.meetingId === meetingId);
        if (meeting) {
          meeting.status = 'Completed';
          meeting.lastUpdated = new Date().toISOString();
          localStorage.setItem('ekvueLiveInterviews', JSON.stringify(meetings));
        }
      } catch (e) {
        console.error('Failed to update meeting status on exit', e);
      }

      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      if (currentRoom) {
        try {
          currentRoom.disconnect();
        } catch(e){}
        currentRoom = null;
      }
      window.close();
      window.location.href = '../interviewer-review.html';
    }
  };
  endBtnTop.addEventListener('click', endCall);
  endBtnBottom.addEventListener('click', endCall);

  // Simple Line Numbers Logic
  function updateLineNumbers() {
    const lines = codeEditor.value.split('\n').length;
    let numbersHtml = '';
    for (let i = 1; i <= lines; i++) {
      numbersHtml += i + '<br>';
    }
    lineNumbers.innerHTML = numbersHtml;
  }
  
  // Stream candidate's code in real-time to the interviewer
  function streamEditorState() {
    try {
      const code = codeEditor.value;
      const langText = langSelect.options[langSelect.selectedIndex].text;
      
      const raw = localStorage.getItem('ekvueLiveInterviews');
      let meetings = raw ? JSON.parse(raw) : [];
      let meeting = meetings.find(m => m.meetingId === meetingId);
      if (!meeting) return;
      
      meeting.editorCode = code;
      meeting.selectedLanguage = langText;
      meeting.lastUpdated = new Date().toISOString();
      
      localStorage.setItem('ekvueLiveInterviews', JSON.stringify(meetings));
    } catch (e) {
      console.error('Failed to stream editor state', e);
    }
  }

  codeEditor.addEventListener('input', () => {
    updateLineNumbers();
    streamEditorState();
  });

  codeEditor.addEventListener('scroll', () => {
    lineNumbers.style.transform = `translateY(-${codeEditor.scrollTop}px)`;
  });
  
  langSelect.addEventListener('change', streamEditorState);
  
  // Initialize line numbers
  updateLineNumbers();
  
  // Stream initial code state
  streamEditorState();

  // IDE Tabs Logic
  promptTab.addEventListener('click', () => {
    promptTab.classList.add('active');
    consoleTab.classList.remove('active');
    promptView.classList.remove('hidden');
    consoleView.classList.add('hidden');
  });

  consoleTab.addEventListener('click', () => {
    consoleTab.classList.add('active');
    promptTab.classList.remove('active');
    consoleView.classList.remove('hidden');
    promptView.classList.add('hidden');
  });

  // Run Code API Integration
  runBtn.addEventListener('click', async () => {
    const code = codeEditor.value;
    const lang = langSelect.value;
    
    // Switch to console view automatically
    consoleTab.click();
    consoleView.innerHTML = '<span style="color:var(--color-cyan)">Compiling and executing code...</span>';
    
    // API Configuration using our backend proxy to avoid CORS
    const url = '/run-code';
    
    // Map our lang selector to the API compiler name (now 1-to-1 matching)
    let compiler = langSelect.value;

    const customApiKey = localStorage.getItem('ekvueOnlineCompilerApiKey') || localStorage.getItem('onlineCompilerApiKey');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          compiler: compiler,
          code: code,
          input: '',
          apiKey: customApiKey || undefined
        })
      });

      const data = await response.json();
      
      if (response.ok && data) {
        let outputHtml = '';
        if (data.output) {
          outputHtml += `<div class="console-success">Output:\n${data.output}</div>`;
        }
        if (data.error) {
          let errText = data.error || '';
          if (errText.includes("Internal error: code execution failed")) {
            errText = "Syntax or execution error in your code. The script failed to compile or run.\n\nDetail: The compiler engine encountered an unhandled exception or syntax error. Please check your syntax, brackets, and ensure the function name matches.";
          }
          outputHtml += `<div class="console-error">Error:\n${errText}</div>`;
        }
        if (data.execution_time) {
          outputHtml += `<br><div style="color:var(--text-muted)">Execution Time: ${data.execution_time}ms</div>`;
        }
        consoleView.innerHTML = outputHtml || '<span class="console-success">Code executed successfully with no output.</span>';
      } else {
        consoleView.innerHTML = `<span class="console-error">API Error: ${data.message || 'Failed to execute code'}</span>`;
      }
    } catch (err) {
      consoleView.innerHTML = `<span class="console-error">Network Error: ${err.message}. Please check your connection or API key.</span>`;
    }
  });

  // Reset Code
  resetBtn.addEventListener('click', () => {
    if (confirm("Reset code to initial state?")) {
      codeEditor.value = `function lengthOfLongestSubstring(s) {
  let maxLength = 0;
  let start = 0;
  const seen = new Map();

  for (let i = 0; i < s.length; i += 1) {
    if (seen.has(s[i])) {
      start = Math.max(start, seen.get(s[i]) + 1);
    }
    seen.set(s[i], i);
  }
  return maxLength;
}`;
      updateLineNumbers();
    }
  });

  // Real-time Chat Sync using ekvueLiveInterviews
  function getMeetingChatLogs() {
    try {
      const raw = localStorage.getItem('ekvueLiveInterviews');
      const meetings = raw ? JSON.parse(raw) : [];
      const meeting = meetings.find(m => m.meetingId === meetingId);
      return meeting && meeting.chatLogs ? meeting.chatLogs : [];
    } catch (e) {
      return [];
    }
  }

  function addChatLog(messageObj) {
    try {
      const raw = localStorage.getItem('ekvueLiveInterviews');
      let meetings = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(meetings)) meetings = [];

      let meeting = meetings.find(m => m.meetingId === meetingId);
      if (!meeting) {
        // Fallback for testing without an interviewer session
        meeting = { meetingId, chatLogs: [] };
        meetings.push(meeting);
      }
      
      if (!meeting.chatLogs) meeting.chatLogs = [];
      meeting.chatLogs.push(messageObj);
      meeting.lastUpdated = new Date().toISOString();
      
      localStorage.setItem('ekvueLiveInterviews', JSON.stringify(meetings));
      loadChatMessages();
    } catch (e) {
      console.error('Failed to save chat log', e);
    }
  }

  function loadChatMessages() {
    const messages = getMeetingChatLogs();
    
    chatHistory.innerHTML = ''; // clear current

    // Always append the welcome message as a default if it's empty
    if (messages.length === 0) {
      chatHistory.insertAdjacentHTML('beforeend', `
        <div class="chat-msg msg-interviewer">
          <strong>System</strong>
          Welcome to your live technical assessment round.
        </div>
      `);
    }

    messages.forEach(msg => {
      if (msg.type === 'system_alert') {
        chatHistory.insertAdjacentHTML('beforeend', `
          <div class="proctor-alert-box">
            <h4>System Proctor</h4>
            <p>${msg.text}</p>
          </div>
        `);
      } else {
        const isMe = msg.sender === 'Candidate' || msg.sender === 'candidate';
        const cssClass = isMe ? 'msg-candidate' : 'msg-interviewer';
        const senderName = isMe ? 'You' : 'Interviewer';
        
        chatHistory.insertAdjacentHTML('beforeend', `
          <div class="chat-msg ${cssClass}">
            <strong>${senderName}</strong>
            ${msg.text}
          </div>
        `);
      }
    });
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addChatLog({
      sender: 'Candidate',
      text: text,
      timestamp: Date.now()
    });
    
    chatInput.value = '';
  }

  chatSendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  function checkMeetingStatus() {
    try {
      const raw = localStorage.getItem('ekvueLiveInterviews');
      const meetings = raw ? JSON.parse(raw) : [];
      const meeting = meetings.find(m => m.meetingId === meetingId);
      if (meeting && meeting.status === 'Completed') {
        console.log('[SYNC] Interview completed by interviewer. Exiting live room.');
        alert('The interviewer has ended the interview session. Redirecting to your dashboard...');
        
        // Clean media streams
        if (localStream) {
          localStream.getTracks().forEach(t => t.stop());
        }
        if (currentRoom) {
          try {
            currentRoom.disconnect();
          } catch(e){}
          currentRoom = null;
        }
        window.close();
        window.location.href = '../interviewer-review.html';
      }
    } catch (e) {
      console.error('[SYNC] Failed to check meeting status', e);
    }
  }

  // Listen for storage events (messages sent by interviewer on same laptop fallback)
  window.addEventListener('storage', (e) => {
    if (e.key === 'ekvueLiveInterviews') {
      loadChatMessages();
      checkMeetingStatus();
    }
  });

  // Background check polling (Cross-browser Sync)
  let isBackgroundSyncing = false;
  async function backgroundSyncLoop() {
    if (isBackgroundSyncing) return;
    isBackgroundSyncing = true;
    try {
      const raw = localStorage.getItem('ekvueLiveInterviews');
      const meetings = raw ? JSON.parse(raw) : [];
      const meeting = meetings.find(m => m.meetingId === meetingId);
      
      // Fetch from Server
      try {
        const res = await fetch(`/api/live-meeting/${meetingId}`);
        if (res.ok) {
          const serverMeeting = await res.json();
          if (!meeting || new Date(serverMeeting.lastUpdated) > new Date(meeting.lastUpdated || 0)) {
            // Apply server state
            const idx = meetings.findIndex(m => m.meetingId === meetingId);
            if (idx > -1) {
              meetings[idx] = { ...meetings[idx], ...serverMeeting };
            } else {
              meetings.push(serverMeeting);
            }
            localStorage.setItem('ekvueLiveInterviews', JSON.stringify(meetings));
            loadChatMessages();
            checkMeetingStatus();
          }
        }
      } catch (err) { /* offline */ }

      // Push local state to server
      if (meeting) {
        try {
          fetch('/api/live-meeting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(meeting)
          }).catch(()=>{});
        } catch(e) {}
      }
    } catch (e) {
      console.error('[SYNC] Error in background sync', e);
    } finally {
      isBackgroundSyncing = false;
    }
  }

  // Poll server every 800ms
  setInterval(backgroundSyncLoop, 800);

  // Initial load
  loadChatMessages();

  // --- Bottom Panel Toggles (Chat, Notes, Code Editor) ---
  const bottomChat = document.getElementById('bottomChat');
  const bottomNotes = document.getElementById('bottomNotes');
  const bottomEditor = document.getElementById('bottomEditor');

  const chatSection = document.querySelector('.chat-section');
  const notesSection = document.querySelector('.notes-section');
  const rightColumn = document.querySelector('.right-column');
  const editorSection = document.querySelector('.editor-section');
  const leftColumn = document.querySelector('.left-column');

  if (bottomChat && chatSection) {
    bottomChat.addEventListener('click', () => {
      chatSection.classList.toggle('hidden');
      bottomChat.classList.toggle('active-state');
      updateRightColumnVisibility();
    });
  }

  if (bottomNotes && notesSection) {
    bottomNotes.addEventListener('click', () => {
      notesSection.classList.toggle('hidden');
      bottomNotes.classList.toggle('active-state');
      updateRightColumnVisibility();
    });
  }

  if (bottomEditor && editorSection && leftColumn) {
    bottomEditor.addEventListener('click', () => {
      editorSection.classList.toggle('hidden');
      bottomEditor.classList.toggle('active-state');

      if (editorSection.classList.contains('hidden')) {
        leftColumn.classList.add('editor-hidden');
      } else {
        leftColumn.classList.remove('editor-hidden');
      }
    });
  }

  function updateRightColumnVisibility() {
    if (chatSection.classList.contains('hidden') && notesSection.classList.contains('hidden')) {
      rightColumn.classList.add('hidden');
    } else {
      rightColumn.classList.remove('hidden');
    }
  }

  // --- LiveKit Meeting Initialization ---

  async function initLiveKitRoom(roomId) {
    console.log('[LiveKit] Connecting to Room on Candidate side');
    const localVideoContainer = document.getElementById('local-video');
    const remoteVideosContainer = document.getElementById('remote-videos');
    if (!localVideoContainer || !remoteVideosContainer || typeof LiveKit === 'undefined') return;

    try {
      // 1. Fetch Token
      const res = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: `ekvue_interview_${roomId}`,
          participantName: 'Candidate'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 2. Create Room
      const room = new LiveKit.Room({
        adaptiveStream: true,
        dynacast: true,
      });
      currentRoom = room;

      // 3. Handle Tracks
      room.on(LiveKit.RoomEvent.TrackSubscribed, (track, publication, participant) => {
        const element = track.attach();
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.objectFit = 'contain';
        element.dataset.sid = track.sid;
        
        const wrapper = document.createElement('div');
        wrapper.id = track.sid;
        wrapper.style.position = 'relative';
        wrapper.style.width = track.source === 'screen_share' ? '100%' : '50%';
        wrapper.style.height = track.source === 'screen_share' ? '100%' : '50%';
        wrapper.appendChild(element);
        
        remoteVideosContainer.appendChild(wrapper);
      });

      room.on(LiveKit.RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        track.detach();
        const wrapper = document.getElementById(track.sid);
        if (wrapper) wrapper.remove();
      });

      room.on(LiveKit.RoomEvent.LocalTrackPublished, (publication, participant) => {
        if (publication.track.kind === 'video' && publication.track.source === 'camera') {
          const element = publication.track.attach();
          element.style.width = '100%';
          element.style.height = '100%';
          element.style.objectFit = 'cover';
          localVideoContainer.innerHTML = '';
          localVideoContainer.appendChild(element);
        }
      });

      room.on(LiveKit.RoomEvent.LocalTrackUnpublished, (publication, participant) => {
        if (publication.track.kind === 'video' && publication.track.source === 'camera') {
          localVideoContainer.innerHTML = '';
        }
      });

      // 4. Connect to Room
      await room.connect(data.url, data.token);
      console.log('Connected to LiveKit Room', room.name);

      // 5. Publish local camera and mic
      await room.localParticipant.enableCameraAndMicrophone();

    } catch (error) {
      console.error('Failed to connect to LiveKit', error);
      alert('Failed to connect to video server. Please refresh.');
    }
  }
});
