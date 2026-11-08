
import type { Department, PostCategory } from './constants';
import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  loginId?: string; // Made optional
  name: string;
  department: Department;
  iconUrl?: string | null;
  email: string;
  role: 'user' | 'admin';
  isStoreAdmin?: boolean; // New property to distinguish store-level admins
}

export interface Post {
  id:string;
  title: string;
  category: PostCategory;
  body: string;
  authorId: string;
  authorName: string;
  authorIconUrl?: string | null; // For consistency in PostCard display
  authorDepartment: Department;
  createdAt: Date;
  updatedAt: Date;
  isImportant: boolean;
  isPinned: boolean;
  status: 'published' | 'draft' | 'archived';
  attachments?: { name: string; url: string }[];
  images?: { name: string; url: string }[];
  targetAudience?: 'all' | 'department' | 'individual'; // Added 'individual'
  targetDepartment?: string; // Can be a Department, 'all', or 'individual'
  sendToDepartmentMode?: 'allInDepartment' | 'individualsInDepartment'; // For department targeting logic
  targetIndividualUserIds?: string[]; // For specific users within a department or general individual targeting
  targetIndividualUserNames?: string[]; // For displaying names of targeted users
  scheduledAt?: Date;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  isRead?: boolean;
  likes?: string[];
  likedByUsers?: { id: string; name: string; iconUrl?: string | null }[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorDepartment: Department;
  authorIconUrl?: string | null;
  text: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  link: string;
  createdAt: Date;
  isRead: boolean;
}

// This is now a simple token, not tied to a specific user beforehand.
export interface Invitation {
  id: string;
  createdAt: Date | Timestamp;
}

export interface SystemSettings {
  status: 'running' | 'maintenance';
}
