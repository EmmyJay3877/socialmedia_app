require('dotenv').config()
const createServer = require('./config/server');
const app = createServer();
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerjsDocs = YAML.load('./api.yaml');
const rateLimit = require('express-rate-limit');
const corsOptions = require('./config/corsOptions')
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const connectDB = require('./config/dbConn');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const PORT = process.env.PORT;
const verifyJWT = require('./middleware/verifyJWT');
const credentials = require('./middleware/credentials');
const Redis = require('redis');
const redisClient = Redis.createClient({
    url: process.env.REDIS_URL
});
const errorHandler = require('./middleware/errorHandler');

// handle uncaught exceptions
process.on('uncaughtException', err => {
    console.log(err.name, ' ====> ', err.message);
    console.log('UNHANDLED EXCEPTION 🔥 Shutting Down!!!')
    process.exit(1);
});

// handle fileupload
app.use(
    fileUpload({
        limits: {
            fileSize: 5 * 1024 * 1024 // Around 5MB
        },
        useTempFiles: true
    }));

// set security http headers
app.use(helmet());

// where limiter is the middleware function
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests, please try again in an hour!'
});

const loginLimiter = rateLimit({
    max: 6,
    windowMs: 25 * 60 * 1000,
    message: 'Too many login attempts, please try again in few minutes!'
});

// swagger ui api docs
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerjsDocs));

// limit requests from same IP
app.use(limiter);

// limit login requests from same IP
app.use('/login', loginLimiter);

redisClient.connect();

redisClient.on('connect', () => console.log('Connected to Redis.'))

// Connect to MongoDB
connectDB();

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// data sanitization against no-sql query injection
app.use(mongoSanitize());

// data sanitization against cross-site scripting attacks(xss)
app.use(xss());

// middleware for cookies
app.use(cookieParser());

// routes
app.use('/register', require('./routes/register'));
app.use('/login', require('./routes/auth'));
app.use('/refresh', require('./routes/refresh'));
app.use('/logout', require('./routes/logout'));
app.use('/forgetPassword', require('./routes/forgetPassword'));
app.use('/resetPassword', require('./routes/forgetPassword'));

app.use(verifyJWT);
app.use('/posts', require('./routes/api/posts'));
app.use('/users', require('./routes/api/users'));
app.use('/likes', require('./routes/api/likes'));
app.use('/comments', require('./routes/api/comments'));
app.use('/replies', require('./routes/api/comments'))
app.use('/following', require('./routes/api/following'));


app.use(errorHandler);


// check db connection before starting server
mongoose.connection.once('open', async () => {
    console.log('Connected to MongoDB');
    // in my tests connectDB is a mockfunction returing true
    // and i dont want this app instance running while testing.
    if (!await connectDB() === true) {
        app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
    }
});

// Handle promise rejections
process.on('unhandledRejection', err => {
    console.log(err.name, '====> ', err.message);
    console.log('UNHANDLED REJECTION 🔥 Shutting Down!!!')
    process.exit(1);
});

module.exports = app;