require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const { ROLES } = require('../utils/constants');

async function run() {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@taskforge.com';
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    console.log(`[Seed] Admin already exists: ${adminEmail}`);
  } else {
    await User.create({
      name: process.env.ADMIN_NAME || 'System Administrator',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: ROLES.ADMIN,
      jobTitle: 'System Administrator',
    });
    console.log(`[Seed] Admin created: ${adminEmail} / ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
  }

  console.log('[Seed] Done. You can now log in with the admin account and create other users from the Admin Portal.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
