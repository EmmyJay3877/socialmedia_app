const supertest = require('supertest');
const nodemailer = require('../../../utils/nodemailer');
const app = require('../../../main');
const { dropDB, connectDB } = require('../../../.jest/mockdbConn');

jest.mock('../../../utils/nodemailer', () => ({
    registrationMail: jest.fn()
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

describe('testing logout endpoint(/logout)', () => {
    let mockData;
    let mockUser;
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
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await dropDB();
        server.close();
    });

    it('should register a user', async () => {

        let info = {
            messageId: 1
        }

        nodemailer.registrationMail.mockReturnValueOnce(info);

        const response = await supertest(app)
            .post('/register')
            .send(mockUser)

        expect(response.status).toBe(201);
        expect(response.body.accessToken).toBeDefined();
    });
});