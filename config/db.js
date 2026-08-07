const mongoose = require('mongoose');

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskforge';
    await mongoose.connect(uri);
    console.log(`[DB] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
