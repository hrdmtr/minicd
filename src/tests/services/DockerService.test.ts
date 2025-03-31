import { DockerService } from '../../services/DockerService';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Mock child_process and fs modules
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

describe('DockerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('build', () => {
    it('should return error if Dockerfile does not exist', async () => {
      // Mock fs.existsSync to return false (Dockerfile not found)
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await DockerService.build('test-project', '/some/path');

      expect(result.success).toBe(false);
      expect(result.log).toContain('Dockerfile not found');
      expect(spawn).not.toHaveBeenCalled();
    });

    it('should spawn docker build process if Dockerfile exists', async () => {
      // Mock fs.existsSync to return true (Dockerfile exists)
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Mock spawn to return object with expected event listeners
      const mockProcess = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') callback('Build output');
            return mockProcess.stdout;
          }),
        },
        stderr: {
          on: jest.fn((event, callback) => {
            if (event === 'data') callback('Build error');
            return mockProcess.stderr;
          }),
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') callback(0);
          return mockProcess;
        }),
      };

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      const result = await DockerService.build('test-project', '/some/path');

      expect(fs.existsSync).toHaveBeenCalledWith(path.join('/some/path', 'Dockerfile'));
      expect(spawn).toHaveBeenCalledWith('docker', ['build', '-t', 'minicd_test-project', '/some/path']);
      expect(result.success).toBe(true);
      expect(result.log).toContain('Build output');
      expect(result.log).toContain('Build error');
    });
  });
});