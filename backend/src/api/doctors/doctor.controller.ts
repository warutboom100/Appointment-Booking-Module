import type { Request, Response } from 'express';
import { created, list, ok } from '../../config/response';
import * as service from './doctor.service';
import {
  createDoctorSchema,
  doctorIdParamSchema,
  doctorQuerySchema,
  updateDoctorSchema,
} from './doctor.schema';

export async function getAll(req: Request, res: Response) {
  const query = doctorQuerySchema.parse(req.query);
  const result = await service.findAll(query);
  list(res, result.items, result.meta);
}

export async function getById(req: Request, res: Response) {
  const { id } = doctorIdParamSchema.parse(req.params);
  const doctor = await service.findById(id);
  ok(res, doctor);
}

export async function create(req: Request, res: Response) {
  const input = createDoctorSchema.parse(req.body);
  const doctor = await service.create(input);
  created(res, doctor);
}

export async function update(req: Request, res: Response) {
  const { id } = doctorIdParamSchema.parse(req.params);
  const input = updateDoctorSchema.parse(req.body);
  const doctor = await service.update(id, input);
  ok(res, doctor);
}

export async function remove(req: Request, res: Response) {
  const { id } = doctorIdParamSchema.parse(req.params);
  const doctor = await service.softDelete(id);
  ok(res, doctor);
}
