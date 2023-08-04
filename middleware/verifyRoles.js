const customError = require('../utils/customError');

const verifyRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new customError('You do not have permission to perform this action', 403);
        }

        next();
    }
}

module.exports = verifyRoles;