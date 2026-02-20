import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { SurgeryCase, UserProfile, CompletedTasks } from '../backend';

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
      completedTasks: CompletedTasks;
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
          data.completedTasks
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
      completedTasks: CompletedTasks;
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
          data.completedTasks
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

      try {
        await actor.deleteCase(id);
        console.log('[useDeleteCase] Case deleted successfully');
      } catch (error: any) {
        console.error('[useDeleteCase] Error deleting case:', {
          error,
          message: error?.message,
          stack: error?.stack,
        });
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useDeleteCase] Invalidating cases query');
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useUpdateCompletedTasks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: bigint; completedTasks: CompletedTasks }) => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useUpdateCompletedTasks] Updating completed tasks:', {
        id: data.id.toString(),
        completedTasks: data.completedTasks,
      });

      try {
        await actor.updateCompletedTasks(data.id, data.completedTasks);
        console.log('[useUpdateCompletedTasks] Completed tasks updated successfully');
      } catch (error: any) {
        console.error('[useUpdateCompletedTasks] Error updating completed tasks:', {
          error,
          message: error?.message,
          stack: error?.stack,
        });
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useUpdateCompletedTasks] Invalidating cases query');
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useGetCallerUserProfile] Fetching caller user profile');
      const profile = await actor.getCallerUserProfile();
      console.log('[useGetCallerUserProfile] Profile:', profile);
      return profile;
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
      console.log('[useSaveCallerUserProfile] Saving profile:', profile);

      try {
        await actor.saveCallerUserProfile(profile);
        console.log('[useSaveCallerUserProfile] Profile saved successfully');
      } catch (error: any) {
        console.error('[useSaveCallerUserProfile] Error saving profile:', {
          error,
          message: error?.message,
          stack: error?.stack,
        });
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useSaveCallerUserProfile] Invalidating currentUserProfile query');
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      console.log('[useIsCallerAdmin] Checking admin status');
      const isAdmin = await actor.isCallerAdmin();
      console.log('[useIsCallerAdmin] Is admin:', isAdmin);
      return isAdmin;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOpenAIConfig() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['openAIConfig'],
    queryFn: async () => {
      if (!actor) return null;
      console.log('[useGetOpenAIConfig] Fetching OpenAI config');
      const config = await actor.getOpenAIConfig();
      console.log('[useGetOpenAIConfig] Config:', config ? 'exists' : 'null');
      return config;
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
      console.log('[useSaveOpenAIConfig] Saving OpenAI config');

      try {
        await actor.setOpenAIConfig(apiKey);
        console.log('[useSaveOpenAIConfig] Config saved successfully');
      } catch (error: any) {
        console.error('[useSaveOpenAIConfig] Error saving config:', {
          error,
          message: error?.message,
          stack: error?.stack,
        });
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useSaveOpenAIConfig] Invalidating openAIConfig query');
      queryClient.invalidateQueries({ queryKey: ['openAIConfig'] });
    },
  });
}

export function useValidateOpenAIConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['validateOpenAIConfig'],
    queryFn: async () => {
      if (!actor) return false;
      console.log('[useValidateOpenAIConfig] Validating OpenAI config');
      const isValid = await actor.validateOpenAIConfig();
      console.log('[useValidateOpenAIConfig] Is valid:', isValid);
      return isValid;
    },
    enabled: !!actor && !isFetching,
  });
}
