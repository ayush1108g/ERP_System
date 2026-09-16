const express = require("express");
const attendanceController = require("../controllers/attendanceController");
const requireRole = require("../middleware/authorization");

const router = express.Router();

router
  .route("/createAttendence")
  .post(requireRole("teacher"), attendanceController.createAttendence);

router
  .route("/delete/:attendance_id")
  .delete(requireRole("teacher"), attendanceController.deleteAttendance);

router.route("/isActive").post(attendanceController.isActive);

router
  .route("/mark")
  .post(requireRole("student"), attendanceController.markAttendance);

router.route("/getbycourse").post(attendanceController.getAttendancebyCourse);
router
  .route("/getpercent")
  .get(attendanceController.getAttendancePercentStudent);

module.exports = router;
