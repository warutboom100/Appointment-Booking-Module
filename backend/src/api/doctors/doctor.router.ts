import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as controller from './doctor.controller';

export const doctorRouter = Router();

doctorRouter.use(authenticate);

doctorRouter.get('/', controller.getAll);
doctorRouter.get('/:id', controller.getById);
doctorRouter.post('/', authorize('admin'), controller.create);
doctorRouter.patch('/:id', authorize('admin'), controller.update);
doctorRouter.delete('/:id', authorize('admin'), controller.remove);
