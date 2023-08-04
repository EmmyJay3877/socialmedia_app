const jwt = require('jsonwebtoken');
const User = require('../../../model/User');
const Post = require('../../../model/Post');
const Comment = require('../../../model/Comment');
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

describe('testing verifyJWT middleware and protected endpoint(/comments)', () => {
    let mockData;
    let mockUser;
    let mockPost;
    let mockComment;
    let user;
    let post;
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
        user = await User.create(mockUser);
        post = await Post.create(mockPost);
    });

    afterEach(async () => {
        await Post.deleteMany();
        await User.deleteMany();
        await Comment.deleteMany();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await dropDB();
        server.close();
    });

    it('should create comment', async () => {

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .post('/comments')
            .set('Authorization', 'Bearer valid-token')
            .send({
                'postId': post.id,
                "text": mockComment.text,
            })

        expect(response.status).toBe(201);
        expect(response.body.success).not.toBeNull();
    });

    it('should create reply', async () => {

        const comment = await Comment.create(mockComment);

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .post('/comments/replies')
            .set('Authorization', 'Bearer valid-token')
            .send({
                'postId': comment.id,
                "text": 'mockreply',
            })

        expect(response.status).toBe(201);
        expect(response.body.success).not.toBeNull();
    });

    it('should authorize a valid user to get comments', async () => {

        await Comment.create(mockComment);

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .get('/comments')
            .set('Authorization', 'Bearer valid-token')

        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get a comment', async () => {

        const comment = await Comment.create(mockComment);

        const id = comment._id;

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .get(`/comments/${id}`)
            .set('Authorization', 'Bearer valid-token')

        expect(mongoose.Types.ObjectId.isValid(response.body._id)).toBeTruthy();
    });

    it('should get comment replies', async () => {

        const comment = await Comment.create(mockComment);

        const id = comment._id;

        mockComment.postId = id;

        await Comment.create(mockComment);

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .get(`/comments/replies/${id}`)
            .set('Authorization', 'Bearer valid-token')

        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('should delete a comment', async () => {

        mockComment.postId = post.id;

        const comment = await Comment.create(mockComment);

        const id = comment.id;

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .delete(`/comments/${id}`)
            .set('Authorization', 'Bearer valid-token')

        expect(response.status).toBe(200);
        expect(response.body.success).not.toBeNull();
    });

    it('should delete a reply', async () => {

        const comment = await Comment.create(mockComment);

        mockComment.postId = comment.id

        const reply = await Comment.create(mockComment)

        const id = reply._id;

        jwt.verify.mockReturnValueOnce({ username: user.username });

        const response = await supertest(app)
            .delete(`/comments/replies/${id}`)
            .set('Authorization', 'Bearer valid-token')

        expect(response.status).toBe(200);
        expect(response.body.success).not.toBeNull();
    });
});