// In equipmentRoutes.js or a similar routes file
const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const requireRole = require("../middleware/authorization");

// Route for adding inventory item issue
router
  .route("/")
  .get(inventoryController.getAllInventory)
  .post(requireRole("student"), inventoryController.addInventoryIssue)
  .patch(requireRole("admin"), inventoryController.updateInventoryItem);

router.post("/add", requireRole("admin"), inventoryController.addInventoryItem);

// Route for deleting inventory item issue
router
  .route("/:equipmentId")
  .get(inventoryController.getEquipmentById)
  .delete(requireRole("admin"), inventoryController.deleteInventoryIssue);

module.exports = router;
