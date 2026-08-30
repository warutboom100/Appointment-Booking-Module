import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as controller from './appointment.controller';

export const appointmentRouter = Router();

appointmentRouter.use(authenticate);

// 1. Available slots endpoint (Must be placed before /:id)
appointmentRouter.get('/available-slots', controller.getAvailableSlots);

// 2. List and Detail endpoints
appointmentRouter.get('/', controller.getAll);
appointmentRouter.get('/:id', controller.getById);

// 3. Booking endpoint (Admin & Receptionist)
appointmentRouter.post('/', authorize('admin', 'receptionist'), controller.create);

// 4. Status update endpoint (Admin, Receptionist, Doctor)
appointmentRouter.patch('/:id/status', authorize('admin', 'receptionist', 'doctor'), controller.updateStatus);

// 5. Cancellation endpoint (Admin & Receptionist)
appointmentRouter.patch('/:id/cancel', authorize('admin', 'receptionist'), controller.cancel);

// 6. Reschedule endpoint (Admin & Receptionist)
appointmentRouter.post('/:id/reschedule', authorize('admin', 'receptionist'), controller.reschedule);
