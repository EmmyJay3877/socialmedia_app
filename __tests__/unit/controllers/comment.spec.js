const Comment = require('../../../model/Comment');
const Post = require('../../../model/Post');
const Redis = require('redis');
const { createComment, getComment, getComments, getCommentReplies, deleteComment } = require('../../../controllers/commentController');

jest.mock('../../../model/Post');
jest.mock('../../../model/Comment');
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


describe('commentController', () => {
    let mockReq;

    let mockRes;

    beforeEach(() => {

        mockReq = {
            body: {
                postId: 1,
                text: 'text',
                profileId: 1,
                commentId: 1,
            },
            params: {
                id: 1,
                profile: 1
            },
            url: '',
            user: {
                id: 1,
                username: 'john',
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

    describe('createComment', () => {

        it('should throw an error if req.body is empyty', async () => {
            mockReq.body = {};

            await expect(createComment(mockReq, mockRes)).rejects.toThrow('Bad Request');
        });

        it('should create a new reply', async () => {
            mockReq.url = '/replies';

            const newReply = {
                "postId": 1,
                "text": 'text',
                "profileId": 1
            }

            const commentUpdate = {
                matchedCount: 1,
                modifiedCount: 1
            };

            Comment.create.mockResolvedValue(newReply);

            Comment.updateOne.mockResolvedValue(commentUpdate);

            await createComment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);

            expect(mockRes.json).toHaveBeenCalledWith({ "success": `${mockReq.user.username} just replied a comment` })
        });

        it('should create a new comment', async () => {

            const newComment = {
                "postId": 1,
                "text": 'text',
                "profileId": 1
            }

            const postUpdate = {
                matchedCount: 1,
                modifiedCount: 1
            };

            Comment.create.mockResolvedValue(newComment);

            Post.updateOne.mockResolvedValue(postUpdate);

            await createComment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);

            expect(mockRes.json).toHaveBeenCalledWith({ "success": `${mockReq.user.username} just commented on a post` })
        });
    });
    describe('getComments', () => {

        it('should return all caches if we have any', async () => {

            const jsonComments = [
                { "comment1": "first comment" },
                { "comment2": "2nd comment" }
            ]

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(JSON.stringify(jsonComments));

            await getComments(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalled();
        });

        it('should check if we have a cache, else find all comments and throw an error if there are no comments', async () => {

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Comment.find.mockResolvedValue(null);

            await expect(getComments(mockReq, mockRes)).rejects.toThrow('Not Found');
        });

        it('should get all comments, save in redis cache and send comments with response', async () => {

            const comments = [
                { comment1: "first comment" },
                { comment2: "2nd comment" }
            ]

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Comment.find.mockResolvedValue(comments);

            await getComments(mockReq, mockRes);

            expect(redisClient.setEx).toHaveBeenCalled();

            expect(mockRes.json).toHaveBeenCalledWith(comments);
        });

    });
    describe('getComment', () => {

        it('should throw an error if comment ID is not present in our params', async () => {

            mockReq.params = {};

            await expect(getComment(mockReq, mockRes)).rejects.toThrow('Bad Request');
        });

        it('should return a cache if we have any', async () => {

            const jsonComment = [
                { "comment1": "first comment" }
            ]

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(JSON.stringify(jsonComment));

            await getComment(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalled()
        });

        it('should check if we have a cache, else find the comment with ID and throw an error if comment was not found', async () => {

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Comment.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }));

            await expect(getComment(mockReq, mockRes)).rejects.toThrow(`No comment with ID ${mockReq.params.id}`);
        });

        it('should get the comment, save in redis cache and send comment with response', async () => {

            const comment = { comment1: "first comment" }

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Comment.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(comment)
            }));

            await getComment(mockReq, mockRes);

            expect(redisClient.setEx).toHaveBeenCalled();

            expect(mockRes.json).toHaveBeenCalledWith(comment);
        });

    });
    describe('getCommentReplies', () => {

        it('should throw an error if ID is not present in our params', async () => {

            mockReq.params = {};

            await expect(getCommentReplies(mockReq, mockRes)).rejects.toThrow('Bad Request');
        });

        it('should return all caches if we have any', async () => {

            const jsonReplies = [
                { "reply1": "first reply" },
                { "reply2": "2nd reply" }
            ]

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(JSON.stringify(jsonReplies));

            await getCommentReplies(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalled()
        });

        it('should check if we have a cache, else find the comment in our DB and throw an error if comment was not found', async () => {

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Comment.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }));

            await expect(getCommentReplies(mockReq, mockRes)).rejects.toThrow(`No comment with ID ${mockReq.params.id}`);
        });

        it('should throw an error if comment has no reply', async () => {

            const comment = { _id: 1, post1: "first post", replies: [] }

            const replies = []

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Comment.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(comment)
            }));

            Comment.find.mockResolvedValue(replies);

            await expect(getCommentReplies(mockReq, mockRes)).rejects.toThrow(`Comment with ID ${comment._id} has no reply.`)
        });

        it('should get the commentReplies, save it in redis and send replies with response', async () => {
            const replies = [
                { "reply1": "first comment" },
                { "reply2": "2nd comment" }
            ]

            const comment = { _id: 1, post1: "first post", replies: replies }

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Comment.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(comment)
            }));

            Comment.find.mockResolvedValue(replies);

            await getCommentReplies(mockReq, mockRes);

            expect(redisClient.setEx).toHaveBeenCalled();

            expect(mockRes.json).toHaveBeenCalledWith(replies);
        });

    });
    describe('deleteComment', () => {

        it('should throw an error if req.body is empty', async () => {

            mockReq.params = {};

            await expect(deleteComment(mockReq, mockRes)).rejects.toThrow('Bad Request');
        });


        it('should throw an error if comment could not be found', async () => {

            Comment.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }));

            await expect(deleteComment(mockReq, mockRes)).rejects.toThrow(`No Comment matches ID ${mockReq.body.commentId}`);
        });

        it('should delete a reply', async () => {

            mockReq.url = '/replies'

            const comment = { _id: 1, deleteOne: jest.fn().mockReturnValue(1) }

            Comment.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(comment)
            }));

            await deleteComment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);

            expect(mockRes.json).toHaveBeenCalledWith({ 'success': 'Reply deleted sucessfully' })
        });

        it('should delete a comment', async () => {

            const comment = { _id: 1, deleteOne: jest.fn().mockReturnValue(1) }

            Comment.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(comment)
            }));

            await deleteComment(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);

            expect(mockRes.json).toHaveBeenCalledWith({ 'success': 'Comment deleted sucessfully' })
        });

    });
});

