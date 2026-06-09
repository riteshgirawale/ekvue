const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  candidateEmail: { type: String, index: true },
  title: String,
  message: String,
  type: String,
  read: { type: Boolean, default: false },
  createdAt: { type: String },
  metadata: { type: Object, default: {} }
});

module.exports = mongoose.model('Notification', NotificationSchema);
