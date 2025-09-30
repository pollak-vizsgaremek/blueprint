export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Default error response
  let status = 500;
  let message = "Internal Server Error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    status = 400;
    message = "Validation Error";
  } else if (err.name === "UnauthorizedError") {
    status = 401;
    message = "Unauthorized";
  } else if (err.name === "NotFoundError") {
    status = 404;
    message = "Not Found";
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: "Route not found" });
};
