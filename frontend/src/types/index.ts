export type UserRole = 'citizen' | 'officer' | 'admin';
export type SeverityType = 'low' | 'medium' | 'high' | 'critical';
export type PriorityType = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatusType =
  | 'reported'
  | 'under_review'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'rejected';

export interface IUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department?: string;
  employeeId?: string;
  active?: boolean;
  mustChangePassword?: boolean;
  profileImage?: string;
  activeTasks?: number;
  resolvedTasks?: number;
  totalTasks?: number;
  createdAt?: string;
}

export interface IIssue {
  _id: string;
  issueId: string;
  title: string;
  description: string;
  category: string;
  severity: SeverityType;
  priorityScore: number;
  priority: PriorityType;
  location: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
  status: IssueStatusType;
  reportedBy: IUser;
  assignedTo?: IUser;
  remarks?: string;
  resolutionImages: string[];
  resolutionRemarks?: string;
  slaDeadline: string;
  resolvedAt?: string;
  upvoteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  active: boolean;
}

export interface INotification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface IIssueTimeline {
  _id: string;
  status: string;
  message: string;
  changedBy: {
    _id: string;
    name: string;
    role: string;
  };
  remarks?: string;
  createdAt: string;
}

export interface IAnalyticsMetrics {
  totalIssues: number;
  pendingIssues: number;
  verifiedIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  closedIssues: number;
  rejectedIssues: number;
  slaBreached: number;
  slaBreachedIssues?: number;
  resolutionRate: number;
  slaCompliance: number;
}

export interface IAnalyticsData {
  totalIssues?: number;
  pendingIssues?: number;
  verifiedIssues?: number;
  inProgressIssues?: number;
  resolvedIssues?: number;
  closedIssues?: number;
  rejectedIssues?: number;
  slaBreachedIssues?: number;
  resolutionRate?: number;
  slaCompliance?: number;
  metrics: IAnalyticsMetrics;
  categoryStats: { category: string; count: number }[];
  issuesByCategory?: { category: string; count: number }[];
  statusStats: { status: string; count: number }[];
  issuesByStatus?: { status: string; count: number }[];
  priorityStats: { priority: string; count: number }[];
  issuesByPriority?: { priority: string; count: number }[];
  officerWorkload: { name: string; department: string; assigned: number; resolved: number }[];
  monthlyTrends: { month: string; total: number; resolved: number }[];
}
