const jwt = require('jsonwebtoken');
const createRefreshAndAccessToken = require('../../../utils/createToken');

jest.mock('jsonwebtoken')

describe('createRefreshAndAccessToken', () => {

    afterAll(() => {
        jest.clearAllMocks();
    });

    it('should return refresh and access token for the given username', async () => {
        const username = 'testuser';
        const expectedAccessToken = 'mocked-access-token';
        const expectedRefreshToken = 'mocked-refresh-token';

        jwt.sign.mockReturnValueOnce(expectedAccessToken);
        jwt.sign.mockReturnValueOnce(expectedRefreshToken);

        const result = await createRefreshAndAccessToken(username);

        // Verify that jwt.sign was called with the correct arguments
        expect(jwt.sign).toHaveBeenCalledWith(
            { username },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '3000s' }
        );
        expect(jwt.sign).toHaveBeenCalledWith(
            { username },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        expect(result).toEqual({
            accessToken: expectedAccessToken,
            refreshToken: expectedRefreshToken,
        });
    });
});