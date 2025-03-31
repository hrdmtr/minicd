import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';
import { connectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import deploymentRoutes from './routes/deploymentRoutes';
import webhookRoutes from './routes/webhookRoutes';
import projectWebRoutes from './routes/projectWebRoutes';
import deploymentWebRoutes from './routes/deploymentWebRoutes';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDatabase();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Basic request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Web routes
app.use('/', authRoutes);
app.use('/projects', projectWebRoutes);
app.use('/deployments', deploymentWebRoutes);

// API routes
app.use('/api/projects', projectRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/webhooks', webhookRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});