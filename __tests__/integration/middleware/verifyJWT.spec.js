const jwt = require('jsonwebtoken');
const User = require('./../../../model/User');
const supertest = require('supertest');

const app = require('../../../main');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}));
jest.mock('./../../../model/User');
jest.mock('redis', (() => {
    const redisClient = {
        connect: jest.fn(),
        on: jest.fn().mockReturnValue('Connected to mockedRedis...')
    }

    return {
        createClient: jest.fn().mockReturnValue(redisClient)
    }
}));
jest.mock('./../../../config/dbConn', (() => jest.fn().mockReturnValue(true)));


describe('verifyJWT', () => {
    let server

    beforeEach(() => {
        server = app.listen(8002, () => console.log(`Server listening on port 8002`))
    });

    afterEach(() => {
        server.close();
        jest.clearAllMocks();
    });

    it('should throw an error if authHeader is invalid', async () => {
        await supertest(app)
            .get('/posts')
            .expect(401)
    });

    it('should throw an error if authHeader is valid but token is invalid', async () => {
        await supertest(app)
            .get('/posts')
            .set('Authorization', 'Bearer')
            .expect(401)
    });

    it('should throw an error if user with the received token doesnt exist', async () => {

        jwt.verify.mockReturnValueOnce({ username: 'testuser' });

        User.findOne.mockImplementationOnce(() => ({
            exec: jest.fn().mockResolvedValueOnce(null)
        }));

        await supertest(app)
            .get('/posts')
            .set('Authorization', 'Bearer valid-token')
            .expect(401)
    });

    // d happy path is in the controller folder 
    // where i performed integration tests on a protected route('/posts')
});