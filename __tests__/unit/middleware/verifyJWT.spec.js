const jwt = require('jsonwebtoken');
const User = require('./../../../model/User');
const verifyJWT = require('./../../../middleware/verifyJWT');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}));
jest.mock('./../../../model/User');


describe('if client sends a valid webToken', () => {
    let mockReq;

    let mockRes;

    let next;

    beforeEach(() => {
        mockReq = {
            headers: {
                authorization: 'Bearer valid-token'
            }
        }

        mockRes = {
            sendStatus: jest.fn()
        }

        next = jest.fn();
    })

    afterEach(() => { jest.clearAllMocks() });

    it('should populate the request.user object with the currentUser', async () => {

        jwt.verify.mockReturnValueOnce({ username: 'testuser' });

        const user = {
            username: 'testuser'
        }

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(user)
        }));

        await verifyJWT(mockReq, mockRes, next);

        expect(mockReq.user).toMatchObject(user);
    });
});