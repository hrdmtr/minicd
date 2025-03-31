import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { IProject } from '../models/Project';

export class DockerService {
  /**
   * Build a Docker image from the specified repository path
   */
  static async build(
    projectName: string,
    repoPath: string,
  ): Promise<{ success: boolean; log: string }> {
    return new Promise((resolve) => {
      let log = '';
      const dockerfilePath = path.join(repoPath, 'Dockerfile');
      
      // Check if Dockerfile exists
      if (!fs.existsSync(dockerfilePath)) {
        return resolve({
          success: false,
          log: 'Error: Dockerfile not found in repository root',
        });
      }

      const imageName = `minicd_${projectName}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const build = spawn('docker', ['build', '-t', imageName, repoPath]);

      build.stdout.on('data', (data) => {
        const output = data.toString();
        log += output;
        console.log(output);
      });

      build.stderr.on('data', (data) => {
        const output = data.toString();
        log += output;
        console.error(output);
      });

      build.on('close', (code) => {
        const success = code === 0;
        resolve({
          success,
          log: log + `\\nDocker build exited with code ${code}`,
        });
      });
    });
  }

  /**
   * Run a Docker container from a built image
   */
  static async run(
    project: IProject,
  ): Promise<{ success: boolean; containerId: string | null; log: string }> {
    return new Promise((resolve) => {
      let log = '';
      const imageName = `minicd_${project.name}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      
      // First stop any existing container for this project
      if (project.containerId) {
        this.stop(project.containerId).catch(console.error);
      }
      
      // Run new container, publish the configured port
      const run = spawn('docker', [
        'run',
        '-d',
        '--restart=unless-stopped',
        '-p', `${project.port}:${project.port}`,
        '--name', `minicd_${project.name}_${Date.now()}`.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        imageName,
      ]);

      run.stdout.on('data', (data) => {
        const output = data.toString().trim();
        log += output + '\\n';
        console.log(output);
      });

      run.stderr.on('data', (data) => {
        const output = data.toString();
        log += output;
        console.error(output);
      });

      run.on('close', (code) => {
        const success = code === 0;
        let containerId = null;
        
        if (success && log.trim()) {
          containerId = log.trim();
        }
        
        resolve({
          success,
          containerId,
          log: log + `\\nDocker run exited with code ${code}`,
        });
      });
    });
  }

  /**
   * Stop and remove a running Docker container
   */
  static async stop(containerId: string): Promise<{ success: boolean; log: string }> {
    return new Promise((resolve) => {
      let log = '';
      const stop = spawn('docker', ['stop', containerId]);

      stop.stdout.on('data', (data) => {
        log += data.toString();
      });

      stop.stderr.on('data', (data) => {
        log += data.toString();
      });

      stop.on('close', (code) => {
        // After stopping, remove the container
        const rm = spawn('docker', ['rm', containerId]);
        
        rm.stdout.on('data', (data) => {
          log += data.toString();
        });

        rm.stderr.on('data', (data) => {
          log += data.toString();
        });

        rm.on('close', (rmCode) => {
          const success = code === 0 && rmCode === 0;
          resolve({
            success,
            log: log + `\\nDocker stop exited with code ${code}, rm exited with code ${rmCode}`,
          });
        });
      });
    });
  }
}