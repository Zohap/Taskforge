const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    checkIn: {
      type: Date,
      default: null,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ['Present', 'Late', 'Absent'],
      default: 'Present',
    },

    workingHours: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One attendance record per user per day
attendanceSchema.index(
  { user: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);