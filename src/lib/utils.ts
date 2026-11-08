import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Post, User } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely converts any value (Firestore Timestamp, Date, string, null) to a valid JS Date.
 */
export function safeParseDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch {
      // Fallback below
    }
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Checks if a user has permission to view a specific post based on targetAudience, targetDepartment, and targetIndividualUserIds.
 */
export function canUserSeePost(post: Post, user: User | null | undefined): boolean {
  if (!post || !user) return false;
  if (post.status && post.status !== 'published') return false;

  // HQ Admins (non-store admins) can see all posts
  const isHqAdmin = Boolean(user.isAdmin && !user.isStoreAdmin);
  if (isHqAdmin) return true;

  // Author can always see their own post
  if (post.authorId === user.id) return true;

  const targetAudience = post.targetAudience;
  const targetDept = post.targetDepartment;
  const targetIndividuals = Array.isArray(post.targetIndividualUserIds) ? post.targetIndividualUserIds : [];

  // General posts for all company
  if (targetAudience === 'all' || targetDept === 'all' || (!targetAudience && (!targetDept || targetDept === 'all'))) {
    return true;
  }

  // Cross-department individual targeted posts
  if (targetAudience === 'individual') {
    return targetIndividuals.includes(user.id);
  }

  // Department / Store specific targeted posts
  if ((targetAudience === 'department' || targetDept) && targetDept === user.department) {
    if (!post.sendToDepartmentMode || post.sendToDepartmentMode === 'allInDepartment') {
      return true;
    }
    if (post.sendToDepartmentMode === 'individualsInDepartment') {
      return targetIndividuals.includes(user.id);
    }
  }

  return false;
}
