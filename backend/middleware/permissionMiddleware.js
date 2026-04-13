import { hasPermission, PERMISSIONS } from "../config/roles.js";

/**
 * Factory: returns middleware that blocks requests where the user's
 * role does not carry the required permission.
 *
 * Usage: requirePermission(PERMISSIONS.CONTROL_DEVICE)
 */
const requirePermission = (permission) => {
  // Validate at startup that the caller passed a known permission
  if (!Object.values(PERMISSIONS).includes(permission)) {
    throw new Error(`[requirePermission] Unknown permission: "${permission}"`);
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }

    if (!hasPermission(req.user.role, permission)) {
      console.warn(
        `[PERMISSION] Denied — ${req.user.email} (${req.user.role}) lacks "${permission}"`
      );
      return res.status(403).json({
        success: false,
        message: `Access denied. You do not have the "${permission}" permission.`,
      });
    }

    next();
  };
};

export default requirePermission;