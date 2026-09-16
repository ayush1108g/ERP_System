const mongoose = require("mongoose");

const { Schema } = mongoose;

const feedbackSchema = new Schema({
  student_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course_id: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  comments: String,
  submitted_at: {
    type: Date,
    default: Date.now,
  },
});

feedbackSchema.index({ student_id: 1, course_id: 1 }, { unique: true });

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
