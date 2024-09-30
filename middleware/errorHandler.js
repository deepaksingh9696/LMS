const errorHandler = (err, res) => {
  console.error(err.stack);

  // Determine the status code and message
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const message = err.message || "Internal Server Error";

  // Send the response
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    // Optionally include stack trace in development
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default errorHandler;
