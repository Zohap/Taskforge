const User = require('../models/User');
const Notification = require('../models/Notification');

// Loads the logged-in user (if any) onto req.user and res.locals for every request
exports.loadUser = async (req, res, next) => {
  try {
    res.locals.currentUser = null;
    res.locals.unreadCount = 0;

    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user && user.isActive) {
        req.user = user;
        res.locals.currentUser = user;
        res.locals.unreadCount = await Notification.countDocuments({ user: user._id, isRead: false });
      } else {
        req.session.destroy(() => {});
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

// Blocks access unless a valid session exists
exports.requireAuth = (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login');
  }
  next();
};

// Restricts a route to one or more roles, e.g. requireRole('admin', 'project_manager')
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login');
  }
  if (!roles.includes(req.user.role)) {
    req.flash('error', "You don't have permission to access that page.");
    return res.redirect('/dashboard');
  }
  next();
};

// Redirects an already-logged-in user away from guest-only pages (e.g. /login)
exports.redirectIfAuthenticated = (req, res, next) => {
  if (req.user) return res.redirect('/dashboard');
  next();
};
