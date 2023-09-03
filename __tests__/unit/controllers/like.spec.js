const Like = require('../../../model/Like');
const Post = require('../../../model/Post');
const Comment = require('../../../model/Comment');
const Redis = require('redis');
const { createLike, deleteLike } = require('../../../controllers/likeController');

jest.mock('../../../model/Post');
jest.mock('../../../model/Comment');
jest.mock('../../../model/Like');
jest.mock('redis', (() => {
    const redisClient = {
        connect: jest.fn(),
        get: jest.fn(),
        setEx: jest.fn().mockReturnValue(true),
        exists: jest.fn(),
        del: jest.fn()
    }

    return {
        createClient: jest.fn().mockReturnValue(redisClient)
    }
}))


describe('likeController', () => {

    let mockReq;

    let mockRes;

    beforeEach(() => {

        mockReq = {
            body: {
                postId: 1,
                profileId: 1,
                likeId: 1
            },
            url: '',
            user: {
                id: 1,
                username: 'John',
            },
            params: {
                id: 1
            }
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createLike', () => {

        it('should throw an error if req.body is empty', async () => {
            mockReq.body = {};

            await expect(createLike(mockReq, mockRes)).rejects.toThrow('Like is empty');

        });

        it('should throw an error if user tries to like twice', async () => {
            const post = {
                "postId": 1,
                likes: [1, 2]
            }

            Post.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(post)
            }));

            mockReq.user.id = '1'

            await expect(createLike(mockReq, mockRes)).rejects.toThrow("You can't like a post twice");
        });

        it('should create a new like for a reply', async () => {

            const like = {
                "postId": 1,
                "profileId": 2
            }

            const reply = {
                "postId": 1,
                likes: [2, 3]
            }

            const replyUpdate = {
                matchedCount: 1,
                modifiedCount: 1
            }

            Comment.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(reply)
            }));

            mockReq.user.id = '1'

            mockReq.url = '/reply/likes';

            Like.create.mockResolvedValueOnce(like);

            Comment.updateOne.mockResolvedValueOnce(replyUpdate);

            await createLike(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);

            expect(mockRes.json).toHaveBeenCalledWith({ "success": `${mockReq.user.username} just liked a reply` })

        });

        it('should create a new like for a comment', async () => {

            const like = {
                "postId": 1,
                "profileId": 1
            }

            const comment = {
                "postId": 1,
                likes: [2, 3]
            }

            const commentUpdate = {
                matchedCount: 1,
                modifiedCount: 1
            }

            Comment.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(comment)
            }));

            mockReq.user.id = '1'

            mockReq.url = '/comment/likes';

            Like.create.mockResolvedValueOnce(like);

            Comment.updateOne.mockResolvedValueOnce(commentUpdate);

            await createLike(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);

            expect(mockRes.json).toHaveBeenCalledWith({ "success": `${mockReq.user.username} just liked a comment` })

        });

        it('should create a new like for a post', async () => {

            const like = {
                "postId": 1,
                "profileId": 1
            }

            const post = {
                "postId": 1,
                likes: [2, 3]
            }

            const postUpdate = {
                matchedCount: 1,
                modifiedCount: 1
            }

            Post.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(post)
            }));

            Like.create.mockResolvedValueOnce(like);

            Post.updateOne.mockResolvedValueOnce(postUpdate);

            await createLike(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);

            expect(mockRes.json).toHaveBeenCalledWith({ "success": `${mockReq.user.username} just liked a post` });

        });
    });

    describe('deleteLike', () => {

        it('should throw an error if req.params.id is empty', async () => {
            mockReq.params = {};

            await expect(deleteLike(mockReq, mockRes)).rejects.toThrow('Bad Request');
        });

        it('should throw an error if like was not found', async () => {

            Like.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }));

            await expect(deleteLike(mockReq, mockRes)).rejects.toThrow(`Like was not found`);
        });

        it('should delete a reply"s like', async () => {

            mockReq.url = '/reply/likes';

            const like = {
                "postId": 1,
                "profileId": 1,
                deleteOne: jest.fn().mockReturnValue(true)
            }

            const replyUpdate = {
                matchedCount: 1,
                modifiedCount: 1
            }

            Like.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(like)
            }));

            like.deleteOne();

            Comment.updateOne.mockResolvedValue(replyUpdate);

            await deleteLike(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);

            expect(mockRes.json).toHaveBeenCalledWith({ 'success': `${mockReq.user.username} just unliked a reply` });
        });

        it('should delete a comment"s like', async () => {

            mockReq.url = '/comment/likes';

            const like = {
                "postId": 1,
                "profileId": 1,
                deleteOne: jest.fn().mockReturnValue(true)
            }

            const commentUpdate = {
                matchedCount: 1,
                modifiedCount: 1
            }

            Like.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(like)
            }));

            like.deleteOne();

            Comment.updateOne.mockResolvedValue(commentUpdate);

            await deleteLike(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);

            expect(mockRes.json).toHaveBeenCalledWith({ 'success': `${mockReq.user.username} just unliked a comment` });
        });

        it('should delete a post"s like', async () => {

            const like = {
                "postId": 1,
                "profileId": 1,
                deleteOne: jest.fn().mockReturnValue(true)
            }

            const postUpdate = {
                matchedCount: 1,
                modifiedCount: 1
            }

            Like.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(like)
            }));

            like.deleteOne();

            Post.updateOne.mockResolvedValue(postUpdate);

            await deleteLike(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);

            expect(mockRes.json).toHaveBeenCalledWith({ 'success': `${mockReq.user.username} just unliked a post` });
        });
    });
});