/**
 * Run once to reset the users collection with fresh hashed passwords.
 * Usage:  node seed.js
 */
import mongoose from "mongoose";
import bcrypt   from "bcryptjs";
import dotenv   from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/iotdb";

const userSchema = new mongoose.Schema({
  name:     String,
  email:    { type: String, unique: true },
  password: String,
  role:     String,
  active:   { type: Boolean, default: true },
});
const User = mongoose.model("User", userSchema);

const users = [
  { name: "Admin User",    email: "admin@iothub.io",    password: "admin123",    role: "Admin"    },
  { name: "Operator User", email: "operator@iothub.io", password: "operator123", role: "Operator" },
  { name: "Viewer User",   email: "viewer@iothub.io",   password: "viewer123",   role: "Viewer"   },
];

try {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  await User.deleteMany({});
  console.log("🗑  Cleared existing users");

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    await User.create({ ...u, password: hash });
    console.log(`✅ Created: ${u.email} / ${u.password}  [${u.role}]`);
  }

  console.log("\n🎉 Seed complete. You can now log in with:");
  users.forEach(u => console.log(`   ${u.email}  /  ${u.password}`));
} catch (err) {
  console.error("❌ Seed failed:", err.message);
} finally {
  await mongoose.disconnect();
  process.exit(0);
}