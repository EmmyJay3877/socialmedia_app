const jwt = require('jsonwebtoken');

const createRefreshAndAccessToken = async (username) => {
    const accessToken = jwt.sign(
        { "username": username },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '3000s' }
    );
    const refreshToken = jwt.sign(
        { "username": username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' }
    );

    return { accessToken, refreshToken };
};


module.exports = createRefreshAndAccessToken;