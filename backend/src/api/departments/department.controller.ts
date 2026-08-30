import type { Request, Response } from 'express';
import { ok, created, list } from '../../config/response';
import * as service from './department.service';
import {
  createDepartmentSchema,
  departmentIdParamSchema,
  departmentQuerySchema,
  updateDepartmentSchema,
} from './department.schema';

export async function getAll(req: Request, res: Response) {
  const query = departmentQuerySchema.parse(req.query);
  const result = await service.findAll(query);
  list(res, result.items, result.meta);
}

export async function getById(req: Request, res: Response) {
  const { id } = departmentIdParamSchema.parse(req.params);
  const department = await service.findById(id);
  ok(res, department);
}

export async function create(req: Request, res: Response) {
  const input = createDepartmentSchema.parse(req.body);
  const department = await service.create(input);
  created(res, department);
}

export async function update(req: Request, res: Response) {
  const { id } = departmentIdParamSchema.parse(req.params);
  const input = updateDepartmentSchema.parse(req.body);
  const department = await service.update(id, input);
  ok(res, department);
}

export async function remove(req: Request, res: Response) {
  const { id } = departmentIdParamSchema.parse(req.params);
  const department = await service.softDelete(id);
  ok(res, department);
}
