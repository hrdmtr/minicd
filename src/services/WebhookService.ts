import crypto from 'crypto';
import { Request } from 'express';
import { DeploymentService } from './DeploymentService';
import Project from '../models/Project';
import dotenv from 'dotenv';

dotenv.config();

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

export class WebhookService {
  /**
   * Verify GitHub webhook signature
   */
  static verifySignature(req: Request): boolean {
    if (!WEBHOOK_SECRET) {
      console.warn('GITHUB_WEBHOOK_SECRET not set, skipping webhook verification');
      return true;
    }

    const signature = req.headers['x-hub-signature-256'] as string;
    if (!signature) {
      return false;
    }

    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  }

  /**
   * Process a GitHub webhook event
   */
  static async processWebhook(
    event: string,
    payload: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Handle 'ping' event (when webhook is initially set up)
      if (event === 'ping') {
        return { success: true, message: 'Webhook ping received successfully' };
      }

      // Extract repository URL from payload
      const repoUrl = payload.repository?.clone_url;
      if (!repoUrl) {
        return { success: false, message: 'Repository URL not found in payload' };
      }

      // Find projects that use this repository
      const projects = await Project.find({
        repositoryUrl: repoUrl,
        isActive: true,
      });

      if (projects.length === 0) {
        return {
          success: false,
          message: `No active projects found for repository ${repoUrl}`,
        };
      }

      const results: string[] = [];

      // Process each matching project
      for (const project of projects) {
        let shouldDeploy = false;
        let branch = '';
        let deploymentType: 'push' | 'pull_request' = 'push';

        // For push events
        if (event === 'push') {
          branch = payload.ref.replace('refs/heads/', '');
          shouldDeploy = branch === project.branch;
          deploymentType = 'push';
        }
        // For pull request events
        else if (event === 'pull_request' && payload.action === 'opened' || payload.action === 'synchronize') {
          branch = payload.pull_request.head.ref;
          shouldDeploy = branch === project.branch;
          deploymentType = 'pull_request';
        }

        // If this event should trigger a deployment for this project
        if (shouldDeploy) {
          const deployResult = await DeploymentService.deploy(
            project._id?.toString() || '',
            deploymentType,
            branch,
          );

          results.push(
            `Project ${project.name}: ${deployResult.success ? 'Deployment started' : 'Deployment failed'} - ${
              deployResult.message
            }`,
          );
        } else {
          results.push(
            `Project ${project.name}: Skipped deployment (branch ${branch} does not match configured branch ${project.branch})`,
          );
        }
      }

      return {
        success: true,
        message: results.join('\n'),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to process webhook: ${errorMessage}`,
      };
    }
  }
}