import { Router } from 'express';
import * as deploymentWebController from '../controllers/deploymentWebController';

const router = Router();

// Deployments listing page
router.get('/', deploymentWebController.getDeploymentsPage);

// Trigger a deployment
router.get('/trigger/:id', deploymentWebController.triggerDeploymentWeb);

// Project deployments
router.get('/project/:projectId', deploymentWebController.getProjectDeploymentsPage);

// Deployment details
router.get('/:id', deploymentWebController.getDeploymentDetailPage);

export default router;