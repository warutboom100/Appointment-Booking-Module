import { db } from '../../knex/db';
import { errors, type PageMeta } from '../../config/response';
import { now } from '../../utils/time';
import { generateNextHn } from './patient.fn';
import type {
  CreatePatientInput,
  Gender,
  PatientQuery,
  UpdatePatientInput,
} from './patient.schema';

export interface Patient {
  id: string;
  hn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  email: string | null;
  id_card_no: string | null;
  address: string | null;
  blood_type: string | null;
  allergies: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function findAll(
  query: PatientQuery,
): Promise<{ items: Patient[]; meta: PageMeta }> {
  const { page, limit, search, gender, is_active } = query;
  const offset = (page - 1) * limit;

  const baseQuery = db<Patient>('patients');

  if (gender) {
    baseQuery.where('gender', gender);
  }

  if (typeof is_active === 'boolean') {
    baseQuery.where('is_active', is_active);
  }

  if (search) {
    baseQuery.where((builder) => {
      builder
        .whereILike('first_name', `%${search}%`)
        .orWhereILike('last_name', `%${search}%`)
        .orWhereILike('hn', `%${search}%`)
        .orWhereILike('phone', `%${search}%`)
        .orWhereILike('id_card_no', `%${search}%`);
    });
  }

  const countResult = await baseQuery.clone().count<{ count: string | number }>('id as count').first();
  const total = Number(countResult?.count ?? 0);

  const items = await baseQuery
    .clone()
    .orderBy('created_at', 'desc')
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

export async function findById(id: string): Promise<Patient> {
  const patient = await db<Patient>('patients').where({ id }).first();
  if (!patient) {
    throw errors.notFound('ไม่พบข้อมูลผู้ป่วย');
  }
  return patient;
}

export async function create(input: CreatePatientInput): Promise<Patient> {
  if (input.id_card_no) {
    const existing = await db<Patient>('patients')
      .where({ id_card_no: input.id_card_no })
      .first();

    if (existing) {
      throw errors.duplicate('เลขบัตรประชาชน/พาสปอร์ตนี้มีอยู่ในระบบแล้ว');
    }
  }

  return await db.transaction(async (trx) => {
    const hn = await generateNextHn(trx);
    const timestamp = now();

    const [created] = await trx<Patient>('patients')
      .insert({
        hn,
        first_name: input.first_name,
        last_name: input.last_name,
        date_of_birth: input.date_of_birth,
        gender: input.gender,
        phone: input.phone,
        email: input.email || null,
        id_card_no: input.id_card_no || null,
        address: input.address || null,
        blood_type: input.blood_type || null,
        allergies: input.allergies || null,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .returning('*');

    return created;
  });
}

export async function update(id: string, input: UpdatePatientInput): Promise<Patient> {
  const patient = await findById(id);

  if (input.id_card_no && input.id_card_no !== patient.id_card_no) {
    const duplicate = await db<Patient>('patients')
      .where({ id_card_no: input.id_card_no })
      .whereNot({ id })
      .first();

    if (duplicate) {
      throw errors.duplicate('เลขบัตรประชาชน/พาสปอร์ตนี้มีอยู่ในระบบแล้ว');
    }
  }

  const timestamp = now();
  const [updated] = await db<Patient>('patients')
    .where({ id })
    .update({
      ...(input.first_name !== undefined ? { first_name: input.first_name } : {}),
      ...(input.last_name !== undefined ? { last_name: input.last_name } : {}),
      ...(input.date_of_birth !== undefined ? { date_of_birth: input.date_of_birth } : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email || null } : {}),
      ...(input.id_card_no !== undefined ? { id_card_no: input.id_card_no || null } : {}),
      ...(input.address !== undefined ? { address: input.address || null } : {}),
      ...(input.blood_type !== undefined ? { blood_type: input.blood_type || null } : {}),
      ...(input.allergies !== undefined ? { allergies: input.allergies || null } : {}),
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      updated_at: timestamp,
    })
    .returning('*');

  return updated;
}

export async function softDelete(id: string): Promise<Patient> {
  await findById(id);

  const timestamp = now();
  const [deleted] = await db<Patient>('patients')
    .where({ id })
    .update({
      is_active: false,
      updated_at: timestamp,
    })
    .returning('*');

  return deleted;
}
