require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
    try {
        // Connect without database selected first
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306,
            ssl: { rejectUnauthorized: false }
        });

        console.log("Connected to MySQL server.");

        // Create Database (May fail on cloud providers like Aiven, which is fine as they pre-create it)
        try {
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'unigateway_db'}\`;`);
            console.log("Database created or already exists.");
        } catch (dbError) {
            console.log("Skipping database creation (Cloud Database Mode). Using existing database.");
        }

        // Use the database
        await connection.query(`USE \`${process.env.DB_NAME || 'unigateway_db'}\`;`);

        // Create feedback table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await connection.query(createTableQuery);
        console.log("Feedback table created or already exists.");

        console.log("✅ Database setup completed successfully!");
        await connection.end();
    } catch (error) {
        console.error("❌ Database setup failed:", error);
    }
}

setupDatabase();
