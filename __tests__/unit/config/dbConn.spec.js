const mongoose = require('mongoose');
const connectDB = require('../../../config/dbConn');

jest.mock('mongoose');

describe('datebaseConnection', () => {

    afterAll(() => {
        jest.clearAllMocks();
    });

    it('should connect to db', async () => {

        await connectDB();

        expect(mongoose.connect).toHaveBeenCalledWith(process.env.DATABASE_URI, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
    });

    it('should log an error', async () => {

        mongoose.connect.mockImplementationOnce(() => {
            throw new Error('Mongoose error');
        });

        await connectDB();
    });
});