import type { Request, Response } from 'express';
import { created, list, ok } from '../../config/response';
import * as service from './appointment-type.service';
import {
  appointmentTypeIdParamSchema,
  appointmentTypeQuerySchema,
  createAppointmentTypeSchema,
  updateAppointmentTypeSchema,
} from './appointment-type.schema';

export async function getAll(req: Request, res: Response) {
  const query = appointmentTypeQuerySchema.parse(req.query);
  const result = await service.findAll(query);
  list(res, result.items, result.meta);
}

export async function getById(req: Request, res: Response) {
  const { id } = appointmentTypeIdParamSchema.parse(req.params);
  const appointmentType = await service.findById(id);
  ok(res, appointmentType);
}

export async function create(req: Request, res: Response) {
  const input = createAppointmentTypeSchema.parse(req.body);
  const appointmentType = await service.create(input);
  created(res, appointmentType);
}

export async function update(req: Request, res: Response) {
  const { id } = appointmentTypeIdParamSchema.parse(req.params);
  const input = updateAppointmentTypeSchema.parse(req.body);
  const appointmentType = await service.update(id, input);
  ok(res, appointmentType);
}

export async function remove(req: Request, res: Response) {
  const { id } = appointmentTypeIdParamSchema.parse(req.params);
  const appointmentType = await service.softDelete(id);
  ok(res, appointmentType);
}
