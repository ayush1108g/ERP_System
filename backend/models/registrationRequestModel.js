const mongoose = require("mongoose");

const registrationRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    requestedRole: {
      type: String,
      enum: ["student", "teacher"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    reviewNote: String,
  },
  { timestamps: true },
);

registrationRequestSchema.index({
  requester: 1,
  course: 1,
  requestedRole: 1,
  status: 1,
});

module.exports = mongoose.model(
  "RegistrationRequest",
  registrationRequestSchema,
);
