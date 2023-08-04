const corsOptions = require('../../../config/corsOptions');


describe('corsOption', () => {
    it('should allow request from allowed origins', () => {
        const origin = 'https://www.yoursite.com';
        const callback = jest.fn();

        corsOptions.origin(origin, callback);

        expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should throw an error from disallowed origin', () => {
        const origin = 'https://www.disallowedsite.com';
        const callback = jest.fn();

        corsOptions.origin(origin, callback);

        expect(callback).toHaveBeenCalledWith(new Error('Not allowed by cors'));
    });
});