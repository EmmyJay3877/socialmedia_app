const Following = require('../model/Following');
const User = require('../model/User');
const CustomError = require('../utils/customError');
const Redis = require('redis');
const redisClient = Redis.createClient();

redisClient.connect();

const EXPIRATION = 20

const createFollowing = async (req, res) => {
    const { followingId } = req.body;
    if (!followingId) throw new CustomError('Bad Request', 403);

    const follow = await Following.findOne({ followingId }).exec();
    if (follow && (follow.followerId.toString() === req.user.id)) {
        throw new CustomError("You can't follow a user twice", 403)
    };

    const newFollowing = await Following.create({
        "followerId": req.user.id, //user that followed
        "followingId": followingId // user that was followed
    })

    if (newFollowing) {
        // update followers array
        const user1Update = await User.updateOne({ "_id": followingId }, { $push: { followers: { $each: [newFollowing.followerId] } } });
        // update following array
        const user2Update = await User.updateOne({ "_id": req.user.id }, { $push: { following: { $each: [newFollowing.followingId] } } });

        if (user1Update.modifiedCount > 0 && user2Update.modifiedCount > 0) {
            res.status(201).json({ "success": `${req.user.username} just followed ${followingId}` })
        };
    };
};

const getYourFollowing = async (req, res) => {
    // check if we already have a cache.
    const result = await redisClient.get(`following?id=${req.user.id}`);
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    let follow = {};

    const user = await User.findOne({ _id: req.user.id }).exec();
    if (!user) throw new CustomError(`No User found`, 404);

    follow.following = user.following.length;
    follow.followers = user.followers.length;

    // save in redis cache.
    redisClient.setEx(`following?id=${req.user.id}`, EXPIRATION, JSON.stringify(follow));

    res.json(follow);
};

const getFollowingOfUser = async (req, res) => {
    const userId = req.params.id;
    if (!userId) throw new CustomError('Bad Request', 403);

    // check if we already have a cache.
    const result = await redisClient.get(`following?id=${userId}`);
    if (result !== undefined && result !== null) return res.json(JSON.parse(result));

    let follow = {};

    const user = await User.findOne({ _id: userId }).exec();
    if (!user) throw new CustomError(`No User found`, 404);

    follow.following = user.following.length;
    follow.followers = user.followers.length;

    // save in redis cache.
    redisClient.setEx(`following?id=${userId}`, EXPIRATION, JSON.stringify(follow));

    res.json(follow);
};

const deleteFollowing = async (req, res) => {
    const followingId = req.params.id;
    if (!followingId) throw new CustomError('Bad Request', 403);

    const follow = await Following.findOne({ followingId }).exec();
    if (!follow) throw new CustomError(`No Follow matches ID ${follow._id}`, 404);

    const result = follow.deleteOne();

    if (result) {
        // update followers array
        const user1Update = await User.updateOne({ "_id": followingId }, { $pull: { followers: req.user.id } });
        // update following array
        const user2Update = await User.updateOne({ "_id": req.user.id }, { $pull: { following: followingId } });

        if (user1Update.modifiedCount > 0 && user2Update.modifiedCount > 0) {
            res.status(200).json({ "success": `${req.user.username} just unfollowed ${followingId}` })
        };
    };
};

module.exports = {
    createFollowing,
    getYourFollowing,
    getFollowingOfUser,
    deleteFollowing
}