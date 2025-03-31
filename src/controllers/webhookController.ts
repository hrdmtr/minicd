import { Request, Response, NextFunction } from 'express';
import { WebhookService } from '../services/WebhookService';
import { AppError } from '../middleware/errorHandler';

// Process GitHub webhook
export const processGithubWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Verify GitHub webhook signature
    const isValid = WebhookService.verifySignature(req);
    if (!isValid) {
      throw new AppError('Invalid webhook signature', 401);
    }

    // Get GitHub event type from headers
    const event = req.headers['x-github-event'] as string;
    if (!event) {
      throw new AppError('Missing GitHub event type', 400);
    }

    // Process the webhook
    const result = await WebhookService.processWebhook(event, req.body);

    res.status(200).json({
      success: true,
      data: {
        event,
        message: result.message,
      },
    });
  } catch (error) {
    next(error);
  }
};