const { connectDB, dropDB } = require('../../../.jest/mockdbConn');
const Post = require('../../../model/Post');
const User = require('../../../model/User');
const mongoose = require('mongoose');

let mockData;
let mockPost;
let mockUser;
let user

describe('post model', () => {
    beforeEach(async () => {
        jest.resetModules();
        mockData = require('../../../.jest/mockData');
        mockPost = mockData.mockPost;
        mockUser = mockData.mockUser;
        user = await User.create(mockUser);
        mockPost.profile = user._id;
    });

    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await dropDB();
    });

    afterEach(async () => {
        await Post.deleteMany();
        await User.deleteMany();
    });

    it('should create a post', async () => {
        const post = await Post.create(mockPost);
        expect(post).not.toBeNull()
        expect(post.profile).toBeDefined();
        expect(mongoose.Types.ObjectId.isValid(post._id)).toBeTruthy();
    });

    it('should throw a validation error for post without required fields', async () => {
        mockPost.text = '';
        await expect(Post.create(mockPost)).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it('should get all posts', async () => {
        await Post.create(mockPost);
        const posts = await Post.find();
        expect(Array.isArray(posts)).toBe(true);
        expect(posts.length).toBeGreaterThan(0);
    });

    it('should get a post', async () => {
        const { profile } = await Post.create(mockPost);
        const post = await Post.findOne({ profile }).exec();
        expect(post).not.toBeNull();
        expect(mongoose.Types.ObjectId.isValid(post._id)).toBeTruthy();
    });

    it('should delete a post', async () => {
        const { profile } = await Post.create(mockPost);
        const post = await Post.findOne({ profile }).exec();
        const result = post.deleteOne();
        expect(result).not.toBeNull();
    });
});