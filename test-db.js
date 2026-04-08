require('dotenv').config();
const db = require('./database/db');

async function testConnection() {
    try {
        console.log("Attempting to connect to the database...");
        
        // Run simple query just to see if the database responds
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        
        console.log("Success: The database is connected.");
        console.log("Test Query Result (Should be 2):", rows[0].solution);
        
        // Close the script automatically
        process.exit(0); 
    } catch (error) {
        console.error("ERROR: Database Connection Failed!");
        console.error(error.message);
        process.exit(1);
    }
}

// Run the function
testConnection();