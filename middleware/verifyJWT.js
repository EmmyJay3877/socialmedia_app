const jwt = require('jsonwebtoken');
const customError = require('./../utils/customError');
const User = require('../model/User');
const tryCatch = require('../utils/tryCatch');

const verifyJWT = tryCatch(async (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new customError('Unauthorized', 401);

    const token = authHeader.split(' ')[1];
    if (!token) throw new customError("You're not logged in, Please log in to gain access.", 401);

    //get payload from token
    const { username } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const currentUser = await User.findOne({ username }).exec();
    if (!currentUser) throw new customError('User with this token does not exists!!', 401);

    // Grant access to protected routes
    req.user = currentUser;
    next();
})

module.exports = verifyJWT;