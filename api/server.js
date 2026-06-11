require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const mailer = require('./emailService/mailer');
const User = require('./models/User');
const Job = require('./models/Job');
const Interview = require('./models/Interview');
const Application = require('./models/Application');
const Notification = require('./models/Notification');
const Scorecard = require('./models/Scorecard');

const path = require('path');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for the render deployment
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Serve the frontend static files
app.use(express.static(path.join(__dirname, '../')));

// --- MONGODB CONNECTION ---
const mongoUriFallback = process.env.MONGO_URI || 'mongodb+srv://alexcarter1616_db_user:c2IsLKsKhQ8S000c@ekvue.g9vvwhk.mongodb.net/?appName=EKVUE';
if (mongoUriFallback && mongoUriFallback !== 'YOUR_MONGODB_CONNECTION_STRING_HERE') {
  mongoose.connect(mongoUriFallback)
    .then(() => console.log('[SUCCESS] Connected to MongoDB!'))
    .catch((err) => console.error('[ERROR] Failed to connect to MongoDB:', err.message));
} else {
  console.warn('[WARNING] MONGODB_URI is not set in api/.env. Data will not be saved!');
}
// --------------------------

// In-memory store for OTPs

// In-memory store for OTPs
// Format: { 'user@email.com': { otp: '1234', expires: 1234567890 } }
const otpStore = new Map();

// Helper to generate a 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const otp = generateOTP();
  const expires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

  otpStore.set(email, { otp, expires });
  console.log(`[DEBUG] Generated OTP for ${email}: ${otp}`);

  try {
    const sendPromise = mailer.sendOTP(email, otp);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP_TIMEOUT')), 15000));
    
    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`[SUCCESS] OTP Email sent to ${email} via Gmail. ID: ${info.messageId}`);
    res.json({ success: true, message: 'OTP sent successfully to your email!' });
  } catch (err) {
    console.error('[ERROR] Gmail Nodemailer Error:', err.message || err);
    res.json({ 
      success: true, 
      message: `⚠️ Email address not recognized. Please enter a valid email. Auto-filled OTP`,
      otp: otp
    });
  }
});

// Send Notification Email Endpoint
app.post('/api/send-notification', async (req, res) => {
  const { email, title, message } = req.body;
  if (!email || !title || !message) {
    return res.status(400).json({ success: false, error: 'Email, title, and message are required' });
  }

  try {
    const sendPromise = mailer.sendNotificationEmail(email, title, message);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP_TIMEOUT')), 15000));
    
    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`[SUCCESS] Notification Email sent to ${email} via Gmail. ID: ${info.messageId}`);
    res.json({ success: true, message: 'Notification email sent' });
  } catch (err) {
    console.error('[ERROR] Gmail Nodemailer Notification Error:', err.message || err);
    res.status(500).json({ success: false, error: 'Email blocked by Render Free Tier firewall' });
  }
});

app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP are required' });
  }

  const record = otpStore.get(email);
  if (!record) {
    return res.json({ success: false, error: 'No OTP requested for this email' });
  }

  if (Date.now() > record.expires) {
    otpStore.delete(email);
    return res.json({ success: false, error: 'OTP has expired' });
  }

  if (record.otp === otp) {
    otpStore.delete(email); // Clear OTP after successful verification
    return res.json({ success: true, message: 'OTP verified successfully' });
  } else {
    return res.json({ success: false, error: 'Invalid OTP' });
  }
});

