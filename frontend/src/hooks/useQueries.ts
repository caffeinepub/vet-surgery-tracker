import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  SurgeryCase,
  Task,
  TaskOptions,
  TaskType,
  UserProfile,
  Dashboard,
  OpenAIConfig,
} from '../backend';

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Cases ───────────────────────────────────────────────────────────────────

export function useGetAllCases() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SurgeryCase[]>({
    queryKey: ['cases'],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getAllCases();
      return result;
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCase(id: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SurgeryCase>({
    queryKey: ['case', id.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCase(id);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      medicalRecordNumber: string;
      arrivalDate: bigint;
      petName: string;
      ownerLastName: string;
      species: SurgeryCase['species'];
      breed: string;
      sex: SurgeryCase['sex'];
      dateOfBirth: bigint | null;
      presentingComplaint: string;
      notes: string;
      taskOptions: TaskOptions;
    }) => {
      if (!actor) throw new Error('Actor not available');
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
        params.taskOptions
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      medicalRecordNumber: string;
      arrivalDate: bigint;
      petName: string;
      ownerLastName: string;
      species: SurgeryCase['species'];
      breed: string;
      sex: SurgeryCase['sex'];
      dateOfBirth: bigint | null;
      presentingComplaint: string;
      notes: string;
      task: Task;
    }) => {
      if (!actor) throw new Error('Actor not available');
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
        params.task
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCase(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; task: Task }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTask(params.id, params.task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTaskCompletion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; taskType: TaskType }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTaskCompletion(params.id, params.taskType);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateRemainingTasks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; taskOptions: TaskOptions }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateRemainingTasks(params.id, params.taskOptions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCaseNotes() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCaseNotes(params.id, params.notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function useGetDashboard() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Dashboard>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getDashboard();
    },
    enabled: !!actor && !actorFetching,
  });
}

// ─── OpenAI Config ───────────────────────────────────────────────────────────

export function useGetOpenAIConfig() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<OpenAIConfig | null>({
    queryKey: ['openAIConfig'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getOpenAIConfig();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useSaveOpenAIConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setOpenAIConfig(apiKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openAIConfig'] });
    },
  });
}

export function useValidateOpenAIConfig() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['validateOpenAIConfig'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.validateOpenAIConfig();
    },
    enabled: !!actor && !actorFetching,
  });
}
