const User = require('../model/User');


const handleLogout = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);
    const refreshToken = cookies.jwt;

    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None' });
        return res.sendStatus(204); // no content
    }

    // delete refreshToken from the db
    foundUser.refreshToken = '';
    const result = await foundUser.save({ validateBeforeSave: false });

    if (result) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None' });
        res.sendStatus(204); // no content
    }
};

module.exports = { handleLogout }