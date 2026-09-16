// addInventoryIssueController.js
const Equipment = require("../models/inventoryModel");
const User = require("../models/userModel");

exports.getAllInventory = async (req, res, next) => {
  try {
    // Retrieve all inventory items
    const inventoryItems = await Equipment.find();

    res.status(200).json({ inventoryItems });
  } catch (error) {
    next(error);
  }
};

exports.addInventoryIssue = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { equipmentId, issued_date } = req.body;

    const equipment = await Equipment.findOneAndUpdate(
      { _id: equipmentId, available_quantity: { $gt: 0 } },
      {
        $inc: { available_quantity: -1 },
        $push: { issued_to: { student_id: studentId, issued_date } },
        $set: { last_updated: new Date() },
      },
      { new: true },
    );

    if (!equipment) {
      const exists = await Equipment.exists({ _id: equipmentId });
      return res
        .status(exists ? 400 : 404)
        .json({
          message: exists
            ? "No available quantity to issue"
            : "Equipment not found",
        });
    }

    // Load the user based on studentId
    const user = await User.findById(studentId);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Update the user document to reflect the issued equipment
    await User.findByIdAndUpdate(studentId, {
      $addToSet: { equipment_issued: equipmentId },
    });

    res.status(200).json({ message: "Inventory item issued successfully" });
  } catch (error) {
    next(error);
  }
};

exports.deleteInventoryIssue = async (req, res, next) => {
  try {
    const { equipmentId, issueId } = req.body;

    // Find the equipment by its ID
    const equipment = await Equipment.findById(equipmentId);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    // Find the issued item to delete
    const issueIndex = equipment.issued_to.findIndex(
      (issue) => issue._id.toString() === issueId,
    );

    if (issueIndex === -1) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const issuedItem = equipment.issued_to[issueIndex];
    // Remove the issued item and update available quantity
    equipment.available_quantity += 1;
    equipment.issued_to.splice(issueIndex, 1);
    await equipment.save();

    await User.findOneAndUpdate(
      { _id: issuedItem.student_id },
      { $pull: { equipment_issued: equipmentId } },
    );

    res
      .status(200)
      .json({ message: "Inventory item issue deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.addInventoryItem = async (req, res, next) => {
  try {
    const { equipment_name, total_quantity, available_quantity } = req.body;

    // Create a new equipment item
    const equipment = new Equipment({
      equipment_name,
      total_quantity,
      available_quantity,
    });

    // Save the equipment item to the database
    await equipment.save();

    res
      .status(201)
      .json({ message: "Inventory item added successfully", equipment });
  } catch (error) {
    next(error);
  }
};

exports.updateInventoryItem = async (req, res, next) => {
  try {
    const { equipmentId, total_quantity, available_quantity } = req.body;

    // Find the equipment by its ID
    const equipment = await Equipment.findById(equipmentId);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    // Update the total and available quantities
    if (total_quantity !== undefined) {
      equipment.total_quantity = total_quantity;
    }
    if (available_quantity !== undefined) {
      equipment.available_quantity = available_quantity;
    }

    // Save the updated equipment item to the database
    await equipment.save();

    res
      .status(200)
      .json({
        message: "Inventory item quantities updated successfully",
        equipment,
      });
  } catch (error) {
    next(error);
  }
};

exports.getEquipmentById = async (req, res, next) => {
  try {
    const equipmentId = req.params.equipmentId;
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    res.status(200).json({ equipment });
  } catch (error) {
    next(error);
  }
};
