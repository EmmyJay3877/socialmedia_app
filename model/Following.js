const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const followSchema = new Schema({
    followerId: { type: Schema.Types.ObjectId, ref: 'User' }, // user who followed
    followingId: { type: Schema.Types.ObjectId, ref: 'User' } // user who was followed
}, {timestamps: true})

module.exports = mongoose.model('Following', followSchema);