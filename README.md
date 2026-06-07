# AI Interview Bot 🚀

An AI-powered technical mock interview platform built using **React**, **Node.js/Express**, and **MongoDB**. The platform simulates real interview experiences by generating role-specific technical questions, evaluating candidate responses using **Google Gemini Flash-Lite**, and tracking interview performance through persistent session management.

---

## ✨ Features

* 🔐 User Authentication (JWT + bcryptjs)
* 👤 User Registration & Login
* 🤖 AI-Generated Technical Interview Questions
* 📝 Real-Time Answer Evaluation
* 📊 Score Tracking & Performance Analytics
* 💾 MongoDB-Based Session Storage
* 📜 Interview History
* 🎯 Role-Based Interview Generation
* ⚡ Powered by Google Gemini Flash-Lite

---

## 📂 Project Structure

```text
AI_INTERVIEW_BOT/
│
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── models/
│   │   ├── Interview.js
│   │   ├── Session.js
│   │   └── User.js
│   │
│   ├── .env
│   ├── db.js
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │
│   ├── src/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Axios
* CSS3

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose ODM

### Authentication

* JSON Web Tokens (JWT)
* bcryptjs

### AI Engine

* Google Gemini API
* Model: `gemini-3.1-flash-lite`

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd AI_INTERVIEW_BOT
```

---

### 2. Configure .gitignore

Create a `.gitignore` file in the root directory:

```gitignore
node_modules/
backend/node_modules/
frontend/node_modules/

.env
backend/.env

dist/
.DS_Store
```

---

### 3. Backend Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secure_jwt_secret

GEMINI_API_KEY=your_google_ai_studio_api_key
```

---

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

---

### 5. Start Backend Server

```bash
npm start
```

Server will run on:

```text
http://localhost:5000
```

---

### 6. Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

---

### 7. Start Frontend Application

```bash
npm run dev
```

Frontend will run on:

```text
http://localhost:5173
```

---

## 🔄 Application Workflow

### 1. User Authentication

* User registers or logs in.
* Passwords are securely hashed using bcryptjs.
* JWT tokens are issued for authenticated requests.

---

### 2. Interview Generation

* User selects a target role (e.g., Frontend Developer, AI/ML Engineer).
* Frontend sends a request to:

```http
POST /generate-questions
```

* Backend invokes Gemini Flash-Lite to generate five role-specific technical questions.

---

### 3. Session Creation

* Backend creates a new interview session.
* Session details are stored in MongoDB.

```http
POST /start-session
```

---

### 4. Answer Evaluation

For each submitted answer:

```http
POST /evaluate-answer
```

Gemini evaluates the response and returns structured feedback:

```json
{
  "score": 8,
  "strongPoints": [
    "Good explanation of concepts"
  ],
  "flaws": [
    "Missed edge cases"
  ],
  "improvedAnswer": "A stronger answer would include..."
}
```

---

### 5. Session Updates

After evaluation:

```http
POST /update-session
```

The system stores:

* Question
* User Answer
* Score
* Strengths
* Weaknesses
* Improved Answer

inside the active MongoDB session document.

---

### 6. Interview Completion

When the user clicks **Finish Interview**:

```http
POST /end-session
```

The backend:


* Aggregates interview data
* Updates session status
* Stores final interview results

---

## 📊 Scoring System

| Metric                     | Value |
| -------------------------- | ----- |
| Questions                  | 5     |
| Maximum Score per Question | 10    |
| Total Maximum Score        | 50    |



---

## 🔐 Security

* Password hashing with bcryptjs
* JWT-based authentication
* Environment variable protection
* MongoDB connection secured through `.env`
* Sensitive credentials excluded from Git tracking

---

## 🚀 Future Enhancements

* Resume Upload & Parsing
* AI-Powered Resume Analysis
* Behavioral Interview Mode
* Speech-to-Text Interviews
* Video Interview Support
* Performance Analytics Dashboard
* Skill Gap Recommendations
* Admin Panel
* Email Reports
* Deployment on Vercel & Render

---

## 👨‍💻 Author

Developed as an AI-powered technical interview preparation platform using modern full-stack technologies and Google's Gemini AI models.

---

## 📜 License

This project is intended for educational and portfolio purposes.
