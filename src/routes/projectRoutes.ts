import express from 'express';
import {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  triggerDeployment,
} from '../controllers/projectController';

const router = express.Router();

// Project routes
router.route('/').get(getAllProjects).post(createProject);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);
router.route('/:id/deploy').post(triggerDeployment);

export default router;