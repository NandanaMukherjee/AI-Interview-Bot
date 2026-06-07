import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    role: String,
    level: String,
    question: String,
    answer: String,
    evaluation: Object,
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);