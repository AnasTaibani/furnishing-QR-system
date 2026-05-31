import bcrypt from 'bcryptjs';

// Hardcoded admin credentials for MVP
const ADMIN_USERNAME = 'luxurandlavish';
const ADMIN_PASSWORD = 'a1b2c3d4'; // In production, this should be hashed

/**
 * Validate admin credentials
 * @param {string} username
 * @param {string} password
 * @returns {boolean}
 */
export function validateAdminCredentials(username, password) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/**
 * Verify session token from cookie
 * @param {string} token
 * @returns {boolean}
 */
export function verifySession(token) {
  // Simple token validation for MVP
  // In production, use JWT or proper session management
  return token === 'admin-session-token';
}

/**
 * Get session token
 * @returns {string}
 */
export function getSessionToken() {
  return 'admin-session-token';
}
