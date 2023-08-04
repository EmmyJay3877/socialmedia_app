const allowedOrigins = require('../../../config/allowedOrigins');
const credentials = require('../../../middleware/credentials');

describe('credentials', () => {
    let mockReq;

    let mockRes;

    let next;

    beforeEach(() => {

        mockReq = {
            headers: {
                origin: allowedOrigins[0]
            }
        }

        mockRes = {
            header: jest.fn()
        }

        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    it('should set response header to Access-Control-Allow-Credentials, true', () => {

        credentials(mockReq, mockRes, next);

        expect(mockRes.header).toHaveBeenCalledWith('Access-Control-Allow-Credentials', true);

        expect(next).toHaveBeenCalled();

    });
});