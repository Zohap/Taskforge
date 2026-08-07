const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');
const pm = require('../controllers/pmController');

router.use(requireAuth, requireRole(ROLES.PROJECT_MANAGER, ROLES.ADMIN));
router.get('/projects', pm.myProjects);

module.exports = router;
