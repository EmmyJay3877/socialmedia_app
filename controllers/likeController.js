const Like = require('../model/Like');
const Post = require('../model/Post');
const Comment = require('../model/Comment');


const createLike = async (req, res) => {
    const { postId } = req.body;
    if (!postId) throw new Error('Like is empty');

    // create a new like
    const newLike = await Like.create({
        // postId can either be the Id of a comment, post or reply.
        "postId": postId,
        "profileId": req.user.id,
    })

    if (newLike) {
        // if it is a reply
        if (req.url.includes('/reply/likes')) {
            // updating the like array in the reply document
            const replyUpdate = await Comment.updateOne({ _id: postId }, { $push: { likes: { $each: [newLike._id] } } })

            if (replyUpdate.matchedCount > 0 && replyUpdate.modifiedCount > 0) {
                res.status(201).json({ "success": `${req.user.username} just liked a reply` });
            }
        } else if (req.url.includes('/comment/likes')) { // if it is a comment
            // updating the like array in the comment document
            const commentUpdate = await Comment.updateOne({ _id: postId }, { $push: { likes: { $each: [newLike._id] } } })

            if (commentUpdate.matchedCount > 0 && commentUpdate.modifiedCount > 0) {
                res.status(201).json({ "success": `${req.user.username} just liked a comment` });
            }
        } else { // if it is a post
            // updating the like array in the post document
            const postUpdate = await Post.updateOne({ _id: postId }, { $push: { likes: { $each: [newLike._id] } } })

            // checking if the Post document was updated
            if (postUpdate.matchedCount > 0 && postUpdate.modifiedCount > 0) {
                res.status(201).json({ "success": `${req.user.username} just liked a post` })
            }
        }
    }
}

const deleteLike = async (req, res) => {
    const { likeId, postId } = req.body;
    if (!likeId || !postId) throw new Error('Bad Request');

    const like = await Like.findOne({ _id: likeId }).exec();
    if (!like) throw new Error(`No Like matches ID ${likeId}`);

    // delete a like
    const result = await like.deleteOne();

    if (result) {
        if (req.url.includes('/reply/likes')) { // if it's a reply
            const replyUpdate = await Comment.updateOne({ _id: postId }, { $pull: { likes: likeId } });
            if (replyUpdate.matchedCount > 0 && replyUpdate.modifiedCount > 0) return res.status(200).json({ 'success': 'Like deleted sucessfully' })
        } else if (req.url.includes('/comment/likes')) { // if it's a comment
            const commentUpdate = await Comment.updateOne({ _id: postId }, { $pull: { likes: likeId } });
            if (commentUpdate.matchedCount > 0 && commentUpdate.modifiedCount > 0) return res.status(200).json({ 'success': 'Like deleted sucessfully' })
        } else { // if it's a post
            const postUpdate = await Post.updateOne({ _id: postId }, { $pull: { likes: likeId } });
            if (postUpdate.matchedCount > 0 && postUpdate.modifiedCount > 0) return res.status(200).json({ 'success': 'Like deleted sucessfully' })
        }
    }
}

module.exports = {
    createLike,
    deleteLike
}