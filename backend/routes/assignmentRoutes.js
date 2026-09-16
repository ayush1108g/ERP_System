const express = require("express");
const assignmentController = require("../controllers/assignmentController");
const requireRole = require("../middleware/authorization");

const router = express.Router();

router
  .route("/")
  .post(requireRole("admin", "teacher"), assignmentController.addAssignment)
  .patch(
    requireRole("admin", "teacher"),
    assignmentController.updateStudentGrade,
  );

router
  .route("/:assignmentId")
  .get(assignmentController.getAssignmentByID)
  .delete(
    requireRole("admin", "teacher"),
    assignmentController.deleteAssignment,
  );

router
  .route("/submitAssignment")
  .post(requireRole("student"), assignmentController.addSubmissionFile);

router
  .route("/askDoubts")
  .post(requireRole("student"), assignmentController.addDoubt);

module.exports = router;
