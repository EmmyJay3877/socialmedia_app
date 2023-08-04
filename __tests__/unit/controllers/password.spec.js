const { forgetPassword, resetPassword } = require('../../../controllers/passwordController');
const User = require('../../../model/User');
const sendEmail = require('../../../utils/email');
const crypto = require('crypto');

jest.mock('../../../model/User');
jest.mock('../../../utils/email');


describe('forgetPassword', () => {

    let mockReq

    let mockRes

    let next

    // new valid user
    const user = {
        email: 'validEmail',
        refreshToken: 'refreshToken',
        passwordResetToken: 'passwordResetToken',
        passwordResetExpires: 'passwordResetExpires',
        save: jest.fn().mockReturnThis(),
        createPswrdResetToken: jest.fn().mockReturnValue('resetToken')
    };

    beforeEach(() => {
        // create a cookies obj in the mock request before each test
        mockReq = {
            body: {
                email: 'user@example.com'
            },
            protocol: 'http',
            get: jest.fn().mockReturnValue('localhost:8000')
        };

        // add mock status and json function into our mock response before each test 
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should get user based on the posted email and throw an error if there is no user with such email', async () => {

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(null)
        }));

        await expect(forgetPassword(mockReq, mockRes, next)).rejects.toThrow('There is no user with this email address', 404);
    });

    it('get user based on the posted email, generate a random token, send the token back as an email and return a response status 200', async () => {

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(user)
        }));

        sendEmail.mockResolvedValueOnce(true);

        await forgetPassword(mockReq, mockRes, next);

        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should throw an error if the try block failed.', async () => {

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(user)
        }));

        sendEmail.mockRejectedValueOnce(new Error);

        await expect(forgetPassword(mockReq, mockRes, next)).rejects.toThrow('There was an error sending the email, try again later!');
    });
});

describe('resetPassword', () => {

    let mockReq

    let mockRes

    let next

    // new valid user
    const user = {
        password: "validPassword",
        passwordConfirm: 'passwordConfirm',
        passwordResetToken: 'passwordResetToken',
        passwordResetExpires: 'passwordResetExpires',
        save: jest.fn().mockReturnThis(),
    };

    beforeEach(() => {
        // create a cookies obj in the mock request before each test
        mockReq = {
            body: {
                password: "validPassword",
                passwordConfirm: 'passwordConfirm',
            },
            params: {
                token: 'token'
            }
        };

        // add mock status and json function into our mock response before each test 
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should get user based on token and throw an error if there is no user or token is invalid or expired', async () => {

        jest.spyOn(crypto, 'createHash').mockImplementationOnce(() => ({
            update: jest.fn().mockReturnThis(),
            digest: jest.fn().mockReturnValue('hashedToken')
        }))

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(null)
        }));

        await expect(resetPassword(mockReq, mockRes, next)).rejects.toThrow('Token is invalid or has expired!');
    });

    it('should get user based on token, accept new password if token has not expired and delete reset token', async () => {

        jest.spyOn(crypto, 'createHash').mockImplementationOnce(() => ({
            update: jest.fn().mockReturnThis(),
            digest: jest.fn().mockReturnValue('hashedToken')
        }))

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(user)
        }));

        await resetPassword(mockReq, mockRes, next);

        expect(mockRes.status).toHaveBeenCalledWith(200);

        expect(mockRes.json).toHaveBeenCalledWith({ 'message': 'success' })
    });

});