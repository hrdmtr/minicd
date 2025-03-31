import path from 'path';
import { GitService } from './GitService';
import { DockerService } from './DockerService';
import Project, { IProject } from '../models/Project';
import Deployment from '../models/Deployment';
import dotenv from 'dotenv';

dotenv.config();

const STORAGE_PATH = process.env.STORAGE_PATH || '/tmp/minicd-deployments';

export class DeploymentService {
  /**
   * Process a deployment request
   */
  static async deploy(
    projectId: string,
    trigger: 'push' | 'pull_request' | 'manual',
    branch?: string,
  ): Promise<{ success: boolean; deploymentId: string | null; message: string }> {
    try {
      // 1. Get project details from database
      const project = await Project.findById(projectId);
      if (!project) {
        return { success: false, deploymentId: null, message: 'Project not found' };
      }

      const branchToUse = branch || project.branch;

      // 2. Create deployment record
      const deployment = new Deployment({
        project: project._id,
        commitHash: 'pending',
        buildStatus: 'pending',
        buildLog: 'Starting deployment...\n',
        startedAt: new Date(),
        triggeredBy: trigger,
        branchName: branchToUse,
      });

      await deployment.save();

      // 3. Update project status
      project.lastBuildStatus = 'pending';
      await project.save();

      // 4. Start async deployment process
      this.runDeployment(project, deployment, branchToUse).catch((error) => {
        console.error(`Deployment failed for project ${project.name}:`, error);
      });

      return {
        success: true,
        deploymentId: deployment._id?.toString() || null,
        message: `Deployment started for project ${project.name}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        deploymentId: null,
        message: `Failed to start deployment: ${errorMessage}`,
      };
    }
  }

  /**
   * Run the actual deployment process
   */
  private static async runDeployment(
    project: IProject,
    deployment: any,
    branch: string,
  ): Promise<void> {
    try {
      const repoDir = path.join(STORAGE_PATH, project._id?.toString() || 'unknown');
      let buildLog = '';

      // 1. Clone/pull repository
      const gitResult = await GitService.cloneOrPull(project.repositoryUrl, branch, repoDir);
      buildLog += `\n${gitResult.message}\n`;

      if (!gitResult.success) {
        await this.finalizeDeployment(project, deployment, 'failure', buildLog);
        return;
      }

      // 2. Get commit hash
      try {
        const commitHash = await GitService.getCurrentCommitHash(repoDir);
        deployment.commitHash = commitHash;
        await deployment.save();
        buildLog += `\nCommit hash: ${commitHash}\n`;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        buildLog += `\nFailed to get commit hash: ${errorMessage}\n`;
      }

      // 3. Build Docker image
      const buildResult = await DockerService.build(project.name, repoDir);
      buildLog += `\n${buildResult.log}\n`;

      if (!buildResult.success) {
        await this.finalizeDeployment(project, deployment, 'failure', buildLog);
        return;
      }

      // 4. Run Docker container
      const runResult = await DockerService.run(project);
      buildLog += `\n${runResult.log}\n`;

      if (!runResult.success) {
        await this.finalizeDeployment(project, deployment, 'failure', buildLog);
        return;
      }

      // 5. Update project container ID
      if (runResult.containerId) {
        project.containerId = runResult.containerId;
        await project.save();
        buildLog += `\nContainer ID: ${runResult.containerId}\n`;
      }

      // 6. Finalize successful deployment
      await this.finalizeDeployment(project, deployment, 'success', buildLog);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.finalizeDeployment(
        project,
        deployment,
        'failure',
        `\nDeployment failed with exception: ${errorMessage}\n`,
      );
    }
  }

  /**
   * Finalize deployment record in database
   */
  private static async finalizeDeployment(
    project: IProject,
    deployment: any,
    status: 'success' | 'failure',
    buildLog: string,
  ): Promise<void> {
    try {
      // Update deployment
      deployment.buildStatus = status;
      deployment.buildLog += buildLog;
      deployment.finishedAt = new Date();
      await deployment.save();

      // Update project
      project.lastBuildStatus = status;
      await project.save();
    } catch (error) {
      console.error('Failed to finalize deployment:', error);
    }
  }
}