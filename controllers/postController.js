const Post = require('../model/Post');
const User = require('../model/User');
const Comment = require('../model/Comment');
const Like = require('../model/Like');
const customError = require('../utils/customError');
const Redis = require('redis');
const redisClient = Redis.createClient();
const cloudinary = require('cloudinary').v2;

const CLOUD_NAME = process.env.CLOUD_NAME
const API_KEY = process.env.API_KEY
const API_SECRET = process.env.API_SECRET
const SECURE = process.env.SECURE

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: SECURE
});

redisClient.connect();

const EXPIRATION = 20

const createPost = async (req, res) => {
    const { text } = req.body;
    if (!text) throw new customError('Post is empty', 400);

    let imageUrl

    const image = req.files?.photo;

    if (image && /^image/.test(image.mimetype)) {

        const options = {
            public_id: image.name
        };

        try {
            const { secure_url } = await cloudinary.uploader.upload(image.tempFilePath, options);
            imageUrl = secure_url;
        } catch (error) {
            throw new customError('Could not upload photo, check your network settings', 500);
        }
    };

    // create a new post
    const newPost = await Post.create({
        "profile": req.user._id,
        "text": text,
        "image": imageUrl
    });

    if (newPost) {
        // updating the post array in the User document
        const userUpdate = await User.updateOne({ "_id": req.user._id }, { $push: { posts: { $each: [newPost._id] } } });

        // checking if the User document was updated
        if (userUpdate.matchedCount > 0 && userUpdate.modifiedCount > 0) {
            res.status(201).json({ "success": `${req.user.username} just made a post` })
        };
    };
};

const getAllPosts = async (req, res) => {
    // check if we already have a cache.
    const result = await redisClient.get('posts');
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    const posts = await Post.find();
    if (!posts) throw new customError('No posts found.', 204);

    // save in redis cache
    redisClient.setEx('posts', EXPIRATION, JSON.stringify(posts));

    res.json(posts);
};

const getPost = async (req, res) => {
    if (!req?.params?.id) throw new customError('Post ID is required', 400);

    // check if we already have a cache.
    const result = await redisClient.get(`posts?id=${req.params.id}`);
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    const post = await Post.findOne({ _id: req.params.id }).exec();
    if (!post) throw new customError(`No post matches ID ${req.params.id}`, 404);

    // save in redis cache.
    redisClient.setEx(`posts?id=${req.params.id}`, EXPIRATION, JSON.stringify(post));

    res.json(post);
};

const getPostComments = async (req, res) => {
    if (!req?.params?.id) throw new customError('Post id is required', 403)

    // check if we already have a cache
    const result = await redisClient.get(`postComments?id=${req.params.id}`);
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    // check if we have the post in our db
    const post = await Post.findOne({ _id: req.params.id }).exec();
    if (!post) throw new customError('Not found', 404);

    const postComments = await Comment.find({ postId: req.params.id });
    if (postComments.length < 1) throw new customError(`Post with ID ${req.params.id} has no comment.`, 204);

    // save in redis cache.
    redisClient.setEx(`postComments?id=${req.params.id}`, EXPIRATION, JSON.stringify(postComments));

    res.json(postComments);
};

const getTotalComments = async (req, res) => {
    if (!req?.params?.id) throw new customError('Post id is required', 403)

    // check if we already have a cache
    const result = await redisClient.get(`totalPostComments?id=${req.params.id}`);
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    let totalComments = {};

    // check if we have the post in our db
    const post = await Post.findOne({ _id: req.params.id }).exec();
    if (!post) throw new customError('Not found', 404);

    totalComments.comments = post.comments.length;

    // save in redis cache.
    redisClient.setEx(`totalPostComments?id=${req.params.id}`, EXPIRATION, JSON.stringify(totalComments));

    res.json(totalComments);
};

const getUserPosts = async (req, res) => {
    if (!req?.user?.id) throw new customError('User ID required.', 403);

    // check if we have the user in our db
    const user = await User.findOne({ _id: req.user.id }).exec();
    if (!user) throw new customError('Unauthorized', 401);

    // check if already have a cache.
    const result = await redisClient.get(`userPosts?profile=${req.user._id}`);
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    const userPosts = await Post.find({ profile: req.user._id });
    if (userPosts.length < 1) throw new customError(`User with ID ${req.user._id} has no post.`, 404);

    // save in redis cache
    redisClient.setEx(`userPosts?profile=${req.user._id}`, EXPIRATION, JSON.stringify(userPosts));

    res.json(userPosts);
};

const deletePost = async (req, res, next) => {
    if (!req?.params?.id) throw new customError('Post id is required', 403);

    const post = await Post.findOne({ _id: req.params.id, profile: req.user.id }).exec();
    if (!post) throw new customError(`No Post matches ID ${req.params.id}`, 404);

    // delete all the comments document related to this post
    const postComments = await Comment.find({ postId: post._id });
    if (postComments) await Comment.deleteMany({ postId: post._id });

    // delete all likes document related to this post
    const postLikes = await Like.find({ postId: post._id });
    if (postLikes) await Like.deleteMany({ postId: post._id });

    const result = await post.deleteOne();

    if (result) {
        // check if this post has a cache and delete.
        const exists = await redisClient.exists(`posts?id=${req.params.id}`);
        if (exists === 1) redisClient.del(`posts?id=${req.params.id}`);
        return res.status(200).json({ "success": `Post with ID ${req.params.id} has been deleted.` });
    };
};


module.exports = {
    createPost,
    getAllPosts,
    getPost,
    getUserPosts,
    getTotalComments,
    deletePost,
    getPostComments,
}