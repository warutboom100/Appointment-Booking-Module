import { db } from '../../knex/db';
import { errors, type PageMeta } from '../../config/response';
import { now } from '../../utils/time';
import type {
  CreateDepartmentInput,
  DepartmentQuery,
  UpdateDepartmentInput,
} from './department.schema';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function findAll(
  query: DepartmentQuery,
): Promise<{ items: Department[]; meta: PageMeta }> {
  const { page, limit, search, is_active } = query;
  const offset = (page - 1) * limit;

  const baseQuery = db<Department>('departments');

  if (typeof is_active === 'boolean') {
    baseQuery.where('is_active', is_active);
  }

  if (search) {
    baseQuery.where((builder) => {
      builder
        .whereILike('name', `%${search}%`)
        .orWhereILike('location', `%${search}%`);
    });
  }

  const countResult = await baseQuery.clone().count<{ count: string | number }>('id as count').first();
  const total = Number(countResult?.count ?? 0);

  const items = await baseQuery
    .clone()
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

export async function findById(id: string): Promise<Department> {
  const department = await db<Department>('departments').where({ id }).first();
  if (!department) {
    throw errors.notFound('ไม่พบข้อมูลแผนก');
  }
  return department;
}

export async function create(input: CreateDepartmentInput): Promise<Department> {
  const existing = await db<Department>('departments')
    .whereRaw('LOWER(name) = LOWER(?)', [input.name])
    .first();

  if (existing) {
    throw errors.duplicate('ชื่อแผนกนี้มีอยู่ในระบบแล้ว');
  }

  const timestamp = now();
  const [created] = await db<Department>('departments')
    .insert({
      name: input.name,
      description: input.description ?? null,
      location: input.location ?? null,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .returning('*');

  return created;
}

export async function update(
  id: string,
  input: UpdateDepartmentInput,
): Promise<Department> {
  const department = await findById(id);

  if (input.name && input.name.toLowerCase() !== department.name.toLowerCase()) {
    const duplicate = await db<Department>('departments')
      .whereRaw('LOWER(name) = LOWER(?)', [input.name])
      .whereNot({ id })
      .first();

    if (duplicate) {
      throw errors.duplicate('ชื่อแผนกนี้มีอยู่ในระบบแล้ว');
    }
  }

  const timestamp = now();
  const [updated] = await db<Department>('departments')
    .where({ id })
    .update({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      updated_at: timestamp,
    })
    .returning('*');

  return updated;
}

export async function softDelete(id: string): Promise<Department> {
  await findById(id);

  const timestamp = now();
  const [deleted] = await db<Department>('departments')
    .where({ id })
    .update({
      is_active: false,
      updated_at: timestamp,
    })
    .returning('*');

  return deleted;
}
