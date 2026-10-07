import mongoose, { Schema, Document } from 'mongoose';

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

export interface IIssue extends Document {
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
  reportedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  remarks?: string;
  resolutionImages: string[];
  resolutionRemarks?: string;
  slaDeadline?: Date;
  resolvedAt?: Date;
  upvoteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema: Schema = new Schema(
  {
    issueId: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    priorityScore: { type: Number, default: 30, min: 0, max: 100 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    location: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    imageUrls: { type: [String], default: [] },
    status: {
      type: String,
      enum: [
        'reported',
        'under_review',
        'verified',
        'assigned',
        'in_progress',
        'resolved',
        'closed',
        'rejected',
      ],
      default: 'reported',
      index: true,
    },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    remarks: { type: String, default: '' },
    resolutionImages: { type: [String], default: [] },
    resolutionRemarks: { type: String, default: '' },
    slaDeadline: { type: Date, required: true },
    resolvedAt: { type: Date, default: null },
    upvoteCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

IssueSchema.index({ title: 'text', description: 'text', location: 'text' });

export default mongoose.model<IIssue>('Issue', IssueSchema);
