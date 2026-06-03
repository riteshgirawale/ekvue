const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  candidate: String,
  candidateName: String,
  candidateEmail: String,
  role: String,
  sessionType: String,
  interviewer: String,
  interviewerName: String,
  interviewerEmail: String,
  date: String,
  time: String,
  status: String,
  notes: String,
  createdAt: String,
  lastUpdated: String,
  companyEmail: String
});

module.exports = mongoose.model('Interview', InterviewSchema);