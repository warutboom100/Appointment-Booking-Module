import type { Request, Response } from 'express';
import { ok } from '../../config/response';
import * as service from './dashboard.service';
import { dashboardStatsQuerySchema, dashboardSummaryQuerySchema } from './dashboard.schema';

export async function getSummary(req: Request, res: Response) {
  const query = dashboardSummaryQuerySchema.parse(req.query);
  const result = await service.getSummary(query);
  ok(res, result);
}

export async function getStats(req: Request, res: Response) {
  const query = dashboardStatsQuerySchema.parse(req.query);
  const result = await service.getStats(query);
  ok(res, result);
}
