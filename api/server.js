require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Resend } = require('resend');

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

// Initialize Resend with the provided key
const resend = new Resend('re_GHAVycML_EGQ3PKNFCbtk8te24L7nFuCc');

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
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Resend test sender
      to: email,
      subject: 'Your EKVUE Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #4f46e5; margin-top: 0;">Verify your email address</h2>
          <p style="color: #475569; font-size: 16px;">Welcome to EKVUE. Please use the following 4-digit code to complete your signup:</p>
          <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
        </div>
      `
    });

    if (error) {
      console.error('[ERROR] Resend API Error:', error);
      return res.json({ 
        success: true, 
        message: 'OTP generated (Email sending failed due to unverified sender, check server console for OTP)' 
      });
    }

    console.log(`[SUCCESS] Email sent to ${email} via Resend. ID: ${data.id}`);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('[ERROR] Resend Try/Catch Error:', err);
    res.json({ 
      success: true, 
      message: 'OTP generated (Email sending failed due to exception, check server console for OTP)' 
    });
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
    const newUser = new User(req.body);
    await newUser.save();
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`EKVUE Auth API running on http://localhost:${PORT}`);
});
