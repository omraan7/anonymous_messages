export default class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(typeof message === "string" ? message : "Request failed");
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    // Back-compat with the old signature `new AppError(msg, status, isOperational)`.
    const opts = typeof options === "boolean" ? { isOperational: options } : options;
    this.isOperational = opts.isOperational ?? true;
    this.code = opts.code;
    this.errors = opts.errors;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
