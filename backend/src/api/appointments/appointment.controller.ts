import type { Request, Response } from 'express';
import { created, list, ok } from '../../config/response';
import * as service from './appointment.service';
import {
  appointmentIdParamSchema,
  appointmentQuerySchema,
  availableSlotsQuerySchema,
  cancelAppointmentSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
} from './appointment.schema';

export async function getAvailableSlots(req: Request, res: Response) {
  const query = availableSlotsQuerySchema.parse(req.query);
  const result = await service.getAvailableSlots(query);
  ok(res, result);
}

export async function getAll(req: Request, res: Response) {
  const query = appointmentQuerySchema.parse(req.query);
  const result = await service.findAll(query);
  list(res, result.items, result.meta);
}

export async function getById(req: Request, res: Response) {
  const { id } = appointmentIdParamSchema.parse(req.params);
  const appointment = await service.findById(id);
  ok(res, appointment);
}

export async function create(req: Request, res: Response) {
  const input = createAppointmentSchema.parse(req.body);
  const userId = req.user?.sub || 'system';
  const appointment = await service.create(userId, input);
  created(res, appointment);
}

export async function updateStatus(req: Request, res: Response) {
  const { id } = appointmentIdParamSchema.parse(req.params);
  const { status } = updateAppointmentStatusSchema.parse(req.body);
  const appointment = await service.updateStatus(id, status);
  ok(res, appointment);
}

export async function cancel(req: Request, res: Response) {
  const { id } = appointmentIdParamSchema.parse(req.params);
  const input = cancelAppointmentSchema.parse(req.body);
  const userId = req.user?.sub || 'system';
  const appointment = await service.cancel(id, userId, input);
  ok(res, appointment);
}

export async function reschedule(req: Request, res: Response) {
  const { id } = appointmentIdParamSchema.parse(req.params);
  const input = rescheduleAppointmentSchema.parse(req.body);
  const userId = req.user?.sub || 'system';
  const appointment = await service.reschedule(id, userId, input);
  ok(res, appointment);
}
