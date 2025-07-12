import { ApiError } from "../utils/ApiError.js";

export function checkApiKey(req, res, next) {
  const clientKey = req.headers["x-api-key"];

  if (!clientKey || clientKey !== process.env.API_KEY) {
    return res
      .status(401)
      .json(new ApiError(401, "Unauthorized!!. Invalid or missing API key"));
  }

  next(); // Continue to the real route handler
}
