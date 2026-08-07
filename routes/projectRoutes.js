const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const project = require('../controllers/projectController');

router.use(requireAuth);

router.get('/', project.list);
router.get('/:id', project.details);
router.post('/:id/team', project.addTeamMember);
router.delete('/:id/team/:userId', project.removeTeamMember);
router.put('/:id/status', project.updateStatus);

module.exports = router;
