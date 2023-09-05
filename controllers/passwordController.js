const User = require('./../model/User');
const customError = require('../utils/customError');
const crypto = require('crypto');
const nodemailer = require('../utils/nodemailer');


const forgetPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email }).exec();
    if (!user) throw new customError('There is no user with this email address', 404);

    const resetToken = await user.createPswrdResetToken();
    await user.save({ validateBeforeSave: false }); //used that object so we don't get an error when trying to save

    try {
        let userEmail = user.email;
        let userName = user.username;
        const info = await nodemailer.resetPasswordMail(userEmail, userName);
        if (info.messageId) {
            res.cookie('token', resetToken, { httpOnly: true, maxAge: 10 * 60 * 1000 });
            res.status(200).json({ 'message': 'Please check your Email to reset your password!' });
        };
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        throw new customError('There was an error sending the email, try again later!', 500);
    }
};

const resetPassword = async (req, res, next) => {
    const cookies = req.cookies;
    if (!cookies?.token) throw new customError('Token has expired');
    const hashedToken = crypto.createHash('sha256').update(cookies?.token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken, passwordResetExpires: {
            $gt: Date.now()
        }
    }).exec();

    if (!user) throw new customError('Token is invalid or has expired!', 400);

    // accept new pswrd if token hasn't expired and there is a user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    // delete reset token and expires
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({ 'message': 'success' });
};

module.exports = {
    forgetPassword,
    resetPassword
}