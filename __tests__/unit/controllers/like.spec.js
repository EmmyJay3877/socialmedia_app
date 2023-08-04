const Like = require('../../../model/Like');
const Post = require('../../../model/Post');
const Comment = require('../../../model/Comment');
const { createLike, deleteLike } = require('../../../controllers/likeController');

jest.mock('../../../model/Post');
jest.mock('../../../model/Comment');
jest.mock('../../../model/Like');


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

        it('should create a new like for a reply', async () => {

            const like = {
                "postId": 1,
                "profileId": 1
            }

            const replyUpdate = {
                matchedCount: 1,
                modifiedCount: 1
            }

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

            const commentUpdate = {
                matchedCount: 1,
                modifiedCount: 1
            }

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

            const postUpdate = {
                matchedCount: 1,
                modifiedCount: 1
            }

            Like.create.mockResolvedValueOnce(like);

            Post.updateOne.mockResolvedValueOnce(postUpdate);

            await createLike(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);

            expect(mockRes.json).toHaveBeenCalledWith({ "success": `${mockReq.user.username} just liked a post` });

        });
    });

    describe('deleteLike', () => {

        it('should throw an error if req.body is empty', async () => {
            mockReq.body = {};

            await expect(deleteLike(mockReq, mockRes)).rejects.toThrow('Bad Request');
        });

        it('should throw an error if like was not found', async () => {

            Like.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }));

            await expect(deleteLike(mockReq, mockRes)).rejects.toThrow(`No Like matches ID ${mockReq.body.likeId}`);
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

            expect(mockRes.json).toHaveBeenCalledWith({ 'success': 'Like deleted sucessfully' });
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

            expect(mockRes.json).toHaveBeenCalledWith({ 'success': 'Like deleted sucessfully' });
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

            expect(mockRes.json).toHaveBeenCalledWith({ 'success': 'Like deleted sucessfully' });
        });
    });
});