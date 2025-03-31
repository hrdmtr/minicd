import express from 'express';
import {
  getDeployments,
  getDeployment,
  getDeploymentLogs,
} from '../controllers/deploymentController';

const router = express.Router();

// Deployment routes
router.route('/project/:projectId').get(getDeployments);
router.route('/:id').get(getDeployment);
router.route('/:id/logs').get(getDeploymentLogs);

export default router;