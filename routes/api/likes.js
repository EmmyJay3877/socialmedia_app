const express = require('express');
const router = express.Router();
const likeController = require('../../controllers/likeController');
const tryCatch = require('../../utils/tryCatch');

router.route('/')
    .post(tryCatch(likeController.createLike))
    .delete(tryCatch(likeController.deleteLike))


module.exports = router;