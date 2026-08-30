import type { Request, Response } from 'express';
import { created, ok } from '../../config/response';
import * as service from './schedule.service';
import {
  createScheduleSchema,
  doctorIdParamSchema,
  scheduleIdParamSchema,
  scheduleQuerySchema,
  updateScheduleSchema,
} from './schedule.schema';

export async function list(req: Request, res: Response) {
  const query = scheduleQuerySchema.parse(req.query);
  const schedules = await service.findAll(query);
  ok(res, schedules);
}

export async function getByDoctor(req: Request, res: Response) {
  const { doctorId } = doctorIdParamSchema.parse(req.params);
  const query = scheduleQuerySchema.parse(req.query);
  const schedules = await service.findByDoctor(doctorId, query);
  ok(res, schedules);
}

export async function getById(req: Request, res: Response) {
  const { id } = scheduleIdParamSchema.parse(req.params);
  const schedule = await service.findById(id);
  ok(res, schedule);
}

export async function create(req: Request, res: Response) {
  const { doctorId } = doctorIdParamSchema.parse(req.params);
  const input = createScheduleSchema.parse(req.body);
  const schedule = await service.create(doctorId, input);
  created(res, schedule);
}

export async function update(req: Request, res: Response) {
  const { id } = scheduleIdParamSchema.parse(req.params);
  const input = updateScheduleSchema.parse(req.body);
  const schedule = await service.update(id, input);
  ok(res, schedule);
}

export async function remove(req: Request, res: Response) {
  const { id } = scheduleIdParamSchema.parse(req.params);
  const schedule = await service.remove(id);
  ok(res, schedule);
}
