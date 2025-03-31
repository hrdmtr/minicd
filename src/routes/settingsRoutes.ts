import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';

const router = Router();

// Settings routes
router.get('/', settingsController.getSettingsPage);
router.post('/', settingsController.updateSettings);

export default router;