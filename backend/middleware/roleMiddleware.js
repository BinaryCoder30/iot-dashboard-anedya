import { ROLES } from "../config/roles.js";

/**
 * Factory: returns middleware that allows only the specified roles.
 * Usage: requireRole("Admin") or requireRole("Admin", "Operator")
 */
const requireRole = (...allowedRoles) => {
  // Validate at startup that caller passed known roles
  allowedRoles.forEach((r) => {
    if (!Object.values(ROLES).includes(r)) {
      throw new Error(`[requireRole] Unknown role: "${r}"`);
    }
  });

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(
        `[RBAC] Access denied — user ${req.user.email} (${req.user.role}) tried to reach a ${allowedRoles.join("/")} route`
      );
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}.`,
      });
    }

    next();
  };
};

export default requireRole;