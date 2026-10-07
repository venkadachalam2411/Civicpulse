import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'citizen' | 'officer' | 'admin';
  department?: string;
  employeeId?: string;
  active: boolean;
  mustChangePassword: boolean;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['citizen', 'officer', 'admin'], default: 'citizen' },
    department: { type: String, default: '' },
    employeeId: { type: String, uppercase: true, trim: true },
    active: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    profileImage: { type: String, default: '' },
  },
  { timestamps: true }
);

// Unique index for employeeId when present
UserSchema.index({ employeeId: 1 }, { unique: true, sparse: true });

export default mongoose.model<IUser>('User', UserSchema);

