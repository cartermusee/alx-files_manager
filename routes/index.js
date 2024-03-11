const express = require('express');

const controller = require('../controllers/AppController');

const users = require('../controllers/UsersController');
const authController = require('../controllers/AuthController');

const router = express.Router();

router.get('/status', controller.getStatus);
router.get('/stats', controller.getStats);
router.get('/users/me', users.getMe);
router.post('/users', users.postNew);

router.get('/connect', authController.getConnect);
router.get('/disconnect', authController.getDisconnect);

module.exports = router;
