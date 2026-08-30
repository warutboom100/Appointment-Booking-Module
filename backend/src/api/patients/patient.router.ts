import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as controller from './patient.controller';

export const patientRouter = Router();

patientRouter.use(authenticate);

patientRouter.get('/', controller.getAll);
patientRouter.get('/:id', controller.getById);
patientRouter.get('/:id/appointments', controller.getAppointments);
patientRouter.post('/', authorize('admin', 'receptionist'), controller.create);
patientRouter.patch('/:id', authorize('admin', 'receptionist'), controller.update);
patientRouter.delete('/:id', authorize('admin'), controller.remove);
