const mongoose = require('mongoose');
const { TASK_STATUS, TASK_PRIORITY } = require('../utils/constants');

const attachmentSchema = new mongoose.Schema(
  {
    originalName: String,
    filename: String,
    path: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Task title is required'], trim: true, maxlength: 150 },
    description: { type: String, trim: true, default: '', maxlength: 2000 },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    priority: { type: String, enum: TASK_PRIORITY, default: 'Medium' },
    dueDate: { type: Date, required: [true, 'Due date is required'] },
    status: { type: String, enum: TASK_STATUS, default: 'To Do' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: [attachmentSchema],
    deadlineNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

taskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', taskSchema);
