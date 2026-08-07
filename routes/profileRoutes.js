const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const profile = require('../controllers/profileController');

router.use(requireAuth);

router.get('/', profile.view);
router.put('/', profile.updateValidators, profile.update);
router.put('/password', profile.changePassword);

module.exports = router;
