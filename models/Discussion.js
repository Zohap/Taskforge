const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: [true, 'Message cannot be empty'], trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Discussion', discussionSchema);
