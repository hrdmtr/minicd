import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  repositoryUrl: string;
  branch: string;
  port: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastBuildStatus: 'success' | 'failure' | 'pending' | 'none';
  containerId?: string;
}

const ProjectSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    repositoryUrl: { type: String, required: true },
    branch: { type: String, required: true, default: 'main' },
    port: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    lastBuildStatus: {
      type: String,
      enum: ['success', 'failure', 'pending', 'none'],
      default: 'none',
    },
    containerId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', ProjectSchema);