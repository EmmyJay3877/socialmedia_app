const { connectDB, dropDB } = require('../../../.jest/mockdbConn');
const User = require('../../../model/User');
const mongoose = require('mongoose');

let mockData
let mockUser;

describe('user model', () => {
    beforeEach(() => {
        jest.resetModules();
        mockData = require('../../../.jest/mockData');
        mockUser = mockData.mockUser;
    });

    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await dropDB();
    });

    afterEach(async () => {
        await User.deleteMany();
    });

    it('should create and save a user in the database', async () => {
        const testUser = await User.create(mockUser);
        expect(testUser).not.toBeNull();
        expect(testUser._id).toBeDefined();
        expect(testUser.username).toBe(mockUser.username);
    });

    it('should throw validation error if passwords do not match', async () => {
        mockUser.passwordConfirm = 'invalidpassword';
        await expect(User.create(mockUser)).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
    });

    it('should throw a validation error for user without required field', async () => {
        mockUser.email = '';
        await expect(User.create(mockUser)).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
    });

    it('should throw a validation error for user with fields of wrong types', async () => {
        mockUser.username = 12435;
        await expect(User.create(mockUser)).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
    });

    it('should throw validation error for username field that < 4 characters', async () => {
        mockUser.username = 'bob';
        await expect(User.create(mockUser)).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
    });

    it('should throw validation error for username field that > 20 characters', async () => {
        mockUser.username = 'abedhuhuhskiekslosuejdisks';
        await expect(User.create(mockUser)).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
    });

    it('should throw validation error for when email is invalid', async () => {
        mockUser.email = 'invalidemail';
        await expect(User.create(mockUser)).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
    });

    it('should throw validation error for when password length is < 8', async () => {
        mockUser.password = 'pswrd';
        await expect(User.create(mockUser)).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
    });

    it('should throw a validation error for when refresh token is invalid', async () => {
        const { username } = await User.create(mockUser);

        await expect(User.findOneAndUpdate(
            { username },
            { refreshToken: 'invalidtoken' },
            { runValidators: true }
        )).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it('should validate that user instance methods are created', async () => {
        const testUser = await User.create(mockUser);
        expect(testUser.comparePassword).toBeDefined();
        expect(testUser.createPswrdResetToken).toBeDefined();
    });

    it('should validate that comparePassword to be truthy', async () => {
        const testUser = await User.create(mockUser);
        const result = await testUser.comparePassword('testPassword', testUser.password);
        expect(result).toBeTruthy();
    });

    it('should validate that comparePassword to be falsy', async () => {
        const testUser = await User.create(mockUser);
        const result = await testUser.comparePassword('invalidpassword', testUser.password);
        expect(result).toBeFalsy();
    });

    it('should validate and return a resetToken', async () => {
        const testUser = await User.create(mockUser);
        const resetToken = await testUser.createPswrdResetToken();
        expect(resetToken).toBeDefined();
        expect(testUser.passwordResetToken).toBeDefined();
        expect(typeof testUser.passwordResetToken).toBe('string');
    });

    it('should throw a duplicate error', async () => {
        await User.create(mockUser);
        await expect(User.create(mockUser)).rejects.toBeInstanceOf(mongoose.mongo.MongoServerError);
    });

    it('should get all users', async () => {
        await User.create(mockUser);
        const users = await User.find();
        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBeGreaterThan(0);
    });

    it('should get a user', async () => {
        await User.create(mockUser);
        const user = await User.findOne({ username: mockUser.username }).exec();
        expect(user).not.toBeNull();
        expect(mongoose.Types.ObjectId.isValid(user._id)).toBeTruthy();
    });

    it('should delete a user', async () => {
        await User.create(mockUser);
        const user = await User.findOne({ username: mockUser.username }).exec();
        const result = await user.deleteOne();
        expect(result).not.toBeNull();
    });
});