const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

exports.loginValidators = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Log In', layout: false, oldInput: {} });
};

exports.postLogin = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('auth/login', {
      title: 'Log In',
      layout: false,
      oldInput: req.body,
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).render('auth/login', {
      title: 'Log In',
      layout: false,
      oldInput: req.body,
      errors: [{ msg: 'Invalid email or password.' }],
    });
  }

  if (!user.isActive) {
    return res.status(403).render('auth/login', {
      title: 'Log In',
      layout: false,
      oldInput: req.body,
      errors: [{ msg: 'This account has been deactivated. Contact your administrator.' }],
    });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  req.session.userId = user._id;
  req.flash('success', `Welcome back, ${user.name.split(' ')[0]}!`);
  res.redirect('/dashboard');
});

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};
