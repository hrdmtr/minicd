import { Request, Response, NextFunction } from 'express';
import Deployment from '../models/Deployment';
import Project from '../models/Project';
import { AppError } from '../middleware/errorHandler';

// Get all deployments for a project
export const getDeployments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    
    // Get deployments for this project, sorted by most recent first
    const deployments = await Deployment.find({ project: projectId })
      .sort({ startedAt: -1 })
      .select('-buildLog'); // Exclude build logs to reduce response size
    
    res.status(200).json({
      success: true,
      data: deployments,
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific deployment
export const getDeployment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const deployment = await Deployment.findById(id).populate('project');
    
    if (!deployment) {
      throw new AppError('Deployment not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: deployment,
    });
  } catch (error) {
    next(error);
  }
};

// Get deployment logs
export const getDeploymentLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const deployment = await Deployment.findById(id).select('buildLog');
    
    if (!deployment) {
      throw new AppError('Deployment not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: {
        logs: deployment.buildLog,
      },
    });
  } catch (error) {
    next(error);
  }
};