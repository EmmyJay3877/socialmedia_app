const Comment = require('../model/Comment');
const Post = require('../model/Post');
const Redis = require('redis');
const CustomError = require('../utils/customError');
const redisClient = Redis.createClient();

redisClient.connect();

const EXPIRATION = 20

const createComment = async (req, res) => {
    const { postId, text } = req.body;
    if (!(postId && text)) throw new Error('Bad Request');

    if (req.url.includes('/replies')) {
        // reply a comment
        const newReply = await Comment.create({
            "postId": postId,
            "text": text,
            "profileId": req.user.id
        })

        if (newReply) {
            // updating the replies array in the comment document
            const commentUpdate = await Comment.updateOne({ "_id": postId }, { $push: { replies: { $each: [newReply._id] } } })

            // checking if the Comment document was updated
            if (commentUpdate.matchedCount > 0 && commentUpdate.modifiedCount > 0) {
                return res.status(201).json({ "success": `${req.user.username} just replied a comment` })
            }
        }
    } else {
        // create a new comment
        const newComment = await Comment.create({
            "postId": postId,
            "text": text,
            "profileId": req.user.id
        })

        if (newComment) {
            // updating the comment array in the post document
            const postUpdate = await Post.updateOne({ "_id": postId }, { $push: { comments: { $each: [newComment._id] } } })

            // checking if the Post document was updated
            if (postUpdate.matchedCount > 0 && postUpdate.modifiedCount > 0) {
                res.status(201).json({ "success": `${req.user.username} just commented on a post` })
            }
        }
    }
}

const getComments = async (req, res) => {

    // check if we already have a cache
    const result = await redisClient.get('comments');
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    const comments = await Comment.find();
    if (!comments) throw new Error('Not Found');

    // save in a redis cache
    redisClient.setEx('comments', EXPIRATION, JSON.stringify(comments));

    res.json(comments);
}

const getTotalLikes = async (req, res) => { // psotId will represent comment and reply Id
    const postId = req.params.id;
    if (!postId) throw new CustomError('Bad Request', 403);

    // check if we already have a cache.
    const result = await redisClient.get(`like?id=${postId}`);
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    let totalLikes = {};

    const post = await Comment.findOne({ _id: postId }).exec();
    if (!post) throw new CustomError(`Post not found`, 404);

    totalLikes.likes = post.likes.length;

    // save in redis cache.
    redisClient.setEx(`like?id=${postId}`, EXPIRATION, JSON.stringify(totalLikes));

    res.json(totalLikes);
};

const getComment = async (req, res) => {
    if (!req?.params?.id) throw new Error('Bad Request');

    // check if we already have a cache.
    const result = await redisClient.get(`comments?id=${req.params.id}`)
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    const comment = await Comment.findOne({ _id: req.params.id }).exec();
    if (!comment) throw new Error(`No comment with ID ${req.params.id}`);

    // save in redis cache.
    redisClient.setEx(`comments?id=${req.params.id}`, EXPIRATION, JSON.stringify(comment));

    res.json(comment);
}

const getCommentReplies = async (req, res) => {
    if (!req?.params?.id) throw new Error('Bad Request');

    // check if we already have a cache.
    const result = await redisClient.get(`commentReplies?id=${req.params.id}`)
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    const comment = await Comment.findOne({ _id: req.params.id }).exec();
    if (!comment) throw new CustomError(`No comment with ID ${req.params.id}`, 404);

    const replies = await Comment.find({ postId: comment._id });
    if (replies.length < 1) throw new CustomError(`Comment with ID ${comment._id} has no reply.`, 204);

    // save in redis cache.
    redisClient.setEx(`commentReplies?id=${req.params.id}`, EXPIRATION, JSON.stringify(replies));

    res.json(replies);
}

const getTotalReplies = async (req, res) => {
    if (!req?.params?.id) throw new CustomError('Comment id is required', 403)

    // check if we already have a cache
    const result = await redisClient.get(`totalCommentReplies?id=${req.params.id}`);
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));
    let totalReplies = {};

    // check if we have the comment in our db
    const comment = await Comment.findOne({ _id: req.params.id }).exec();
    if (!comment) throw new CustomError('Not found', 404);

    totalReplies.replies = comment.replies.length;

    // save in redis cache.
    redisClient.setEx(`totalCommentReplies?id=${req.params.id}`, EXPIRATION, JSON.stringify(totalReplies));

    res.json(totalReplies);
};

const deleteComment = async (req, res) => {
    if (!req?.params?.id) throw new Error('Bad Request');

    const comment = await Comment.findOne({ _id: req.params.id, profileId: req.user.id }).exec();
    if (!comment) throw new Error(`No Comment matches ID ${req.params.id}`);

    // delete a comment/reply
    const result = await comment.deleteOne();

    if (result) {
        if (req.url.includes('/replies')) {
            // check if this reply has a cache and delete.
            const exists = await redisClient.exists(`commentReplies?id=${comment.id}`);
            if (exists === 1) redisClient.del(`commentReplies?id=${comment.id}`);

            const commentUpdate = await Comment.updateOne({ _id: comment.postId }, { $pull: { replies: comment.id } });
            if (commentUpdate.matchedCount > 0 && commentUpdate.modifiedCount > 0) return res.status(200).json({ 'success': 'Reply deleted sucessfully' })
        } else {
            // check if this comment has a cache and delete.
            const exists = await redisClient.exists(`comments?id=${comment.id}`);
            if (exists === 1) redisClient.del(`comments?id=${comment.id}`);

            const postUpdate = await Post.updateOne({ _id: comment.postId }, { $pull: { comments: comment.id } });
            if (postUpdate.matchedCount > 0 && postUpdate.modifiedCount > 0) return res.status(200).json({ 'success': 'Comment deleted sucessfully' })
        }
    }
}

module.exports = {
    createComment,
    deleteComment,
    getTotalLikes,
    getComments,
    getTotalReplies,
    getComment,
    getCommentReplies
}