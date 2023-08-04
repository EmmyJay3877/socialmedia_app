const express = require('express');
const router = express.Router();
const passwordController = require('./../controllers/passwordController');
const tryCatch = require('./../utils/tryCatch');

router.post('/', tryCatch(passwordController.forgetPassword));

module.exports = router;