
import type { User } from './types';

// This type is used for seeding and includes password for the old auth system.
// With Firebase Auth, this is no longer secure or necessary.
export type StoredUser = User & { password?: string };

// By switching to Firebase Authentication, user creation must be handled
// through the registration form to securely create users in the Auth system.
// Seeding users with plaintext passwords from a file is insecure and incompatible
// with the new system. Therefore, the initial user list is now empty.
// Please use the registration form to create new users.
export const initialUsers: StoredUser[] = [];
