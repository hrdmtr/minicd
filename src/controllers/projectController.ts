import { Request, Response, NextFunction } from 'express';
import Project, { IProject } from '../models/Project';
import Deployment from '../models/Deployment';
import { DeploymentService } from '../services/DeploymentService';
import { AppError } from '../middleware/errorHandler';

// Get all projects
export const getAllProjects = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific project
export const getProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new project
export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, repositoryUrl, branch, port } = req.body;
    
    // Validate required fields
    if (!name || !repositoryUrl || !port) {
      throw new AppError('Missing required fields: name, repositoryUrl, port', 400);
    }
    
    // Create project
    const project = await Project.create({
      name,
      repositoryUrl,
      branch: branch || 'main',
      port,
    });
    
    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// Update a project
export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, repositoryUrl, branch, port, isActive } = req.body;
    
    // Find project
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    
    // Update fields if provided
    if (name !== undefined) project.name = name;
    if (repositoryUrl !== undefined) project.repositoryUrl = repositoryUrl;
    if (branch !== undefined) project.branch = branch;
    if (port !== undefined) project.port = port;
    if (isActive !== undefined) project.isActive = isActive;
    
    await project.save();
    
    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a project
export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    
    // Delete associated deployments
    await Deployment.deleteMany({ project: project._id });
    
    // Delete project
    await project.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// Trigger a manual deployment
export const triggerDeployment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { branch } = req.body;
    
    const result = await DeploymentService.deploy(id, 'manual', branch);
    
    if (!result.success) {
      throw new AppError(result.message, 400);
    }
    
    res.status(200).json({
      success: true,
      data: {
        deploymentId: result.deploymentId,
        message: result.message,
      },
    });
  } catch (error) {
    next(error);
  }
};