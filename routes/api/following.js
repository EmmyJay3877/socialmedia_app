const express = require('express');
const router = express.Router();
const followingController = require('../../controllers/followingController');
const tryCatch = require('../../utils/tryCatch');

router.route('/')
    .post(tryCatch(followingController.createFollowing))
    .delete(tryCatch(followingController.deleteFollowing))


module.exports = router;