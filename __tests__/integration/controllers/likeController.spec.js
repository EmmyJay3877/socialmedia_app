const jwt = require('jsonwebtoken');
const User = require('../../../model/User');
const Post = require('../../../model/Post');
const Comment = require('../../../model/Comment');
const Like = require('../../../model/Like');
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

describe('testing verifyJWT middleware and protected endpoint(/likes)', () => {
    let mockData;
    let mockUser;
    let mockPost;
    let mockComment;
    let mockLike;
    let user;
    let post;
    let comment;
    let server;

    beforeAll(async () => {
        await connectDB();
        server = app.listen(8001, () => console.log(`mockServer listening on port 8001`))
    });

    beforeEach(async () => {
        jest.resetModules();
        mockData = require('../../../.jest/mockData');
        mockPost = mockData.mockPost;
        mockUser = mockData.mockUser;
        mockComment = mockData.mockComment;
        mockLike = mockData.mockLike;
        user = await User.create(mockUser);
        post = await Post.create(mockPost);
        comment = await Comment.create(mockComment);
    });

    afterEach(async () => {
        await Post.deleteMany();
        await User.deleteMany();
        await Comment.deleteMany();
        await Like.deleteMany();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await dropDB();
        server.close();
    });

    it('should create like for a post', async () => {

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .post('/likes')
            .set('Authorization', 'Bearer valid-token')
            .send({
                'postId': post.id,
            })

        expect(response.status).toBe(201);
        expect(response.body.success).not.toBeNull();
    });

    it('should create like for a comment or reply', async () => {

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .post('/comments/comment/likes')
            .set('Authorization', 'Bearer valid-token')
            .send({
                'postId': comment.id,
            })

        expect(response.status).toBe(201);
        expect(response.body.success).not.toBeNull();
    });

    it('should unlike a post', async () => {

        mockLike.postId = post.id;

        const like = await Like.create(mockLike);

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .delete(`/likes`)
            .set('Authorization', 'Bearer valid-token')
            .send({
                "likeId": like.id,
                "postId": post.id,
            })

        expect(response.status).toBe(200);
        expect(response.body.success).not.toBeNull();
    });

    it('should unlike a comment or reply', async () => {

        mockLike.postId = comment.id;

        const like = await Like.create(mockLike);

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .delete(`/comments/comment/likes`)
            .set('Authorization', 'Bearer valid-token')
            .send({
                "likeId": like.id,
                "postId": comment.id,
            })

        expect(response.status).toBe(200);
        expect(response.body.success).not.toBeNull();
    });
});