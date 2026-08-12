const getAttendanceRedirect = (user) => {
  if (user.role === 'Project Manager') {
    return '/pm/dashboard';
  }

  if (user.role === 'Admin') {
    return '/admin/dashboard';
  }

  return '/attendance';
};
const dayjs = require('dayjs');
const Attendance = require('../models/Attendance');
const catchAsync = require('../utils/catchAsync');


// ===============================
// MY ATTENDANCE
// ===============================

exports.myAttendance = catchAsync(async (req, res) => {
  const attendance = await Attendance.find({
    user: req.user._id,
  }).sort({ date: -1 });

  const today = dayjs().startOf('day').toDate();

  const todayAttendance = await Attendance.findOne({
    user: req.user._id,
    date: today,
  });

  res.render('team/attendance', {
    title: 'My Attendance',
    attendance,
    todayAttendance,
  });
});


// ===============================
// CHECK IN
// ===============================

exports.checkIn = catchAsync(async (req, res) => {
  const today = dayjs().startOf('day').toDate();

  // Check if already checked in today
  const existingAttendance = await Attendance.findOne({
    user: req.user._id,
    date: today,
  });

  if (existingAttendance) {
  return res.redirect(
    `${getAttendanceRedirect(req.user)}?error=already-checked-in`
  );
}

  const now = new Date();

  // Example: after 9:15 AM = Late
  const lateTime = dayjs()
    .startOf('day')
    .hour(9)
    .minute(15)
    .second(0)
    .millisecond(0);

  const status = dayjs(now).isAfter(lateTime)
    ? 'Late'
    : 'Present';

  await Attendance.create({
    user: req.user._id,
    date: today,
    checkIn: now,
    status,
    workingHours: 0,
  });

  res.redirect(`${getAttendanceRedirect(req.user)}?success=checked-in`);
});


// ===============================
// CHECK OUT
// ===============================

exports.checkOut = catchAsync(async (req, res) => {
  const today = dayjs().startOf('day').toDate();

  const attendance = await Attendance.findOne({
    user: req.user._id,
    date: today,
  });

  if (!attendance) {
  return res.redirect(
    `${getAttendanceRedirect(req.user)}?error=not-checked-in`
  );
}

if (attendance.checkOut) {
  return res.redirect(
    `${getAttendanceRedirect(req.user)}?error=already-checked-out`
  );
}

  const now = new Date();

  attendance.checkOut = now;

  // Calculate working hours
  const millisecondsWorked =
    now.getTime() - attendance.checkIn.getTime();

  const hoursWorked =
    millisecondsWorked / (1000 * 60 * 60);

  attendance.workingHours = Number(hoursWorked.toFixed(2));

  await attendance.save();

  res.redirect(`${getAttendanceRedirect(req.user)}?success=checked-out`);
});

// ===============================
// TEAM ATTENDANCE
// Project Manager + Admin
// ===============================

exports.teamAttendance = catchAsync(async (req, res) => {

  const attendance = await Attendance.find()
    .populate('user', 'name email role')
    .sort({ date: -1 });

  res.render('pm/attendance', {
    title: 'Team Attendance',
    attendance,
  });

});