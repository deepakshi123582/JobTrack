const pool = require("../config/db");

// ==========================================
// 1. CREATE A NEW JOB APPLICATION
// ==========================================
const createApplication = async (req, res) => {
    try {
        const {
            company,
            job_title,
            location,
            job_type,
            application_date,
            status,
            job_link,
            notes
        } = req.body;

        if (
            typeof company !== "string" ||
            !company.trim() ||
            typeof job_title !== "string" ||
            !job_title.trim()
        ) {
            return res.status(400).json({
                message: "Company name and job title are required."
            });
        }

        const userId = req.user.id;

        const [result] = await pool.query(
            `INSERT INTO applications
            (
                user_id,
                company,
                job_title,
                location,
                job_type,
                application_date,
                status,
                job_link,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                company.trim(),
                job_title.trim(),
                location || null,
                job_type || null,
                application_date || null,
                status || "Applied",
                job_link || null,
                notes || null
            ]
        );

        return res.status(201).json({
            message: "Job application added successfully!",
            applicationId: result.insertId
        });

    } catch (error) {
        console.error("Create application error:", error);

        return res.status(500).json({
            message: "Unable to add job application."
        });
    }
};


// ==========================================
// 2. GET ALL APPLICATIONS
// ==========================================
const getApplications = async (req, res) => {
    try {
        const userId = req.user.id;

        const [applications] = await pool.query(
            `SELECT
                id,
                company,
                job_title,
                location,
                job_type,
                application_date,
                status,
                job_link,
                notes,
                created_at
             FROM applications
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            applications
        });

    } catch (error) {
        console.error("Get applications error:", error);

        return res.status(500).json({
            message: "Unable to fetch job applications."
        });
    }
};


// ==========================================
// 3. UPDATE AN APPLICATION
// ==========================================
const updateApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.user.id;

        const {
            company,
            job_title,
            location,
            job_type,
            application_date,
            status,
            job_link,
            notes
        } = req.body;

        if (
            typeof company !== "string" ||
            !company.trim() ||
            typeof job_title !== "string" ||
            !job_title.trim()
        ) {
            return res.status(400).json({
                message: "Company name and job title are required."
            });
        }

        // Check that the application belongs to this user.
        const [existingApplications] = await pool.query(
            "SELECT id FROM applications WHERE id = ? AND user_id = ?",
            [applicationId, userId]
        );

        if (existingApplications.length === 0) {
            return res.status(404).json({
                message: "Application not found."
            });
        }

        await pool.query(
            `UPDATE applications
             SET
                company = ?,
                job_title = ?,
                location = ?,
                job_type = ?,
                application_date = ?,
                status = ?,
                job_link = ?,
                notes = ?
             WHERE id = ? AND user_id = ?`,
            [
                company.trim(),
                job_title.trim(),
                location || null,
                job_type || null,
                application_date || null,
                status || "Applied",
                job_link || null,
                notes || null,
                applicationId,
                userId
            ]
        );

        return res.status(200).json({
            message: "Application updated successfully!"
        });

    } catch (error) {
        console.error("Update application error:", error);

        return res.status(500).json({
            message: "Unable to update application."
        });
    }
};


// ==========================================
// 4. DELETE AN APPLICATION
// ==========================================
const deleteApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.user.id;

        const [result] = await pool.query(
            `DELETE FROM applications
             WHERE id = ? AND user_id = ?`,
            [applicationId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Application not found."
            });
        }

        return res.status(200).json({
            message: "Application deleted successfully!"
        });

    } catch (error) {
        console.error("Delete application error:", error);

        return res.status(500).json({
            message: "Unable to delete application."
        });
    }
};


// ==========================================
// EXPORT ALL FUNCTIONS
// ==========================================
module.exports = {
    createApplication,
    getApplications,
    updateApplication,
    deleteApplication
};