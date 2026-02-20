import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { SurgeryCase, UserProfile, Task, TaskOptions, OpenAIConfig } from '../backend';

export function useGetAllCases() {
  const { actor, isFetching } = useActor();

  return useQuery<SurgeryCase[]>({
    queryKey: ['cases'],
    queryFn: async () => {
      if (!actor) return [];
      console.log('[useGetAllCases] Fetching all cases');
      const cases = await actor.getAllCases();
      console.log('[useGetAllCases] Fetched cases:', cases.length);
      return cases;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCaseByMedicalRecordNumber(mrn: string, enabled: boolean = true) {
  const { actor, isFetching } = useActor();

  return useQuery<SurgeryCase | null>({
    queryKey: ['case', 'mrn', mrn],
    queryFn: async () => {
      if (!actor || !mrn) return null;
      console.log('[useGetCaseByMedicalRecordNumber] Fetching case by MRN:', mrn);
      const result = await actor.getCaseByMedicalRecordNumber(mrn);
      console.log('[useGetCaseByMedicalRecordNumber] Result:', result);
      return result;
    },
    enabled: !!actor && !isFetching && enabled && mrn.trim().length > 0,
    retry: false,
  });
}

export function useCreateCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      medicalRecordNumber: string;
      arrivalDate: bigint;
      petName: string;
      ownerLastName: string;
      species: any;
      breed: string;
      sex: any;
      dateOfBirth: bigint | null;
      presentingComplaint: string;
      notes: string;
      taskOptions: TaskOptions;
    }) => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useCreateCase] Creating case with data:', {
        ...data,
        arrivalDate: data.arrivalDate.toString(),
        dateOfBirth: data.dateOfBirth?.toString(),
      });

      try {
        const result = await actor.createCase(
          data.medicalRecordNumber,
          data.arrivalDate,
          data.petName,
          data.ownerLastName,
          data.species,
          data.breed,
          data.sex,
          data.dateOfBirth,
          data.presentingComplaint,
          data.notes,
          data.taskOptions
        );
        console.log('[useCreateCase] Case created successfully:', result);
        return result;
      } catch (error: any) {
        console.error('[useCreateCase] Error creating case:', {
          error,
          message: error?.message,
          stack: error?.stack,
        });
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useCreateCase] Invalidating cases query');
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useUpdateCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      medicalRecordNumber: string;
      arrivalDate: bigint;
      petName: string;
      ownerLastName: string;
      species: any;
      breed: string;
      sex: any;
      dateOfBirth: bigint | null;
      presentingComplaint: string;
      notes: string;
      task: Task;
    }) => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useUpdateCase] Updating case with data:', {
        ...data,
        id: data.id.toString(),
        arrivalDate: data.arrivalDate.toString(),
        dateOfBirth: data.dateOfBirth?.toString(),
      });

      try {
        await actor.updateCase(
          data.id,
          data.medicalRecordNumber,
          data.arrivalDate,
          data.petName,
          data.ownerLastName,
          data.species,
          data.breed,
          data.sex,
          data.dateOfBirth,
          data.presentingComplaint,
          data.notes,
          data.task
        );
        console.log('[useUpdateCase] Case updated successfully');
      } catch (error: any) {
        console.error('[useUpdateCase] Error updating case:', {
          error,
          message: error?.message,
          stack: error?.stack,
        });
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useUpdateCase] Invalidating cases query');
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useDeleteCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useDeleteCase] Deleting case:', id.toString());
      await actor.deleteCase(id);
      console.log('[useDeleteCase] Case deleted successfully');
    },
    onSuccess: () => {
      console.log('[useDeleteCase] Invalidating cases query');
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: bigint; task: Task }) => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useUpdateTask] Updating task for case:', {
        id: data.id.toString(),
        task: data.task,
      });

      try {
        await actor.updateTask(data.id, data.task);
        console.log('[useUpdateTask] Task updated successfully');
      } catch (error: any) {
        console.error('[useUpdateTask] Error updating task:', {
          error,
          message: error?.message,
          stack: error?.stack,
        });
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useUpdateTask] Invalidating cases query');
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useUpdateRemainingTasks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: bigint; taskOptions: TaskOptions }) => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useUpdateRemainingTasks] Updating remaining tasks for case:', {
        id: data.id.toString(),
        taskOptions: data.taskOptions,
      });

      try {
        await actor.updateRemainingTasks(data.id, data.taskOptions);
        console.log('[useUpdateRemainingTasks] Remaining tasks updated successfully');
      } catch (error: any) {
        console.error('[useUpdateRemainingTasks] Error updating remaining tasks:', {
          error,
          message: error?.message,
          stack: error?.stack,
        });
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useUpdateRemainingTasks] Invalidating cases query');
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useUpdateCaseNotes() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: bigint; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useUpdateCaseNotes] Updating notes for case:', data.id.toString());
      await actor.updateCaseNotes(data.id, data.notes);
      console.log('[useUpdateCaseNotes] Notes updated successfully');
    },
    onSuccess: () => {
      console.log('[useUpdateCaseNotes] Invalidating cases query');
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

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
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOpenAIConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<OpenAIConfig | null>({
    queryKey: ['openAIConfig'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOpenAIConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useValidateOpenAIConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['validateOpenAIConfig'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.validateOpenAIConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveOpenAIConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setOpenAIConfig(apiKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validateOpenAIConfig'] });
      queryClient.invalidateQueries({ queryKey: ['openAIConfig'] });
    },
  });
}
