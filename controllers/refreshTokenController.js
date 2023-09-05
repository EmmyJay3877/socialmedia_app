const User = require('../model/User');
const jwt = require('jsonwebtoken');
const customError = require('./../utils/customError');



const handleRefresh = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) throw new customError('Unauthorized', 401);
    const refreshToken = cookies.jwt;

    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) throw new customError('User not found', 404);

    //get payload from token
    const { username } = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // verify username is in DB
    const currentUser = await User.findOne({ username }).exec();
    if (!currentUser) throw new customError('User with this token does not exists!!', 401);

    // create new accesstoken
    const accessToken = jwt.sign(
        { "username": currentUser.username },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '3000s' }
    );

    res.json({ accessToken })
};

module.exports = { handleRefresh }