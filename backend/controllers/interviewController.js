const pool = require("../config/db");

// Get all interviews for the logged-in user
const getInterviews = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT i.*, a.company, a.job_title
             FROM interviews i
             JOIN applications a ON i.application_id = a.id
             WHERE a.user_id = ?
             ORDER BY i.interview_date ASC`,
            [req.user.id]
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error("Get interviews error:", error);
        res.status(500).json({
            message: "Unable to fetch interviews."
        });
    }
};

// Create a new interview
const createInterview = async (req, res) => {
    try {
        const {
            application_id,
            interview_date,
            interview_type,
            interviewer,
            notes
        } = req.body;

        if (!application_id || !interview_date) {
            return res.status(400).json({
                message: "Application and interview date are required."
            });
        }

        const [applications] = await pool.query(
            "SELECT id FROM applications WHERE id = ? AND user_id = ?",
            [application_id, req.user.id]
        );

        if (applications.length === 0) {
            return res.status(404).json({
                message: "Application not found."
            });
        }

        const [result] = await pool.query(
            `INSERT INTO interviews
             (application_id, interview_date, interview_type,
              interviewer, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [
                application_id,
                interview_date,
                interview_type || null,
                interviewer || null,
                notes || null
            ]
        );

        res.status(201).json({
            message: "Interview scheduled successfully!",
            interviewId: result.insertId
        });
    } catch (error) {
        console.error("Create interview error:", error);
        res.status(500).json({
            message: "Unable to schedule interview."
        });
    }
};

// Update an existing interview
const updateInterview = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            application_id,
            interview_date,
            interview_type,
            interviewer,
            status,
            notes
        } = req.body;

        const allowedStatuses = [
            "Scheduled",
            "Completed",
            "Cancelled"
        ];

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid interview status."
            });
        }

        // Confirm that the interview belongs to the logged-in user
        const [interviews] = await pool.query(
            `SELECT i.id
             FROM interviews i
             JOIN applications a ON i.application_id = a.id
             WHERE i.id = ? AND a.user_id = ?`,
            [id, req.user.id]
        );

        if (interviews.length === 0) {
            return res.status(404).json({
                message: "Interview not found."
            });
        }

        // If changing the application, ensure it belongs to this user
        if (application_id) {
            const [applications] = await pool.query(
                "SELECT id FROM applications WHERE id = ? AND user_id = ?",
                [application_id, req.user.id]
            );

            if (applications.length === 0) {
                return res.status(404).json({
                    message: "Application not found."
                });
            }
        }

        await pool.query(
            `UPDATE interviews
             SET application_id = COALESCE(?, application_id),
                 interview_date = COALESCE(?, interview_date),
                 interview_type = COALESCE(?, interview_type),
                 interviewer = COALESCE(?, interviewer),
                 status = COALESCE(?, status),
                 notes = COALESCE(?, notes)
             WHERE id = ?`,
            [
                application_id || null,
                interview_date || null,
                interview_type || null,
                interviewer || null,
                status || null,
                notes || null,
                id
            ]
        );

        res.status(200).json({
            message: "Interview updated successfully!"
        });
    } catch (error) {
        console.error("Update interview error:", error);
        res.status(500).json({
            message: "Unable to update interview."
        });
    }
};

// Delete an interview
const deleteInterview = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            `DELETE i
             FROM interviews i
             JOIN applications a ON i.application_id = a.id
             WHERE i.id = ? AND a.user_id = ?`,
            [id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Interview not found."
            });
        }

        res.status(200).json({
            message: "Interview deleted successfully!"
        });
    } catch (error) {
        console.error("Delete interview error:", error);
        res.status(500).json({
            message: "Unable to delete interview."
        });
    }
};

module.exports = {
    getInterviews,
    createInterview,
    updateInterview,
    deleteInterview
};