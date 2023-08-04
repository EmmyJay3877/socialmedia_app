const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    text: {
        type: String,
        required: true
    },
    profileId: { type: Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: Schema.Types.ObjectId, ref: 'Like' }],
    replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }]
}, {timestamps: true})

module.exports = mongoose.model('Comment', commentSchema);