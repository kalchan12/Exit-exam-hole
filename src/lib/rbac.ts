import type { UserRole } from './constants/admin';

const ADMIN_USERNAMES = new Set(['psycho']);

const roleCache = new Map<string, UserRole>();

/** Get the role for a given username, with caching. */
export function getUserRole(username: string | undefined | null): UserRole {
  if (!username) return 'user';
  const cached = roleCache.get(username);
  if (cached) return cached;

  const role: UserRole = ADMIN_USERNAMES.has(username) ? 'admin' : 'user';
  roleCache.set(username, role);
  return role;
}

/** Check if a username has the admin role. */
export function isAdmin(username: string | undefined | null): boolean {
  return getUserRole(username) === 'admin';
}

/** Check if a user can manage questions (admin or moderator). */
export function canManageQuestions(username: string | undefined | null): boolean {
  const role = getUserRole(username);
  return role === 'admin' || role === 'moderator';
}

/** Clear the role cache for a specific user or all users. */
export function invalidateRoleCache(username?: string): void {
  if (username) roleCache.delete(username);
  else roleCache.clear();
}
