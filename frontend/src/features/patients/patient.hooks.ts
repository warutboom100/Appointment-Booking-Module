import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  getPatients,
  getPatientById,
  createPatient,
  getPatientAppointmentHistory,
  type GetPatientsParams,
} from './patient.api';
import type { CreatePatientInput } from '@/types';

export const PATIENTS_QUERY_KEY = 'patients';

export function usePatients(params: GetPatientsParams = {}) {
  return useQuery({
    queryKey: [PATIENTS_QUERY_KEY, params],
    queryFn: () => getPatients(params),
    placeholderData: keepPreviousData,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: [PATIENTS_QUERY_KEY, id],
    queryFn: () => getPatientById(id),
    enabled: !!id,
  });
}

export function usePatientHistory(patientId: string) {
  return useQuery({
    queryKey: [PATIENTS_QUERY_KEY, patientId, 'appointments'],
    queryFn: () => getPatientAppointmentHistory(patientId),
    enabled: !!patientId,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePatientInput) => createPatient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_QUERY_KEY] });
    },
  });
}
