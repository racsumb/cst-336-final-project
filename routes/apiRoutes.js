const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await db.execute(
            `SELECT *
             FROM users
             WHERE username = ?`,
            [username]
        );

        const user = rows[0];

        // I check if the user exists AND if the password matches
        // (for now it's plain text, later we would hash it)
        if (user && user.password === password) {

            // I return success AND the userId so the frontend can use it
            res.json({
                success: true,
                message: "Logged in",
                userId: user.id
            });

        } else {
            // If login fails, I return an error message
            res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

    } catch (error) {
        console.error(error);

        // If something breaks, I return a server error
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// ===============================
// REGISTER A NEW USER
// ===============================
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // check if the username is taken
        const [existingUsers] = await db.execute(
            `SELECT * FROM users WHERE username = ?`,
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: "That hero name is already taken!"
            });
        }

        // if its available, insert the new user into the database
        const [result] = await db.execute(
            `INSERT INTO users (username, password, current_level, total_xp)
             VALUES (?, ?, 1, 0)`,
            [username, password]
        );

        // return success and the newly created ID
        res.json({
            success: true,
            message: "Account created successfully",
            userId: result.insertId
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// ===============================
// GET QUESTS FOR A USER
// ===============================
router.get('/quests/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // I query the database to get all quests that belong to this user
        const [rows] = await db.query(
            `SELECT * FROM quests WHERE user_id = ?`,
            [userId]
        );

        // I send the quests back as JSON so the frontend can display them
        res.json(rows);

    } catch (error) {
        console.error(error);

        // If something goes wrong, I return an error
        res.status(500).json({
            error: "Failed to fetch quests"
        });
    }
});

// ===============================
// ADD A NEW QUEST
// ===============================
router.post('/quests', async (req, res) => {

    const { user_id, quest_title, category, difficulty } = req.body;

    try {
        // I insert a new quest into the database for the current user
        const [result] = await db.query(
            `INSERT INTO quests (user_id, quest_title, category, difficulty)
             VALUES (?, ?, ?, ?)`,
            [user_id, quest_title, category, difficulty]
        );

        // I return success and the new quest id
        res.json({
            success: true,
            message: "Quest added successfully",
            questId: result.insertId
        });

    } catch (error) {
        console.error(error);

        // If something breaks, I return an error
        res.status(500).json({
            success: false,
            message: "Failed to add quest"
        });
    }
});

// ===============================
// UPDATE QUEST COMPLETION STATUS
// ===============================
router.put('/quests/:id', async (req, res) => {

    const { is_completed } = req.body;
    const questId = req.params.id;

    try {
        // I update the quest's completed status based on its id
        const [result] = await db.query(
            `UPDATE quests
             SET is_completed = ?
             WHERE id = ?`,
            [is_completed, questId]
        );

        // I return success if the update worked
        res.json({
            success: true,
            message: "Quest updated successfully",
            affectedRows: result.affectedRows
        });

    } catch (error) {
        console.error(error);

        // If something breaks, I return an error
        res.status(500).json({
            success: false,
            message: "Failed to update quest"
        });
    }
});

// ===============================
// DELETE A QUEST
// ===============================
router.delete('/quests/:id', async (req, res) => {

    const questId = req.params.id;

    try {
        // I delete the quest based on its id
        const [result] = await db.query(
            `DELETE FROM quests WHERE id = ?`,
            [questId]
        );

        // I return success if the delete worked
        res.json({
            success: true,
            message: "Quest deleted successfully",
            affectedRows: result.affectedRows
        });

    } catch (error) {
        console.error(error);

        // If something breaks, I return an error
        res.status(500).json({
            success: false,
            message: "Failed to delete quest"
        });
    }
});

// ===============================
// GET DAILY STATS FOR A USER
// ===============================
router.get('/stats/:userId', async (req, res) => {

    const userId = req.params.userId;

    try {
        // I get the user's daily stats for today
        const [rows] = await db.query(
            `SELECT * FROM daily_stats
             WHERE user_id = ?
             AND log_date = CURDATE()`,
            [userId]
        );

        // I send back today's stats if they exist, otherwise an empty object
        res.json(rows[0] || {});

    } catch (error) {
        console.error(error);

        // If something breaks, I return an error
        res.status(500).json({
            success: false,
            message: "Failed to fetch daily stats"
        });
    }
});

// ===============================
// SAVE OR UPDATE DAILY STATS
// ===============================
router.post('/stats', async (req, res) => {

    const { user_id, sleep_hours, workout_time, mood } = req.body;

    try {
        // First I check if the user already has stats saved for today
        const [existingRows] = await db.query(
            `SELECT id
             FROM daily_stats
             WHERE user_id = ?
             AND log_date = CURDATE()`,
            [user_id]
        );

        if (existingRows.length > 0) {
            // If today's stats already exist, I update them
            await db.query(
                `UPDATE daily_stats
                 SET sleep_hours = ?, workout_time = ?, mood = ?
                 WHERE user_id = ?
                 AND log_date = CURDATE()`,
                [sleep_hours, workout_time, mood, user_id]
            );

            res.json({
                success: true,
                message: "Daily stats updated successfully"
            });

        } else {
            // If today's stats do not exist yet, I insert a new row
            await db.query(
                `INSERT INTO daily_stats (user_id, log_date, sleep_hours, workout_time, mood)
                 VALUES (?, CURDATE(), ?, ?, ?)`,
                [user_id, sleep_hours, workout_time, mood]
            );

            res.json({
                success: true,
                message: "Daily stats saved successfully"
            });
        }

    } catch (error) {
        console.error(error);

        // If something breaks, I return an error
        res.status(500).json({
            success: false,
            message: "Failed to save daily stats"
        });
    }
});

// ===============================
// GET STATS HISTORY FOR A USER
// ===============================
router.get('/stats/history/:userId', async (req, res) => {

    const userId = req.params.userId;

    try {
        // I get all historical daily stats for this user ordered by newest first
        const [rows] = await db.query(
            `SELECT *
             FROM daily_stats
             WHERE user_id = ?
             ORDER BY log_date DESC`,
            [userId]
        );

        // I return all saved stats history as JSON
        res.json(rows);

    } catch (error) {
        console.error(error);

        // If something breaks, I return an error
        res.status(500).json({
            success: false,
            message: "Failed to fetch stats history"
        });
    }
});

module.exports = router;