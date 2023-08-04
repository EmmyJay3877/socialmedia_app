const customError = require('../../../utils/customError');

describe('customError', () => {
    it('should create a customError object/instance', () => {
        const message = 'mockError';
        const statusCode = 500;

        const mockError = new customError(message, statusCode);

        expect(mockError.message).toBe(message);
        expect(mockError.statusCode).toBe(statusCode);
        expect(mockError.isOperational).toBe(true);
        expect(mockError.stack).toBeDefined();
    });
});