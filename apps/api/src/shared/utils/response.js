export const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

export const error = (res, message, statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    errors,
  });
};
