const Assignment = require("../models/assignmentModel");
const Student = require("../models/userModel");
const Course = require("../models/courseModel");

const hasCourseAccess = (user, course) =>
  user.role === "admin" ||
  (user.role === "teacher" &&
    user.courses_taught.some(
      (id) => id.toString() === course._id.toString(),
    )) ||
  (user.role === "student" &&
    user.courses_enrolled.some(
      (entry) => entry.course_id.toString() === course._id.toString(),
    ));

exports.addAssignment = async (req, res, next) => {
  try {
    const { name, courseId, due_date, total_marks, questionFile, description } =
      req.body;

    // Check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (req.user.role === "teacher" && !hasCourseAccess(req.user, course)) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this course" });
    }

    // Create the assignment
    const assignment = new Assignment({
      name,
      courseId,
      due_date,
      total_marks,
      questionFile,
      description,
    });

    // Save the assignment to the database
    await assignment.save();

    // Add the assignment to the course's assignments array
    course.assignments.push({
      assignment_id: assignment._id,
      name,
      due_date,
      total_marks,
      questionFile,
      description,
    });

    // Save the updated course
    await course.save();

    res
      .status(201)
      .json({ message: "Assignment added successfully", assignment });
  } catch (error) {
    next(error);
  }
};

// Update student grade for an assignment
exports.updateStudentGrade = async (req, res, next) => {
  try {
    const { assignmentId, studentId, grade, comments } = req.body;

    // Check if the assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    const course = await Course.findById(assignment.courseId);
    if (
      !course ||
      !hasCourseAccess(req.user, course) ||
      req.user.role === "student"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to grade this assignment" });
    }

    // Check if the student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Update the student's grade and comments for the assignment
    const submissionIndex = assignment.submissions.findIndex(
      (submission) => submission.studentId.toString() === studentId,
    );
    if (submissionIndex === -1) {
      return res.status(404).json({ message: "Submission not found" });
    }

    assignment.submissions[submissionIndex].grade = grade;
    assignment.submissions[submissionIndex].comments = comments;

    await assignment.save();

    res.json({ message: "Student grade updated successfully", assignment });
  } catch (error) {
    next(error);
  }
};

// Add submission file for an assignment
exports.addSubmissionFile = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const rollNumber = req.user.personal_info.rollNumber;
    const { assignmentId, submissionFile } = req.body;

    // Check if the assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if the student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const isEnrolled = student.courses_enrolled.some(
      (entry) => entry.course_id.toString() === assignment.courseId.toString(),
    );
    if (!isEnrolled) {
      return res
        .status(403)
        .json({ message: "Student is not enrolled in this course" });
    }

    // Find the submission index for the student
    const submissionIndex = assignment.submissions.findIndex((submission) =>
      submission.studentId.equals(studentId),
    );

    // If the student hasn't submitted yet, add a new submission object
    if (submissionIndex === -1) {
      assignment.submissions.push({
        studentId,
        submissionFile,
        rollNumber,
      });
    } else {
      // If the student has already submitted, update the submission file
      assignment.submissions[submissionIndex].submissionFile = submissionFile;
    }

    // Save the updated assignment
    await assignment.save();

    res.json({
      message: "Submission file added/updated successfully",
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

// Add doubt to the assignment question file
exports.addDoubt = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const student_name = req.user.personal_info.name;
    const { assignmentId, message } = req.body;

    // Check if the assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    const course = await Course.findById(assignment.courseId);
    if (!course || !hasCourseAccess(req.user, course)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to post a doubt here" });
    }

    // Check if the student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Add the doubt to the assignment
    assignment.doubts.push({
      message,
      student_id: studentId,
      student_name,
    });

    // Save the updated assignment
    await assignment.save();

    res.json({ message: "Doubt added successfully", assignment });
  } catch (error) {
    next(error);
  }
};

// Delete an assignment
exports.deleteAssignment = async (req, res, next) => {
  try {
    const assignmentId = req.params.assignmentId;

    // Check if the assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    const course = await Course.findById(assignment.courseId);
    if (
      !course ||
      !hasCourseAccess(req.user, course) ||
      (req.user.role !== "admin" && req.user.role !== "teacher")
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this assignment" });
    }

    // Remove the assignment from the Course model
    const assignmentIndex = course.assignments.findIndex((a) =>
      a.assignment_id.equals(assignmentId),
    );
    if (assignmentIndex !== -1) {
      course.assignments.splice(assignmentIndex, 1);
      await course.save();
    }

    // Delete the assignment
    await Assignment.findByIdAndDelete(assignmentId);

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getAssignmentByID = async (req, res) => {
  const { assignmentId } = req.params;

  try {
    // Query the database for the assignment by its ID
    const assignment = await Assignment.findById(assignmentId);

    // Check if the assignment exists
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const course = await Course.findById(assignment.courseId);
    if (!course || !hasCourseAccess(req.user, course)) {
      return res
        .status(403)
        .json({ message: "You are not enrolled or assigned to this course" });
    }

    // If the assignment exists, send it in the response
    res.status(200).json({ assignment });
  } catch (error) {
    // Handle any errors that occur during the database query
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
