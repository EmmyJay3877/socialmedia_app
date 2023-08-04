const jwt = require('jsonwebtoken');
const User = require('../../../model/User');
const Post = require('../../../model/Post');
const supertest = require('supertest');

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

describe('testing verifyJWT middleware and protected endpoint(/posts)', () => {
    let mockData;
    let mockUser;
    let mockPost;
    let user;
    let server

    beforeAll(async () => {
        await connectDB();
        server = app.listen(8001, () => console.log(`mockServer listening on port 8001`))
    });

    beforeEach(async () => {
        jest.resetModules();
        mockData = require('../../../.jest/mockData');
        mockPost = mockData.mockPost;
        mockUser = mockData.mockUser;
        user = await User.create(mockUser);
    });

    afterEach(async () => {
        await Post.deleteMany();
        await User.deleteMany();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await dropDB();
        server.close();
    });


    it('should authorize a valid user to get posts', async () => {

        await Post.create(mockPost);

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .get('/posts')
            .set('Authorization', 'Bearer valid-token')

        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('should create a post', async () => {

        mockPost.text = 'testPost2';

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .post('/posts')
            .set('Authorization', 'Bearer valid-token')
            .send(mockPost)

        expect(response.status).toBe(201);
        expect(response.body.success).not.toBeNull();
    });

    it('should delete a post', async () => {

        mockPost.text = 'testPost3';

        const post = await Post.create(mockPost);

        const id = post._id

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .delete(`/posts/${id}`)
            .set('Authorization', 'Bearer valid-token')

        expect(response.status).toBe(200);
        expect(response.body.success).not.toBeNull();
    });
});