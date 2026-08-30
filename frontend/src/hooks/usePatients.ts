import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  getPatientsApi,
  getPatientByIdApi,
  createPatientApi,
  updatePatientApi,
  getPatientAppointmentHistoryApi,
  type GetPatientsParams,
} from '@/api/patient.api';
import type { CreatePatientInput } from '@/types';

export const PATIENTS_QUERY_KEY = 'patients';

export function usePatients(params: GetPatientsParams = {}) {
  return useQuery({
    queryKey: [PATIENTS_QUERY_KEY, params],
    queryFn: () => getPatientsApi(params),
    placeholderData: keepPreviousData,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: [PATIENTS_QUERY_KEY, id],
    queryFn: () => getPatientByIdApi(id),
    enabled: !!id,
  });
}

export function usePatientHistory(patientId: string) {
  return useQuery({
    queryKey: [PATIENTS_QUERY_KEY, patientId, 'appointments'],
    queryFn: () => getPatientAppointmentHistoryApi(patientId),
    enabled: !!patientId,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePatientInput) => createPatientApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_QUERY_KEY] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreatePatientInput> }) =>
      updatePatientApi(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [PATIENTS_QUERY_KEY] });
    },
  });
}
