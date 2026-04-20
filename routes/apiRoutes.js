const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Complexity of bcrypt encyrption


// ===============================
// USER LOGIN
// ===============================
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
        const isMatch = await bcrypt.compare(password, user.password);

        if (user && isMatch) {
            res.json({
                success: true,
                message: "Logged in",
                userId: user.id,
                username: user.username
            });
        } else {
            res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

    } catch (error) {
        console.error(error);

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

        const hashedPassword = await bcrypt.hash(password,saltRounds);

        // if its available, insert the new user into the database
        const [result] = await db.execute(
            `INSERT INTO users (username, password, current_level, total_xp)
             VALUES (?, ?, 1, 0)`,
            [username, hashedPassword]
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

    // Server side validation for user inputs
    if (!user_id || !quest_title) {
        return res.status(400).json({ success: false, message: "Failed to add quest" });
    }

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

// ===============================
// TEST SINGLE ENDPOING TO GET STATS INFORMATION FOR A USER
// ===============================
router.get('/stats/summary/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {

        // Verify the username
        const [userRows] = await db.query(
            `SELECT username FROM users WHERE id = ?`,
            [userId]
        );
        const username = userRows[0]?.username || "Hero";

        // Get today's stats
        const [todayRows] = await db.query(
            `SELECT * FROM daily_stats WHERE user_id = ? AND log_date = CURDATE()`,
            [userId]
        );

        // Calculate averages for the last 7 days
        const [avgRows] = await db.query(
            `SELECT AVG(sleep_hours) as avgSleep, AVG(workout_time) as avgWork
             FROM daily_stats 
             WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
            [userId]
        );

        // Get raw history for last 7 days
        const [historyRows] = await db.query(
            `SELECT DATE_FORMAT(log_date, '%W, %b %d') as formattedDate, sleep_hours, workout_time, mood
             FROM daily_stats WHERE user_id = ? 
             ORDER BY log_date DESC LIMIT 7`,
            [userId]
        );

        res.json({
            username: username,
            today: todayRows[0] || null,
            averages: avgRows[0],
            history: historyRows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching summary" });
    }
});

// ===============================
// GET RANDOM QUOTE
// ===============================
router.get("/quote", async (req, res) => {
  try {
    const response = await fetch("https://zenquotes.io/api/random");
    const data = await response.json();

    const quote = data[0]; // ZenQuotes returns an array

    res.json({
      content: quote.q,
      author: quote.a
    });

  } catch (err) {
    console.error("ZenQuotes fetch failed:", err);
    res.status(500).json({
      content: "Even the bravest heroes face cloudy omens.",
      author: "Unknown Sage"
    });
  }
});

// ===============================
// GET RANDOM BACKGROUND IMAGE
// ===============================
router.get("/background", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=fantasy landscape mountains&orientation=landscape&client_id=${process.env.UNSPLASH_KEY}`
    );

    const data = await response.json();
    console.log("Unsplash raw response:", data);

    res.json({
      url: data?.urls?.full || "/img/fallback-fantasy.jpg"
    });

  } catch (err) {
    console.error("Unsplash fetch failed:", err);
    res.json({ url: "/img/fallback-fantasy.jpg" });
  }
});

// ===============================
// UPDATE QUEST COMPLETION STATUS & CALCULATE XP
// ===============================
router.put('/quests/:id', async (req, res) => {
    const { is_completed } = req.body;
    const questId = req.params.id;

    try {
        // get quest details first so we know who gets the XP and how hard it was
        const [questRows] = await db.query(`SELECT user_id, difficulty FROM quests WHERE id = ?`, [questId]);
        if (questRows.length === 0) return res.status(404).json({ success: false, message: "Quest not found" });
        
        const quest = questRows[0];

        // determine exp based on difficulty
        // easy = 10, medium = 25, hard = 50, expert = 100
        let xpValue = 10;
        if (quest.difficulty === 'Medium') xpValue = 25;
        if (quest.difficulty === 'Hard') xpValue = 50;
        if (quest.difficulty === 'Expert') xpValue = 100;

        // if checking the box, add XP ... if unchecking, subtract XP
        const xpDelta = is_completed === 1 ? xpValue : -xpValue;

        // update the quest status
        await db.query(`UPDATE quests SET is_completed = ? WHERE id = ?`, [is_completed, questId]);

        // Update users XP (GREATEST(0) prevents negative XP)
        await db.query(`
            UPDATE users 
            SET total_xp = GREATEST(0, total_xp + ?)
            WHERE id = ?
        `, [xpDelta, quest.user_id]);

        // Update users level based on updated XP values
        // level goes up by 1 for every 100 XP they earn (100 exp per level)
        await db.query(`
            UPDATE users 
            SET current_level = FLOOR(GREATEST(0, total_xp) / 100)
            WHERE id = ?
        `, [quest.user_id]);

        // fetch the newly calculated stats
        const [userRows] = await db.query(`SELECT current_level, total_xp FROM users WHERE id = ?`, [quest.user_id]);

        // send the new stats back to the frontend
        res.json({
            success: true,
            newLevel: userRows[0].current_level,
            newXp: userRows[0].total_xp
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to update quest and XP" });
    }
});

module.exports = router;