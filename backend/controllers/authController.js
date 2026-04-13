import jwt  from "jsonwebtoken";
import User from "../models/User.js";
import { ROLES } from "../config/roles.js";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

// ─── POST /api/auth/register ──────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || name.trim().length < 2)
      return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });
    if (!email || !EMAIL_REGEX.test(email))
      return res.status(400).json({ success: false, message: "Valid email is required" });
    if (!password || password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    if (role && !Object.values(ROLES).includes(role))
      return res.status(400).json({ success: false, message: `Role must be: ${Object.values(ROLES).join(", ")}` });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists)
      return res.status(409).json({ success: false, message: "Email already registered" });

    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password,
      role:     role || ROLES.VIEWER,
    });

    const token = generateToken(user);
    console.log(`[AUTH] Registered: ${user.email} (${user.role})`);

    const safe = user.toObject();
    delete safe.password;

    res.status(201).json({ success: true, message: "Registration successful", token, role: user.role, user: safe });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log(`[AUTH] Login attempt — email: "${email}"`);

    // 1. Basic input check
    if (!email || !EMAIL_REGEX.test(email))
      return res.status(400).json({ success: false, message: "Valid email is required" });
    if (!password)
      return res.status(400).json({ success: false, message: "Password is required" });

    // 2. Find user — MUST use .select("+password") because field has select:false
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    console.log(`[AUTH] User lookup result: ${user ? user.email : "NOT FOUND"}`);

    if (!user)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    // 3. Check active
    if (!user.active) {
      console.log(`[AUTH] Account inactive: ${user.email}`);
      return res.status(403).json({ success: false, message: "Account has been deactivated" });
    }

    // 4. Compare password
    const isMatch = await user.comparePassword(password);
    console.log(`[AUTH] Password match: ${isMatch}`);

    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    // 5. Success
    const token = generateToken(user);
    console.log(`[AUTH] Login success: ${user.email} (${user.role})`);

    const safe = user.toObject();
    delete safe.password;

    res.json({ success: true, message: "Login successful", token, role: user.role, user: safe });
  } catch (err) {
    console.error("[AUTH] Login error:", err);
    next(err);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const safe = user.toObject();
    delete safe.password;
    res.json({ success: true, user: safe });
  } catch (err) {
    next(err);
  }
};