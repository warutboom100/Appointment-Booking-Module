import { db } from '../../knex/db';
import { errors, type PageMeta } from '../../config/response';
import { now } from '../../utils/time';
import type {
  AppointmentTypeQuery,
  CreateAppointmentTypeInput,
  UpdateAppointmentTypeInput,
} from './appointment-type.schema';

export interface AppointmentType {
  id: string;
  name: string;
  duration_minutes: number;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function findAll(
  query: AppointmentTypeQuery,
): Promise<{ items: AppointmentType[]; meta: PageMeta }> {
  const { page, limit, search, is_active } = query;
  const offset = (page - 1) * limit;

  const baseQuery = db<AppointmentType>('appointment_types');

  if (typeof is_active === 'boolean') {
    baseQuery.where('is_active', is_active);
  }

  if (search) {
    baseQuery.where((builder) => {
      builder
        .whereILike('name', `%${search}%`)
        .orWhereILike('description', `%${search}%`);
    });
  }

  const countResult = await baseQuery.clone().count<{ count: string | number }>('id as count').first();
  const total = Number(countResult?.count ?? 0);

  const items = await baseQuery
    .clone()
    .orderBy('duration_minutes', 'asc')
    .orderBy('name', 'asc')
    .limit(limit)
    .offset(offset);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function findById(id: string): Promise<AppointmentType> {
  const appointmentType = await db<AppointmentType>('appointment_types').where({ id }).first();
  if (!appointmentType) {
    throw errors.notFound('ไม่พบข้อมูลประเภทการนัดหมาย');
  }
  return appointmentType;
}

export async function create(input: CreateAppointmentTypeInput): Promise<AppointmentType> {
  const existing = await db<AppointmentType>('appointment_types')
    .whereRaw('LOWER(name) = LOWER(?)', [input.name])
    .first();

  if (existing) {
    throw errors.duplicate('ชื่อประเภทการนัดหมายนี้มีอยู่ในระบบแล้ว');
  }

  const timestamp = now();
  const [created] = await db<AppointmentType>('appointment_types')
    .insert({
      name: input.name,
      duration_minutes: input.duration_minutes,
      description: input.description ?? null,
      color: input.color || null,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .returning('*');

  return created;
}

export async function update(
  id: string,
  input: UpdateAppointmentTypeInput,
): Promise<AppointmentType> {
  const appointmentType = await findById(id);

  if (input.name && input.name.toLowerCase() !== appointmentType.name.toLowerCase()) {
    const duplicate = await db<AppointmentType>('appointment_types')
      .whereRaw('LOWER(name) = LOWER(?)', [input.name])
      .whereNot({ id })
      .first();

    if (duplicate) {
      throw errors.duplicate('ชื่อประเภทการนัดหมายนี้มีอยู่ในระบบแล้ว');
    }
  }

  const timestamp = now();
  const [updated] = await db<AppointmentType>('appointment_types')
    .where({ id })
    .update({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.duration_minutes !== undefined ? { duration_minutes: input.duration_minutes } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.color !== undefined ? { color: input.color || null } : {}),
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      updated_at: timestamp,
    })
    .returning('*');

  return updated;
}

export async function softDelete(id: string): Promise<AppointmentType> {
  await findById(id);

  const timestamp = now();
  const [deleted] = await db<AppointmentType>('appointment_types')
    .where({ id })
    .update({
      is_active: false,
      updated_at: timestamp,
    })
    .returning('*');

  return deleted;
}
