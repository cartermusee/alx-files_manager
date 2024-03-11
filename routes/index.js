const express = require('express');

const controller = require('../controllers/AppController');

const users = require('../controllers/UsersController');

const router = express.Router();

router.get('/status', controller.getStatus);
router.get('/stats', controller.getStats);
router.post('/users', users.postNew);

module.exports = router;
