// feedbackRoutes.js
const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const requireRole = require("../middleware/authorization");

// Route for writing feedback
router.post("/", requireRole("student"), feedbackController.writeFeedback);

// Route for getting all feedback
router.get(
  "/",
  requireRole("admin", "teacher"),
  feedbackController.getAllFeedback,
);

module.exports = router;
