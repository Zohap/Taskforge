const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.list = catchAsync(async (req, res) => {
  const { filter = 'all' } = req.query;
  const query = { user: req.user._id };
  if (filter === 'unread') query.isRead = false;
  if (filter === 'read') query.isRead = true;

  const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(100);

  res.render('notifications/list', {
    title: 'Notifications',
    notifications,
    filter,
  });
});

exports.markRead = catchAsync(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new AppError('Notification not found', 404);

  notification.isRead = true;
  await notification.save();

  if (notification.link) return res.redirect(notification.link);
  res.redirect('/notifications');
});

exports.markAllRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
  req.flash('success', 'All notifications marked as read.');
  res.redirect('/notifications');
});

exports.remove = catchAsync(async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
  req.flash('success', 'Notification deleted.');
  res.redirect('/notifications');
});
