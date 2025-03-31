import { Request, Response } from 'express';
import Project from '../models/Project';

/**
 * Render login page
 */
export const getLoginPage = (req: Request, res: Response): void => {
  res.render('login', { 
    title: 'Login',
    error: null 
  });
};

/**
 * Process login attempt
 */
export const login = (req: Request, res: Response): void => {
  // For demo purposes, any login credentials are accepted
  res.redirect('/');
};

/**
 * Render home page with projects
 */
export const getHomePage = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await Project.find().sort({ updatedAt: -1 });
    
    res.render('home', { 
      title: 'Dashboard',
      projects 
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.render('home', { 
      title: 'Dashboard',
      projects: [],
      error: 'Failed to load projects'
    });
  }
};

/**
 * Handle logout
 */
export const logout = (req: Request, res: Response): void => {
  // In a real app, we would destroy the session
  res.redirect('/login');
};