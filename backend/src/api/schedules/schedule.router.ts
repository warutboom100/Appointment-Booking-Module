import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as controller from './schedule.controller';

// Router for /api/v1/schedules/:id
export const scheduleRouter = Router();
scheduleRouter.use(authenticate);
scheduleRouter.get('/', controller.list);
scheduleRouter.get('/:id', controller.getById);
scheduleRouter.patch('/:id', authorize('admin'), controller.update);
scheduleRouter.delete('/:id', authorize('admin'), controller.remove);

// Nested router for /api/v1/doctors/:doctorId/schedules
export const doctorScheduleRouter = Router({ mergeParams: true });
doctorScheduleRouter.use(authenticate);
doctorScheduleRouter.get('/', controller.getByDoctor);
doctorScheduleRouter.post('/', authorize('admin'), controller.create);
