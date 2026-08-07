const mongoose = require('mongoose');
const { PROJECT_STATUS, PROJECT_PRIORITY } = require('../utils/constants');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Project name is required'], trim: true, maxlength: 120 },
    description: { type: String, required: [true, 'Project description is required'], trim: true, maxlength: 2000 },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: 'End date must be after the start date',
      },
    },
    priority: { type: String, enum: PROJECT_PRIORITY, default: 'Medium' },
    status: { type: String, enum: PROJECT_STATUS, default: 'Planning' },
    projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

projectSchema.index({ name: 'text', description: 'text' });

// Virtual: task progress computed on demand via statics, kept lightweight here
projectSchema.virtual('isOverdue').get(function () {
  return this.status !== 'Completed' && this.endDate < new Date();
});

projectSchema.set('toObject', { virtuals: true });
projectSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Project', projectSchema);
