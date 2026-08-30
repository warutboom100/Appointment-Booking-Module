import type { Request, Response } from 'express';
import { created, ok } from '../../config/response';
import * as service from './override.service';
import {
  createOverrideSchema,
  doctorIdParamSchema,
  overrideIdParamSchema,
  overrideQuerySchema,
  updateOverrideSchema,
} from './override.schema';

export async function getAll(req: Request, res: Response) {
  const query = overrideQuerySchema.parse(req.query);
  const overrides = await service.findAll(query);
  ok(res, overrides);
}

export async function getByDoctor(req: Request, res: Response) {
  const { doctorId } = doctorIdParamSchema.parse(req.params);
  const query = overrideQuerySchema.parse(req.query);
  const overrides = await service.findByDoctor(doctorId, query);
  ok(res, overrides);
}

export async function getById(req: Request, res: Response) {
  const { id } = overrideIdParamSchema.parse(req.params);
  const override = await service.findById(id);
  ok(res, override);
}

export async function create(req: Request, res: Response) {
  const { doctorId } = doctorIdParamSchema.parse(req.params);
  const input = createOverrideSchema.parse(req.body);
  const override = await service.create(doctorId, input);
  created(res, override);
}

export async function update(req: Request, res: Response) {
  const { id } = overrideIdParamSchema.parse(req.params);
  const input = updateOverrideSchema.parse(req.body);
  const override = await service.update(id, input);
  ok(res, override);
}

export async function remove(req: Request, res: Response) {
  const { id } = overrideIdParamSchema.parse(req.params);
  const override = await service.remove(id);
  ok(res, override);
}
