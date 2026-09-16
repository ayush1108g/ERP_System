const Attendance = require("../models/attendanceModel");
const catchasync = require("../utils/catchAsync");
const Course = require("../models/courseModel");
const AppError = require("../utils/appError");

const teachesCourse = (user, courseId) =>
  user.courses_taught.some((id) => id.toString() === courseId.toString());
const enrolledInCourse = (user, courseId) =>
  user.courses_enrolled.some(
    (entry) => entry.course_id.toString() === courseId.toString(),
  );

exports.createAttendence = catchasync(async (req, res, next) => {
  if (req.user.role !== "teacher") {
    return next(
      new AppError("You are not authorized to create attendence", 401),
    );
  }
  const { course_id, location, validtill } = req.body;
  const course = await Course.findById(course_id);
  if (!course) {
    return next(new AppError("Course not found", 404));
  }
  if (!teachesCourse(req.user, course._id)) {
    return next(new AppError("You are not assigned to this course", 403));
  }
  const attendance = await Attendance.create({
    course_id,
    createdBy: req.user._id,
    location,
    validtill: validtill || Date.now() + 1000 * 60 * 60,
  });

  if (course?.attendance_records && course.attendance_records.length > 0) {
    course.attendance_records.push(attendance._id);
  } else {
    course.attendance_records = [attendance._id];
  }

  await course.save({
    validateBeforeSave: false,
  });

  res.status(201).json({
    status: "success",
    data: {
      attendance,
    },
  });
});

exports.deleteAttendance = catchasync(async (req, res, next) => {
  if (req.user.role !== "teacher") {
    return next(
      new AppError("You are not authorized to create attendence", 401),
    );
  }

  const attendance = await Attendance.findById(req.params.attendance_id);

  if (!attendance) {
    return next(new AppError("Attendance not found", 404));
  }

  const course = await Course.findById(attendance.course_id);
  if (!course || !teachesCourse(req.user, course._id)) {
    return next(new AppError("You are not assigned to this course", 403));
  }
  if (course) {
    course.attendance_records.pull(attendance._id);
    await course.save({ validateBeforeSave: false });
  }

  const delattendance = await Attendance.findByIdAndDelete(
    req.params.attendance_id,
  );

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.isActive = catchasync(async (req, res, next) => {
  const course_id = req.body.course_id;
  if (req.user.role !== "student" || !enrolledInCourse(req.user, course_id)) {
    return next(new AppError("You are not enrolled in this course", 403));
  }
  const attendance = await Attendance.findOne({
    course_id,
    validtill: { $gt: Date.now() },
  });
  if (!attendance) {
    return res.status(200).json({
      status: "success",
      data: {
        isActive: false,
      },
    });
  }
  res.status(200).json({
    status: "success",
    data: {
      attendance,
    },
  });
});

exports.markAttendance = catchasync(async (req, res, next) => {
  const attendance = await Attendance.findById(req.body.attendance_id);
  console.log(attendance);
  if (!attendance) {
    return next(new AppError("Attendance not found", 404));
  }
  if (new Date(attendance.validtill) < Date.now()) {
    return next(new AppError("Attendance is expired", 400));
  }

  if (
    req.user.role !== "student" ||
    !enrolledInCourse(req.user, attendance.course_id)
  ) {
    return next(new AppError("You are not enrolled in this course", 403));
  }
  if (
    attendance.attendance_records.some(
      (record) => record.student_id.toString() === req.user._id.toString(),
    )
  ) {
    return next(new AppError("Attendance has already been marked", 409));
  }

  const name = req.user?.personal_info?.name;
  const rollNumber = req.user?.personal_info?.rollNumber;
  const student_id = req.user._id;
  const attendanceRecord = {
    student_id,
    name,
    rollNumber,
    status: "present",
  };
  attendance.attendance_records.push(attendanceRecord);
  await attendance.save({
    validateBeforeSave: false,
  });
  res.status(200).json({
    status: "success",
    data: {
      attendance,
    },
    message: "Attendance marked",
  });
});

exports.getAttendancebyCourse = catchasync(async (req, res, next) => {
  const course_id = req.body.course_id;
  const course = await Course.findById(course_id);
  if (!course) return next(new AppError("Course not found", 404));
  const canView =
    req.user.role === "admin" ||
    (req.user.role === "teacher" && teachesCourse(req.user, course_id)) ||
    (req.user.role === "student" && enrolledInCourse(req.user, course_id));
  if (!canView)
    return next(
      new AppError("You are not authorized to view this attendance", 403),
    );
  const attendance = await Attendance.find({ course_id });
  if (!attendance) {
    return next(new AppError("Attendance not found", 404));
  }
  res.status(200).json({
    status: "success",
    length: attendance.length,
    data: {
      attendance,
    },
  });
});
exports.getAttendancePercentStudent = catchasync(async (req, res, next) => {
  const student_id = req.user._id;
  const student = req.user;

  // Check if the student is enrolled in any courses
  if (student.courses_enrolled.length === 0) {
    return res.status(200).json({
      status: "success",
      data: {
        percentage: 0,
      },
    });
  }

  let totalA = 0; // Total attendance records
  let presentA = 0; // Attendance records where the student is present

  // Map over each course the student is enrolled in
  const TotalAttendance = student.courses_enrolled.map(async (course) => {
    // Find attendance records for the current course
    const attendance = await Attendance.find({
      course_id: course.course_id,
    });

    // If no attendance records found for the course, return 0 attendance
    if (!attendance || attendance.length === 0) {
      return 0;
    }

    // Increment the total attendance records
    totalA += attendance.length;

    // Loop through each attendance record
    attendance.forEach((attend) => {
      // Check if the student's attendance record is present
      let ps = false;
      attend.attendance_records.forEach((record) => {
        if (!ps && record.student_id.toString() === student_id.toString()) {
          presentA += 1;
          ps = true;
        }
      });
    });

    // Return the attendance percentage for the current course
    return presentA / totalA;
  });

  // Wait for all the attendance percentage calculations to complete
  const percentage = await Promise.all(TotalAttendance);

  // Send the response with the attendance data
  res.status(200).json({
    status: "success",
    data: {
      percentage,
      totalA,
      presentA,
    },
  });
});
