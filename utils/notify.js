const Notification = require('../models/Notification');

/**
 * Create a notification for a single user.
 * @param {Object} opts
 * @param {String} opts.user - recipient user id
 * @param {String} opts.type - notification type
 * @param {String} opts.message - human readable message
 * @param {String} [opts.link] - relative URL the notification should point to
 */
async function notifyUser({ user, type, message, link = '' }) {
  if (!user) return;
  await Notification.create({ user, type, message, link });
}

/**
 * Create the same notification for multiple users.
 */
async function notifyMany(userIds = [], { type, message, link = '' }) {
  const unique = [...new Set(userIds.filter(Boolean).map((id) => id.toString()))];
  if (!unique.length) return;
  await Notification.insertMany(unique.map((user) => ({ user, type, message, link })));
}

module.exports = { notifyUser, notifyMany };
