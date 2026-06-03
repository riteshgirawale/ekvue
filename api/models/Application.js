const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  jobId: String,
  jobTitle: String,
  candidateName: String,
  candidateEmail: String,
  companyEmail: String,
  status: String,
  dateApplied: String,
  resumeLink: String
});

module.exports = mongoose.model('Application', ApplicationSchema);