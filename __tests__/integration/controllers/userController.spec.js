const jwt = require('jsonwebtoken');
const User = require('../../../model/User');
const supertest = require('supertest');
const mongoose = require('mongoose');

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

describe('testing verifyJWT middleware and protected endpoint(/users)', () => {
    let mockData;
    let mockUser;
    let user;
    let server

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


    it('should get users', async () => {

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .get('/users')
            .set('Authorization', 'Bearer valid-token')

        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get a user', async () => {

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const id = user._id;

        const response = await supertest(app)
            .get(`/users/${id}`)
            .set('Authorization', 'Bearer valid-token')

        expect(mongoose.Types.ObjectId.isValid(response.body._id)).toBeTruthy();
    });

    it('should update a username', async () => {

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .put(`/users/updateMe`)
            .set('Authorization', 'Bearer valid-token')
            .send({ 'username': 'john' })

        expect(response.status).toBe(200);
        expect(response.body.success).not.toBeNull();
    });

    it('should update a password', async () => {

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .put(`/users/updateMyPassword`)
            .set('Authorization', 'Bearer valid-token')
            .send({
                'passwordCurrent': 'testPassword',
                "password": 'testPassword_',
                "passwordConfirm": 'testPassword_',
            })

        expect(response.status).toBe(200);
        expect(response.body.success).not.toBeNull();
    });

    it('should delete a user', async () => {

        // create new test admin
        mockUser.username = 'testAdmin';
        mockUser.email = 'testAdmin@gmail.com';
        mockUser.role = 'admin';

        const mockAdmin = await User.create(mockUser);

        jwt.verify.mockReturnValueOnce({ username: mockAdmin.username });

        // create new test user
        mockUser.username = 'testusername2';
        mockUser.email = 'testemail@vmail.com';
        mockUser.role = 'user';
        const mockUser2 = await User.create(mockUser);

        const response = await supertest(app)
            .delete(`/users/${mockUser2._id}`)
            .set('Authorization', 'Bearer valid-token')

        expect(response.status).toBe(200);
        expect(response.body.success).not.toBeNull();
    });
});