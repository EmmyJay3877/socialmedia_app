const User = require('../model/User');
const customError = require('./../utils/customError');
const createRefreshAndAccessToken = require('../utils/createToken');

const handleLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!(username && password)) throw new customError('Username and Password is required.', 400);

    const foundUser = await User.findOne({ username }).select('+password').exec();
    if (!foundUser || !(await foundUser.comparePassword(password, foundUser.password))) throw new customError('Invalid username or password!', 403);

    const { accessToken, refreshToken } = await createRefreshAndAccessToken(username);

    // saving refresh token with current user
    const result = await User.findOneAndUpdate({ username }, { refreshToken: refreshToken });

    if (result) {
        // Creates secure httpOnly cookie with refresh token
        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // add sameSite: 'None', secure: true before production. or when implementing the frontend.

        // Sends access token to user
        res.json({ accessToken });
    }
}

module.exports = { handleLogin };