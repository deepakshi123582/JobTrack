const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Job application routes
app.use("/api/applications", applicationRoutes);

// Test database connection
app.get("/api/test-db", async (req, res) => {
    try {
        const [result] = await pool.query("SELECT 1 AS test");

        res.json({
            message: "Database connected successfully!",
            result
        });
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`JobTrack server is running on port ${PORT}`);
});