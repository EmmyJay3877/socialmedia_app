const { handleNewUser } = require('../../../controllers/registerController');
const User = require('../../../model/User');
const createRefreshAndAccessToken = require('../../../utils/createToken');

jest.mock('../../../model/User');
jest.mock('../../../utils/createToken');

describe('Register new user', () => {
    // fake request
    let mockReq;

    // fake response
    let mockRes;

    // foundUser (invalid)
    const foundUser = {
        username: 'invalidUsername',
        email: 'invalidEmail',
        password: "invalidPassword",
        passwordConfirm: "invalidPasswordConfirm",
        role: 'invalidRole'
    };

    // new valid user
    const user = {
        username: 'validUsername',
        email: 'validEmail',
        password: "validPassword",
        passwordConfirm: "validPasswordConfirm",
        role: 'validRole'
    };

    // tokens
    const tokens = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken'
    };

    beforeEach(() => {
        // create a body obj in the mock request before each test
        mockReq = {
            body: {}
        };

        // add mock cookie, status, json functions into our mock response before each test 
        mockRes = {
            cookie: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should throw an error if form is incomplete', async () => {
        // set the request body to an empty obj
        mockReq.body = {};

        await expect(handleNewUser(mockReq, mockRes)).rejects.toThrow('Form is incomplete');
    });

    it('should throw an error if user already exist in database', async () => {
        mockReq.body = foundUser;

        // return a user that already exist
        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(foundUser)
        }));

        await expect(handleNewUser(mockReq, mockRes)).rejects.toThrow('Conflict. User already exists.');
    });

    it('should create and save new user, get access and refresh tokens, save refresh token with the current user, create secure httpOnly cookie with refresh token and send access token to user.', async () => {
        mockReq.body = user;

        // could not return a user
        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(null)
        }));

        //  therefore create new user
        User.create.mockResolvedValueOnce(user);

        createRefreshAndAccessToken.mockResolvedValueOnce(tokens);

        // save refreshToken
        User.findOneAndUpdate.mockImplementationOnce(() => {
            user.refreshToken = tokens.refreshToken;
            return user
        });

        await handleNewUser(mockReq, mockRes);

        expect(User.findOneAndUpdate).toHaveReturnedWith(user);
        expect(mockRes.cookie).toHaveBeenCalledWith('jwt', tokens.refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
        });
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: `New User ${user.username} created.`,
            accessToken: tokens.accessToken
        });
    });
});