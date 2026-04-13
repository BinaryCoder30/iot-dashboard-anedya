import { Router } from "express";
import { register, login, getMe } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

// ✅ FULLY PUBLIC — zero middleware before these two
router.post("/register", register);
router.post("/login",    login);

// 🔒 Only /me is protected
router.get("/me", authMiddleware, getMe);

export default router;