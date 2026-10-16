/**
 * Async handler wrapper to catch unhandled promise rejections
 * and pass them automatically to the next() error middleware.
 *
 * @param {Function} fn Controller async function
 * @returns {Function} Express request handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
