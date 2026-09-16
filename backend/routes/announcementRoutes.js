const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const requireRole = require("../middleware/authorization");

router.get("/", announcementController.getAllAnnouncements);

router.post(
  "/",
  requireRole("admin"),
  announcementController.createAnnouncement,
);

router.patch(
  "/:announcementId",
  requireRole("admin"),
  announcementController.updateAnnouncement,
);

router.delete(
  "/:announcementId",
  requireRole("admin"),
  announcementController.deleteAnnouncement,
);

module.exports = router;
