const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  location: String,
  type: String,
  salary: String,
  status: String,
  postedDate: String,
  companyName: String,
  companyEmail: String
});

module.exports = mongoose.model('Job', JobSchema);