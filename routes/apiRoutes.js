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

module.exports = router;