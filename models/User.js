const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.TEAM_MEMBER,
    },
    jobTitle: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '', maxlength: 500 },
    avatarInitials: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    const parts = this.name.trim().split(/\s+/);
    this.avatarInitials = parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('');
  }
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
