// writeFeedbackController.js
const Feedback = require("../models/feedbackModel");
const Course = require("../models/courseModel");

exports.writeFeedback = async (req, res, next) => {
  try {
    const student_id = req.user._id;
    const { course_id, rating, comments } = req.body;
    if (
      !Number.isInteger(Number(rating)) ||
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {
      return res
        .status(400)
        .json({ message: "Rating must be an integer from 1 to 5" });
    }
    const course = await Course.findById(course_id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (
      !req.user.courses_enrolled.some(
        (entry) => entry.course_id.toString() === course_id.toString(),
      )
    ) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this course" });
    }
    const existing = await Feedback.findOne({ student_id, course_id });
    if (existing)
      return res
        .status(409)
        .json({ message: "Feedback has already been submitted" });

    const feedback = new Feedback({
      student_id,
      course_id,
      rating,
      comments,
    });

    await feedback.save();

    // Update course model with the new feedback
    await Course.findByIdAndUpdate(course_id, {
      $push: {
        feedback: {
          student_id,
          rating,
          comments,
        },
      },
    });

    res
      .status(201)
      .json({ message: "Feedback submitted successfully", feedback });
  } catch (error) {
    next(error);
  }
};

exports.getAllFeedback = async (req, res, next) => {
  try {
    const filter =
      req.user.role === "teacher"
        ? { course_id: { $in: req.user.courses_taught } }
        : {};
    const feedback = await Feedback.find(filter);
    res.status(200).json({ feedback });
  } catch (error) {
    next(error);
  }
};
