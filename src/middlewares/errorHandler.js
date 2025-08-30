const ApiResponse = require('../utils/ApiResponse');


module.exports = (err, req, res, next) => {
const status = err.statusCode || 500;
const message = err.message || 'Internal server error';


if (process.env.NODE_ENV !== 'production') {
console.error('Error:', err);
}


res.status(status).json(new ApiResponse(status, {}, message));
};