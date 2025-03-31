import { Router } from 'express';
import * as projectWebController from '../controllers/projectWebController';

const router = Router();

// Projects listing page
router.get('/', projectWebController.getProjectsPage);

// Create new project
router.get('/new', projectWebController.getNewProjectPage);
router.post('/', projectWebController.createProjectWeb);

// Project details
router.get('/:id', projectWebController.getProjectDetailPage);

// Edit project
router.get('/:id/edit', projectWebController.getEditProjectPage);
router.post('/:id/update', projectWebController.updateProjectWeb);

// Delete project
router.post('/:id/delete', projectWebController.deleteProjectWeb);

export default router;