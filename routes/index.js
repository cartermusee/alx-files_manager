const express = require('express');

const controller = require('../controllers/AppController');

const users = require('../controllers/UsersController');
const authController = require('../controllers/AuthController');
const filesController = require('../controllers/FilesController');

const router = express.Router();

router.get('/status', controller.getStatus);
router.get('/stats', controller.getStats);
router.get('/users/me', users.getMe);
router.post('/users', users.postNew);

router.get('/connect', authController.getConnect);
router.get('/disconnect', authController.getDisconnect);

router.get('/files/:id', filesController.getShow);
router.get('/files', filesController.getIndex);

router.post('/files', filesController.postUpload);

router.put('/files/:id/publish', filesController.putPublish);
router.put('/files/:id/publish', filesController.putUnpublish);

router.get('/files/:id/data', filesController.getFile);


module.exports = router;
