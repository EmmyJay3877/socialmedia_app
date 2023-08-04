const tryCatch = require('../../../utils/tryCatch');


describe('trycatch', () => {

    let mockedController;

    let mockReq

    let mockRes

    let next

    beforeEach(() => {

        mockReq = {}

        mockRes = {}

        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call the controller function and pass req, res and next', async () => {
        mockedController = jest.fn().mockResolvedValue(true);
        // the double brackets means, invoking the trycatch function and
        // passing req, res and next to the resulting function
        // check the trycatch code for understanding.
        await tryCatch(mockedController)(mockReq, mockRes, next);

        expect(mockedController).toHaveBeenCalledWith(mockReq, mockRes, next);
        expect(next).not.toHaveBeenCalled();
    });

    it('should call the next function with an error if the next function throws an error', async () => {
        const error = new Error('Something went wrong');

        mockedController = jest.fn().mockImplementationOnce(() => {
            throw new Error('Something went wrong');
        });

        await tryCatch(mockedController)(mockReq, mockRes, next);

        expect(mockedController).toHaveBeenCalledWith(mockReq, mockRes, next);
        expect(next).toHaveBeenCalledWith(error);
    });
});