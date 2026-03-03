import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from './useInternetIdentity';
import { createActorWithConfig } from '../config';
import type {
  SurgeryCase,
  UserProfile,
  Dashboard,
  TaskOptions,
  Task,
  TaskType,
  Species,
  Sex,
  Time,
  OpenAIConfig,
} from '../backend';

// ---------------------------------------------------------------------------
// Actor factory
// ---------------------------------------------------------------------------
function useCreateActor() {
  const { identity } = useInternetIdentity();

  const getActor = async () => {
    if (!identity) {
      return createActorWithConfig();
    }
    return createActorWithConfig({ agentOptions: { identity } });
  };

  return { getActor, identity };
}

// ---------------------------------------------------------------------------
// Error classification helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the error looks like a canister-stopped / IC infrastructure
 * error (Reject code 4 or 5, IC0508, "is stopped", etc.).
 */
export function isCanisterUnavailableError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('Reject code: 5') ||
    msg.includes('Reject code: 4') ||
    msg.includes('IC0508') ||
    msg.includes('is stopped') ||
    msg.includes('CallContextManager') ||
    msg.includes('canister is stopped') ||
    msg.includes('canister is not running') ||
    msg.includes('Canister is stopped')
  );
}

/**
 * Maps any backend/network error to a user-friendly message string.
 * Raw IC rejection details are never returned.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred.';

  if (isCanisterUnavailableError(error)) {
    return 'Unable to connect to the server. Please try again later.';
  }

  const msg = error instanceof Error ? error.message : String(error);

  // Network / fetch failures
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('network error') ||
    msg.includes('ERR_NETWORK')
  ) {
    return 'Unable to connect to the server. Please check your connection and try again.';
  }

  // Generic IC rejection — hide raw details
  if (
    msg.includes('Reject code') ||
    msg.includes('Reject text') ||
    msg.includes('canister_id') ||
    msg.includes('requestDetails')
  ) {
    return 'Unable to connect to the server. Please try again later.';
  }

  return 'Unable to connect to the server. Please try again later.';
}

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------
export function useGetCallerUserProfile() {
  const { getActor, identity } = useCreateActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', identity?.getPrincipal().toString()],
    queryFn: async () => {
      const actor = await getActor();
      return actor.getCallerUserProfile();
    },
    enabled: !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: query.isLoading,
    isFetched: query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const queryClient = useQueryClient();
  const { getActor } = useCreateActor();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      const actor = await getActor();
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------
export function useGetAllCases() {
  const { getActor, identity } = useCreateActor();

  return useQuery<SurgeryCase[]>({
    queryKey: ['cases'],
    queryFn: async () => {
      const actor = await getActor();
      return actor.getAllCases();
    },
    enabled: !!identity,
    staleTime: 1000 * 30,
    retry: (failureCount, error) => {
      // Don't retry canister-stopped errors immediately — they need a redeploy
      if (isCanisterUnavailableError(error)) return false;
      return failureCount < 2;
    },
  });
}

export function useGetCase(id: bigint) {
  const { getActor, identity } = useCreateActor();

  return useQuery<SurgeryCase>({
    queryKey: ['case', id.toString()],
    queryFn: async () => {
      const actor = await getActor();
      return actor.getCase(id);
    },
    enabled: !!identity,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  const { getActor } = useCreateActor();

  return useMutation({
    mutationFn: async (params: {
      medicalRecordNumber: string;
      arrivalDate: Time;
      petName: string;
      ownerLastName: string;
      species: Species;
      breed: string;
      sex: Sex;
      dateOfBirth: Time | null;
      presentingComplaint: string;
      notes: string;
      taskOptions: TaskOptions;
    }) => {
      const actor = await getActor();
      return actor.createCase(
        params.medicalRecordNumber,
        params.arrivalDate,
        params.petName,
        params.ownerLastName,
        params.species,
        params.breed,
        params.sex,
        params.dateOfBirth,
        params.presentingComplaint,
        params.notes,
        params.taskOptions,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  const { getActor } = useCreateActor();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      medicalRecordNumber: string;
      arrivalDate: Time;
      petName: string;
      ownerLastName: string;
      species: Species;
      breed: string;
      sex: Sex;
      dateOfBirth: Time | null;
      presentingComplaint: string;
      notes: string;
      task: Task;
    }) => {
      const actor = await getActor();
      return actor.updateCase(
        params.id,
        params.medicalRecordNumber,
        params.arrivalDate,
        params.petName,
        params.ownerLastName,
        params.species,
        params.breed,
        params.sex,
        params.dateOfBirth,
        params.presentingComplaint,
        params.notes,
        params.task,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['case', variables.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();
  const { getActor } = useCreateActor();

  return useMutation({
    mutationFn: async (id: bigint) => {
      const actor = await getActor();
      return actor.deleteCase(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTaskCompletion() {
  const queryClient = useQueryClient();
  const { getActor } = useCreateActor();

  return useMutation({
    mutationFn: async (params: { id: bigint; taskType: TaskType }) => {
      const actor = await getActor();
      return actor.updateTaskCompletion(params.id, params.taskType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { getActor } = useCreateActor();

  return useMutation({
    mutationFn: async (params: { id: bigint; task: Task }) => {
      const actor = await getActor();
      return actor.updateTask(params.id, params.task);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['case', variables.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateRemainingTasks() {
  const queryClient = useQueryClient();
  const { getActor } = useCreateActor();

  return useMutation({
    mutationFn: async (params: { id: bigint; taskOptions: TaskOptions }) => {
      const actor = await getActor();
      return actor.updateRemainingTasks(params.id, params.taskOptions);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['case', variables.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCaseNotes() {
  const queryClient = useQueryClient();
  const { getActor } = useCreateActor();

  return useMutation({
    mutationFn: async (params: { id: bigint; notes: string }) => {
      const actor = await getActor();
      return actor.updateCaseNotes(params.id, params.notes);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['case', variables.id.toString()] });
    },
  });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export function useGetDashboard() {
  const { getActor, identity } = useCreateActor();

  return useQuery<Dashboard>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const actor = await getActor();
      return actor.getDashboard();
    },
    enabled: !!identity,
    staleTime: 1000 * 30,
  });
}

// ---------------------------------------------------------------------------
// OpenAI / Settings
// ---------------------------------------------------------------------------
export function useValidateOpenAIConfig() {
  const { getActor, identity } = useCreateActor();

  return useQuery<boolean>({
    queryKey: ['validateOpenAIConfig'],
    queryFn: async () => {
      const actor = await getActor();
      return actor.validateOpenAIConfig();
    },
    enabled: !!identity,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetOpenAIConfig() {
  const { getActor, identity } = useCreateActor();

  return useQuery<OpenAIConfig | null>({
    queryKey: ['openAIConfig'],
    queryFn: async () => {
      const actor = await getActor();
      return actor.getOpenAIConfig();
    },
    enabled: !!identity,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveOpenAIConfig() {
  const queryClient = useQueryClient();
  const { getActor } = useCreateActor();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      const actor = await getActor();
      return actor.setOpenAIConfig(apiKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openAIConfig'] });
      queryClient.invalidateQueries({ queryKey: ['validateOpenAIConfig'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Role / Access control
// ---------------------------------------------------------------------------
export function useGetCallerUserRole() {
  const { getActor, identity } = useCreateActor();

  return useQuery<string>({
    queryKey: ['callerUserRole', identity?.getPrincipal().toString()],
    queryFn: async () => {
      const actor = await getActor();
      return actor.getCallerUserRole();
    },
    enabled: !!identity,
    staleTime: 1000 * 60 * 5,
  });
}

export function useIsCallerAdmin() {
  const { getActor, identity } = useCreateActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin', identity?.getPrincipal().toString()],
    queryFn: async () => {
      const actor = await getActor();
      return actor.isCallerAdmin();
    },
    enabled: !!identity,
    staleTime: 1000 * 60 * 5,
  });
}
