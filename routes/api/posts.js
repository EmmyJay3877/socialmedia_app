const express = require('express');
const router = express.Router();
const postController = require('../../controllers/postController');
const tryCatch = require('../../utils/tryCatch');


router.route('/')
    .get(tryCatch(postController.getAllPosts))
    .post(tryCatch(postController.createPost))

router.route('/:id')
    .get(tryCatch(postController.getPost))
    .delete(tryCatch(postController.deletePost))

router.route('/user/posts')
    .get(tryCatch(postController.getUserPosts))

router.route('/comments/:id')
    .get(tryCatch(postController.getPostComments))

router.route('/post/:id')
    .get(tryCatch(postController.getTotalComments))

module.exports = router;