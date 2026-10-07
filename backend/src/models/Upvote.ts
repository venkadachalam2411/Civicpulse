import mongoose, { Schema, Document } from 'mongoose';

export interface IUpvote extends Document {
  issue: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
}

const UpvoteSchema: Schema = new Schema(
  {
    issue: { type: Schema.Types.ObjectId, ref: 'Issue', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

UpvoteSchema.index({ issue: 1, user: 1 }, { unique: true });

export default mongoose.model<IUpvote>('Upvote', UpvoteSchema);
