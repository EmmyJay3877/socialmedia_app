const Like = require('../model/Like');
const Post = require('../model/Post');
const Comment = require('../model/Comment');
const CustomError = require('../utils/customError');
const Redis = require('redis');
const redisClient = Redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.connect();

const EXPIRATION = 20


const createLike = async (req, res) => {
    const { postId } = req.body;
    if (!postId) throw new CustomError('Like is empty', 403);

    await checkRepeatedLike(postId, req.user.id, req);

    const newLike = await Like.create({
        // postId can either be the Id of a comment, post or reply.
        "postId": postId,
        "profileId": req.user.id,
    })

    if (newLike) {
        // if it is a reply
        if (req.url.includes('/reply/likes')) {
            // updating the like array in the reply document
            const replyUpdate = await Comment.updateOne({ _id: postId }, { $push: { likes: { $each: [req.user.id] } } })

            if (replyUpdate.matchedCount > 0 && replyUpdate.modifiedCount > 0) {
                res.status(201).json({ "success": `${req.user.username} just liked a reply` });
            }
        } else if (req.url.includes('/comment/likes')) { // if it is a comment
            // updating the like array in the comment document
            const commentUpdate = await Comment.updateOne({ _id: postId }, { $push: { likes: { $each: [req.user.id] } } })

            if (commentUpdate.matchedCount > 0 && commentUpdate.modifiedCount > 0) {
                res.status(201).json({ "success": `${req.user.username} just liked a comment` });
            }
        } else { // if it is a post
            // updating the like array in the post document
            const postUpdate = await Post.updateOne({ _id: postId }, { $push: { likes: { $each: [req.user.id] } } })

            // checking if the Post document was updated
            if (postUpdate.matchedCount > 0 && postUpdate.modifiedCount > 0) {
                res.status(201).json({ "success": `${req.user.username} just liked a post` })
            }
        }
    }
}

const checkRepeatedLike = async (postId, userId, req) => {
    if (req.url.includes('/reply/likes')) {
        const reply = await Comment.findOne({ _id: postId }).exec();
        reply.likes.forEach(like => {
            if (like.toString() === userId) throw new CustomError("You can't like a reply twice", 403)
        });
    } else if (req.url.includes('/comment/likes')) {
        const comment = await Comment.findOne({ _id: postId }).exec();
        comment.likes.forEach(like => {
            if (like.toString() === userId) throw new CustomError("You can't like a comment twice", 403)
        });
    } else {
        const post = await Post.findOne({ _id: postId }).exec();
        post.likes.forEach(like => {
            if (like.toString() === userId) throw new CustomError("You can't like a post twice", 403)
        });
    }
};

const getTotalLikes = async (req, res) => { // on a post
    const postId = req.params.id;
    if (!postId) throw new CustomError('Bad Request', 403);

    // check if we already have a cache.
    const result = await redisClient.get(`like?id=${postId}`);
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    let totalLikes = {};

    const post = await Post.findOne({ _id: postId }).exec();
    if (!post) throw new CustomError(`Post not found`, 404);

    totalLikes.likes = post.likes.length;

    // save in redis cache.
    redisClient.setEx(`like?id=${postId}`, EXPIRATION, JSON.stringify(totalLikes));

    res.json(totalLikes);
};

const deleteLike = async (req, res) => {
    const postId = req.params.id;
    if (!postId) throw new CustomError('Bad Request', 403);

    const like = await Like.findOne({ postId, profileId: req.user.id }).exec();
    if (!like) throw new CustomError(`Like was not found`, 404);

    // delete a like
    const result = await like.deleteOne();

    if (result) {
        if (req.url.includes('/reply/likes')) { // if it's a reply
            const replyUpdate = await Comment.updateOne({ _id: postId }, { $pull: { likes: like._id } });
            if (replyUpdate.matchedCount > 0 && replyUpdate.modifiedCount > 0) return res.status(200).json({ 'success': `${req.user.username} just unliked a reply` })
        } else if (req.url.includes('/comment/likes')) { // if it's a comment
            const commentUpdate = await Comment.updateOne({ _id: postId }, { $pull: { likes: like._id } });
            if (commentUpdate.matchedCount > 0 && commentUpdate.modifiedCount > 0) return res.status(200).json({ 'success': `${req.user.username} just unliked a comment` })
        } else { // if it's a post
            const postUpdate = await Post.updateOne({ _id: postId }, { $pull: { likes: like._id } });
            if (postUpdate.matchedCount > 0 && postUpdate.modifiedCount > 0) return res.status(200).json({ 'success': `${req.user.username} just unliked a post` })
        }
    }
}

module.exports = {
    createLike,
    getTotalLikes,
    deleteLike
}