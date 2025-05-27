const userAnswerSchema = new Schema({
  question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
  response: { type: String, required: true },
  answeredAt: { type: Date, default: Date.now },
});

const userSchema = new Schema(
  {
    username: String,
    totalQuestionsAnswered: { type: Number, default: 0 },
    answerCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
