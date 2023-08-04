const Post = require('../../../model/Post');
const User = require('../../../model/User');
const Comment = require('../../../model/Comment');
const Like = require('../../../model/Like');
const Redis = require('redis');
const { createPost, getAllPosts, getPost, getPostComments, getUserPosts, deletePost } = require('../../../controllers/postController');

jest.mock('../../../model/Post');
jest.mock('../../../model/User');
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


describe('postController', () => {

    let mockReq;

    let mockRes;

    beforeEach(() => {

        mockReq = {
            body: {
                profile: 'profile',
                text: 'text',
                image: 'image'
            },
            params: {
                id: 1,
                profile: 1
            },
            user: {
                _id: 1,
                username: 'john'
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

    describe('createPost', () => {

        const newPost = {
            profile: 'profile',
            text: 'text',
            image: 'image'
        };

        const userUpdate = {
            matchedCount: 1,
            modifiedCount: 1
        }

        it('should throw an error if post is empty', async () => {

            mockReq.body = {};

            await expect(createPost(mockReq, mockRes)).rejects.toThrow('Post is empty');

        });

        it('should create a new post, update the post array in the user document and send status 201.', async () => {

            Post.create.mockResolvedValueOnce(newPost);

            User.updateOne.mockResolvedValueOnce(userUpdate);

            await createPost(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);

            expect(mockRes.json).toHaveBeenCalledWith({ "success": `${mockReq.user.username} just made a post` });

        });
    });

    describe('getAllPosts', () => {

        it('should return all caches if we have any', async () => {

            const jsonPost = [
                { "post1": "first post" },
                { "post2": "2nd post" }
            ]

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(JSON.stringify(jsonPost));

            await getAllPosts(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalled();
        });

        it('should check if we have a cache, else find all post and throw an error if there are no posts', async () => {

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Post.find.mockResolvedValue(null);

            await expect(getAllPosts(mockReq, mockRes)).rejects.toThrow('No posts found.');

        });

        it('should get all posts, save in redis cache and send posts with response', async () => {

            const posts = [
                { post1: "first post" },
                { post2: "2nd post" }
            ]

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Post.find.mockResolvedValue(posts);

            await getAllPosts(mockReq, mockRes);

            expect(redisClient.setEx).toHaveBeenCalled();

            expect(mockRes.json).toHaveBeenCalledWith(posts);
        });
    });

    describe('getPost', () => {

        it('should throw an error if post ID is not present in our params', async () => {

            mockReq.params = {};

            await expect(getPost(mockReq, mockRes)).rejects.toThrow('Post ID is required');
        });

        it('should return a cache if we have any', async () => {

            const jsonPost = [
                { "post1": "first post" }
            ]

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(JSON.stringify(jsonPost));

            await getPost(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalled()
        });

        it('should check if we have a cache, else find the post with ID and throw an error if post was not found', async () => {

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Post.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }));

            await expect(getPost(mockReq, mockRes)).rejects.toThrow(`No post matches ID ${mockReq.params.id}`);

        });

        it('should get the post, save in redis cache and send post with response', async () => {

            const post = { post1: "first post" }

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Post.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(post)
            }));

            await getPost(mockReq, mockRes);

            expect(redisClient.setEx).toHaveBeenCalled();

            expect(mockRes.json).toHaveBeenCalledWith(post);
        });
    });

    describe('getPostComments', () => {

        it('should throw an error if ID is not present in our params', async () => {

            mockReq.params = {};

            await expect(getPostComments(mockReq, mockRes)).rejects.toThrow('Post id is required');
        });

        it('should return all caches if we have any', async () => {

            const jsonComments = [
                { "comment1": "first comment" },
                { "comment2": "2nd comment" }
            ]

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(JSON.stringify(jsonComments));

            await getPostComments(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalled()
        });

        it('should check if we have a cache, else find the post in our DB and throw an error if post was not found', async () => {

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Post.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }));

            await expect(getPostComments(mockReq, mockRes)).rejects.toThrow('Not found');

        });

        it('should throw an error if post was found and does not have any comment.', async () => {
            const post = { post1: "first post", comments: [] }

            const comments = []

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Post.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(post)
            }));

            Comment.find.mockResolvedValue(comments);

            await expect(getPostComments(mockReq, mockRes)).rejects.toThrow(`Post with ID ${mockReq.params.id} has no comment.`)
        });

        it('should get the postsComment, save it in redis and send comments with response', async () => {
            const comments = [
                { "comment1": "first comment" },
                { "comment2": "2nd comment" }
            ]

            const post = { post1: "first post", comments: comments }

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Post.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(post)
            }));

            Comment.find.mockResolvedValue(comments);

            await getPostComments(mockReq, mockRes);

            expect(redisClient.setEx).toHaveBeenCalled();

            expect(mockRes.json).toHaveBeenCalledWith(comments);
        });

    });

    describe('getUserPosts', () => {

        it('should throw an error if user ID is not present in our params', async () => {

            mockReq.user = {};

            await expect(getUserPosts(mockReq, mockRes)).rejects.toThrow('User ID required.');
        });

        it('should find the user in our DB and throw an error if user was not found', async () => {

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }));

            await expect(getUserPosts(mockReq, mockRes)).rejects.toThrow('Unauthorized');

        });

        it('should return all caches if we have any', async () => {

            const jsonPosts = [
                { "post1": "first post" },
                { "post2": "2nd post" }
            ]

            const user = { id: 1 }

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(user)
            }));

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(JSON.stringify(jsonPosts));

            await getUserPosts(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalled()
        });

        it('should throw an error if user was found and does not have any post.', async () => {
            const user = { id: 1, posts: [] }

            const posts = []

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(user)
            }));

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Post.find.mockResolvedValue(posts);

            await expect(getUserPosts(mockReq, mockRes)).rejects.toThrow(`User with ID ${mockReq.params.profile} has no post.`)

        });

        it('should get the userPosts, save it in redis and send posts with response', async () => {
            const posts = [
                { "post1": "first post" },
                { "post2": "2nd post" }
            ]

            const user = { id: 1, post: posts }

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(user)
            }));

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            Post.find.mockResolvedValue(posts);

            await getUserPosts(mockReq, mockRes);

            expect(redisClient.setEx).toHaveBeenCalled();

            expect(mockRes.json).toHaveBeenCalledWith(posts);
        });
    });

    describe('deletePost', () => {

        it('should throw an error if post ID is not present in our params', async () => {

            mockReq.params = {};

            await expect(deletePost(mockReq, mockRes)).rejects.toThrow('Post id is required');
        });

        it('should find the post with ID and throw an error if post was not found', async () => {

            Post.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }));

            await expect(deletePost(mockReq, mockRes)).rejects.toThrow(`No Post matches ID ${mockReq.params.id}`);
        });

        it('should delete the comments, likes of the post and the post itself, check if the post has a cache and also delete the cache.', async () => {
            const post = { postId: 1, deleteOne: jest.fn() }
            const comments = []
            const likes = []

            Post.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(post)
            }));

            Comment.find.mockResolvedValue(comments);

            Like.find.mockResolvedValue(likes);

            post.deleteOne.mockResolvedValue(true);

            const redisClient = Redis.createClient()

            redisClient.exists.mockReturnValue(1);

            await deletePost(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);

            expect(mockRes.json).toHaveBeenCalledWith({ "success": `Post with ID ${mockReq.params.id} has been deleted.` })
        });

    });
});
