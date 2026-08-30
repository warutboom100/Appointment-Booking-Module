import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  getAppointmentsApi,
  getAppointmentByIdApi,
  getAvailableSlotsApi,
  bookAppointmentApi,
  updateAppointmentStatusApi,
  cancelAppointmentApi,
  rescheduleAppointmentApi,
  getAppointmentTypesApi,
  getDashboardSummaryApi,
  type GetAppointmentsParams,
} from '@/api/appointment.api';
import type { CreateAppointmentInput } from '@/types';

export const APPOINTMENTS_KEY = 'appointments';
export const APPOINTMENT_TYPES_KEY = 'appointment-types';
export const AVAILABLE_SLOTS_KEY = 'available-slots';
export const DASHBOARD_SUMMARY_KEY = 'dashboard-summary';

// === Appointment Types ===
export function useAppointmentTypes() {
  return useQuery({
    queryKey: [APPOINTMENT_TYPES_KEY],
    queryFn: getAppointmentTypesApi,
    staleTime: 5 * 60 * 1000,
  });
}

// === Appointments List & Single ===
export function useAppointments(params: GetAppointmentsParams = {}) {
  return useQuery({
    queryKey: [APPOINTMENTS_KEY, params],
    queryFn: () => getAppointmentsApi(params),
    placeholderData: keepPreviousData,
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: [APPOINTMENTS_KEY, id],
    queryFn: () => getAppointmentByIdApi(id),
    enabled: !!id,
  });
}

// === Available Slots Finder ===
export function useAvailableSlots(params: {
  doctor_id: string;
  date: string;
  appointment_type_id: string;
}) {
  return useQuery({
    queryKey: [AVAILABLE_SLOTS_KEY, params],
    queryFn: () => getAvailableSlotsApi(params),
    enabled: !!params.doctor_id && !!params.date && !!params.appointment_type_id,
  });
}

// === Appointment Mutations ===
export function useBookAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAppointmentInput) => bookAppointmentApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [AVAILABLE_SLOTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DASHBOARD_SUMMARY_KEY] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAppointmentStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DASHBOARD_SUMMARY_KEY] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelAppointmentApi(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [AVAILABLE_SLOTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DASHBOARD_SUMMARY_KEY] });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { new_date: string; new_start_time: string; new_doctor_id?: string };
    }) => rescheduleAppointmentApi(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [AVAILABLE_SLOTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DASHBOARD_SUMMARY_KEY] });
    },
  });
}

// === Dashboard Summary ===
export function useDashboardSummary() {
  return useQuery({
    queryKey: [DASHBOARD_SUMMARY_KEY],
    queryFn: getDashboardSummaryApi,
    refetchInterval: 30 * 1000, // auto refresh every 30s
  });
}
