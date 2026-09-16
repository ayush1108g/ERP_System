const express = require("express");
const registrationController = require("../controllers/registrationController");

const router = express.Router();

router.post("/request", registrationController.createRequest);
router.get("/mine", registrationController.getMyRequests);
router.get("/", registrationController.getRequests);
router.post("/direct", registrationController.directEnrol);
router.patch("/:id/review", registrationController.reviewRequest);

module.exports = router;
