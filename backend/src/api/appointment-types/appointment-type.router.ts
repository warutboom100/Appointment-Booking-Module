import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as controller from './appointment-type.controller';

export const appointmentTypeRouter = Router();

appointmentTypeRouter.use(authenticate);

appointmentTypeRouter.get('/', controller.getAll);
appointmentTypeRouter.get('/:id', controller.getById);
appointmentTypeRouter.post('/', authorize('admin'), controller.create);
appointmentTypeRouter.patch('/:id', authorize('admin'), controller.update);
appointmentTypeRouter.delete('/:id', authorize('admin'), controller.remove);
