const RegistrationRequest = require("../models/registrationRequestModel");
const Course = require("../models/courseModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const allowedRoles = ["student", "teacher"];

const getId = (value) => value?._id?.toString?.() || value?.toString();

const ensureTargetCanRegister = (user, requestedRole) => {
  if (
    !user ||
    !allowedRoles.includes(user.role) ||
    user.role !== requestedRole
  ) {
    throw new AppError(
      "The selected user is not eligible for this registration",
      400,
    );
  }
  if (user.isApproved === false) {
    throw new AppError("The selected user account is not approved", 400);
  }
};

const enrolUser = async ({ course, user, requestedRole }) => {
  ensureTargetCanRegister(user, requestedRole);
  const userId = getId(user);

  if (requestedRole === "student") {
    if (course.students_enrolled.some((id) => getId(id) === userId)) {
      throw new AppError("User is already enrolled in this course", 409);
    }
    await User.findByIdAndUpdate(userId, {
      $push: {
        courses_enrolled: {
          course_id: course._id,
          enrollment_date: new Date(),
        },
      },
    });
    course.students_enrolled.push(userId);
  } else {
    if (user.courses_taught.some((id) => getId(id) === getId(course))) {
      throw new AppError("Teacher is already assigned to this course", 409);
    }
    await User.findByIdAndUpdate(userId, {
      $addToSet: { courses_taught: course._id },
    });
    if (!course.professor.includes(user.personal_info.name)) {
      course.professor.push(user.personal_info.name);
    }
  }

  await course.save();
  return user;
};

exports.createRequest = catchAsync(async (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new AppError("Only students and teachers can request registration", 403),
    );
  }

  const { courseId } = req.body;
  const course = await Course.findById(courseId);
  if (!course) return next(new AppError("Course not found", 404));

  const alreadyEnrolled =
    req.user.role === "student"
      ? course.students_enrolled.some((id) => getId(id) === getId(req.user))
      : req.user.courses_taught.some((id) => getId(id) === getId(course));
  if (alreadyEnrolled)
    return next(
      new AppError("You are already registered for this course", 409),
    );

  const existing = await RegistrationRequest.findOne({
    requester: req.user._id,
    targetUser: req.user._id,
    course: course._id,
    requestedRole: req.user.role,
    status: "pending",
  });
  if (existing)
    return next(new AppError("A registration request is already pending", 409));

  const request = await RegistrationRequest.create({
    requester: req.user._id,
    targetUser: req.user._id,
    course: course._id,
    requestedRole: req.user.role,
  });

  res.status(201).json({ status: "success", data: request });
});

exports.getRequests = catchAsync(async (req, res, next) => {
  if (req.user.role !== "admin")
    return next(new AppError("Admin access required", 403));
  const requests = await RegistrationRequest.find({ status: "pending" })
    .populate("requester", "role email personal_info")
    .populate("targetUser", "role email personal_info")
    .populate("course", "name professor semester")
    .sort({ createdAt: -1 });
  res
    .status(200)
    .json({ status: "success", results: requests.length, data: requests });
});

exports.getMyRequests = catchAsync(async (req, res) => {
  const requests = await RegistrationRequest.find({ requester: req.user._id })
    .populate("course", "name")
    .sort({ createdAt: -1 });
  res.status(200).json({ status: "success", data: requests });
});

exports.directEnrol = catchAsync(async (req, res, next) => {
  if (req.user.role !== "admin")
    return next(new AppError("Admin access required", 403));
  const { courseId, userId, requestedRole } = req.body;
  if (!courseId || !userId || !allowedRoles.includes(requestedRole)) {
    return next(
      new AppError(
        "courseId, userId, and a valid requestedRole are required",
        400,
      ),
    );
  }

  const [course, user] = await Promise.all([
    Course.findById(courseId),
    User.findById(userId),
  ]);
  if (!course) return next(new AppError("Course not found", 404));
  if (!user) return next(new AppError("User not found", 404));
  await enrolUser({ course, user, requestedRole });

  res
    .status(200)
    .json({ status: "success", message: "User registered successfully" });
});

exports.reviewRequest = catchAsync(async (req, res, next) => {
  if (req.user.role !== "admin")
    return next(new AppError("Admin access required", 403));
  const { status, reviewNote } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return next(new AppError("Status must be approved or rejected", 400));
  }

  const request = await RegistrationRequest.findById(req.params.id);
  if (!request)
    return next(new AppError("Registration request not found", 404));
  if (request.status !== "pending")
    return next(new AppError("This request has already been reviewed", 409));

  if (status === "approved") {
    const [course, user] = await Promise.all([
      Course.findById(request.course),
      User.findById(request.targetUser),
    ]);
    if (!course || !user)
      return next(new AppError("Course or user no longer exists", 404));
    await enrolUser({ course, user, requestedRole: request.requestedRole });
  }

  request.status = status;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  request.reviewNote = reviewNote;
  await request.save();
  res.status(200).json({ status: "success", data: request });
});
