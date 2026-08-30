import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // 1. Clear existing data in reverse dependency order
  await knex('appointments').del();
  await knex('schedule_overrides').del();
  await knex('doctor_schedules').del();
  await knex('appointment_types').del();
  await knex('patients').del();
  await knex('doctors').del();
  await knex('departments').del();
  await knex('refresh_tokens').del();
  await knex('users').del();

  const now = new Date();
  const passwordHash = await bcrypt.hash('password123', 10);

  // Helper for Bangkok date string YYYY-MM-DD
  const formatBangkokDate = (d: Date): string => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d);
  };



  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatBangkokDate(tomorrow);

  const dayAfterTomorrow = new Date(now);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterTomorrowStr = formatBangkokDate(dayAfterTomorrow);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);


  // 2. Users (Admin, Receptionists, Doctors)
  const users = await knex('users')
    .insert([
      {
        username: 'admin',
        password_hash: passwordHash,
        name: 'System Administrator',
        role: 'admin',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        username: 'receptionist1',
        password_hash: passwordHash,
        name: 'Somying Staff',
        role: 'receptionist',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        username: 'receptionist2',
        password_hash: passwordHash,
        name: 'Manit Staff',
        role: 'receptionist',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        username: 'dr_somchai',
        password_hash: passwordHash,
        name: 'Dr. Somchai Jaidee',
        role: 'doctor',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        username: 'dr_natthapong',
        password_hash: passwordHash,
        name: 'Dr. Natthapong Srisuk',
        role: 'doctor',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        username: 'dr_wipawan',
        password_hash: passwordHash,
        name: 'Dr. Wipawan Thongsuk',
        role: 'doctor',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ])
    .returning('*');

  const userMap = Object.fromEntries(users.map((u) => [u.username, u.id]));

  // 3. Departments
  const departments = await knex('departments')
    .insert([
      {
        name: 'General Medicine',
        description: 'Primary outpatient medical care and general health checkup',
        location: 'Building A, Floor 1',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Cardiology',
        description: 'Heart and cardiovascular disease diagnosis and treatment',
        location: 'Building A, Floor 2',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Orthopedics',
        description: 'Bone, joint, spine, and musculoskeletal care',
        location: 'Building B, Floor 1',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Pediatrics',
        description: 'Medical care for infants, children, and adolescents',
        location: 'Building A, Floor 3',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Dermatology',
        description: 'Skin, hair, and nail health specialist clinic',
        location: 'Building C, Floor 1',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ])
    .returning('*');

  const deptMap = Object.fromEntries(departments.map((d) => [d.name, d.id]));

  // 4. Doctors
  const doctors = await knex('doctors')
    .insert([
      {
        user_id: userMap['dr_somchai'],
        department_id: deptMap['General Medicine'],
        first_name: 'Somchai',
        last_name: 'Jaidee',
        specialization: 'Internal Medicine',
        license_no: 'TH-12345',
        phone: '081-111-2222',
        email: 'somchai.j@hospital.com',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: userMap['dr_natthapong'],
        department_id: deptMap['Cardiology'],
        first_name: 'Natthapong',
        last_name: 'Srisuk',
        specialization: 'Interventional Cardiology',
        license_no: 'TH-23456',
        phone: '082-222-3333',
        email: 'natthapong.s@hospital.com',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: userMap['dr_wipawan'],
        department_id: deptMap['Orthopedics'],
        first_name: 'Wipawan',
        last_name: 'Thongsuk',
        specialization: 'Sports Medicine & Joint Surgery',
        license_no: 'TH-34567',
        phone: '083-333-4444',
        email: 'wipawan.t@hospital.com',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: null,
        department_id: deptMap['Pediatrics'],
        first_name: 'Kanya',
        last_name: 'Prasert',
        specialization: 'General Pediatrics',
        license_no: 'TH-45678',
        phone: '084-444-5555',
        email: 'kanya.p@hospital.com',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: null,
        department_id: deptMap['Dermatology'],
        first_name: 'Anan',
        last_name: 'Sukhumvit',
        specialization: 'Clinical Dermatology',
        license_no: 'TH-56789',
        phone: '085-555-6666',
        email: 'anan.s@hospital.com',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ])
    .returning('*');

  const doctorMap = Object.fromEntries(doctors.map((d) => [`${d.first_name} ${d.last_name}`, d.id]));

  // 5. Patients
  await knex('patients')
    .insert([
      {
        hn: 'HN-000001',
        first_name: 'Somporn',
        last_name: 'Kaewkla',
        date_of_birth: '1985-03-15',
        gender: 'female',
        phone: '081-234-5678',
        email: 'somporn.k@example.com',
        id_card_no: '1100100123456',
        address: '123 Sukhumvit Rd, Khlong Toei, Bangkok 10110',
        blood_type: 'O+',
        allergies: 'Penicillin, Amoxicillin',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        hn: 'HN-000002',
        first_name: 'Narisa',
        last_name: 'Wongsawat',
        date_of_birth: '1992-07-22',
        gender: 'female',
        phone: '089-876-5432',
        email: 'narisa.w@example.com',
        id_card_no: '1200200234567',
        address: '45/6 Phahonyothin Rd, Chatuchak, Bangkok 10900',
        blood_type: 'A+',
        allergies: 'None',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        hn: 'HN-000003',
        first_name: 'Prasit',
        last_name: 'Charoensuk',
        date_of_birth: '1978-11-08',
        gender: 'male',
        phone: '062-345-6789',
        email: 'prasit.c@example.com',
        id_card_no: '1300300345678',
        address: '789 Rama 4 Rd, Pathum Wan, Bangkok 10330',
        blood_type: 'B+',
        allergies: 'Aspirin',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        hn: 'HN-000004',
        first_name: 'Wichai',
        last_name: 'Rattana',
        date_of_birth: '1965-01-30',
        gender: 'male',
        phone: '084-555-1234',
        email: 'wichai.r@example.com',
        id_card_no: '1400400456789',
        address: '88 Silom Rd, Bang Rak, Bangkok 10500',
        blood_type: 'AB+',
        allergies: 'Sulfa drugs',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        hn: 'HN-000005',
        first_name: 'Supaporn',
        last_name: 'Maneerat',
        date_of_birth: '2000-09-14',
        gender: 'female',
        phone: '095-123-9876',
        email: 'supaporn.m@example.com',
        id_card_no: '1500500567890',
        address: '12 Ratchadaphisek Rd, Din Daeng, Bangkok 10400',
        blood_type: 'O-',
        allergies: 'None',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

  await knex.raw("SELECT setval('patient_hn_seq', 5, true);");

  // 6. Appointment Types
  await knex('appointment_types')
    .insert([
      {
        name: 'New Patient Visit',
        duration_minutes: 30,
        description: 'First-time patient examination, complete medical history intake and initial diagnosis',
        color: '#4CAF50',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Follow-up Visit',
        duration_minutes: 15,
        description: 'Return visit to evaluate symptom progression, review lab/X-ray results, and refill prescription',
        color: '#2196F3',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Consultation',
        duration_minutes: 20,
        description: 'Specialist medical consultation, diagnostic review, or second opinion',
        color: '#FF9800',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Procedure',
        duration_minutes: 45,
        description: 'Minor outpatient medical procedures such as wound dressing, joint injection, or suture removal',
        color: '#F44336',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);


  // 7. Doctor Schedules (Recurring weekly across all 7 days)
  await knex('doctor_schedules').insert([
    // Dr. Somchai Jaidee (General Medicine) - Mon, Tue, Wed, Thu, Fri
    ...[1, 2, 3, 4, 5].map((day) => ({
      doctor_id: doctorMap['Somchai Jaidee'],
      day_of_week: day,
      start_time: '09:00',
      end_time: '16:00',
      break_start: '12:00',
      break_end: '13:00',
      is_available: true,
      max_appointments: 15,
      created_at: now,
      updated_at: now,
    })),

    // Dr. Natthapong Srisuk (Cardiology) - Mon, Tue, Thu, Fri
    ...[1, 2, 4, 5].map((day) => ({
      doctor_id: doctorMap['Natthapong Srisuk'],
      day_of_week: day,
      start_time: '08:30',
      end_time: '15:30',
      break_start: '12:00',
      break_end: '13:00',
      is_available: true,
      max_appointments: 12,
      created_at: now,
      updated_at: now,
    })),

    // Dr. Wipawan Thongsuk (Orthopedics) - Mon, Wed, Thu, Sat
    ...[1, 3, 4, 6].map((day) => ({
      doctor_id: doctorMap['Wipawan Thongsuk'],
      day_of_week: day,
      start_time: '09:00',
      end_time: '16:00',
      break_start: '12:00',
      break_end: '13:00',
      is_available: true,
      max_appointments: 12,
      created_at: now,
      updated_at: now,
    })),

    // Dr. Kanya Prasert (Pediatrics) - Mon, Tue, Wed, Fri
    ...[1, 2, 3, 5].map((day) => ({
      doctor_id: doctorMap['Kanya Prasert'],
      day_of_week: day,
      start_time: '09:00',
      end_time: '15:00',
      break_start: '12:00',
      break_end: '13:00',
      is_available: true,
      max_appointments: 10,
      created_at: now,
      updated_at: now,
    })),

    // Dr. Anan Sukhumvit (Dermatology) - Tue, Wed, Thu, Fri, Sat
    ...[2, 3, 4, 5, 6].map((day) => ({
      doctor_id: doctorMap['Anan Sukhumvit'],
      day_of_week: day,
      start_time: '10:00',
      end_time: '17:00',
      break_start: '13:00',
      break_end: '14:00',
      is_available: true,
      max_appointments: 10,
      created_at: now,
      updated_at: now,
    })),
  ]);

  // 8. Schedule Overrides (Sample Leave & Special Weekend Hours)
  await knex('schedule_overrides').insert([
    {
      doctor_id: doctorMap['Somchai Jaidee'],
      override_date: dayAfterTomorrowStr,
      is_available: false,
      reason: 'Attending Medical Academic Conference',
      created_at: now,
      updated_at: now,
    },
    {
      doctor_id: doctorMap['Natthapong Srisuk'],
      override_date: tomorrowStr,
      is_available: true,
      start_time: '13:00',
      end_time: '18:00',
      break_start: null,
      break_end: null,
      reason: 'Special Cardiology Evening Clinic',
      created_at: now,
      updated_at: now,
    },
  ]);


}
