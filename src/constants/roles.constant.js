
export const ROLES = {
  ADMIN: "admin",         // Full Access
  EDITOR: "editor",       // Can Publish/Edit/Delete Articles
  REPORTER: "reporter",   // Can Create/Edit Own Article (Draft Only)
  USER: "user"            // Read Only & Comments
};

// All valid role values as an array for validation
export const ROLE_VALUES = Object.values(ROLES);

// Permission groups for role-based access control
export const PERMISSIONS = {
  CAN_PUBLISH: [ROLES.ADMIN, ROLES.EDITOR],
  CAN_EDIT_OTHERS: [ROLES.ADMIN, ROLES.EDITOR],
  CAN_DELETE_USERS: [ROLES.ADMIN]
};