import { useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "https://ai-interview-bot-1-pgzl.onrender.com"; // Synchronized to match standard node backend output

export default function App() {
  // AUTH
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  // SESSION
  const [sessionId, setSessionId] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [finalScore, setFinalScore] = useState(null);

  // INTERVIEW
  const [role, setRole] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);

  // AUTH INPUTS
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  // UI STATE
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ======================
  // AUTH HEADER FIX
  // ======================
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    if (!token || token === "null" || token === "undefined") return null;

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // ======================
  // REGISTER
  // ======================
  const register = async () => {
    try {
      setLoading(true);
      setError("");

      await axios.post(`${API_BASE}/register`, {
        name,
        email,
        password,
      });

      alert("Registered successfully!");
      setIsLogin(true);
    } catch (err) {
      setError(err.response?.data?.error || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // LOGIN
  // ======================
  const login = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.post(`${API_BASE}/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setUser(res.data.user);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // LOGOUT
  // ======================
  const logout = () => {
    localStorage.clear();

    setUser(null);
    setIsLoggedIn(false);
    setQuestions([]);
    setSessionId(null);
    setAnswers([]);
    setFinalScore(null);
    setCurrentIndex(0);
    setAnswer("");
    setResult(null);
  };

  // ======================
  // GENERATE QUESTIONS
  // ======================
  const generateQuestions = async () => {
    if (!role.trim()) {
      setError("Please enter a role");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token || token === "null") {
        setError("Session expired. Please login again.");
        setLoading(false);
        return;
      }

      const res = await axios.post(
        `${API_BASE}/generate-questions`,
        {
          role: role.trim(),
          level: "medium",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = res.data?.questions;

      if (!text || typeof text !== "string") {
        setError("Server did not return questions");
        return;
      }

      const qList = text
        .split("\n")
        .map((q) => q.replace(/^\d+\.\s*/, "").trim())
        .filter((q) => q.length > 0);

      if (qList.length === 0) {
        setError("Failed to parse questions");
        return;
      }

      setQuestions(qList);
      setCurrentIndex(0);
      setAnswer("");
      setResult(null);
      setAnswers([]);
      setFinalScore(null);

      const sessionRes = await axios.post(
        `${API_BASE}/start-session`,
        {
          role,
          level: "medium",
          questions: qList,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSessionId(sessionRes.data.sessionId);
    } catch (err) {
      console.log("❌ FULL ERROR:", err.response?.data);
      console.log("❌ STATUS:", err.response?.status);

      setError(
        err.response?.data?.error ||
          err.response?.data?.details?.error?.message ||
          "Failed to generate questions"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // SUBMIT ANSWER
  // ======================
  const submitAnswer = async () => {
    if (!answer.trim()) {
      setError("Please write an answer");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const config = getAuthConfig();
      if (!config) return;

      const res = await axios.post(
        `${API_BASE}/evaluate`,
        {
          question: questions[currentIndex],
          answer,
          role,
          level: "medium",
          sessionId, // Passed down seamlessly to avoid standalone endpoint updates
        },
        config
      );

      let data = res.data.result;

      if (typeof data === "string") {
        const match = data.match(/\{[\s\S]*\}/);
        if (match) data = JSON.parse(match[0]);
      }

      setResult(data);

      const newAnswer = {
        question: questions[currentIndex],
        answer,
        evaluation: data,
      };

      setAnswers((prev) => [...prev, newAnswer]);
    } catch (err) {
      setError(err.response?.data?.error || "Evaluation failed");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // NEXT
  // ======================
  const nextQuestion = () => {
    if (currentIndex >= questions.length - 1) {
      finishInterview();
      return;
    }

    setAnswer("");
    setResult(null);
    setCurrentIndex((p) => p + 1);
  };

  // ======================
  // FINISH
  // ======================
  const finishInterview = async () => {
    try {
      setLoading(true);
      setError("");
      const config = getAuthConfig();
      if (!config || !sessionId) return;

      const res = await axios.post(
        `${API_BASE}/end-session`,
        { sessionId },
        config
      );

      setFinalScore(res.data.finalScore);
    } catch (err) {
      console.log(err.message);
      setError("Failed to wrap up interview details.");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // UI
  // ======================
  if (!isLoggedIn) {
    return (
      <div className="container">
        <h1>{isLogin ? "Login" : "Register"}</h1>

        {error && <p className="error">{error}</p>}
        {loading && <p className="loading">Loading...</p>}

        {!isLogin && (
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={isLogin ? login : register} disabled={loading}>
          {isLogin ? "Login" : "Register"}
        </button>

        <p style={{ marginTop: "10px" }}>
          {isLogin ? "New user?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            disabled={loading}
          >
            {isLogin ? "Register here" : "Login here"}
          </button>
        </p>
      </div>
    );
  }

  // Final performance evaluation dashboard layout
  if (finalScore !== null) {
    return (
      <div className="container">
        <h1>Interview Complete! 🎉</h1>
        <div className="question-box" style={{ textAlign: "center", padding: "30px" }}>
          
          <p style={{ margin: "15px 0", color: "#666" }}>
            Great job completing your mock interview window for the <strong>{role}</strong> position!
          </p>
          <button onClick={logout} style={{ marginTop: "10px" }}>
            Start Fresh Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>AI Interview Bot</h1>

      <div className="top-right">
        <button onClick={logout}>Logout</button>
        <span>{user?.name}</span>
      </div>

      {questions.length === 0 ? (
        <div className="question-box">
          <input
            placeholder="Enter role (e.g. Frontend Engineer)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
          />

          <button onClick={generateQuestions} disabled={loading}>
            {loading ? "Generating..." : "Start Interview"}
          </button>

          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <div className="question-box">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#666" }}>
            <span>Question {currentIndex + 1} of {questions.length}</span>
          </div>

          <h3>{questions[currentIndex]}</h3>

          {error && <p className="error">{error}</p>}

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your technical response here..."
            disabled={loading || result !== null}
          />

          <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
            <button onClick={submitAnswer} disabled={loading || !answer.trim() || result !== null}>
              {loading && !result ? "Evaluating..." : "Submit Answer"}
            </button>

            <button onClick={nextQuestion} disabled={loading || result === null}>
              {currentIndex >= questions.length - 1 ? "Finish Interview 🏁" : "Next Question ➡️"}
            </button>
          </div>

          {result && (
            <div className="result-box" style={{ marginTop: "20px", textAlign: "left", background: "#f9f9f9", padding: "15px", borderRadius: "8px" }}>
              <h4>Score: {result.score}</h4>
              <p><strong>Feedback:</strong> {result.improvedAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}