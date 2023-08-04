const express = require('express');
const router = express.Router();
const commentController = require('../../controllers/commentController');
const likeController = require('../../controllers/likeController');
const tryCatch = require('../../utils/tryCatch');

router.route('/')
    .get(tryCatch(commentController.getComments))
    .post(tryCatch(commentController.createComment))

router.route('/:id')
    .get(tryCatch(commentController.getComment))
    .delete(tryCatch(commentController.deleteComment))

router.route('/replies')
    .post(tryCatch(commentController.createComment))

router.route('/replies/:id')
    .get(tryCatch(commentController.getCommentReplies))
    .delete(tryCatch(commentController.deleteComment))

router.route('/reply/likes')
    .post(tryCatch(likeController.createLike))
    .delete(tryCatch(likeController.deleteLike))

router.route('/comment/likes')
    .post(tryCatch(likeController.createLike))
    .delete(tryCatch(likeController.deleteLike))

module.exports = router;