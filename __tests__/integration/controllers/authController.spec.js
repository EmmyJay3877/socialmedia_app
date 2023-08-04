const User = require('../../../model/User');
const supertest = require('supertest');

const app = require('../../../main');
const { dropDB, connectDB } = require('../../../.jest/mockdbConn');

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

describe('testing logout endpoint(/logout)', () => {
    let mockData;
    let mockUser;
    let user;
    let server;

    beforeAll(async () => {
        await connectDB();
        server = app.listen(8001, () => console.log(`mockServer listening on port 8001`))
    });

    beforeEach(async () => {
        jest.resetModules();
        mockData = require('../../../.jest/mockData');
        mockUser = mockData.mockUser;
    });

    afterEach(async () => {
        await User.deleteMany();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await dropDB();
        server.close();
    });

    it('should login a user', async () => {

        user = await User.create(mockUser);

        const response = await supertest(app)
            .post('/login')
            .send({
                "username": mockUser.username,
                "password": mockUser.password,
            })

        expect(response.status).toBe(200);
        expect(response.body.accessToken).toBeDefined();
    });
});