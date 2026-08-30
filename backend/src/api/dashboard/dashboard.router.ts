import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as controller from './dashboard.controller';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

// 1. Get today's dashboard summary & queue breakdown
dashboardRouter.get('/summary', controller.getSummary);

// 2. Get statistics by custom date range
dashboardRouter.get('/stats', controller.getStats);
