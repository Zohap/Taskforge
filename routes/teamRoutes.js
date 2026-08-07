const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');
const team = require('../controllers/teamController');

router.use(requireAuth, requireRole(ROLES.TEAM_MEMBER, ROLES.ADMIN));
router.get('/tasks', team.myTasks);
router.get('/projects', team.myProjects);

module.exports = router;
