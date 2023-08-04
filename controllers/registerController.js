const User = require('../model/User');
const customError = require('../utils/customError');
const createRefreshAndAccessToken = require('../utils/createToken');


const handleNewUser = async (req, res) => {
    const { username, email, password, passwordConfirm, role } = req.body;
    if (!(username && email && password && passwordConfirm)) throw new customError('Form is incomplete.', 400);

    // check if user exists already in the DB
    const foundUser = await User.findOne({ username }).exec();
    if (foundUser) throw new customError('Conflict. User already exists.', 409);

    // create and save new User
    const newUser = await User.create({
        "username": username,
        "email": email,
        "password": password,
        "passwordConfirm": passwordConfirm,
        "role": role
    })

    if (!newUser) throw new customError('Could not create new user', 204);

    const { accessToken, refreshToken } = await createRefreshAndAccessToken(username);

    // saving refresh token with current user
    const result = await User.findOneAndUpdate(
        { username },
        { refreshToken: refreshToken },
        { runValidators: true }
    );

    if (result) {
        // Creates secure httpOnly cookie with refresh token
        res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // add sameSite: 'None', secure: true before production. or when implementing the frontend.

        res.status(201).json({
            "message": `New User ${username} created.`,
            accessToken
        });
    };
};


module.exports = { handleNewUser };