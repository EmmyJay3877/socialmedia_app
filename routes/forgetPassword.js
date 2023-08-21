const express = require('express');
const router = express.Router();
const passwordController = require('./../controllers/passwordController');
const tryCatch = require('./../utils/tryCatch');

router.post('/', tryCatch(passwordController.forgetPassword));

router.put('/:token', tryCatch(passwordController.resetPassword));

module.exports = router;