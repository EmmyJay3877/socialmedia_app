const Post = require('../../../model/Post');
const User = require('../../../model/User');
const Comment = require('../../../model/Comment');
const Like = require('../../../model/Like');
const Following = require('../../../model/Following');
const Redis = require('redis');
const {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    updatePassword
} = require('../../../controllers/userController');

jest.mock('../../../model/Post');
jest.mock('../../../model/User');
jest.mock('../../../model/Comment');
jest.mock('../../../model/Like');
jest.mock('../../../model/Following');
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

describe('userController', () => {
    let mockReq;

    let mockRes;

    beforeEach(() => {

        mockReq = {
            body: {
                username: 'john'
            },
            params: {
                id: 1,
                profile: 1
            },
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

    describe('getAllUsers', () => {

        it('should return a cache if we have any', async () => {

            const userCache = [
                { "user1": "first user" },
                { "user2": "2nd user" }
            ]

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(JSON.stringify(userCache));

            await getAllUsers(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalled();
        });

        it('should check if we have a cache, else find all users and throw an error if there are no users', async () => {

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            User.find.mockResolvedValue(null);

            await expect(getAllUsers(mockReq, mockRes)).rejects.toThrow('No users found');
        });

        it('should get all users, save in redis cache and send users with response', async () => {

            const users = [
                { "user1": "first user" },
                { "user2": "2nd user" }
            ]

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            User.find.mockResolvedValue(users);

            await getAllUsers(mockReq, mockRes);

            expect(redisClient.setEx).toHaveBeenCalled();

            expect(mockRes.json).toHaveBeenCalledWith(users);
        });
    });

    describe('getUser', () => {

        it('should throw an error if user ID is not present in our params', async () => {

            mockReq.params = {};

            await expect(getUser(mockReq, mockRes)).rejects.toThrow('User ID required.');
        });

        it('should return a cache if we have any', async () => {

            const userCache = [
                { "user1": "first user" }
            ]

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(JSON.stringify(userCache));

            await getUser(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalled()
        });

        it('should check if we have a cache, else find the user with ID and throw an error if user was not found', async () => {

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }));

            await expect(getUser(mockReq, mockRes)).rejects.toThrow(`No User matches ID ${mockReq.params.id}`);
        });

        it('should get the user, save in redis cache and send user with response', async () => {

            const user = { user1: "first user" }

            const redisClient = Redis.createClient()

            redisClient.get.mockReturnValue(null);

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(user)
            }));

            await getUser(mockReq, mockRes);

            expect(redisClient.setEx).toHaveBeenCalled();

            expect(mockRes.json).toHaveBeenCalledWith(user);
        });
    });

    describe('updateUser', () => {

        it('should throw an error if the user.id is invalid or user was not found.', async () => {

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }))

            await expect(updateUser(mockReq, mockRes)).rejects.toThrow('Unauthorized to perform this action');
        });

        it('should throw an error if username already exists', async () => {

            const foundUser = { id: 1 }

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(foundUser)
            }));

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(foundUser)
            }));

            await expect(updateUser(mockReq, mockRes)).rejects.toThrow('Username already exist');
        });

        it('should filter our request body, find and update user, and return status 200', async () => {

            const foundUser = { id: 1 }

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(foundUser)
            }));

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }))

            const filterObj = jest.fn();

            filterObj.mockReturnValue({ username: 'john' });

            User.findByIdAndUpdate.mockResolvedValue(foundUser);

            await updateUser(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);

            expect(mockRes.json).toHaveBeenCalledWith({ "success": `User updated successfully` })
        });
    });

    describe('updatePassword', () => {

        it('should throw an error if user wasnt found', async () => {

            User.findOne.mockImplementationOnce(() => ({
                select: jest.fn().mockImplementationOnce(() => ({
                    exec: jest.fn().mockResolvedValue(null)
                }))
            }));

            await expect(updatePassword(mockReq, mockRes)).rejects.toThrow('Password is incorrect');

        });

        it('should throw an error if the received password doesnt match the password in the database', async () => {

            const user = { id: 1, comparePassword: jest.fn().mockReturnValue(false) };

            User.findOne.mockImplementationOnce(() => ({
                select: jest.fn().mockImplementationOnce(() => ({
                    exec: jest.fn().mockResolvedValue(user)
                }))
            }));

            await expect(updatePassword(mockReq, mockRes)).rejects.toThrow('Password is incorrect');
        });

        it('should save password with status code 200', async () => {

            const user = { id: 1, comparePassword: jest.fn().mockReturnValue(true), save: jest.fn() };

            User.findOne.mockImplementationOnce(() => ({
                select: jest.fn().mockImplementationOnce(() => ({
                    exec: jest.fn().mockResolvedValue(user)
                }))
            }));

            await updatePassword(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);

            expect(mockRes.json).toHaveBeenCalledWith({ "message": "success" });
        });
    });

    describe('deleteUser', () => {

        it('should throw an error if user isnt authorized', async () => {

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }));

            await expect(deleteUser(mockReq, mockRes)).rejects.toThrow('User not found');
        });

        it('should find user, delete user posts, comments, likes, following and cache.', async () => {

            const user = { id: 1, posts: [], deleteOne: jest.fn().mockResolvedValue(1) };
            const userComments = [];
            const userLikes = [];
            const userFollowing = [];

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(user)
            }));

            Post.deleteMany.mockResolvedValue(1);

            Comment.find.mockResolvedValue(userComments);
            Comment.deleteMany.mockResolvedValue(1);

            Like.find.mockResolvedValue(userLikes);
            Like.deleteMany.mockResolvedValue(1);

            Following.find.mockResolvedValue(userFollowing);
            Following.deleteMany.mockResolvedValue(1);

            const redisClient = Redis.createClient();

            redisClient.exists.mockResolvedValue(1);

            redisClient.del.mockResolvedValue(true);

            await deleteUser(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);

            expect(mockRes.json).toHaveBeenCalledWith({ "success": `User with ID ${mockReq.user.id} has been deleted.` })
        });
    });
});
