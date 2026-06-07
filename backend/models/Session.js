import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    userId: String,
    role: String,
    level: String,
    questions: [String],
    answers: [
      {
        question: String,
        answer: String,
        evaluation: Object,
      },
    ],
    finalScore: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Session", SessionSchema);