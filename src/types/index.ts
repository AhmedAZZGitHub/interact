/**
 * ==========================================================================
 * INTERACT MULTI-TENANT PLATFORM - TYPE DEFINITIONS (TypeScript)
 * Full RBAC, Multi-Tenant Hierarchy, Firestore Schema & Data Models
 * ==========================================================================
 */

export type ClubStatus = 'pending_superadmin' | 'active' | 'suspended';

export type UserStatus = 'pending_superadmin' | 'pending_president' | 'active' | 'rejected';

export type UserRole =
  | 'superadmin'
  | 'president'
  | 'vice_president'
  | 'secretaire'
  | 'protocole'
  | 'chef_commission'
  | 'co_chef'
  | 'representant'
  | 'membre'
  | 'recrue'
  | 'guest';

export interface MandateRecord {
  year: string; // e.g. "2024-2025"
  role: UserRole;
  commissionName?: string;
  notes?: string;
}

export interface Club {
  id: string;
  name: string;
  district: string; // e.g. "District 9010 (Tunisie, Algérie, Maroc, Mauritanie)"
  sponsorRotaryClub?: string;
  logoUrl?: string;
  description?: string;
  status: ClubStatus;
  presidentUid: string;
  presidentName: string;
  presidentEmail: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string; // formatted with country code e.g. "+216 98 123 456"
  birthDate?: string; // YYYY-MM-DD
  photoURL?: string;
  clubId: string;
  isSuperAdmin: boolean;
  role: UserRole;
  status: UserStatus;
  commissionIds: string[];
  strikesCount: number;
  history?: MandateRecord[];
  joinedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  stats?: {
    tasksCompleted: number;
    tasksOverdue: number;
    meetingsAttended: number;
    meetingsTotal: number;
  };
}

export interface Commission {
  id: string;
  clubId: string;
  name: string;
  type: 'action_sociale' | 'relations_publiques' | 'finances_sponsoring' | 'developpement_interne' | 'seminaires_formation';
  icon: string;
  description: string;
  chefUid: string;
  coChefUid?: string;
  headIds: string[];
  memberIds: string[];
  createdAt: string;
}

export interface Action {
  id: string;
  clubId: string;
  commissionId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'en_cours' | 'terminee';
  createdAt: string;
  createdBy: string;
}

export interface Task {
  id: string;
  clubId: string;
  commissionId: string;
  actionId: string;
  title: string;
  description?: string;
  assignedTo: string[]; // array of UIDs
  deadline: string; // ISO 8601 string
  status: 'faite' | 'non_faite';
  priority: 'normal' | 'warning' | 'urgent';
  flagReview: boolean; // if true, Chef has temporarily frozen automatic sanctions for evaluation
  autoSanctionApplied: boolean;
  createdAt: string;
  completedAt?: string;
}

export type ChannelType = 'announcements' | 'commission' | 'task_custom';

export interface Channel {
  id: string;
  clubId: string;
  name: string;
  type: ChannelType;
  description?: string;
  commissionId?: string;
  taskId?: string;
  allowedWriters: string[]; // Role strings or User UIDs
  meetUrl?: string; // Google Meet, Jitsi Meet or Agora room URL
  createdById: string;
  createdAt: string;
}

export interface MessageReaction {
  emoji: '👍' | '❤️' | '🔥' | '🎉' | '👀';
  uids: string[];
}

export interface Message {
  id: string;
  channelId: string;
  clubId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  reactions: Record<string, string[]>; // { '👍': ['uid1', 'uid2'], '❤️': ['uid3'] }
}

export type SanctionType = 'tache_non_faite' | 'absence_reunion' | 'manquement_disciplinaire';
export type SanctionStatus = 'pending_review' | 'approved' | 'rejected' | 'excused';
export type SanctionSeverity = 'avertissement' | 'sanction_legere' | 'sanction_lourde';

export interface Sanction {
  id: string;
  clubId: string;
  userId: string;
  userName: string;
  taskId?: string;
  actionTitle?: string;
  type: SanctionType;
  status: SanctionStatus;
  severity: SanctionSeverity;
  reason: string;
  delayHours?: number;
  reviewedBy?: string;
  reviewedAt?: string;
  excuseReason?: string;
  createdAt: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  clubId: string;
  commissionId: string;
  submittedBy: string[]; // array of UIDs
  submittedByName: string;
  textNotes: string;
  fileUrls: string[]; // links to drive, images, or documents
  submittedAt: string;
  validated: boolean;
  validatedBy?: string;
  validatedAt?: string;
  feedbackNotes?: string;
}

export interface ClubEvent {
  id: string;
  clubId: string;
  title: string;
  type: 'statutaire' | 'action' | 'deadline' | 'formation';
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  isPublicToClub: boolean;
  createdById: string;
  createdAt: string;
}
