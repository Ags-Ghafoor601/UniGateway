require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ dest: '/tmp/' });

// Middleware
app.use(cors()); // Allow requests from your frontend
app.use(express.json()); // Parse incoming JSON payloads
app.use(express.static(__dirname)); // Serve static frontend files

// Create a MySQL Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'unigateway_db',
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verify the connection on startup
pool.getConnection()
    .then(connection => {
        console.log("✅ Successfully connected to MySQL database!");
        connection.release();
    })
    .catch(err => {
        console.error("❌ MySQL Connection Error:", err.message);
    });

// API Route to receive feedback
app.post('/api/feedback', async (req, res) => {
    const { subject, message } = req.body;
    if (!subject || !message) {
        return res.status(400).json({ success: false, error: "Subject and message are required." });
    }
    try {
        const [result] = await pool.execute(
            'INSERT INTO feedback (subject, message) VALUES (?, ?)',
            [subject, message]
        );
        console.log(`Feedback received. Insert ID: ${result.insertId}`);
        res.status(200).json({ success: true, message: "Feedback saved successfully!" });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ success: false, error: "Failed to save feedback to database." });
    }
});

// API Route for AI Chat (ARIA & Voice Coach)
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { messages, model, temperature, max_tokens } = req.body;
        const response = await groq.chat.completions.create({
            messages: messages,
            model: model || "llama-3.1-8b-instant",
            temperature: temperature || 0.7,
            max_tokens: max_tokens || 150
        });
        res.json(response);
    } catch (error) {
        console.error("Groq Chat Error:", error);
        res.status(500).json({ error: "Failed to communicate with AI" });
    }
});

// API Route for AI Transcription (Voice Coach)
app.post('/api/ai/transcribe', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file provided" });
        }
        const { model, language } = req.body;
        
        // Append original extension so Groq SDK accepts the file format
        const ext = path.extname(req.file.originalname) || '.webm';
        const newPath = req.file.path + ext;
        fs.renameSync(req.file.path, newPath);
        
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(newPath),
            model: model || "whisper-large-v3-turbo",
            language: language
        });
        
        // Clean up temporary file
        fs.unlinkSync(newPath);
        
        res.json(transcription);
    } catch (error) {
        console.error("Groq Transcription Error:", error);
        // Ensure cleanup of the original and renamed files
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        if (req.file && fs.existsSync(req.file.path + (path.extname(req.file.originalname) || '.webm'))) fs.unlinkSync(req.file.path + (path.extname(req.file.originalname) || '.webm'));
        res.status(500).json({ error: "Failed to transcribe audio" });
    }
});

// API Route for AI Quiz Generation
app.post('/api/ai/quiz', async (req, res) => {
    try {
        const { prompt, max_tokens } = req.body;
        const response = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            temperature: 0.3, // Lower temperature for more consistent JSON
            max_tokens: max_tokens || 2500
        });
        res.json({ content: response.choices[0]?.message?.content });
    } catch (error) {
        console.error("Groq Quiz Error:", error);
        res.status(500).json({ error: "Failed to generate quiz" });
    }
});

// Export the app for Vercel Serverless, but also run locally if started directly
const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
}
module.exports = app;