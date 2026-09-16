const express = require("express");
const courseController = require("../controllers/courseController");
const requireRole = require("../middleware/authorization");

const router = express.Router();

// Route to get all assignments of a course
router.get("/:courseId/assignments", courseController.getAllAssignments);
router.get("/:courseId/feedback", courseController.getCourseFeedback);
router
  .route("/:id")
  .get(courseController.getCourse)
  .patch(requireRole("admin", "teacher"), courseController.updateCourse)
  .delete(requireRole("admin"), courseController.deleteCourse);

router
  .route("/")
  .post(requireRole("admin"), courseController.createCourse)
  .get(courseController.getAllCourses);

module.exports = router;
