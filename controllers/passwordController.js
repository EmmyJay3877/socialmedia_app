const User = require('./../model/User');
const customError = require('../utils/customError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');


const forgetPassword = async (req, res, next) => {
    // get user based on posted email
    const user = await User.findOne({ email: req.body.email }).exec();
    if (!user) throw new customError('There is no user with this email address', 404);

    // generate the random token
    const resetToken = await user.createPswrdResetToken();
    await user.save({ validateBeforeSave: false }); //used that object so we don't get an error when trying to save

    // send it back as an email
    const resetUrl = `${req.protocol}://${req.get('host')}/users/resetPassword/${resetToken}`;

    const message = `Forgot your passowrd? Submt a PATCH request with your new password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset Token is only valid for 10mins',
            message
        });

        res.status(200).json({ 'message': 'Token sent to email!' });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        throw new customError('There was an error sending the email, try again later!', 500);
    }
};


const resetPassword = async (req, res, next) => {
    // get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken, passwordResetExpires: {
            $gt: Date.now()
        }
    }).exec();

    // accept new pswrd if token hasn't expired and there is a user
    if (!user) throw new customError('Token is invalid or has expired!', 400);

    // set password
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