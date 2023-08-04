const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Username is required!'],
        unique: true,
        validate: {
            validator: function (value) {
                // Regular expression to validate the username
                const regex = /^[a-zA-Z][a-zA-Z0-9]*$/;
                return regex.test(value);
            },
            message: 'Username must contain only letters or a combination of letters and numbers (but not only numbers).'
        },
        minlength: [4, 'Usernname must have more than 4 characters'],
        maxlength: [20, 'Usernname must have less than 20 characters']
    },
    email: {
        type: String,
        validate: [validator.isEmail, 'Please provide a valid email!'],
        required: [true, 'Email is required!'],
        unique: true,
        lowercase: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'], //check if the value given is an item of the array.
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Password is required!'],
        minlength: [8, 'Password should be more than 8 characters!'],
        select: false //pswrd will never show up in any output
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password!'],
        validate: {
            // this will only work when we CREATE and SAVE a new document !!!
            validator: function (value) {
                return value === this.password;
            },
            message: 'Password do not match'
        }
    },
    code: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
        validate: [validator.isJWT, 'invalid token!']
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

userSchema.pre('save', async function (next) { //run this funtion if password was modified
    if (!this.isModified('password')) return next(); //exit this function and call the next middleware

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;
    next();
});

// create a user instance method, which is available for all documents in the user collection.
userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPswrdResetToken = async function () {
    const resetToken = crypto.randomBytes(32).toString('hex'); //this token will be sent to the user

    // encrypting the resetToken
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //10mins

    return resetToken;
};

module.exports = mongoose.model('User', userSchema);