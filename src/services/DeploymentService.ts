import path from 'path';
import fs from 'fs';
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
      
      // Deployment overview
      buildLog += `==================================================\n`;
      buildLog += `📋 DEPLOYMENT PROCESS - Project: ${project.name}\n`;
      buildLog += `==================================================\n`;
      buildLog += `🔹 Repository: ${project.repositoryUrl}\n`;
      buildLog += `🔹 Branch: ${branch}\n`;
      buildLog += `🔹 Working Directory: ${repoDir}\n`;
      buildLog += `🔹 Container Port: ${project.port}\n`;
      if (project.exposedPort) {
        buildLog += `🔹 Exposed Port: ${project.exposedPort}\n`;
      }
      buildLog += `🔹 Started at: ${new Date().toISOString()}\n`;
      buildLog += `==================================================\n\n`;
      
      // Update initial log immediately
      deployment.buildLog += buildLog;
      await deployment.save();

      // Define deployment steps
      const TOTAL_STEPS = 5;
      buildLog += `ℹ️ Deployment will go through ${TOTAL_STEPS} steps\n\n`;

      // STEP 1: Clone/pull repository
      buildLog += `\n✅ STEP 1/${TOTAL_STEPS}: PREPARING SOURCE CODE\n`;
      buildLog += `--------------------------------------------\n`;
      buildLog += `📂 Target directory: ${repoDir}\n`;
      
      const gitResult = await GitService.cloneOrPull(project.repositoryUrl, branch, repoDir);
      buildLog += `${gitResult.message}\n`;

      if (!gitResult.success) {
        buildLog += `❌ Failed to prepare source code. Aborting deployment.\n`;
        await this.finalizeDeployment(project, deployment, 'failure', buildLog);
        return;
      }
      
      buildLog += `✅ Source code prepared successfully.\n`;
      
      // Update log after step 1
      deployment.buildLog += buildLog;
      await deployment.save();
      buildLog = '';

      // STEP 2: Get commit hash
      buildLog += `\n✅ STEP 2/${TOTAL_STEPS}: GETTING COMMIT INFORMATION\n`;
      buildLog += `--------------------------------------------\n`;
      
      try {
        const commitHash = await GitService.getCurrentCommitHash(repoDir);
        deployment.commitHash = commitHash;
        await deployment.save();
        buildLog += `📝 Commit hash: ${commitHash}\n`;
        buildLog += `✅ Commit information retrieved successfully.\n`;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        buildLog += `⚠️ Warning: Failed to get commit hash: ${errorMessage}\n`;
        buildLog += `⚠️ Continuing deployment without commit information.\n`;
      }
      
      // Check for .env file and generate if needed
      buildLog += `\n📄 Checking for environment variables...\n`;
      if (project.environmentVariables && project.environmentVariables.length > 0) {
        buildLog += `📄 Found ${project.environmentVariables.length} environment variables. Creating .env file...\n`;
        
        try {
          let envContent = '# Generated by MiniCD\n';
          project.environmentVariables.forEach(variable => {
            const value = variable.isSecret ? '******' : variable.value;
            envContent += `${variable.key}=${variable.value}\n`;
            // Only log masked values
            buildLog += `📄 Setting ${variable.key}=${variable.isSecret ? '******' : value}\n`;
          });
          
          await fs.promises.writeFile(path.join(repoDir, '.env'), envContent, 'utf8');
          buildLog += `📄 .env file created successfully.\n`;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          buildLog += `⚠️ Warning: Failed to create .env file: ${errorMessage}\n`;
        }
      } else {
        buildLog += `📄 No environment variables configured for this project.\n`;
      }
      
      // Update log after step 2
      deployment.buildLog += buildLog;
      await deployment.save();
      buildLog = '';

      // STEP 3: Build Docker image
      buildLog += `\n✅ STEP 3/${TOTAL_STEPS}: BUILDING DOCKER IMAGE\n`;
      buildLog += `--------------------------------------------\n`;
      buildLog += `🔨 Starting Docker build...\n`;
      
      const buildResult = await DockerService.build(project.name, repoDir);
      buildLog += `${buildResult.log}\n`;

      if (!buildResult.success) {
        buildLog += `❌ Docker build failed. Aborting deployment.\n`;
        await this.finalizeDeployment(project, deployment, 'failure', buildLog);
        return;
      }
      
      buildLog += `✅ Docker image built successfully.\n`;
      
      // Update log after step 3
      deployment.buildLog += buildLog;
      await deployment.save();
      buildLog = '';

      // STEP 4: Run Docker container
      buildLog += `\n✅ STEP 4/${TOTAL_STEPS}: STARTING CONTAINER\n`;
      buildLog += `--------------------------------------------\n`;
      
      if (project.containerId) {
        buildLog += `🔄 Stopping and removing previous container...\n`;
      }
      
      const runResult = await DockerService.run(project);
      buildLog += `${runResult.log}\n`;

      if (!runResult.success) {
        buildLog += `❌ Failed to start Docker container. Aborting deployment.\n`;
        await this.finalizeDeployment(project, deployment, 'failure', buildLog);
        return;
      }
      
      // Update log after step 4
      deployment.buildLog += buildLog;
      await deployment.save();
      buildLog = '';

      // STEP 5: Finalize deployment
      buildLog += `\n✅ STEP 5/${TOTAL_STEPS}: FINALIZING DEPLOYMENT\n`;
      buildLog += `--------------------------------------------\n`;
      
      // Update container information
      if (runResult.containerId) {
        project.containerId = runResult.containerId;
        deployment.containerId = runResult.containerId;
        buildLog += `🐳 Container ID: ${runResult.containerId}\n`;
      }
      
      // Set up exposed port info
      if (project.exposedPort) {
        buildLog += `🔌 Application accessible at: http://localhost:${project.exposedPort}\n`;
        deployment.exposedPort = project.exposedPort;
        deployment.containerUrl = `http://localhost:${project.exposedPort}`;
      } else {
        buildLog += `🔌 Application accessible at: http://localhost:${project.port}\n`;
        deployment.exposedPort = project.port;
        deployment.containerUrl = `http://localhost:${project.port}`;
      }
      
      await project.save();
      await deployment.save();
      
      buildLog += `\n==================================================\n`;
      buildLog += `✨ DEPLOYMENT COMPLETED SUCCESSFULLY!\n`;
      buildLog += `==================================================\n`;
      buildLog += `🔸 Project: ${project.name}\n`;
      buildLog += `🔸 Branch: ${branch}\n`;
      if (deployment.commitHash && deployment.commitHash !== 'pending') {
        buildLog += `🔸 Commit: ${deployment.commitHash}\n`;
      }
      buildLog += `🔸 Container ID: ${deployment.containerId}\n`;
      buildLog += `🔸 Application URL: ${deployment.containerUrl}\n`;
      buildLog += `🔸 Finished at: ${new Date().toISOString()}\n`;
      buildLog += `==================================================\n`;

      // Finalize successful deployment
      await this.finalizeDeployment(project, deployment, 'success', buildLog);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      let errorLog = `\n==================================================\n`;
      errorLog += `❌ DEPLOYMENT FAILED WITH EXCEPTION\n`;
      errorLog += `==================================================\n`;
      errorLog += `🔴 Error: ${errorMessage}\n`;
      errorLog += `🔴 Time: ${new Date().toISOString()}\n`;
      errorLog += `🔴 Project: ${project.name}\n`;
      errorLog += `🔴 Repository: ${project.repositoryUrl}\n`;
      errorLog += `🔴 Branch: ${branch}\n`;
      errorLog += `==================================================\n`;
      errorLog += `⚠️ Check system logs for more details.\n`;
      
      // Log the error for debugging
      console.error(`Deployment error for project ${project.name}:`, error);
      
      await this.finalizeDeployment(
        project,
        deployment,
        'failure',
        errorLog,
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