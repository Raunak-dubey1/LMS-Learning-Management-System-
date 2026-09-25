import { roles } from '../config/constants.js';

export const normalizeRole = (role = '') => String(role).trim().toLowerCase();

export const hasRequiredRole = (userRole, allowedRoles = []) => {
  const normalizedUserRole = normalizeRole(userRole);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (normalizedUserRole === roles.ADMIN) {
    return true;
  }

  return normalizedAllowedRoles.includes(normalizedUserRole);
};
