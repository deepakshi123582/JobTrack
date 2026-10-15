const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    getInterviews,
    createInterview,
    updateInterview,
    deleteInterview
} = require("../controllers/interviewController");

const router = express.Router();

router.get("/", authMiddleware, getInterviews);

router.post("/", authMiddleware, createInterview);

router.put("/:id", authMiddleware, updateInterview);

router.delete("/:id", authMiddleware, deleteInterview);

module.exports = router;