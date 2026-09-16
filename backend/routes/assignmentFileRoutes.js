const express = require("express");
const multer = require("multer");
const router = express.Router();

const fileController = require("../controllers/fileUploadController");
const authController = require("../controllers/authentication");

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/upload-file", authController.protect, (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

router
  .route("/upload-file")
  .post(
    authController.protect,
    upload.any(),
    fileController.uploadAssignmentFile,
  );

module.exports = router;
