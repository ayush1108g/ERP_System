const AppError = require("../utils/appError");

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError("You are not authorized to perform this action", 403),
      );
    }
    next();
  };

module.exports = requireRole;