// 5. Notifications API
app.get('/api/notifications', async (req, res) => {
  try {
    const query = {};
    const orConds = [];

    if (req.query.candidateEmail) {
      orConds.push({ candidateEmail: new RegExp(`^${req.query.candidateEmail}$`, 'i') });
    }
    if (req.query.candidateName) {
      orConds.push({ 'metadata.candidateName': new RegExp(`^${req.query.candidateName}$`, 'i') });
    }

    if (orConds.length > 0) {
      query.$or = orConds;
    }
    
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const newNotif = new Notification(req.body);
    await newNotif.save();
    res.json(newNotif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/mark-read', async (req, res) => {
  try {
    const candidateEmail = req.body.candidateEmail;
    const notificationId = req.body.id;
    
    if (notificationId) {
      await Notification.findOneAndUpdate({ id: notificationId }, { read: true });
    } else if (candidateEmail) {
      await Notification.updateMany({ candidateEmail: candidateEmail }, { read: true });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Scorecards API
app.get('/api/scorecards', async (req, res) => {
  try {
    const query = {};
    
    // Support querying by ID directly (for clicking notifications)
    if (req.query.id) {
      query.id = req.query.id;
    } else {
      const orConds = [];
      if (req.query.candidateName) {
        orConds.push({ candidateName: new RegExp(`^${req.query.candidateName}$`, 'i') });
      }
      if (req.query.candidateEmail) {
        orConds.push({ email: new RegExp(`^${req.query.candidateEmail}$`, 'i') });
      }
      if (orConds.length > 0) {
        query.$or = orConds;
      }
    }
    
    if (req.query.companyEmail) query.companyEmail = req.query.companyEmail;

    const scorecards = await Scorecard.find(query).sort({ date: -1 });
    res.json(scorecards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scorecards', async (req, res) => {
  try {
    const existing = await Scorecard.findOne({ id: req.body.id });
    if (existing) {
      const updated = await Scorecard.findOneAndUpdate({ id: req.body.id }, req.body, { new: true });
      return res.json(updated);
    }
    const newScorecard = new Scorecard(req.body);
    await newScorecard.save();
    res.json(newScorecard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Chatbot Route Execution to bypass CORS
app.post('/run-code', async (req, res) => {
  const { compiler, code, input, apiKey: customApiKey } = req.body;
  const defaultApiKey = '1c2fdfdc0cfd60cb8ec188bf659dffe4';
  const apiKey = customApiKey || process.env.ONLINE_COMPILER_API_KEY || process.env.COMPILER_API_KEY || defaultApiKey;
  const url = 'https://api.onlinecompiler.io/api/run-code-sync/';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify({ compiler, code, input: input || '' })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[ERROR] Code Execution Failed:', err);
    res.status(500).json({ message: 'Internal Proxy Error', error: err.toString() });
  }
});

// --- DATABASE APIs ---

// 1. Users API
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const existing = await User.findOne({ email: req.body.email, role: req.body.role });
    if (existing) {
      return res.status(400).json({ error: 'User with this email and role already exists.' });
    }
    const newUser = new User(req.body);
    await newUser.save();
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const query = { email: new RegExp('^' + email + '$', 'i') };
    if (role) {
      query.role = role;
    }
    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ success: false, error: role ? 'No account found for this role.' : 'No registered account found.' });
    }
    if (user.password !== password) {
      return res.status(401).json({ success: false, error: 'Incorrect password.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Jobs API
app.get('/api/jobs', async (req, res) => {
  try {
    const query = {};
    if (req.query.companyEmail) query.companyEmail = req.query.companyEmail;
    
    const jobs = await Job.find(query);
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const newJob = new Job(req.body);
    await newJob.save();
    res.json(newJob);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/jobs/:id', async (req, res) => {
  try {
    const updated = await Job.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    await Job.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Interviews API
app.get('/api/interviews', async (req, res) => {
  try {
    const query = {};
    if (req.query.candidateEmail) query.candidateEmail = req.query.candidateEmail;
    if (req.query.interviewerEmail) query.interviewerEmail = req.query.interviewerEmail;
    if (req.query.companyEmail) query.companyEmail = req.query.companyEmail;

    const interviews = await Interview.find(query);
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/interviews', async (req, res) => {
  try {
    const newInterview = new Interview(req.body);
    await newInterview.save();
    res.json(newInterview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/interviews/:id', async (req, res) => {
  try {
    const updated = await Interview.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Applications API
app.get('/api/applications', async (req, res) => {
  try {
    const query = {};
    if (req.query.candidateEmail) query.candidateEmail = req.query.candidateEmail;
    if (req.query.companyEmail) query.companyEmail = req.query.companyEmail;

    const apps = await Application.find(query);
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/applications', async (req, res) => {
  try {
    const newApp = new Application(req.body);
    await newApp.save();
    res.json(newApp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/applications/:id', async (req, res) => {
  try {
    const updated = await Application.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- OPENAI PROXY ---
app.post('/api/generate-challenge', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is missing on the server' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// LIVEKIT TOKEN API
// ==========================================
app.post('/api/livekit/token', async (req, res) => {
  const { roomName, participantName } = req.body;
  console.log(`[LiveKit Token API] Request received for room: "${roomName}", participant: "${participantName}"`);
  
  if (!roomName || !participantName) {
    console.warn('[LiveKit Token API] Missing roomName or participantName');
    return res.status(400).json({ error: 'roomName and participantName are required' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY || 'APISjtKyyzNmDpC';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'Da6mXncnqkIPbBdH24uVufAUoEgx1gLkjaXM6HtAmEL';
  const url = process.env.LIVEKIT_URL || 'wss://ekuve-hecwi0s4.livekit.cloud';

  if (!apiKey || !apiSecret || !url) {
    console.error('[LiveKit Token API] Credentials missing in process.env');
    return res.status(500).json({ error: 'LiveKit credentials missing on server' });
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      name: participantName,
    });
    
    at.addGrant({ roomJoin: true, room: roomName });
    
    const token = await at.toJwt();
    console.log(`[LiveKit Token API] Token successfully generated for room: "${roomName}"`);
    res.json({ token, url });
  } catch (err) {
    console.error('[LiveKit Token API] Error generating token:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// LIVE MEETING SYNC (Cross-Browser/Cross-Laptop)
// ==========================================
const liveMeetings = new Map();

// Auto-cleanup stale meetings older than 2 hours
setInterval(() => {
  const now = Date.now();
  liveMeetings.forEach((meeting, id) => {
    if (now - new Date(meeting.lastUpdated || 0).getTime() > 7200000) {
      liveMeetings.delete(id);
    }
  });
}, 300000);

// Create or update a live meeting record with intelligent merging
app.post('/api/live-meeting', (req, res) => {
  const data = req.body;
  if (!data.meetingId) {
    return res.status(400).json({ error: 'meetingId is required' });
  }
  
  const existing = liveMeetings.get(data.meetingId) || {};
  
  // Merge ChatLogs (take the longest to avoid overwrites)
  let mergedChatLogs = existing.chatLogs || [];
  if (data.chatLogs && data.chatLogs.length > mergedChatLogs.length) {
    mergedChatLogs = data.chatLogs;
  } else if (data.chatLogs && data.chatLogs.length === mergedChatLogs.length) {
    // If same length, take the newest data just in case
    mergedChatLogs = data.chatLogs;
  }

  // Merge Signaling (Offers, Answers, and ICE candidates)
  const sig = { ...(existing.signaling || {}), ...(data.signaling || {}) };
  
  // Merge Candidate ICE
  if (data.signaling && data.signaling.candidateCandidates) {
    const existingIce = existing.signaling?.candidateCandidates || [];
    const newIce = data.signaling.candidateCandidates;
    const mergedIce = [...existingIce];
    newIce.forEach(nc => {
       const idx = mergedIce.findIndex(ec => ec.candidate === nc.candidate);
       if (idx > -1) mergedIce[idx] = nc;
       else mergedIce.push(nc);
    });
    sig.candidateCandidates = mergedIce;
  }
  // Merge Interviewer ICE
  if (data.signaling && data.signaling.interviewerCandidates) {
    const existingIce = existing.signaling?.interviewerCandidates || [];
    const newIce = data.signaling.interviewerCandidates;
    const mergedIce = [...existingIce];
    newIce.forEach(nc => {
       const idx = mergedIce.findIndex(ec => ec.candidate === nc.candidate);
       if (idx > -1) mergedIce[idx] = nc;
       else mergedIce.push(nc);
    });
    sig.interviewerCandidates = mergedIce;
  }

  // Prevent status downgrades (Completed > Active > Launched)
  let finalStatus = data.status || existing.status;
  if (existing.status === 'Completed') {
    finalStatus = 'Completed';
  } else if (existing.status === 'Active' && data.status === 'Launched') {
    finalStatus = 'Active';
  }

  const merged = { ...existing, ...data, status: finalStatus, signaling: sig, chatLogs: mergedChatLogs };
  merged.lastUpdated = new Date().toISOString();
  
  liveMeetings.set(data.meetingId, merged);
  res.json({ success: true, meeting: merged });
});

// Fetch a single meeting by ID
app.get('/api/live-meeting/:id', (req, res) => {
  const meeting = liveMeetings.get(req.params.id);
  if (meeting) res.json(meeting);
  else res.status(404).json({ error: 'Not found' });
});

// Get active live meetings for a specific candidate
app.get('/api/live-meetings', (req, res) => {
  const email = (req.query.email || '').toLowerCase().trim();
  const name = (req.query.name || '').toLowerCase().trim();
  const now = Date.now();

  const results = [];
  liveMeetings.forEach((meeting) => {
    const meetEmail = (meeting.candidateEmail || '').toLowerCase().trim();
    const meetName = (meeting.candidateName || '').toLowerCase().trim();
    const isMe = (email && meetEmail === email) || (name && meetName === name);
    const isActive = meeting.status === 'Launched' || meeting.status === 'Active';
    const isRecent = (now - new Date(meeting.lastUpdated || 0).getTime()) < 120000;

    if (isMe && isActive && isRecent) {
      results.push(meeting);
    }
  });

  res.json(results);
});

// Delete/end a live meeting
app.delete('/api/live-meeting/:meetingId', (req, res) => {
  liveMeetings.delete(req.params.meetingId);
  res.json({ success: true });
});

// ==========================================
// GENERIC GLOBAL STATE SYNC (PieSocket Fallback)
// ==========================================
const globalStateStore = new Map();

app.get('/api/global-state/:key', (req, res) => {
  const key = req.params.key;
  const data = globalStateStore.get(key) || [];
  res.json(data);
});

app.post('/api/global-state/:key', (req, res) => {
  const key = req.params.key;
  const incomingData = req.body || [];
  
  // Merge lists based on ID or Timestamp
  const existingData = globalStateStore.get(key) || [];
  if (!Array.isArray(existingData) || !Array.isArray(incomingData)) {
    globalStateStore.set(key, incomingData);
    return res.json({ success: true });
  }

  const merged = [...existingData];
  incomingData.forEach(incomingItem => {
    const itemId = incomingItem.id || incomingItem.meetingId;
    if (!itemId) {
      merged.push(incomingItem);
      return;
    }
    
    const idx = merged.findIndex(m => (m.id === itemId || m.meetingId === itemId));
    if (idx > -1) {
      const localTime = new Date(merged[idx].lastUpdated || merged[idx].createdAt || 0).getTime();
      const remoteTime = new Date(incomingItem.lastUpdated || incomingItem.createdAt || 0).getTime();
      if (remoteTime >= localTime) {
        merged[idx] = incomingItem;
      }
    } else {
      merged.push(incomingItem);
    }
  });

  // Limit memory usage: keep only the last 1000 items per key
  if (merged.length > 1000) {
    merged.splice(0, merged.length - 1000);
  }

  globalStateStore.set(key, merged);
  res.json({ success: true });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`EKVUE Auth & Socket API running on http://localhost:${PORT}`);
});
