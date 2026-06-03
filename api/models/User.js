const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  role: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  school: String,
  studyField: String,
  level: String,
  interests: String,
  company: String,
  title: String,
  experience: String,
  industry: String,
  size: String,
  website: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
