// === Role & Auth ===
export type UserRole = 'admin' | 'receptionist' | 'doctor';

export interface SafeUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  accessToken: string;
  user: SafeUser;
}

export interface RegisterInput {
  username: string;
  password: string;
  name: string;
  role?: UserRole;
}

// === API Response & Pagination ===
export interface ApiResponse<T> {
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]> | unknown;
  };
}

// === Master Data: Department ===
export interface Department {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// === Master Data: Doctor ===
export interface Doctor {
  id: string;
  user_id?: string | null;
  department_id: string;
  first_name: string;
  last_name: string;
  title?: string | null; // e.g. "นพ.", "พญ."
  specialization?: string | null;
  license_no?: string | null;
  room_number?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  department_name?: string;
  created_at: string;
  updated_at: string;
}

// === Master Data: Patient ===
export type Gender = 'male' | 'female' | 'other';

export interface Patient {
  id: string;
  hn: string; // Auto-generated e.g. HN20240101-001
  first_name: string;
  last_name: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: Gender;
  phone?: string | null;
  email?: string | null;
  id_card_number?: string | null;
  address?: string | null;
  allergies?: string | null;
  medical_history?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientInput {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  phone?: string;
  email?: string;
  id_card_number?: string;
  address?: string;
  allergies?: string;
  medical_history?: string;
}

// === Master Data: Appointment Type ===
export interface AppointmentType {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  color_code?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// === Doctor Schedule & Overrides ===
export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0=Sunday .. 6=Saturday
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  break_start?: string | null;
  break_end?: string | null;
  is_available: boolean;
  max_appointments?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleOverride {
  id: string;
  doctor_id: string;
  override_date: string; // YYYY-MM-DD
  is_available: boolean;
  start_time?: string | null;
  end_time?: string | null;
  break_start?: string | null;
  break_end?: string | null;
  reason?: string | null;
  created_at: string;
  updated_at: string;

  // Joined doctor & department fields
  doctor_first_name?: string;
  doctor_last_name?: string;
  doctor_title?: string;
  doctor_specialization?: string;
  department_name?: string;
  department_id?: string;
}

// === Appointment (Core) ===
export type AppointmentStatus =
  | 'booked'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  department_id: string;
  appointment_type_id: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  status: AppointmentStatus;
  reason_for_visit?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  cancelled_by_user_id?: string | null;
  rescheduled_from_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  patient?: Patient;
  doctor?: Doctor;
  department?: Department;
  appointment_type?: AppointmentType;
}

export interface CreateAppointmentInput {
  patient_id: string;
  doctor_id: string;
  department_id: string;
  appointment_type_id: string;
  appointment_date: string;
  start_time: string;
  reason_for_visit?: string;
  notes?: string;
}

// === Available Slots Response ===
export interface TimeSlot {
  start_time: string;
  end_time: string;
}

export interface AvailableSlotsData {
  doctor_id: string;
  doctor_name: string;
  date: string;
  appointment_type: string;
  duration_minutes: number;
  slots: TimeSlot[];
}

// === Dashboard Summary ===
export interface DashboardSummary {
  today_date: string;
  total_appointments_today: number;
  status_breakdown: Record<AppointmentStatus, number>;
  active_doctors_today: number;
  checked_in_queue_count: number;
}
