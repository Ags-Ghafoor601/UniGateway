require('dotenv').config();
const express = require('express');
const cors = require('cors');

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const rateLimit = require('express-rate-limit');

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({
    dest: '/tmp/',
    limits: { fileSize: 4 * 1024 * 1024 } // 4MB limit for audio uploads
});

// Middleware
app.use(cors()); // Allow requests from your frontend
app.use(express.json()); // Parse incoming JSON payloads
app.use(express.static(__dirname)); // Serve static frontend files



// Rate Limiter for AI endpoints (max 50 requests per hour)
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: { error: "Too many AI requests from this IP, please try again after an hour." },
});



// API Route for AI Chat (ARIA & Voice Coach)
app.post('/api/ai/chat', aiLimiter, async (req, res) => {
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
app.post('/api/ai/transcribe', aiLimiter, upload.single('file'), async (req, res) => {
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
app.post('/api/ai/quiz', aiLimiter, async (req, res) => {
    try {
        const { prompt, max_tokens } = req.body;
        const response = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
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