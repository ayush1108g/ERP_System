const crypto = require("crypto");
const cookie = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const usersignup = require("./../models/userModel");
const AppError = require("./../utils/appError");
const catchasync = require("./../utils/catchAsync");

const signToken = (id) => {
  const Accesstoken = jwt.sign(id, process.env.ACCESS_JWT_SECRET, {
    expiresIn: process.env.ACCESS_JWT_EXPIRES_IN,
  });

  const Refreshtoken = jwt.sign(id, process.env.REFRESH_JWT_SECRET, {
    expiresIn: process.env.REFRESH_JWT_EXPIRES_IN,
  });

  return [Accesstoken, Refreshtoken];
};

const createSendToken = catchasync(async (user, statusCode, res) => {
  user.lastlogin = Date.now();
  await user.save({ validateBeforeSave: false });
  const [AccessToken, RefreshToken] = signToken({ id: user._id });
  const cookieoptions = {
    expires: new Date(
      Date.now() +
        process.env.ACCESS_JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    withCredentials: true,
    // httpOnly: true,
    // domain: ".github.io",
    // domain: "localhost",
    // path: "/winter_code_week_2/#/",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    httpOnly: false,
  };
  // if (process.env.NODE_ENV === "production") cookieoptions.secure = true;
  // console.log(cookieoptions);
  res.cookie("AccessToken", AccessToken, cookieoptions);
  res.cookie("RefreshToken", RefreshToken, cookieoptions);
  // console.log(token);
  // console.log(user);
  user.password = undefined;
  if (user.role === "student") {
    user.courses_taught = undefined;
    user.isApproved = undefined;
  }
  res.status(statusCode).json({
    status: "success",
    AccessToken,
    RefreshToken,
    role: user.role,
    data: { user },
  });
});

const verifyRefreshToken = catchasync(async (req, res, next) => {
  let RefreshToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    RefreshToken = req.headers.authorization.split(" ")[1];
  }
  if (!RefreshToken) {
    return next(new AppError("you are not logged in", 401));
  }
  const decoded = await promisify(jwt.verify)(
    RefreshToken,
    process.env.REFRESH_JWT_SECRET,
  );
  const currentUser = await usersignup.findById(decoded.id).select("+password");
  if (!currentUser) {
    return next(
      new AppError("the user belonging to this token does not exist", 401),
    );
  }
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("user recently changed password! please login again", 401),
    );
  }
  req.user = currentUser;
  createSendToken(currentUser, 200, res);
});

const protect = catchasync(async (req, res, next) => {
  // console.log("hello ");
  let AccessToken;
  // console.log(req.headers.authorization);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    AccessToken = req.headers.authorization.split(" ")[1];
  }
  if (!AccessToken) {
    return next(new AppError("you are not logged in", 401));
  }

  const decoded = await promisify(jwt.verify)(
    AccessToken,
    process.env.ACCESS_JWT_SECRET,
  );

  const currentUser = await usersignup.findById(decoded.id).select("+password");
  // console.log(currentUser);
  if (!currentUser) {
    return next(
      new AppError("the user belonging to this token does not exist", 401),
    );
  }
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("user recently changed password! please login again", 401),
    );
  }
  if (currentUser.isApproved === false) {
    return next(new AppError("Your account is not approved yet", 401));
  }
  req.user = currentUser;
  next();
});

module.exports = {
  signToken,
  createSendToken,
  protect,
  verifyRefreshToken,
};
