import { Router } from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/roleMiddleware.js";
import requirePermission from "../middleware/permissionMiddleware.js";
import { ROLES, PERMISSIONS } from "../config/roles.js";

const router = Router();

// All user routes require authentication + MANAGE_USERS permission
router.use(authMiddleware, requirePermission(PERMISSIONS.MANAGE_USERS));

// ─── GET /api/users ───────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const users = await User.find().select("-password").lean();
    console.log(`[USERS] List fetched by ${req.user.email}`);
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/users/:id  (update role) ───────────────────────────────────────
router.put("/:id", async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role)
      return res.status(400).json({ success: false, message: "Role is required" });

    if (!Object.values(ROLES).includes(role))
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${Object.values(ROLES).join(", ")}`,
      });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    console.log(`[USERS] Role updated: ${user.email} → ${role} (by ${req.user.email})`);
    res.json({ success: true, message: "Role updated successfully", user });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/users/deactivate/:id ───────────────────────────────────────────
router.put("/deactivate/:id", async (req, res, next) => {
  try {
    // Prevent self-deactivation
    if (req.params.id === req.user.id)
      return res.status(400).json({ success: false, message: "You cannot deactivate your own account" });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    ).select("-password");

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    console.log(`[USERS] Deactivated: ${user.email} (by ${req.user.email})`);
    res.json({ success: true, message: "User deactivated successfully", user });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
router.delete("/:id", requireRole(ROLES.ADMIN), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    console.log(`[USERS] Deleted: ${user.email} (by ${req.user.email})`);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;