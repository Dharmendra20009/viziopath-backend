const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');


module.exports = function auth(req, res, next) {
try {
let token;


// 1) Prefer httpOnly cookie
if (req.cookies && req.cookies.token) {
token = req.cookies.token;
}


// 2) Fallback: Authorization: Bearer <token>
if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
token = req.headers.authorization.split(' ')[1];
}


if (!token) throw new ApiError(401, 'Not authenticated');


const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = { id: decoded.id };
return next();
} catch (err) {
return next(new ApiError(401, 'Invalid or expired token'));
}
};