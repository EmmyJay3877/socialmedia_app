const { handleLogin } = require('../../../controllers/authController');
const User = require('../../../model/User');
const createRefreshAndAccessToken = require('../../../utils/createToken');

jest.mock('../../../model/User');
jest.mock('../../../utils/createToken');

describe('handleLogin', () => {
    // fake request
    let mockReq;

    // fake response
    let mockRes;

    // foundUser (invalid)
    const foundUser = {
        username: 'invalidUsername',
        password: "invalidPassword",
        comparePassword: jest.fn().mockReturnValue(false)
    };

    // User object, returned when we use findOneAndUpdate
    const user = {
        username: 'validUsername',
        password: "validPassword",
        comparePassword: jest.fn().mockReturnValue(true)
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

        // add mock cookie and json functions into our mock response before each test 
        mockRes = {
            cookie: jest.fn(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // 1st test
    it('should throw an error if username and password are missing', async () => {
        // set the request body to an empty obj
        mockReq.body = {};

        await expect(handleLogin(mockReq, mockRes)).rejects.toThrow('Username and Password is required.');
    });

    // 2nd test
    it('should throw an error if username could not be found', async () => {
        mockReq.body = {
            "username": 'invalidUsername',
            "password": "wrongPassword"
        };

        // return an empty obj from findOne method
        User.findOne.mockImplementationOnce(() => ({
            select: jest.fn(() => ({
                exec: jest.fn().mockReturnValueOnce(null)
            }))
        }));

        await expect(handleLogin(mockReq, mockRes)).rejects.toThrow('Invalid username or password!');
        expect(User.findOne).toHaveBeenCalledTimes(1);
    });

    // 3rd test
    it('should throw an error if user was found but password does not match', async () => {

        mockReq.body = {
            username: 'invalidUsername',
            password: "invalidPassword"
        };

        // return a foundUser
        User.findOne.mockImplementationOnce(() => ({
            select: jest.fn(() => ({
                exec: jest.fn().mockReturnValueOnce(foundUser)
            }))
        }));

        // password does not match
        foundUser.comparePassword();

        await expect(handleLogin(mockReq, mockRes)).rejects.toThrow('Invalid username or password!');
        expect(User.findOne).toHaveBeenCalledTimes(1);
    });

    // // 4th test
    it('should get access and refresh tokens, save refresh token with the current user, create secure httpOnly cookie with refresh token and send access token to user.', async () => {

        mockReq.body = {
            username: 'validUsername',
            password: "validPassword",
        };

        // return a foundUser
        User.findOne.mockImplementationOnce(() => ({
            select: jest.fn(() => ({
                exec: jest.fn(() => user)
            }))
        }));

        // password does match
        user.comparePassword();

        createRefreshAndAccessToken.mockImplementationOnce(() => tokens);

        User.findOneAndUpdate.mockImplementationOnce(() => {
            user.refreshToken = tokens.refreshToken;
            return user
        });

        await handleLogin(mockReq, mockRes);

        expect(createRefreshAndAccessToken).toHaveReturnedWith(tokens);
        expect(User.findOneAndUpdate).toHaveReturnedWith(user);
        expect(mockRes.cookie).toHaveBeenCalledWith('jwt', tokens.refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
        });
        expect(mockRes.json).toHaveBeenCalledWith({ accessToken: tokens.accessToken });
    });
});