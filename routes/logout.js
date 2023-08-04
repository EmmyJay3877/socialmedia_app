const express = require('express');
const router = express.Router();
const logoutController = require('../controllers/logoutController');
const tryCatch = require('../utils/tryCatch');

router.get('/', tryCatch(logoutController.handleLogout));

module.exports = router;