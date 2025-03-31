import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project';
import Deployment from '../models/Deployment';
import { DeploymentService } from '../services/DeploymentService';

// Get all projects (web view)
export const getProjectsPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    
    res.render('projects/index', {
      title: 'Projects',
      projects,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// Get project creation page
export const getNewProjectPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.render('projects/new', {
      title: 'New Project',
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// Create a new project (web form)
export const createProjectWeb = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { 
      name, repositoryUrl, branch, port, exposedPort, actualExposedPort, isActive,
      envKeys, envValues, envSecrets 
    } = req.body;
    
    // Validate required fields
    if (!name || !repositoryUrl || !port) {
      return res.render('projects/new', {
        title: 'New Project',
        error: 'Missing required fields: name, repositoryUrl, port'
      });
    }
    
    // Process environment variables
    const environmentVariables = [];
    if (envKeys && envValues) {
      // Convert to arrays if single values
      const keys = Array.isArray(envKeys) ? envKeys : [envKeys];
      const values = Array.isArray(envValues) ? envValues : [envValues];
      const secrets = envSecrets ? (Array.isArray(envSecrets) ? envSecrets : [envSecrets]) : [];
      
      // Create environment variables array
      for (let i = 0; i < keys.length; i++) {
        // Skip empty key/value pairs
        if (!keys[i] || keys[i].trim() === '') continue;
        
        environmentVariables.push({
          key: keys[i],
          value: values[i] || '',
          isSecret: secrets.includes(i.toString())
        });
      }
    }
    
    // Handle port assignment
    let exposedPortValue;
    if (actualExposedPort === '0') {
      // Use automatic port assignment
      exposedPortValue = 0;
    } else if (actualExposedPort && actualExposedPort.trim() !== '') {
      // Use specific port
      exposedPortValue = parseInt(actualExposedPort, 10);
    } else {
      // Use same as container port (undefined)
      exposedPortValue = undefined;
    }
    
    // Create project
    const project = await Project.create({
      name,
      repositoryUrl,
      branch: branch || 'main',
      port: parseInt(port, 10),
      exposedPort: exposedPortValue,
      isActive: isActive === 'true',
      environmentVariables
    });
    
    res.redirect(`/projects/${project._id}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    res.render('projects/new', {
      title: 'New Project',
      error: errorMessage
    });
  }
};

// Get project details page
export const getProjectDetailPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Project not found'
      });
    }
    
    // Get recent deployments for this project
    const deployments = await Deployment.find({ 
      project: project._id 
    })
    .sort({ startedAt: -1 })
    .limit(10);
    
    // Webhook URL for the GitHub setup
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const webhookUrl = `${baseUrl}/api/webhooks/github`;
    
    res.render('projects/detail', {
      title: project.name,
      project,
      deployments,
      webhookUrl,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// Get project edit page
export const getEditProjectPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Project not found'
      });
    }
    
    res.render('projects/edit', {
      title: `Edit ${project.name}`,
      project,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// Update a project (web form)
export const updateProjectWeb = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { 
      name, repositoryUrl, branch, port, exposedPort, actualExposedPort, isActive, 
      envKeys, envValues, envSecrets 
    } = req.body;
    
    // Find project
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Project not found'
      });
    }
    
    // Update fields if provided
    if (name !== undefined) project.name = name;
    if (repositoryUrl !== undefined) project.repositoryUrl = repositoryUrl;
    if (branch !== undefined) project.branch = branch;
    if (port !== undefined) project.port = parseInt(port, 10);
    
    // Handle port assignment
    if (actualExposedPort === '0') {
      // Use automatic port assignment
      project.exposedPort = 0;
    } else if (actualExposedPort && actualExposedPort.trim() !== '') {
      // Use specific port
      project.exposedPort = parseInt(actualExposedPort, 10);
    } else {
      // Use same as container port (undefined)
      project.exposedPort = undefined;
    }
    
    project.isActive = isActive === 'true';
    
    // Process environment variables
    if (envKeys && envValues) {
      const environmentVariables = [];
      
      // Convert to arrays if single values
      const keys = Array.isArray(envKeys) ? envKeys : [envKeys];
      const values = Array.isArray(envValues) ? envValues : [envValues];
      const secrets = envSecrets ? (Array.isArray(envSecrets) ? envSecrets : [envSecrets]) : [];
      
      // Create environment variables array
      for (let i = 0; i < keys.length; i++) {
        // Skip empty key/value pairs
        if (!keys[i] || keys[i].trim() === '') continue;
        
        environmentVariables.push({
          key: keys[i],
          value: values[i] || '',
          isSecret: secrets.includes(i.toString())
        });
      }
      
      project.environmentVariables = environmentVariables;
    } else {
      project.environmentVariables = [];
    }
    
    await project.save();
    
    res.redirect(`/projects/${project._id}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Project not found'
      });
    }
    
    res.render('projects/edit', {
      title: `Edit ${project.name}`,
      project,
      error: errorMessage
    });
  }
};

// Delete a project (web form)
export const deleteProjectWeb = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Project not found'
      });
    }
    
    // Delete associated deployments
    await Deployment.deleteMany({ project: project._id });
    
    // Delete project
    await project.deleteOne();
    
    res.redirect('/projects');
  } catch (error) {
    next(error);
  }
};