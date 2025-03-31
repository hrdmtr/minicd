import { Request, Response, NextFunction } from 'express';
import Deployment from '../models/Deployment';
import Project from '../models/Project';
import { DeploymentService } from '../services/DeploymentService';

// Get all deployments page
export const getDeploymentsPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = 10; // Items per page
    const skip = (page - 1) * limit;
    
    // Count total deployments
    const totalDeployments = await Deployment.countDocuments();
    const totalPages = Math.ceil(totalDeployments / limit);
    
    // Get deployments with project information
    const deployments = await Deployment.find()
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('project'); // This joins project data
    
    res.render('deployments/index', {
      title: 'Deployments',
      deployments,
      currentPage: page,
      totalPages,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// Get deployment detail page
export const getDeploymentDetailPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const deployment = await Deployment.findById(req.params.id)
      .populate('project');
    
    if (!deployment) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Deployment not found'
      });
    }
    
    const project = deployment.project as any;
    
    res.render('deployments/detail', {
      title: `Deployment - ${project.name}`,
      deployment,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// Trigger a manual deployment (web)
export const triggerDeploymentWeb = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find project to get the branch
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Project not found'
      });
    }
    
    const result = await DeploymentService.deploy(id, 'manual', project.branch);
    
    if (!result.success) {
      return res.render('error', {
        title: 'Deployment Error',
        message: result.message
      });
    }
    
    if (result.deploymentId) {
      res.redirect(`/deployments/${result.deploymentId}`);
    } else {
      res.redirect(`/projects/${id}`);
    }
  } catch (error) {
    next(error);
  }
};

// Get project deployments
export const getProjectDeploymentsPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Verify project exists
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Project not found'
      });
    }
    
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = 10; // Items per page
    const skip = (page - 1) * limit;
    
    // Count total deployments for this project
    const totalDeployments = await Deployment.countDocuments({ project: projectId });
    const totalPages = Math.ceil(totalDeployments / limit);
    
    // Get deployments for this project
    const deployments = await Deployment.find({ project: projectId })
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.render('deployments/project', {
      title: `Deployments - ${project.name}`,
      project,
      deployments,
      currentPage: page,
      totalPages,
      error: null
    });
  } catch (error) {
    next(error);
  }
};