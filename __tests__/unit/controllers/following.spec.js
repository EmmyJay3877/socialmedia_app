const Following = require('../../../model/Following');
const User = require('../../../model/User');
const { createFollowing, deleteFollowing } = require('../../../controllers/followingController');

jest.mock('../../../model/Following');
jest.mock('../../../model/User');
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

describe('followingController', () => {

    let mockReq;

    let mockRes;

    beforeEach(() => {

        mockReq = {
            body: {
                followId: 1,
                followerId: 1,
                followingId: 1
            },
            user: {
                id: 1,
                username: 'john',
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

    describe('createFollowing', () => {

        it('should throw an error if req.body is empty', async () => {

            mockReq.body = {};

            await expect(createFollowing(mockReq, mockRes)).rejects.toThrow('Bad Request');
        });

        it('should throw an error if user tries to follow twice', async () => {
            const user = {
                "id": 1,
                followers: [1, 2]
            }

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(user)
            }));

            mockReq.user.id = '1'

            await expect(createFollowing(mockReq, mockRes)).rejects.toThrow("You can't follow a user twice");
        });

        it('should create a new following', async () => {

            const user = {
                "id": 1,
                followers: [2]
            }

            User.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(user)
            }));

            const newFollowing = {
                "followerId": 1, //user that followed
                "followingId": 1 // user that was followed
            }

            const user1Update = {
                modifiedCount: 1
            }

            const user2Update = {
                modifiedCount: 1
            }

            Following.create.mockResolvedValue(newFollowing);

            User.updateOne.mockResolvedValue(user1Update);

            User.updateOne.mockResolvedValue(user2Update);

            await createFollowing(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);

            expect(mockRes.json).toHaveBeenCalledWith({ "success": `${mockReq.user.username} just followed ${mockReq.body.followingId}` });
        });

    });

    describe('deleteFollowing', () => {

        it('should throw an error if req.body is empty', async () => {

            mockReq.params = {};

            await expect(deleteFollowing(mockReq, mockRes)).rejects.toThrow('Bad Request');
        });

        it('should throw an error if follow was not found', async () => {

            Following.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(null)
            }));

            await expect(deleteFollowing(mockReq, mockRes)).rejects.toThrow(`No Follow matches ID ${mockReq.params.id}`);
        });

        it('should delete a follow', async () => {

            const follow = { followingId: 1, deleteOne: jest.fn().mockReturnValue(true) };

            const user1Update = {
                modifiedCount: 1
            }

            const user2Update = {
                modifiedCount: 1
            }

            Following.findOne.mockImplementationOnce(() => ({
                exec: jest.fn().mockResolvedValue(follow)
            }));

            User.updateOne.mockResolvedValue(user1Update);

            User.updateOne.mockResolvedValue(user2Update);

            await deleteFollowing(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);

            expect(mockRes.json).toHaveBeenCalledWith({ "success": `${mockReq.user.username} just unfollowed ${mockReq.body.followingId}` });
        });
    });
});
