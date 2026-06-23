<div align="center">
  
  # 🎓 UniGateway
  **The Ultimate AI-Powered Academic Companion & University Navigator**

  <p align="center">
    <img src="https://img.shields.io/badge/Status-Production_Ready-brightgreen?style=for-the-badge&logo=github" alt="Status" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
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
*   **🔒 Secure Authentication**: Robust user management powered by Google Firebase Auth.

---

## 🏗️ Architecture & Tech Stack

UniGateway utilizes a hybrid architecture for maximum performance and security:

### Frontend
*   **HTML5 / CSS3 / Vanilla JavaScript**: Lightweight, ultra-fast client rendering.
*   **Tailwind CSS**: Utility-first styling for a beautiful, modern, dark-themed UI.
*   **Animations**: Custom CSS keyframes (`float`, `slide-up`, `pop`) for a premium user experience.

### Backend
*   **Node.js & Express.js**: Handles API routing, static file serving, and secure proxying.
*   **Multer**: Manages temporary audio file uploads for the voice-to-text pipeline.

### Databases
*   **Firebase Authentication**: Handles secure user registration, login, and profile management.
*   **MySQL**: Relational database used to capture and store student feedback securely.

### AI Integration
*   **Groq Cloud SDK**: The backend acts as a secure proxy to Groq's lightning-fast inference engine, ensuring that `GROQ_API_KEY` is never exposed to the client.

---

## 🛠️ Getting Started (Local Development)

To get a local copy up and running, follow these simple steps.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16 or higher)
*   [MySQL Server](https://dev.mysql.com/downloads/installer/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YourUsername/unigateway.git
   cd unigateway
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
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=unigateway_db
   ```

4. **Initialize the Database**
   Run the included setup script to automatically create the MySQL database and tables:
   ```bash
   node setup-db.js
   ```

5. **Start the Application**
   ```bash
   npm start
   ```
   *The server will start on `http://localhost:3000`.*

---

## 🚀 Deployment Guide

UniGateway is fully configured for modern cloud deployment. 

1. **Database Hosting (Aiven.io)**: Create a free MySQL instance on Aiven. Retrieve the Host, User, and Password, and update your `.env` variables in your hosting provider.
2. **Web Hosting (Render.com)**: 
   * Connect your GitHub repository to a new Render "Web Service".
   * Build Command: `npm install`
   * Start Command: `npm start`
   * Add your `.env` variables in the Render dashboard.

*(The `package.json` and `server.js` dynamic port binding are already optimized for Render).*

---

## 🛡️ Security Measures
*   **Hidden API Keys**: All AI requests are routed through `/api/ai/*` backend endpoints. No keys exist in the frontend JavaScript.
*   **Garbage Collection**: The `voice.js` upload route uses `fs.unlinkSync` to immediately destroy temporary audio chunks after transcription, preventing server bloat.
*   **Git Ignore Strategy**: `.env`, `node_modules/`, and `uploads/` are strictly ignored from source control.

---

<div align="center">
  <p><b>Built with ❤️ for students.</b></p>
</div>
