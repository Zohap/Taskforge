const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const calendarController = require('../controllers/calendarController');

router.use(requireAuth);

router.get('/', calendarController.index);

module.exports = router;