const express = require('express');
const createServer = require('../../../config/server');

jest.mock('express');

describe('createServer', () => {

    afterAll(() => {
        jest.clearAllMocks();
    });

    it('should return a express instance', () => {

        const app = {
            use: jest.fn().mockReturnValue(true)
        }

        express.mockReturnValueOnce(app);

        const expressInstance = createServer();

        expect(app.use).toHaveBeenCalledWith(express.urlencoded({ extended: false }));

        expect(app.use).toHaveBeenCalledWith(express.json({ limit: '10kb' }));

        expect(expressInstance).toEqual(app);
    });
});