require('dotenv').config();
const mysql = require('mysql2/promise');

async function viewFeedback() {
    try {
        console.log("Connecting to Aiven MySQL Database...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false }
        });

        console.log("Fetching feedback...\n");
        const [rows] = await connection.execute('SELECT id, subject, message, created_at FROM feedback ORDER BY created_at DESC');
        
        if (rows.length === 0) {
            console.log("No feedback found yet!");
        } else {
            console.table(rows);
        }

        await connection.end();
    } catch (error) {
        console.error("Error viewing feedback:", error.message);
    }
}

viewFeedback();
