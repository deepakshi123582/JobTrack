const express = require("express");

const {
    createApplication,
    getApplications,
    updateApplication,
    deleteApplication,
    getApplicationStats
} = require("../controllers/applicationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get dashboard statistics
router.get("/stats", authMiddleware, getApplicationStats);

// Create a new application
router.post("/", authMiddleware, createApplication);

// Get all applications
router.get("/", authMiddleware, getApplications);

// Update an application
router.put("/:id", authMiddleware, updateApplication);

// Delete an application
router.delete("/:id", authMiddleware, deleteApplication);

module.exports = router;