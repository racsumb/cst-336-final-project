-- ==========================================
-- Users table
-- Tracks account info (username / password), level, and total XP
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Stored as plain text for testing
    current_level INT DEFAULT 1,
    total_xp INT DEFAULT 0
);

-- ==========================================
-- Quests table
-- Allows users to manage daily tasks
-- ==========================================
CREATE TABLE IF NOT EXISTS quests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    quest_title VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    difficulty VARCHAR(20),
    is_completed BOOLEAN DEFAULT FALSE,
    -- This links the quest to a specific user. 
    -- ON DELETE CASCADE means if the user is deleted, their quests are too.
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- Daily stats table
-- Logs date, sleep, workout, and mood metrics
-- ==========================================
CREATE TABLE IF NOT EXISTS daily_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    log_date DATE NOT NULL,
    sleep_hours DECIMAL(4,2),
    workout_time INT, -- Stored in minutes
    mood VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- Starter Data for easy testing
-- ==========================================

-- Insert the development team as placeholder users
INSERT INTO users (username, password, current_level, total_xp) 
VALUES 
('Andrew', 'password1', 1, 0),
('Taylor', 'password1', 1, 0),
('Richie', 'password1', 5, 450),
('Branden', 'password1', 1, 0);

-- Give Richie (user_id 3) some active quests
INSERT INTO quests (user_id, quest_title, category, difficulty) 
VALUES 
(3, '30 Min Cardio', 'Exercise', 'Hard', FALSE),
(3, 'Read 20 Pages', 'Personal', 'Easy', TRUE);

-- Give Richie a daily stat log
INSERT INTO daily_stats (user_id, log_date, sleep_hours, workout_time, mood) 
VALUES 
(3, CURDATE(), 7.5, 30, 'Rested and Ready');