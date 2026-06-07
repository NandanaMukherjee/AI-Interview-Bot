import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { connectDB } from "./db.js";
import Interview from "./models/Interview.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import { auth } from "./middleware/auth.js";
import Session from "./models/Session.js";

dotenv.config();
console.log("GEMINI KEY:", process.env.GEMINI_API_KEY);
const app = express();

app.use(cors());
app.use(express.json());

// =======================
// DB CONNECT
// =======================
connectDB();

// =======================
// CONFIG
// =======================
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "models/gemini-3.1-flash-lite";

// =======================
// HEALTH CHECK
// =======================
app.get("/", (req, res) => {
  res.send("Backend running with MongoDB + AI + Auth ✅");
});


// ======================================================
// REGISTER
// ======================================================
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.json({ message: "User created", userId: user._id });
  } catch (err) {
    res.status(500).json({ error: "Register failed" });
  }
});


// ======================================================
// LOGIN
// ======================================================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
});


// ======================================================
// GENERATE QUESTIONS
// ======================================================

app.post("/generate-questions", auth, async (req, res) => {
  try {
    const { role, level = "medium" } = req.body;

    if (!role || typeof role !== "string") {
      return res.status(400).json({ error: "Role is required" });
    }

    const prompt = `
Generate 5 interview questions for ${role} (${level})
Only numbered list
No extra text
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: "Empty AI response" });
    }

    return res.json({ questions: text });

  } catch (err) {
    console.log("❌ GEMINI ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      error: "Failed to generate questions",
      details: err.response?.data || err.message,
    });
  }
});
// ======================================================
// EVALUATE
// ======================================================
app.post("/evaluate", auth, async (req, res) => {
  try {
    const { question, answer, role, level } = req.body;

    if (!question || !role) {
      return res.status(400).json({
        error: "Question and role are required",
      });
    }

    const safeAnswer =
      answer && answer.trim()
        ? answer.trim()
        : "User did not know the answer";

    const prompt = `
You are a FAANG-level senior technical interviewer.

STRICT RULES:
- Return ONLY valid JSON
- No markdown
- No explanations
- No text outside JSON

JSON FORMAT:
{
  "score": "X/10",
  "strongPoints": ["..."],
  "weakPoints": ["..."],
  "flaws": ["..."],
  "improvedAnswer": "...",
  "tipsToImprove": ["..."]
}

QUESTION:
${question}

USER ANSWER:
${safeAnswer}
`;

    // 🔥 GEMINI CALL (stable format)
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.log("❌ Empty Gemini response:", response.data);

      return res.status(500).json({
        error: "Empty response from AI model",
      });
    }

    // 🔥 safer JSON extraction (not regex-only)
    let parsed = null;

    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");

      if (start !== -1 && end !== -1) {
        const jsonString = text.slice(start, end + 1);
        parsed = JSON.parse(jsonString);
      }
    } catch (err) {
      console.log("❌ JSON Parse Error:", err.message);
    }

    // fallback (prevents crash)
    if (!parsed) {
      parsed = {
        score: "0/10",
        strongPoints: [],
        weakPoints: [],
        flaws: ["Failed to parse AI response"],
        improvedAnswer: text,
        tipsToImprove: [],
      };
    }

    await Interview.create({
      userId: req.userId,
      role,
      level,
      question,
      answer: safeAnswer,
      evaluation: parsed,
    });

    res.json({ result: parsed });
  } catch (err) {
    console.log("❌ FULL ERROR:", err.response?.data || err.message);

    res.status(500).json({
      error: "Evaluation failed",
      details: err.response?.data || err.message,
    });
  }
});

// ======================================================
// HISTORY
// ======================================================
app.get("/history", auth, async (req, res) => {
  try {
    const data = await Interview.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});


// ======================================================
// SESSION ROUTES (FIXED ORDER)
// ======================================================

app.post("/start-session", auth, async (req, res) => {
  try {
    const { role, level, questions } = req.body;

    const session = await Session.create({
      userId: req.userId,
      role,
      level,
      questions,
      answers: [],
      finalScore: 0,
    });

    res.json({ sessionId: session._id });
  } catch (err) {
    res.status(500).json({ error: "Session start failed" });
  }
});


app.post("/update-session", auth, async (req, res) => {
  try {
    const { sessionId, question, answer, evaluation } = req.body;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.answers.push({ question, answer, evaluation });

    await session.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Session update failed" });
  }
});


app.post("/end-session", auth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const total = session.answers.reduce((sum, a) => {
      const score = parseInt(a.evaluation?.score) || 0;
      return sum + score;
    }, 0);

    const finalScore =
      session.answers.length > 0
        ? total / session.answers.length
        : 0;

    session.finalScore = finalScore;

    await session.save();

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: "Session end failed" });
  }
});


// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
