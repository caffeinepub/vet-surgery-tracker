import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { SurgeryCase, Checklist, UserProfile, OpenAIConfig } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      console.log('[useGetCallerUserProfile] Fetching caller user profile', {
        actorAvailable: !!actor,
        timestamp: new Date().toISOString(),
      });

      if (!actor) throw new Error('Actor not available');
      const profile = await actor.getCallerUserProfile();

      console.log('[useGetCallerUserProfile] Profile fetched:', {
        hasProfile: !!profile,
        timestamp: new Date().toISOString(),
      });

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
      console.log('[useSaveCallerUserProfile] Saving profile:', {
        profile,
        actorAvailable: !!actor,
        timestamp: new Date().toISOString(),
      });

      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);

      console.log('[useSaveCallerUserProfile] Profile saved successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Admin Check Query
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

// OpenAI Configuration Queries
export function useGetOpenAIConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<OpenAIConfig | null>({
    queryKey: ['openAIConfig'],
    queryFn: async () => {
      console.log('[useGetOpenAIConfig] Fetching OpenAI configuration', {
        actorAvailable: !!actor,
        timestamp: new Date().toISOString(),
      });

      if (!actor) return null;
      const config = await actor.getOpenAIConfig();

      console.log('[useGetOpenAIConfig] Config fetched:', {
        hasConfig: !!config,
        timestamp: new Date().toISOString(),
      });

      return config;
    },
    enabled: !!actor && !isFetching,
    retry: false,
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
    retry: false,
  });
}

export function useSetOpenAIConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      console.log('[useSetOpenAIConfig] Setting OpenAI configuration', {
        actorAvailable: !!actor,
        timestamp: new Date().toISOString(),
      });

      if (!actor) throw new Error('Actor not available');
      await actor.setOpenAIConfig(apiKey);

      console.log('[useSetOpenAIConfig] Configuration saved successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openAIConfig'] });
      queryClient.invalidateQueries({ queryKey: ['validateOpenAIConfig'] });
    },
  });
}

// Case Queries
export function useGetAllCases() {
  const { actor, isFetching } = useActor();

  return useQuery<SurgeryCase[]>({
    queryKey: ['cases'],
    queryFn: async () => {
      console.log('[useGetAllCases] Fetching all cases', {
        actorAvailable: !!actor,
        timestamp: new Date().toISOString(),
      });

      if (!actor) return [];
      const cases = await actor.getAllCases();

      console.log('[useGetAllCases] Cases fetched:', {
        count: cases.length,
        timestamp: new Date().toISOString(),
      });

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
      console.log('[useGetCaseByMedicalRecordNumber] Fetching case by MRN:', {
        mrn,
        actorAvailable: !!actor,
        timestamp: new Date().toISOString(),
      });

      if (!actor) return null;
      const surgeryCase = await actor.getCaseByMedicalRecordNumber(mrn);

      console.log('[useGetCaseByMedicalRecordNumber] Case fetched:', {
        found: !!surgeryCase,
        timestamp: new Date().toISOString(),
      });

      return surgeryCase;
    },
    enabled: !!actor && !isFetching && enabled && mrn.trim().length > 0,
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
      checklist: Checklist;
    }) => {
      console.log('[useCreateCase] Creating case:', {
        medicalRecordNumber: data.medicalRecordNumber,
        arrivalDate: data.arrivalDate.toString(),
        petName: data.petName,
        species: data.species,
        sex: data.sex,
        actorAvailable: !!actor,
        timestamp: new Date().toISOString(),
      });

      if (!actor) {
        const error = new Error('Actor not available - backend connection failed');
        console.error('[useCreateCase] Actor not available:', {
          timestamp: new Date().toISOString(),
        });
        throw error;
      }

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
          data.checklist
        );

        console.log('[useCreateCase] Case created successfully:', {
          caseId: result.id.toString(),
          medicalRecordNumber: result.medicalRecordNumber,
          timestamp: new Date().toISOString(),
        });

        return result;
      } catch (error) {
        console.error('[useCreateCase] Backend call failed:', {
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          data,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log('[useCreateCase] Invalidating cases cache after successful creation');
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (error, variables) => {
      console.error('[useCreateCase] Mutation error:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        variables,
        timestamp: new Date().toISOString(),
      });
    },
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors, but not for validation errors
      const shouldRetry = failureCount < 2 && 
        error instanceof Error && 
        !error.message.includes('validation') &&
        !error.message.includes('Invalid') &&
        !error.message.includes('Required');
      
      console.log('[useCreateCase] Retry decision:', {
        failureCount,
        shouldRetry,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      
      return shouldRetry;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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
      checklist: Checklist;
    }) => {
      console.log('[useUpdateCase] Updating case:', {
        caseId: data.id.toString(),
        medicalRecordNumber: data.medicalRecordNumber,
        actorAvailable: !!actor,
        timestamp: new Date().toISOString(),
      });

      if (!actor) {
        const error = new Error('Actor not available - backend connection failed');
        console.error('[useUpdateCase] Actor not available:', {
          timestamp: new Date().toISOString(),
        });
        throw error;
      }

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
          data.checklist
        );

        console.log('[useUpdateCase] Case updated successfully:', {
          caseId: data.id.toString(),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[useUpdateCase] Backend call failed:', {
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          data,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      console.log('[useUpdateCase] Invalidating cases cache after successful update');
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (error, variables) => {
      console.error('[useUpdateCase] Mutation error:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        variables,
        timestamp: new Date().toISOString(),
      });
    },
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors, but not for validation errors
      const shouldRetry = failureCount < 2 && 
        error instanceof Error && 
        !error.message.includes('validation') &&
        !error.message.includes('Invalid') &&
        !error.message.includes('Required') &&
        !error.message.includes('not found');
      
      console.log('[useUpdateCase] Retry decision:', {
        failureCount,
        shouldRetry,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      
      return shouldRetry;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useDeleteCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      console.log('[useDeleteCase] Deleting case:', {
        caseId: id,
        actorAvailable: !!actor,
        timestamp: new Date().toISOString(),
      });

      if (!actor) throw new Error('Actor not available');
      await actor.deleteCase(id);

      console.log('[useDeleteCase] Case deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (error) => {
      console.error('[useDeleteCase] Error deleting case:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    },
  });
}

export function useUpdateChecklist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, checklist }: { id: bigint; checklist: Checklist }) => {
      console.log('[useUpdateChecklist] Updating checklist:', {
        caseId: id,
        checklist,
        actorAvailable: !!actor,
        timestamp: new Date().toISOString(),
      });

      if (!actor) throw new Error('Actor not available');
      await actor.updateChecklist(id, checklist);

      console.log('[useUpdateChecklist] Checklist updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (error) => {
      console.error('[useUpdateChecklist] Error updating checklist:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    },
  });
}

export function useUpdateCaseNotes() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: bigint; notes: string }) => {
      console.log('[useUpdateCaseNotes] Updating notes:', {
        caseId: id,
        notesLength: notes.length,
        actorAvailable: !!actor,
        timestamp: new Date().toISOString(),
      });

      if (!actor) throw new Error('Actor not available');
      await actor.updateCaseNotes(id, notes);

      console.log('[useUpdateCaseNotes] Notes updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (error) => {
      console.error('[useUpdateCaseNotes] Error updating notes:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    },
  });
}
