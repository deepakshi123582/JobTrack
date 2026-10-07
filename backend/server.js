const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test API route
app.get("/", (req, res) => {
    res.json({
        message: "JobTrack API is running successfully!"
    });
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
    try {
        const [result] = await pool.query("SELECT 1 AS test");

        res.json({
            message: "Database connected successfully!",
            result: result
        });
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

// Server port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
    console.log(`JobTrack server is running on port ${PORT}`);
});