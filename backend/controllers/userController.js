const express = require("express");
const User = require("./../models/userModel.js");
const factory = require("./handlerFactory");

const crypto = require("crypto");
const cookie = require("cookie-parser");
const jwt = require("jsonwebtoken");
const catchasync = require("../utils/catchAsync");
const email = require("./../utils/nodemailer");
const AppError = require("./../utils/appError");
const authentication = require("./authentication");

exports.verifytoken = catchasync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    message: "token verified",
    name: req.user.name,
  });
});

exports.signup = catchasync(async (req, res, next) => {
  console.log(req.body);
  req.body.isApproved = false;
  if (!req.body.role || !["student", "teacher"].includes(req.body.role)) {
    return next(new AppError("please provide role", 400));
  }
  if (req?.body?.role === "student") {
    req.body.isApproved = true;
    if (req.body.courses_taught) req.body.courses_taught = [];

    if (!req.body?.personal_info?.rollNumber) {
      return next(new AppError("please provide roll number", 400));
    }
  }
  const newusersignup = await User.create(req.body);

  authentication.createSendToken(newusersignup, 201, res);
});

exports.login = catchasync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("please provide email and password", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  console.log(user);
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("incorrect email or password", 401));
  }
  if (user.isApproved === false) {
    return next(new AppError("Your account is not approved yet", 401));
  }
  console.log(user);
  authentication.createSendToken(user, 200, res);
});

exports.forgotPassword = catchasync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError("there is no user with that email address", 404));

  const resetToken = await user.createpasswordresetpassword();
  console.log(resetToken);
  await user.save();
  const code = resetToken;
  console.log(code);
  const message = `Your verification code is \n ${resetToken}\n If you didn't forget your password, please ignore this email!`;
  try {
    await email({
      email: user.email,
      subject: "Password Reset code",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "password reset link sent to your email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(
      new AppError(
        "there was an error sending the email. try again later",
        500,
      ),
    );
  }
});

exports.verifycode = catchasync(async (req, res, next) => {
  const hashtoken = req.body.code;
  console.log(hashtoken);
  const user = await User.findOne({
    resetPasswordToken: hashtoken,
    passwordresetexpired: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError("password reset code is invalid", 404));
  }
  res.status(200).json({
    status: "success",
    message: "go to next page",
  });
});

exports.resetPassword = catchasync(async (req, res, next) => {
  const hashtoken = req.params.token;
  console.log(hashtoken);
  const user = await User.findOne({
    resetPasswordToken: hashtoken,
    passwordresetexpired: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError("password reset code is invalid", 404));
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.passwordresetexpired = undefined;
  await user.save({ validateBeforeSave: false });
  authentication.createSendToken(user, 200, res);
});

exports.updateuser = async (req, res, next) => {
  try {
    const userId = req.user._id; // Extract userId from request parameters
    const OLDpersonalInfo = req.user.personal_info;

    const updateFields = req.body; // Get the fields to update from request body

    console.log(updateFields);
    // Extract only the allowed fields to update
    //   let filteredUpdateFields;
    //  if (updateFields.personal_info) {
    //     // Extract only the allowed fields to update
    //     const allowedFields = ['personal_info'];
    //     filteredUpdateFields = Object.keys(updateFields)
    //       .filter(key => allowedFields.includes(key))
    //       .reduce((obj, key) => {
    //         obj[key] = updateFields[key];
    //         return obj;
    //       }, {});

    //     console.log(filteredUpdateFields);
    //   }

    const filteredUpdateFields = {
      personal_info: {
        ...OLDpersonalInfo,
        ...updateFields.personal_info,
      },
    };
    console.log(filteredUpdateFields);

    // Find the user by ID and update only allowed fields
    const user = await User.findByIdAndUpdate(userId, filteredUpdateFields, {
      new: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    next(error);
  }
};

exports.updatepass = catchasync(async (req, res, next) => {
  const user = req.user;
  console.log(req.body.oldpassword, user.password);
  if (!(await user.correctPassword(req.body.oldpassword, user.password))) {
    return next(new AppError("incorrect password", 401));
  }
  user.password = req.body.newpassword;
  await user.save();
  authentication.createSendToken(user, 200, res);
});

exports.getuserbyid = catchasync(async (req, res) => {
  const user = req.user;

  user.password = undefined;

  res.status(200).json({
    status: "success",
    data: user,
  });
});

exports.tobeapproved = catchasync(async (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new AppError("You are not authorized to approve users", 401));
  }
  const user = await User.find({ isApproved: false });
  res.status(200).json({
    status: "success",
    data: user,
    length: user.length,
  });
});

exports.approveuser = catchasync(async (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new AppError("You are not authorized to approve users", 401));
  }
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("User not found", 404));
  user.isApproved = true;
  await user.save();
  res.status(200).json({
    status: "success",
    data: user,
  });
});

exports.deleteUser = catchasync(async (req, res) => {
  const user = req.user;
  user.isActive = false;
  await user.save();
  authentication.createSendToken(user, 200, res);
});

exports.getalluserstats = catchasync(async (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new AppError("You are not authorized to get user stats", 401));
  }
  try {
    const stats = await User.aggregate([
      //find no of users in each role
      {
        $group: {
          _id: "$role",
          numUsers: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
});

exports.getallusers = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next(new AppError("Admin access required", 403));
    }
    const users = await User.find({
      role: { $in: ["student", "teacher"] },
      isApproved: true,
    })
      .select("role email personal_info courses_taught courses_enrolled")
      .sort({ "personal_info.name": 1 });
    res.status(200).json({
      status: "success",
      length: users.length,
      data: users,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};
