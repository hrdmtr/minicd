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
  ): Promise<{ success: boolean; containerId: string | null; exposedPort?: number; log: string }> {
    return new Promise((resolve) => {
      let log = '';
      const imageName = `minicd_${project.name}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      
      // First stop any existing container for this project
      if (project.containerId) {
        this.stop(project.containerId).catch(console.error);
      }
      
      // Prepare docker run arguments
      const dockerArgs = [
        'run',
        '-d',
        '--restart=unless-stopped'
      ];
      
      // Handle port mapping
      // If exposedPort is configured, use specific port mapping
      // If exposedPort is 0, use Docker's automatic port assignment
      // Otherwise use same port for container and host
      if (project.exposedPort && project.exposedPort > 0) {
        // Use specific port mapping
        dockerArgs.push('-p', `${project.exposedPort}:${project.port}`);
        log += `Setting up port mapping: ${project.exposedPort}:${project.port}\n`;
      } else if (project.exposedPort === 0) {
        // Use automatic port assignment (Docker will choose a free port)
        dockerArgs.push('-p', `${project.port}`);
        log += `Setting up automatic port mapping for container port ${project.port}\n`;
      } else {
        // Use same port for container and host
        dockerArgs.push('-p', `${project.port}:${project.port}`);
        log += `Setting up port mapping: ${project.port}:${project.port}\n`;
      }
      
      // Add container name
      const containerName = `minicd_${project.name}_${Date.now()}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      dockerArgs.push('--name', containerName);
      
      // Add environment variables if available
      if (project.environmentVariables && project.environmentVariables.length > 0) {
        log += `Setting up environment variables...\n`;
        project.environmentVariables.forEach(variable => {
          dockerArgs.push('-e', `${variable.key}=${variable.value}`);
        });
      }
      
      // Add image name
      dockerArgs.push(imageName);
      
      log += `Starting container with name: ${containerName}\n`;
      
      // Run the container
      const run = spawn('docker', dockerArgs);

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

      run.on('close', async (code) => {
        const success = code === 0;
        let containerId = null;
        let exposedPort = project.exposedPort;
        
        if (success && log.trim()) {
          containerId = log.trim();
          
          // If automatic port assignment was used, retrieve the assigned port
          if (project.exposedPort === 0 && containerId) {
            try {
              // Use docker port command to get the assigned port
              const portProcess = spawn('docker', ['port', containerId, `${project.port}/tcp`]);
              let portOutput = '';
              
              portProcess.stdout.on('data', (data) => {
                portOutput += data.toString();
              });
              
              // Wait for port command to complete
              await new Promise<void>((portResolve) => {
                portProcess.on('close', (portCode) => {
                  if (portCode === 0 && portOutput.trim()) {
                    // Extract port from output format like "0.0.0.0:32768"
                    const portMatch = portOutput.trim().match(/:(\d+)$/);
                    if (portMatch && portMatch[1]) {
                      exposedPort = parseInt(portMatch[1], 10);
                      log += `\\nDocker assigned port ${exposedPort} for container port ${project.port}\\n`;
                    }
                  }
                  portResolve();
                });
              });
            } catch (error) {
              log += `\\nFailed to retrieve assigned port: ${error}\\n`;
            }
          }
        }
        
        resolve({
          success,
          containerId,
          exposedPort,
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