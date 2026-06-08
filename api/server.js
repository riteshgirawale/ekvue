require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const mailer = require('./emailService/mailer');
const User = require('./models/User');
const Job = require('./models/Job');
const Interview = require('./models/Interview');
const Application = require('./models/Application');

const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend static files
app.use(express.static(path.join(__dirname, '../')));

// --- MONGODB CONNECTION ---
if (process.env.MONGO_URI && process.env.MONGO_URI !== 'YOUR_MONGODB_CONNECTION_STRING_HERE') {
  mongoose.connect(process.env.MONGO_URI)
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

// Proxy for Code Execution to bypass CORS
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
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ success: false, error: 'No account found for this role.' });
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
    const jobs = await Job.find({});
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
    const interviews = await Interview.find({});
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
    const apps = await Application.find({});
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

// Create or update a live meeting record
app.post('/api/live-meeting', (req, res) => {
  const data = req.body;
  if (!data.meetingId) {
    return res.status(400).json({ error: 'meetingId is required' });
  }
  data.lastUpdated = new Date().toISOString();
  liveMeetings.set(data.meetingId, data);
  res.json({ success: true });
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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`EKVUE Auth API running on http://localhost:${PORT}`);
});
