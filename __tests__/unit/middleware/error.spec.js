const errorHandler = require('../../../middleware/errorHandler');
const customError = require('../../../utils/customError');

jest.mock('../../../utils/customError', () => jest.fn());
jest.mock('process');

describe('errorHandler', () => {
    let mockReq;

    let mockRes;

    let mockError;

    let next;

    beforeEach(() => {

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        }

        mockError = {
            statusCode: 400,
            message: 'message',
            stack: 'stack',
            path: 'path',
            value: 'value',
            keyPattern: {
                name: 'name',
            },
            isOperational: true,
            errors: [],
        }

        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    if (process.env.NODE_ENV === 'development') {
        describe('devErrors', () => {
            it('should return devError with response', () => {
                errorHandler(mockError, mockReq, mockRes, next);

                expect(mockRes.status).toHaveBeenCalledWith(mockError.statusCode);

                expect(mockRes.json).toHaveBeenCalledWith({
                    statusCode: mockError.statusCode,
                    message: mockError.message,
                    stackTrace: mockError.stack,
                    error: mockError
                })
            });
        });
    };

    if (process.env.NODE_ENV === 'production') {
        describe('prodError', () => {
            if (process.env.NODE_ENV === 'production') {
                it('should throw an error if error is not operational', () => {

                    mockError.isOperational = false;

                    errorHandler(mockError, mockReq, mockRes, next);

                    expect(mockRes.status).toHaveBeenCalledWith(500);

                    expect(mockRes.send).toHaveBeenCalledWith('Something went wrong, try again later.');
                });

                it('should return prodError with response', () => {

                    errorHandler(mockError, mockReq, mockRes, next);

                    expect(mockRes.status).toHaveBeenCalledWith(mockError.statusCode);

                    expect(mockRes.json).toHaveBeenCalledWith({
                        statusCode: mockError.statusCode,
                        message: mockError.message,
                    })
                });
            };
        });

        describe('when there is a castError', () => {
            it('should return an error with msg and statusCode', () => {

                mockError.name = 'CastError'

                customError.mockImplementationOnce((msg, statusCode) => ({
                    message: msg,
                    statusCode: statusCode,
                    isOperational: true,
                }));

                const msg = `Invalid value for ${mockError.path}: ${mockError.value}`

                errorHandler(mockError, mockReq, mockRes, next);

                expect(customError).toHaveBeenCalledWith(msg, 400);

                expect(mockRes.status).toHaveBeenCalledWith(mockError.statusCode);

                expect(mockRes.json).toHaveBeenCalledWith({
                    statusCode: mockError.statusCode,
                    message: msg,
                })
            });
        });

        describe('when there is a duplicateKeyError', () => {
            it('should return an error with msg and statusCode', () => {

                mockError.code = 11000;

                customError.mockImplementationOnce((msg, statusCode) => ({
                    message: msg,
                    statusCode: statusCode,
                    isOperational: true,
                }));

                const key = Object.keys(mockError.keyPattern);

                const msg = `User with this ${key} already exist`

                errorHandler(mockError, mockReq, mockRes, next);

                expect(customError).toHaveBeenCalledWith(msg, 409);
            });
        });

        describe('when there is a validationError', () => {
            it('should return an error with one msg and statusCode', () => {
                mockError.name = 'ValidationError'

                mockError.errors = [{ message: 'err1' }];

                const error = Object.values(mockError.errors).map(err => err.message);

                const msg = `Invalid input data: ${error}`;

                customError.mockImplementationOnce((msg, statusCode) => ({
                    message: msg,
                    statusCode: statusCode,
                    isOperational: true,
                }));

                errorHandler(mockError, mockReq, mockRes, next);

                expect(customError).toHaveBeenCalledWith(msg, 409);
            });

            it('should return an error with msgs and statusCode', () => {

                mockError.name = 'ValidationError'

                mockError.errors = [{ message: 'err1' }, { message: 'err2' }];

                const error = Object.values(mockError.errors).map(err => err.message);

                const errMsgs = error.join('. ');

                const msg = `Invalid input data: ${errMsgs}`;

                customError.mockImplementationOnce((msg, statusCode) => ({
                    message: msg,
                    statusCode: statusCode,
                    isOperational: true,
                }));

                errorHandler(mockError, mockReq, mockRes, next);

                expect(customError).toHaveBeenCalledWith(msg, 409);

                expect(mockRes.status).toHaveBeenCalledWith(409);

                expect(mockRes.json).toHaveBeenCalledWith({
                    statusCode: 409,
                    message: msg,
                })
            });
        });

        describe('JWTerror', () => {
            it('should return an error with response', () => {
                mockError.name = 'JsonWebTokenError';

                customError.mockImplementationOnce((msg, statusCode) => ({
                    message: msg,
                    statusCode: statusCode,
                    isOperational: true,
                }));

                errorHandler(mockError, mockReq, mockRes, next);

                expect(customError).toHaveBeenCalledWith('Invalid token, Please login.', 401);
            });
        });

        describe('expiredJWTerror', () => {
            it('should return an error with response', () => {

                mockError.name = 'TokenExpiredError';

                customError.mockImplementationOnce((msg, statusCode) => ({
                    message: msg,
                    statusCode: statusCode,
                    isOperational: true,
                }));

                errorHandler(mockError, mockReq, mockRes, next);

                expect(customError).toHaveBeenCalledWith('Token has expired', 401);
            });
        });
    };
});