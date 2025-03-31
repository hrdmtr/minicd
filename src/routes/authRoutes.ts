import { Router } from 'express';
import { getLoginPage, login, getHomePage, logout } from '../controllers/authController';

const router = Router();

// Auth routes
router.get('/login', getLoginPage);
router.post('/login', login);
router.get('/logout', logout);

// Home route
router.get('/', getHomePage);

export default router;