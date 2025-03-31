import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs/promises';
import path from 'path';

export class GitService {
  /**
   * Clone or pull a git repository
   */
  static async cloneOrPull(
    repoUrl: string,
    branch: string,
    targetDir: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(targetDir, { recursive: true });
      
      // Check if .git directory already exists (repo already cloned)
      const gitDirExists = await fs
        .access(path.join(targetDir, '.git'))
        .then(() => true)
        .catch(() => false);

      const git: SimpleGit = simpleGit(targetDir);

      if (gitDirExists) {
        // If repo exists, fetch and pull
        await git.fetch('origin');
        const pullResult = await git.pull('origin', branch);
        return {
          success: true,
          message: `Repository updated successfully: ${JSON.stringify(pullResult)}`,
        };
      } else {
        // If repo doesn't exist, clone it
        await git.clone(repoUrl, targetDir, ['--branch', branch]);
        return {
          success: true,
          message: `Repository cloned successfully to ${targetDir}`,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Git operation failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Get the current commit hash
   */
  static async getCurrentCommitHash(repoPath: string): Promise<string> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const log = await git.log({ maxCount: 1 });
      
      if (log.latest) {
        return log.latest.hash;
      }
      
      throw new Error('No commits found in repository');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get commit hash: ${errorMessage}`);
    }
  }
}