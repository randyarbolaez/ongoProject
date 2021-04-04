const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const taskSchema = new Schema(
  {
    task: { type: String, required: true },
    completed: { type: Boolean, required: true, default: false },
    followers: { type: Array },
    user: Schema.Types.ObjectId,
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
