const mongoose = require('mongoose');

const ScorecardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  meetingId: String,
  email: String, // Interviewer email
  interviewerName: String,
  candidateName: String,
  date: String,
  globalScore: String,
  recommendation: String,
  codeQuality: Number,
  problemSolving: Number,
  techKnowledge: Number,
  communication: Number,
  systemDesign: Number,
  strengths: String,
  improvements: String,
  notes: String,
  proctorStats: { type: Object, default: {} },
  companyEmail: { type: String, index: true },
  sessionType: String
});

module.exports = mongoose.model('Scorecard', ScorecardSchema);
