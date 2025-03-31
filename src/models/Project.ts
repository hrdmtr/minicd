import mongoose, { Document, Schema } from 'mongoose';

export interface EnvironmentVariable {
  key: string;
  value: string;
  isSecret?: boolean;
}

export interface IProject extends Document {
  name: string;
  repositoryUrl: string;
  branch: string;
  port: number;
  exposedPort?: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastBuildStatus: 'success' | 'failure' | 'pending' | 'none';
  containerId?: string;
  environmentVariables?: EnvironmentVariable[];
}

const EnvironmentVariableSchema: Schema = new Schema(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
    isSecret: { type: Boolean, default: false },
  },
  { _id: false }
);

const ProjectSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    repositoryUrl: { type: String, required: true },
    branch: { type: String, required: true, default: 'main' },
    port: { type: Number, required: true },
    exposedPort: { type: Number },
    isActive: { type: Boolean, default: true },
    lastBuildStatus: {
      type: String,
      enum: ['success', 'failure', 'pending', 'none'],
      default: 'none',
    },
    containerId: { type: String },
    environmentVariables: [EnvironmentVariableSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', ProjectSchema);