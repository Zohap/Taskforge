const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../utils/constants');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
