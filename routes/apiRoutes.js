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

module.exports = router;