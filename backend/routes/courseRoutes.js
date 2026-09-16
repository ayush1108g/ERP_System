const express = require("express");
const courseController = require("../controllers/courseController");

const router = express.Router();

// Route to get all assignments of a course
router.get("/:courseId/assignments", courseController.getAllAssignments);
router.get("/:courseId/feedback", courseController.getCourseFeedback);
router
  .route("/:id")
  .get(courseController.getCourse)
  .patch(courseController.updateCourse)
  .delete(courseController.deleteCourse);

router
  .route("/")
  .post(courseController.createCourse)
  .get(courseController.getAllCourses);

module.exports = router;
