const express = require("express");
const userController = require("../controllers/userController");
const authcontroller = require("./../controllers/authentication");

const router = express.Router();

router
  .route("/verifytoken")
  .get(authcontroller.protect, userController.verifytoken);

router.route("/verifyrefreshtoken").get(authcontroller.verifyRefreshToken);

router.route("/signup").post(userController.signup);
router.route("/login").post(userController.login);
router.route("/forgotpassword").post(userController.forgotPassword);
router.route("/verifycode").post(userController.verifycode);
router.route("/resetpassword/:token").patch(userController.resetPassword);

router
  .route("/update")
  .get(authcontroller.protect, userController.getuserbyid)
  .put(authcontroller.protect, userController.updateuser);

router
  .route("/updatepassword")
  .put(authcontroller.protect, userController.updatepass);

router
  .route("/tobeapproved")
  .get(authcontroller.protect, userController.tobeapproved);

router
  .route("/approve/:id")
  .get(authcontroller.protect, userController.approveuser);

router.route("/getall").get(authcontroller.protect, userController.getallusers);

router
  .route("/getalluserstats")
  .get(authcontroller.protect, userController.getalluserstats);

module.exports = router;
