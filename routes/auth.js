const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const tryCatch = require('./../utils/tryCatch');

router.post('/', tryCatch(authController.handleLogin));

module.exports = router;