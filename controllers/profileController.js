const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.view = (req, res) => {
  res.render('profile/show', { title: 'My Profile', errors: [], profileUser: req.user });
};

exports.updateValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

exports.update = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('profile/show', {
      title: 'My Profile',
      errors: errors.array(),
      profileUser: { ...req.user.toObject(), ...req.body },
    });
  }

  const { name, email, jobTitle, phone, bio } = req.body;

  const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
  if (existing) {
    return res.status(400).render('profile/show', {
      title: 'My Profile',
      errors: [{ msg: 'That email is already in use by another account.' }],
      profileUser: { ...req.user.toObject(), ...req.body },
    });
  }

  const user = await User.findById(req.user._id);
  user.name = name;
  user.email = email;
  user.jobTitle = jobTitle;
  user.phone = phone;
  user.bio = bio;
  await user.save();

  req.flash('success', 'Profile updated successfully.');
  res.redirect('/profile');
});

exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    req.flash('error', 'Current password is incorrect.');
    return res.redirect('/profile');
  }
  if (!newPassword || newPassword.length < 6) {
    req.flash('error', 'New password must be at least 6 characters.');
    return res.redirect('/profile');
  }
  if (newPassword !== confirmPassword) {
    req.flash('error', 'New password and confirmation do not match.');
    return res.redirect('/profile');
  }

  user.password = newPassword;
  await user.save();

  req.flash('success', 'Password changed successfully.');
  res.redirect('/profile');
});
