import mongoose, { Schema, Document } from 'mongoose';

export interface IIssueTimeline extends Document {
  issue: mongoose.Types.ObjectId;
  status: string;
  message: string;
  changedBy: mongoose.Types.ObjectId;
  remarks?: string;
  createdAt: Date;
}

const IssueTimelineSchema: Schema = new Schema(
  {
    issue: { type: Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    status: { type: String, required: true },
    message: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IIssueTimeline>('IssueTimeline', IssueTimelineSchema);
