import type { Request, Response } from 'express';
import { created, list, ok } from '../../config/response';
import * as service from './patient.service';
import * as appointmentService from '../appointments/appointment.service';
import { appointmentQuerySchema } from '../appointments/appointment.schema';
import {
  createPatientSchema,
  patientIdParamSchema,
  patientQuerySchema,
  updatePatientSchema,
} from './patient.schema';

export async function getAll(req: Request, res: Response) {
  const query = patientQuerySchema.parse(req.query);
  const result = await service.findAll(query);
  list(res, result.items, result.meta);
}

export async function getById(req: Request, res: Response) {
  const { id } = patientIdParamSchema.parse(req.params);
  const patient = await service.findById(id);
  ok(res, patient);
}

export async function create(req: Request, res: Response) {
  const input = createPatientSchema.parse(req.body);
  const patient = await service.create(input);
  created(res, patient);
}

export async function update(req: Request, res: Response) {
  const { id } = patientIdParamSchema.parse(req.params);
  const input = updatePatientSchema.parse(req.body);
  const patient = await service.update(id, input);
  ok(res, patient);
}

export async function remove(req: Request, res: Response) {
  const { id } = patientIdParamSchema.parse(req.params);
  const patient = await service.softDelete(id);
  ok(res, patient);
}

export async function getAppointments(req: Request, res: Response) {
  const { id } = patientIdParamSchema.parse(req.params);
  const query = appointmentQuerySchema.parse(req.query);
  const result = await appointmentService.findByPatientId(id, query);
  list(res, result.items, result.meta);
}
