import express from 'express';
import { processGithubWebhook } from '../controllers/webhookController';

const router = express.Router();

// Webhook routes
router.route('/github').post(processGithubWebhook);

export default router;