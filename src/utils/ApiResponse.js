class ApiResponse {
constructor(statusCode, data = {}, message = '') {
this.success = statusCode >= 200 && statusCode < 300;
this.statusCode = statusCode;
this.message = message;
this.data = data;
}
}
module.exports = ApiResponse;