const supertest = require('supertest');
const User = require('../../../model/User');
const jwt = require('jsonwebtoken');

const app = require('../../../main');
const { dropDB, connectDB } = require('../../../.jest/mockdbConn');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}));

jest.mock('redis', (() => {
    const redisClient = {
        connect: jest.fn(),
        on: jest.fn().mockReturnValue('Connected to mockedRedis...'),
        get: jest.fn(),
        setEx: jest.fn().mockReturnValue(true),
        exists: jest.fn(),
        del: jest.fn()
    }

    return {
        createClient: jest.fn().mockReturnValue(redisClient)
    }
}));

jest.mock('./../../../config/dbConn', (() => jest.fn().mockReturnValue(true)));

jest.mock('../../../utils/email', (() => jest.fn().mockReturnValue(true)));

describe('testing logout endpoint(/logout)', () => {
    let mockData;
    let mockUser;
    let user;
    let server;

    beforeAll(async () => {
        await connectDB();
        server = app.listen(8001, () => console.log(`mockServer listening on port 8001`))
    });

    beforeEach(async () => {
        jest.resetModules();
        mockData = require('../../../.jest/mockData');
        mockUser = mockData.mockUser;
        user = await User.create(mockUser);
    });

    afterEach(async () => {
        await User.deleteMany();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await dropDB();
        server.close();
    });

    it('should send reset password link to the provided email.', async () => {

        const response = await supertest(app)
            .post('/forgetPassword')
            .send({ "email": mockUser.email })

        expect(response.status).toBe(200);
        expect(response.body.message).not.toBeNull();
    });

    it('should reset user password.', async () => {

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const resetToken = await user.createPswrdResetToken();

        await user.save({ validateBeforeSave: false });

        const response = await supertest(app)
            .put(`/resetPassword/${resetToken}`)
            .set('Authorization', 'Bearer valid-token')
            .send({
                "password": mockUser.password,
                "passwordConfirm": mockUser.passwordConfirm,
            })

        expect(response.status).toBe(200);
        expect(response.body.message).not.toBeNull();
    });
});