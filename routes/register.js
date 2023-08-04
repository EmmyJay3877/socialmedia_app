const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');
const tryCatch = require('../utils/tryCatch');

router.post('/', tryCatch(registerController.handleNewUser));

module.exports = router;