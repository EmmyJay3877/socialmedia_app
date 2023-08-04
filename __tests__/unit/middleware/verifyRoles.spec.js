const verifyRoles = require('../../../middleware/verifyRoles');
const customError = require('../../../utils/customError');

describe('verifyRoles', () => {
    let mockReq;

    let mockRes;

    let next;

    beforeEach(() => {
        mockReq = {
            user: {
                role: 'admin'
            }
        }

        next = jest.fn();
    });

    afterEach(() => { jest.clearAllMocks() });

    it('should throw an error if user isnt admin', () => {
        mockReq.user.role = 'user'

        const requiredRoles = ['admin'];

        // used an arrow so we can recieve the thrown error
        expect(() => verifyRoles(...requiredRoles)(mockReq, mockRes, next)).toThrow(customError);
    });

    it('should call next', () => {
        const requiredRoles = ['admin'];

        verifyRoles(...requiredRoles)(mockReq, mockRes, next);

        expect(next).toHaveBeenCalled();
    });
});