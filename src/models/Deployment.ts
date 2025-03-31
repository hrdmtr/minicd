import mongoose, { Document, Schema } from 'mongoose';
import { IProject } from './Project';

export interface IDeployment extends Document {
  project: IProject['_id'];
  commitHash: string;
  buildStatus: 'success' | 'failure' | 'pending';
  buildLog: string;
  startedAt: Date;
  finishedAt?: Date;
  triggeredBy: 'push' | 'pull_request' | 'manual';
  branchName: string;
  containerId?: string;
  exposedPort?: number;
  containerUrl?: string;
}

const DeploymentSchema: Schema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    commitHash: { type: String, required: true },
    buildStatus: {
      type: String,
      enum: ['success', 'failure', 'pending'],
      default: 'pending',
    },
    buildLog: { type: String, default: '' },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    triggeredBy: {
      type: String,
      enum: ['push', 'pull_request', 'manual'],
      required: true,
    },
    branchName: { type: String, required: true },
    containerId: { type: String },
    exposedPort: { type: Number },
    containerUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IDeployment>('Deployment', DeploymentSchema);