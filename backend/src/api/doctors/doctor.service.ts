import { db } from '../../knex/db';
import { errors, type PageMeta } from '../../config/response';
import { now } from '../../utils/time';
import type { CreateDoctorInput, DoctorQuery, UpdateDoctorInput } from './doctor.schema';

export interface Doctor {
  id: string;
  user_id: string | null;
  department_id: string;
  first_name: string;
  last_name: string;
  specialization: string | null;
  license_no: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DoctorWithDepartment extends Doctor {
  department_name: string;
  department_location: string | null;
}

export async function findAll(
  query: DoctorQuery,
): Promise<{ items: DoctorWithDepartment[]; meta: PageMeta }> {
  const { page, limit, department_id, search, is_active } = query;
  const offset = (page - 1) * limit;

  const baseQuery = db('doctors')
    .join('departments', 'doctors.department_id', 'departments.id')
    .select(
      'doctors.*',
      'departments.name as department_name',
      'departments.location as department_location',
    );

  if (department_id) {
    baseQuery.where('doctors.department_id', department_id);
  }

  if (typeof is_active === 'boolean') {
    baseQuery.where('doctors.is_active', is_active);
  }

  if (search) {
    baseQuery.where((builder) => {
      builder
        .whereILike('doctors.first_name', `%${search}%`)
        .orWhereILike('doctors.last_name', `%${search}%`)
        .orWhereILike('doctors.specialization', `%${search}%`)
        .orWhereILike('doctors.license_no', `%${search}%`);
    });
  }

  const countResult = await baseQuery
    .clone()
    .clearSelect()
    .count<{ count: string | number }>('doctors.id as count')
    .first();

  const total = Number(countResult?.count ?? 0);

  const items = await baseQuery
    .clone()
    .orderBy('doctors.first_name', 'asc')
    .orderBy('doctors.last_name', 'asc')
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

export async function findById(id: string): Promise<DoctorWithDepartment> {
  const doctor = await db('doctors')
    .join('departments', 'doctors.department_id', 'departments.id')
    .select(
      'doctors.*',
      'departments.name as department_name',
      'departments.location as department_location',
    )
    .where('doctors.id', id)
    .first();

  if (!doctor) {
    throw errors.notFound('ไม่พบข้อมูลแพทย์');
  }

  return doctor;
}

export async function create(input: CreateDoctorInput): Promise<Doctor> {
  // 1. Verify Department exists & is active
  const department = await db('departments').where({ id: input.department_id }).first();
  if (!department) {
    throw errors.notFound('ไม่พบข้อมูลแผนก');
  }
  if (!department.is_active) {
    throw errors.validation('แผนกนี้ถูกปิดใช้งานแล้ว');
  }

  // 2. Verify License No uniqueness
  const existingLicense = await db('doctors').where({ license_no: input.license_no }).first();
  if (existingLicense) {
    throw errors.duplicate('เลขที่ใบประกอบวิชาชีพนี้มีอยู่ในระบบแล้ว');
  }

  // 3. Verify User if linked
  if (input.user_id) {
    const user = await db('users').where({ id: input.user_id }).first();
    if (!user) {
      throw errors.notFound('ไม่พบข้อมูลผู้ใช้งานที่ต้องการผูก');
    }
    const userLinked = await db('doctors').where({ user_id: input.user_id }).first();
    if (userLinked) {
      throw errors.duplicate('ผู้ใช้งานนี้ถูกผูกกับแพทย์ท่านอื่นแล้ว');
    }
  }

  const timestamp = now();
  const [created] = await db<Doctor>('doctors')
    .insert({
      first_name: input.first_name,
      last_name: input.last_name,
      department_id: input.department_id,
      license_no: input.license_no,
      specialization: input.specialization ?? null,
      phone: input.phone ?? null,
      email: input.email || null,
      user_id: input.user_id ?? null,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .returning('*');

  return created;
}

export async function update(id: string, input: UpdateDoctorInput): Promise<Doctor> {
  const doctor = await findById(id);

  if (input.department_id && input.department_id !== doctor.department_id) {
    const department = await db('departments').where({ id: input.department_id }).first();
    if (!department) {
      throw errors.notFound('ไม่พบข้อมูลแผนก');
    }
    if (!department.is_active) {
      throw errors.validation('แผนกนี้ถูกปิดใช้งานแล้ว');
    }
  }

  if (input.license_no && input.license_no !== doctor.license_no) {
    const duplicate = await db('doctors')
      .where({ license_no: input.license_no })
      .whereNot({ id })
      .first();

    if (duplicate) {
      throw errors.duplicate('เลขที่ใบประกอบวิชาชีพนี้มีอยู่ในระบบแล้ว');
    }
  }

  if (input.user_id && input.user_id !== doctor.user_id) {
    const user = await db('users').where({ id: input.user_id }).first();
    if (!user) {
      throw errors.notFound('ไม่พบข้อมูลผู้ใช้งานที่ต้องการผูก');
    }
    const userLinked = await db('doctors')
      .where({ user_id: input.user_id })
      .whereNot({ id })
      .first();

    if (userLinked) {
      throw errors.duplicate('ผู้ใช้งานนี้ถูกผูกกับแพทย์ท่านอื่นแล้ว');
    }
  }

  const timestamp = now();
  const [updated] = await db<Doctor>('doctors')
    .where({ id })
    .update({
      ...(input.first_name !== undefined ? { first_name: input.first_name } : {}),
      ...(input.last_name !== undefined ? { last_name: input.last_name } : {}),
      ...(input.department_id !== undefined ? { department_id: input.department_id } : {}),
      ...(input.license_no !== undefined ? { license_no: input.license_no } : {}),
      ...(input.specialization !== undefined ? { specialization: input.specialization } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email || null } : {}),
      ...(input.user_id !== undefined ? { user_id: input.user_id } : {}),
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      updated_at: timestamp,
    })
    .returning('*');

  return updated;
}

export async function softDelete(id: string): Promise<Doctor> {
  await findById(id);

  const timestamp = now();
  const [deleted] = await db<Doctor>('doctors')
    .where({ id })
    .update({
      is_active: false,
      updated_at: timestamp,
    })
    .returning('*');

  return deleted;
}
