const { handleLogout } = require('../../../controllers/logoutController');
const User = require('../../../model/User');

jest.mock('../../../model/User');


describe('handleLogout', () => {
    // fake request
    let mockReq;

    // fake response
    let mockRes;

    // new valid user
    const user = {
        username: 'validUsername',
        email: 'validEmail',
        password: "validPassword",
        refreshToken: 'refreshToken',
        save: jest.fn().mockReturnThis()
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
            clearCookie: jest.fn(),
            sendStatus: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should throw an error if there is no jwt cookie in our request', async () => {
        // set cookie to an empty obj
        mockReq.cookies = {};

        await handleLogout(mockReq, mockRes);

        expect(mockRes.sendStatus).toHaveBeenCalledWith(204);
    });

    it('should get the jwt token from the request cookie, find a user using the refresh token from the cookie and clearCookie if user was not found.', async () => {

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(null)
        }));

        await handleLogout(mockReq, mockRes);

        expect(mockRes.clearCookie).toHaveBeenCalledWith('jwt', { httpOnly: true, sameSite: 'None' });
        expect(mockRes.sendStatus).toHaveBeenCalledWith(204);
    });

    it('should delete refreshToken from DB if the user was found, save the user and also clearCookie from our response.', async () => {

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(user)
        }));

        await handleLogout(mockReq, mockRes);

        expect(mockRes.clearCookie).toHaveBeenCalledWith('jwt', { httpOnly: true, sameSite: 'None' });
        expect(mockRes.sendStatus).toHaveBeenCalledWith(204);

    });
});