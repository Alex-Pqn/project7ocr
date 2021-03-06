const express = require('express');

const router = express.Router();

const profileController = require('../controllers/profile');

const auth = require('../middlewares/auth');

router.get('/get', auth, profileController.getAllForums)


module.exports = router