import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as controller from './department.controller';

export const departmentRouter = Router();

departmentRouter.use(authenticate);

departmentRouter.get('/', controller.getAll);
departmentRouter.get('/:id', controller.getById);
departmentRouter.post('/', authorize('admin'), controller.create);
departmentRouter.patch('/:id', authorize('admin'), controller.update);
departmentRouter.delete('/:id', authorize('admin'), controller.remove);
