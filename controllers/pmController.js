const Attendance = require('../models/Attendance');
const User = require('../models/User');


// ===============================
// MY PROJECTS
// ===============================

// The shared /projects and /tasks routes already scope results by role
// (see projectController.scopeFilter). These routes simply give the
// Project Manager portal its own nav entry point into that same data.

exports.myProjects = (req, res) => {

  const qs = new URLSearchParams(req.query).toString();

  res.redirect(`/projects${qs ? `?${qs}` : ''}`);

};


// ===============================
// TEAM ATTENDANCE
// ===============================

exports.attendance = async (req, res) => {

  try {

    // Get only Project Managers and Team Members
    // System Administrators are excluded.

    const teamMembers = await User.find({
      role: {
        $in: ['project_manager', 'team_member']
      }
    }).select('_id name email role');


    const teamMemberIds = teamMembers.map(user => user._id);


    // Get attendance only for managers + team members

    const attendance = await Attendance.find({
      user: {
        $in: teamMemberIds
      }
    })
      .populate('user', 'name email role')
      .sort({ date: -1 });


    res.render('pm/attendance', {

      title: 'Team Attendance',

      attendance

    });

  } catch (err) {

    console.error(err);

    res.status(500).send('Unable to load attendance');

  }

};