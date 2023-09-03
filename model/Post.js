const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    profile: { type: Schema.Types.ObjectId, ref: 'User' },
    text: {
        type: String,
        required: true
    },
    image: String,
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }]
}, { timestamps: true })

module.exports = mongoose.model('Post', postSchema)