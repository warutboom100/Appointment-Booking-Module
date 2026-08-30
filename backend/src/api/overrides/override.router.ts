import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as controller from './override.controller';

// Router for /api/v1/overrides
export const overrideRouter = Router();
overrideRouter.use(authenticate);
overrideRouter.get('/', controller.getAll);
overrideRouter.get('/:id', controller.getById);
overrideRouter.patch('/:id', authorize('admin'), controller.update);
overrideRouter.delete('/:id', authorize('admin'), controller.remove);

// Nested router for /api/v1/doctors/:doctorId/overrides
export const doctorOverrideRouter = Router({ mergeParams: true });
doctorOverrideRouter.use(authenticate);
doctorOverrideRouter.get('/', controller.getByDoctor);
doctorOverrideRouter.post('/', authorize('admin'), controller.create);
