
export const ROLES = {
  ADMIN: "admin",         // Full Access
  EDITOR: "editor",       // Can Publish/Edit/Delete Articles
  REPORTER: "reporter",   // Can Create/Edit Own Article (Draft Only)
  USER: "user"            // Read Only & Comments
};

// Validation ke liye list
export const ROLE_VALUES = Object.values(ROLES); // ['admin', 'editor', 'reporter', 'user']

// Helper: Check karne ke liye ki kaun permission de sakta hai
export const PERMISSIONS = {
  CAN_PUBLISH: [ROLES.ADMIN, ROLES.EDITOR], // Sirf ye dono publish kar sakte hain
  CAN_EDIT_OTHERS: [ROLES.ADMIN, ROLES.EDITOR],
  CAN_DELETE_USERS: [ROLES.ADMIN]
};