// ─── Role Definitions ─────────────────────────────────────────────────────────
export const ROLES = Object.freeze({
  ADMIN:    "Admin",
  OPERATOR: "Operator",
  VIEWER:   "Viewer",
});

export const PERMISSIONS = Object.freeze({
  MANAGE_USERS:   "MANAGE_USERS",
  VIEW_DATA:      "VIEW_DATA",
  CONTROL_DEVICE: "CONTROL_DEVICE",
});

// Each role gets an explicit, immutable permission set
export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]:    Object.freeze([
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_DATA,
    PERMISSIONS.CONTROL_DEVICE,
  ]),
  [ROLES.OPERATOR]: Object.freeze([
    PERMISSIONS.VIEW_DATA,
    PERMISSIONS.CONTROL_DEVICE,
  ]),
  [ROLES.VIEWER]:   Object.freeze([
    PERMISSIONS.VIEW_DATA,
  ]),
});

/**
 * Returns true if the given role has the given permission.
 * @param {string} role
 * @param {string} permission
 */
export const hasPermission = (role, permission) =>
  Array.isArray(ROLE_PERMISSIONS[role]) &&
  ROLE_PERMISSIONS[role].includes(permission);