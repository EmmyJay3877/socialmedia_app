const Following = require('../model/Following');
const User = require('../model/User');

const createFollowing = async (req, res) => {
    const { followingId } = req.body;
    if (!followingId) throw new Error('Bad Request');

    // create a new following
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

const deleteFollowing = async (req, res) => {
    const { followId } = req.body;
    if (!followId) throw new Error('Bad Request');

    const follow = await Following.findOne({ _id: followId }).exec();
    if (!follow) throw new Error(`No Follow matches ID ${followId}`);

    const followingId = follow.followingId

    // delete a follow
    const result = follow.deleteOne();

    if (result && followingId) {
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
    deleteFollowing
}