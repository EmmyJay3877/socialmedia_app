const { handleRefresh } = require('../../../controllers/refreshTokenController');
const User = require('../../../model/User');
const jwt = require('jsonwebtoken');

jest.mock('../../../model/User');
jest.mock('jsonwebtoken');

describe('handle Refresh path', () => {
    // fake request
    let mockReq;

    // fake response
    let mockRes;

    // foundUser (invalid)
    const foundUser = {
        username: 'invalidUsername',
        email: 'invalidEmail',
        password: "invalidPassword"
    };

    // new valid user
    const user = {
        username: 'validUsername',
        email: 'validEmail',
        password: "validPassword",
    };

    const username = 'invalidUsername';

    // token
    const token = {
        accessToken: 'accessToken'
    };

    beforeEach(() => {
        // create a cookies obj in the mock request before each test
        mockReq = {
            cookies: {
                jwt: 'jwtToken'
            }
        };

        // add mock json function into our mock response before each test 
        mockRes = {
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should throw an error if there is no jwt cookie in our request', async () => {
        // set cookie to an empty obj
        mockReq.cookies = {};

        await expect(handleRefresh(mockReq, mockRes)).rejects.toThrow('Unauthorized');
    });

    it('should get the jwt token from the request cookie, find a user using the refresh token from the cookie and throw an error if user was not found', async () => {

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(null)
        }));

        await expect(handleRefresh(mockReq, mockRes)).rejects.toThrow('User not found');
    });

    it('should get payload from token, check if username is in DB and throw an error if the user with that token does not exist', async () => {

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(foundUser)
        }));

        jwt.verify.mockReturnValueOnce(username);

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(null)
        }));

        await expect(handleRefresh(mockReq, mockRes)).rejects.toThrow('User with this token does not exists!!');
    });

    it('should create and send new accessToken', async () => {

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(user)
        }));

        jwt.verify.mockReturnValueOnce(user.username);

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(user)
        }));

        jwt.sign.mockReturnValueOnce(token.accessToken);

        await handleRefresh(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ accessToken: token.accessToken });
    });
});
