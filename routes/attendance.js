const express = require('express');

const router = express.Router();

const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

const attendanceController = require('../controllers/attendanceController');


// =====================================
// MY ATTENDANCE
// Team Member + PM + Admin
// =====================================

router.get(
  '/',
  requireAuth,
  requireRole(
    ROLES.TEAM_MEMBER,
    ROLES.PROJECT_MANAGER,
    ROLES.ADMIN
  ),
  attendanceController.myAttendance
);


// =====================================
// CHECK IN
// Team Member + PM + Admin
// =====================================

router.post(
  '/check-in',
  requireAuth,
  requireRole(
    ROLES.TEAM_MEMBER,
    ROLES.PROJECT_MANAGER,
    ROLES.ADMIN
  ),
  attendanceController.checkIn
);


// =====================================
// CHECK OUT
// Team Member + PM + Admin
// =====================================

router.post(
  '/check-out',
  requireAuth,
  requireRole(
    ROLES.TEAM_MEMBER,
    ROLES.PROJECT_MANAGER,
    ROLES.ADMIN
  ),
  attendanceController.checkOut
);


// =====================================
// TEAM ATTENDANCE
// PM + Admin
// =====================================

router.get(
  '/team',
  requireAuth,
  requireRole(
    ROLES.PROJECT_MANAGER,
    ROLES.ADMIN
  ),
  attendanceController.teamAttendance
);


module.exports = router;