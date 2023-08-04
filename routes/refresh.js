const express = require('express');
const router = express.Router();
const refreshTokenController = require('../controllers/refreshTokenController');
const tryCatch = require('../utils/tryCatch');

router.get('/', tryCatch(refreshTokenController.handleRefresh));

module.exports = router;