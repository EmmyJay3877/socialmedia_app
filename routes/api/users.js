const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const tryCatch = require('../../utils/tryCatch');
const verifyRoles = require('../../middleware/verifyRoles');
const passwordController = require('../../controllers/passwordController');

router.route('/')
    .get(tryCatch(userController.getAllUsers))

router.put('/resetPassword/:token', tryCatch(passwordController.resetPassword));

router.put('/updateMyPassword', tryCatch(userController.updatePassword));

router.put('/updateMe', tryCatch(userController.updateUser))

router.route('/:id')
    .get(tryCatch(userController.getUser))
    .delete(verifyRoles('admin'), tryCatch(userController.deleteUser))

module.exports = router;
