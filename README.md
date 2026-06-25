<div align="center">
  
  # 🎓 UniGateway
  **The Ultimate AI-Powered Academic Companion & University Navigator**

  <p align="center">
    <img src="https://img.shields.io/badge/Status-Production_Ready-brightgreen?style=for-the-badge&logo=github" alt="Status" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  </p>

  <p align="center">
    <em>Empowering students with AI-driven insights, merit calculations, and intelligent voice coaching.</em>
  </p>
</div>

---

## 🌟 About The Project

**UniGateway** is a premium, full-stack student portal designed to bridge the gap between high school and university. By leveraging cutting-edge Artificial Intelligence (Groq API, Llama-3, Whisper), UniGateway transforms how students prepare for entry tests, track their performance, and select their future universities.

Wrapped in a stunning, highly-responsive **Glassmorphism UI**, the application feels like a native mobile app while running completely in the browser.

### 🔥 Key Features
*   **🤖 AI Quiz Banker**: Instantly generate dynamic MCQs based on custom topics or uploaded documents (PDF, Word, TXT). Powered by `llama-3.1-8b-instant`.
*   **🎙️ ARIA Voice Coach**: A conversational AI tutor. Students can speak directly to ARIA using their microphone, and the app transcribes their voice via the `whisper-large-v3-turbo` model for immediate, intelligent feedback.
*   **📊 Merit Calculator**: A highly accurate aggregate calculator for universities across Pakistan (NUST, FAST, UET, MDCAT). Features a beautiful circular progress visualization.
*   **📈 Diagnostic Scanner & Insights**: AI analyzes the student's recent test scores and instantly generates targeted study guides for their weakest subjects.
*   **🏫 University Navigator**: A fast, client-side searchable database of universities with advanced filtering by city and institution type.
*   **🔒 Secure Authentication & 24/7 Feedback**: Robust user management and 24/7 serverless feedback storage powered by **Google Firebase Firestore**.

---

## 🏗️ Architecture & Tech Stack

UniGateway utilizes a highly-optimized, serverless architecture designed specifically for **Vercel**:

### Frontend
*   **HTML5 / CSS3 / Vanilla JavaScript**: Lightweight, ultra-fast client rendering.
*   **Tailwind CSS**: Utility-first styling for a beautiful, modern, dark-themed UI.
*   **Firebase SDK**: Client-side authentication and zero-downtime, serverless feedback submission.

### Serverless Backend
*   **Vercel Serverless Functions (`server.js`)**: Acts as a high-speed, stateless proxy for secure AI operations.
*   **Multer**: Manages temporary audio file uploads for the voice-to-text pipeline, strictly capped at 4MB to prevent payload crashes.
*   **Express Rate Limiting**: Intelligent cooldowns on all AI endpoints to prevent spam and API credit drainage.

### AI Integration
*   **Groq Cloud SDK**: The backend acts as a secure proxy to Groq's lightning-fast inference engine, ensuring that your `GROQ_API_KEY` is never exposed to the client.

---

## 🛠️ Getting Started (Local Development)

To get a local copy up and running, follow these simple steps.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ags-Ghafoor601/UniGateway.git
   cd UniGateway
   ```

2. **Install NPM packages**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory and add your credentials:
   ```env
   PORT=3000
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Start the Application**
   ```bash
   npm start
   ```
   *The server will start on `http://localhost:3000`.*

---

## 🚀 Deployment Guide

UniGateway is fully optimized for a 1-click deployment to **Vercel**. 

1. **Push to GitHub**: Commit your changes and push them to your repository.
2. **Connect to Vercel**: Import your repository into the Vercel dashboard.
3. **Environment Variables**: Add your `GROQ_API_KEY` securely in the Vercel project settings.
4. **Deploy**: Vercel will automatically read your `vercel.json` file, build the `server.js` function, and host your static frontend at the edge!

---

## 🛡️ Robust Security Measures
*   **Hidden API Keys**: All AI requests are routed through `/api/ai/*` backend endpoints. No keys exist in the frontend JavaScript.
*   **Anti-Spam Feedback**: Client-side `localStorage` limits combined with serverless Firestore writing ensures the database cannot be brought down by traffic spikes.
*   **Rate Limits**: All AI endpoints are capped to 50 requests per hour per IP.
*   **Garbage Collection**: The `voice.js` upload route uses `fs.unlinkSync` to immediately destroy temporary audio chunks after transcription, preventing server bloat.

---

<div align="center">
  <p><b>Built with ❤️ for students.</b></p>
</div>
