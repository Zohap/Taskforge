const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/auth');

router.get('/', (req, res) => res.redirect(req.session.userId ? '/dashboard' : '/login'));
router.get('/login', redirectIfAuthenticated, authController.getLogin);
router.post('/login', redirectIfAuthenticated, authController.loginValidators, authController.postLogin);
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

module.exports = router;
