const jwt = require('jsonwebtoken');
const User = require('../../../model/User');
const supertest = require('supertest');

const app = require('../../../main');
const { dropDB, connectDB } = require('../../../.jest/mockdbConn');
const Following = require('../../../model/Following');

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

describe('testing verifyJWT middleware and protected endpoint(/following)', () => {
    let mockData;
    let mockUser;
    let mockFollowing;
    let user1;
    let user2;
    let server;

    beforeAll(async () => {
        await connectDB();
        server = app.listen(8001, () => console.log(`mockServer listening on port 8001`))
    });

    beforeEach(async () => {
        jest.resetModules();
        mockData = require('../../../.jest/mockData');
        mockUser = mockData.mockUser;
        mockFollowing = mockData.mockFollowing;
        user1 = await User.create(mockUser);
        mockUser.username = 'testuser2';
        mockUser.email = 'testuser2@vmail.com';
        user2 = await User.create(mockUser);
    });

    afterEach(async () => {
        await User.deleteMany();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await dropDB();
        server.close();
    });

    it('should follow a user', async () => {
        mockFollowing.followingId = user2.id;

        jwt.verify.mockReturnValueOnce({ username: user1.username });

        const response = await supertest(app)
            .post('/following')
            .set('Authorization', 'Bearer valid-token')
            .send(mockFollowing)

        expect(response.status).toBe(201);
        expect(response.body.success).not.toBeNull();
    });

    it('should unfollow a user', async () => {

        mockFollowing.followerId = user1.id;
        mockFollowing.followingId = user2.id;

        await Following.create(mockFollowing);

        jwt.verify.mockReturnValueOnce({ username: user1.username });

        const response = await supertest(app)
            .delete(`/following/${user2.id}`)
            .set('Authorization', 'Bearer valid-token')

        expect(response.status).toBe(200);
        expect(response.body.success).not.toBeNull();
    });
});