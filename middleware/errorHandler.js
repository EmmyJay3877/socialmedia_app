
const customError = require('./../utils/customError');

const devErrors = (error, res) => {
    res.status(error.statusCode).json({
        statusCode: error.statusCode,
        message: error.message,
        stackTrace: error.stack,
        error: error
    })
}

const prodErrors = (error, res) => {
    if (error.isOperational) {
        res.status(error.statusCode).json({
            statusCode: error.statusCode,
            message: error.message,
        });
    } else {
        res.status(500).send('Something went wrong, try again later.');
    }
}

const castErrorHandler = (err) => {
    const msg = `Invalid value for ${err.path}: ${err.value}`
    return new customError(msg, 400);
}

const duplicateKeyErrorHandler = (err) => {
    const key = Object.keys(err.keyPattern);
    const msg = `User with this ${key} already exist`
    return new customError(msg, 409);
}

const validationError = (err) => {
    const error = Object.values(err.errors).map(err => err.message);
    if (error.length < 1) {
        const msg = `Invalid input data: ${error}`;
        return new customError(msg, 409);
    }
    const errMsgs = error.join('. ');
    const msg = `Invalid input data: ${errMsgs}`;
    return new customError(msg, 409);
}

const handleJWTError = err => new customError('Invalid token, Please login.', 401)

const handleExpiredJWTError = err => new customError('Token has expired', 401);

const errorHandler = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500

    if (process.env.NODE_ENV === 'development') devErrors(error, res);
    else if (process.env.NODE_ENV === 'production') {
        if (error.name === 'CastError') error = castErrorHandler(error); //invalid value error
        if (error.code === 11000) error = duplicateKeyErrorHandler(error); //duplicate key error
        if (error.name === 'ValidationError') error = validationError(error); //validation error
        if (error.name === 'JsonWebTokenError') error = handleJWTError(error); //invalid json error
        if (error.name === 'TokenExpiredError') error = handleExpiredJWTError(error); //expired jwt error
        prodErrors(error, res);
    }
}

module.exports = errorHandler;
