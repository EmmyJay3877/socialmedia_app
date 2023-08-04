const User = require('../model/User');
const Post = require('../model/Post');
const Comment = require('../model/Comment');
const Like = require('../model/Like');
const Following = require('../model/Following');
const Redis = require('redis');
const CustomError = require('../utils/customError');
const redisClient = Redis.createClient();

redisClient.connect();

const EXPIRATION = 20

const getAllUsers = async (req, res) => {
    // check if we already have a cache.
    const result = await redisClient.get('users');
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    const users = await User.find();
    if (!users) throw new CustomError('No users found', 404);

    // save in redis cache
    redisClient.setEx('users', EXPIRATION, JSON.stringify(users));

    res.json(users);
};

const getUser = async (req, res) => {
    if (!req?.params?.id) throw new Error('User ID required.');

    // check if we already have a cache.
    const result = await redisClient.get(`users?id=${req.params.id}`);
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    const user = await User.findOne({ _id: req.params.id }).exec();
    if (!user) throw new Error(`No User matches ID ${req.params.id}`);

    // save in redis cache.
    redisClient.setEx(`users?id=${req.params.id}`, EXPIRATION, JSON.stringify(user));

    res.json(user);
};

// filter our request body
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(key => {
        if (allowedFields.includes(key)) newObj[key] = obj[key];
    })
    return newObj;
}

const updateUser = async (req, res) => {
    const user = await User.findOne({ _id: req.user._id }).exec();
    if (!user) throw new CustomError(`Unauthorized to perform this action`, 401);

    if (req.body?.username) {
        // check if the username exists already
        const foundUserName = await User.findOne({ username: req.body.username }).exec();
        if (foundUserName) throw new CustomError('Username already exist', 400);
    }

    const filteredBody = filterObj(req.body, 'username');

    const result = await User.findByIdAndUpdate(req.user._id, filteredBody, { new: true, runValidators: true });

    if (result) return res.status(200).json({ "success": `User updated successfully` })
};

const updatePassword = async (req, res) => {
    const user = await User.findOne({ username: req.user.username }).select('+password').exec();

    // check if current user password is correct
    if (!user || !await user.comparePassword(req.body.passwordCurrent, user.password)) {
        throw new CustomError('Password is incorrect', 401);
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    res.status(200).json({ "message": "success" });
};

const deleteUser = async (req, res) => {
    const user = await User.findOne({ _id: req.params.id }).exec();
    if (!user) throw new CustomError(`User not found`, 404);

    // check if user has post, delete if they do.
    if (user.posts) await Post.deleteMany({ profile: user.id });

    // check if the user has made comments, delete if they had.
    const userComments = await Comment.find({ profileId: user.id });
    if (userComments) await Comment.deleteMany({ profileId: user.id });

    // check if user liked some posts/comments, delete if they did.
    const userLikes = await Like.find({ profileId: user.id });
    if (userLikes) await Like.deleteMany({ profileId: user.id });

    // delete user from followers array of other users.
    const userFollowing = await Following.find({ followerId: user.id });
    if (userFollowing) {
        userFollowing.map(async (userFollow) => {
            await User.updateOne({ _id: userFollow.followingId }, { $pull: { followers: userFollow.followerId } })
        })
        // delte from the following collection.
        await Following.deleteMany({ followerId: user.id })
    }

    const result = await user.deleteOne();
    if (result) {
        // check if this user has a cache and delete.
        const exists = await redisClient.exists(`users?id=${user.id}`);
        if (exists === 1) redisClient.del(`users?id=${user.id}`);
        return res.status(200).json({ "success": `User with ID ${user.id} has been deleted.` })
    }
};

module.exports = {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    updatePassword,
}