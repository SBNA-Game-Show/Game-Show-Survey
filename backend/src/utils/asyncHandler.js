/*
A utility function to wrap async route handlers
and forward errors to Express error middleware
*/
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    // If the async function throws/rejects, catch it and pass to next()
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

export { asyncHandler };
