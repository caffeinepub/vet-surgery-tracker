import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { SurgeryCase, Task, TaskOptions, UserProfile, OpenAIConfig } from '../backend';
import { TaskType } from '../backend';

// ─── Query Keys ────────────────────────────────────────────────────────────────

export function useCasesQueryKey() {
  const { identity } = useInternetIdentity();
  return ['cases', identity?.getPrincipal().toString() ?? 'anon'];
}

export function useDashboardQueryKey() {
  const { identity } = useInternetIdentity();
  return ['dashboard', identity?.getPrincipal().toString() ?? 'anon'];
}

// ─── User Profile ───────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', identity?.getPrincipal().toString() ?? 'anon'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
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
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['currentUserProfile', identity?.getPrincipal().toString() ?? 'anon'],
      });
    },
  });
}

// ─── Cases ──────────────────────────────────────────────────────────────────────

export function useGetAllCases() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString() ?? 'anon';

  return useQuery<SurgeryCase[]>({
    queryKey: ['cases', principalStr],
    queryFn: async () => {
      if (!actor) {
        console.warn('[useGetAllCases] actor not available');
        return [];
      }
      try {
        const result = await actor.getAllCases();
        console.log(`[useGetAllCases] fetched ${result.length} cases for principal ${principalStr}`);
        return result;
      } catch (err) {
        console.error('[useGetAllCases] fetch error:', err);
        throw err;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 0,
    retry: (failureCount, error) => {
      // Don't retry authorization errors
      const msg = String(error);
      if (msg.includes('Unauthorized') || msg.includes('Only users')) return false;
      return failureCount < 2;
    },
  });
}

export function useGetCase(id: bigint) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<SurgeryCase>({
    queryKey: ['case', id.toString(), identity?.getPrincipal().toString() ?? 'anon'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCase(id);
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useCreateCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (params: {
      medicalRecordNumber: string;
      arrivalDate: bigint;
      petName: string;
      ownerLastName: string;
      species: import('../backend').Species;
      breed: string;
      sex: import('../backend').Sex;
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
        params.taskOptions,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cases', identity?.getPrincipal().toString() ?? 'anon'],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', identity?.getPrincipal().toString() ?? 'anon'],
      });
    },
  });
}

export function useCreateCaseBatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (
      cases: Array<{
        medicalRecordNumber: string;
        arrivalDate: bigint;
        petName: string;
        ownerLastName: string;
        species: import('../backend').Species;
        breed: string;
        sex: import('../backend').Sex;
        dateOfBirth: bigint | null;
        presentingComplaint: string;
        notes: string;
        taskOptions: TaskOptions;
      }>,
    ) => {
      if (!actor) throw new Error('Actor not available');
      const results: SurgeryCase[] = [];
      for (const c of cases) {
        const result = await actor.createCase(
          c.medicalRecordNumber,
          c.arrivalDate,
          c.petName,
          c.ownerLastName,
          c.species,
          c.breed,
          c.sex,
          c.dateOfBirth,
          c.presentingComplaint,
          c.notes,
          c.taskOptions,
        );
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cases', identity?.getPrincipal().toString() ?? 'anon'],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', identity?.getPrincipal().toString() ?? 'anon'],
      });
    },
  });
}

export function useUpdateCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      medicalRecordNumber: string;
      arrivalDate: bigint;
      petName: string;
      ownerLastName: string;
      species: import('../backend').Species;
      breed: string;
      sex: import('../backend').Sex;
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
        params.task,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['cases', identity?.getPrincipal().toString() ?? 'anon'],
      });
      queryClient.invalidateQueries({
        queryKey: ['case', variables.id.toString(), identity?.getPrincipal().toString() ?? 'anon'],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', identity?.getPrincipal().toString() ?? 'anon'],
      });
    },
  });
}

export function useDeleteCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCase(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cases', identity?.getPrincipal().toString() ?? 'anon'],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', identity?.getPrincipal().toString() ?? 'anon'],
      });
    },
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (params: { id: bigint; task: Task }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTask(params.id, params.task);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['cases', identity?.getPrincipal().toString() ?? 'anon'],
      });
      queryClient.invalidateQueries({
        queryKey: ['case', variables.id.toString(), identity?.getPrincipal().toString() ?? 'anon'],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', identity?.getPrincipal().toString() ?? 'anon'],
      });
    },
  });
}

export function useUpdateTaskCompletion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString() ?? 'anon';

  return useMutation({
    mutationFn: async (params: { id: bigint; taskType: TaskType }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTaskCompletion(params.id, params.taskType);
    },
    onMutate: async (variables) => {
      // Optimistic update: toggle the task completion in the cache immediately
      const casesQueryKey = ['cases', principalStr];
      await queryClient.cancelQueries({ queryKey: casesQueryKey });
      const previousCases = queryClient.getQueryData<SurgeryCase[]>(casesQueryKey);

      if (previousCases) {
        const updatedCases = previousCases.map((c) => {
          if (c.id !== variables.id) return c;
          const task = { ...c.task };
          switch (variables.taskType) {
            case TaskType.dischargeNotes:
              task.dischargeNotesCompleted = !task.dischargeNotesCompleted;
              break;
            case TaskType.pdvmNotified:
              task.pdvmNotifiedCompleted = !task.pdvmNotifiedCompleted;
              break;
            case TaskType.labs:
              task.labsCompleted = !task.labsCompleted;
              break;
            case TaskType.histo:
              task.histoCompleted = !task.histoCompleted;
              break;
            case TaskType.surgeryReport:
              task.surgeryReportCompleted = !task.surgeryReportCompleted;
              break;
            case TaskType.imaging:
              task.imagingCompleted = !task.imagingCompleted;
              break;
            case TaskType.culture:
              task.cultureCompleted = !task.cultureCompleted;
              break;
          }
          return { ...c, task };
        });
        queryClient.setQueryData(casesQueryKey, updatedCases);
      }

      return { previousCases };
    },
    onError: (_err, _variables, context) => {
      // Roll back on error
      if (context?.previousCases) {
        queryClient.setQueryData(['cases', principalStr], context.previousCases);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['cases', principalStr],
      });
      queryClient.invalidateQueries({
        queryKey: ['case', variables.id.toString(), principalStr],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', principalStr],
      });
    },
  });
}

export function useUpdateCaseNotes() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (params: { id: bigint; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCaseNotes(params.id, params.notes);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['cases', identity?.getPrincipal().toString() ?? 'anon'],
      });
      queryClient.invalidateQueries({
        queryKey: ['case', variables.id.toString(), identity?.getPrincipal().toString() ?? 'anon'],
      });
    },
  });
}

export function useUpdateRemainingTasks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (params: { id: bigint; taskOptions: TaskOptions }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateRemainingTasks(params.id, params.taskOptions);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['cases', identity?.getPrincipal().toString() ?? 'anon'],
      });
      queryClient.invalidateQueries({
        queryKey: ['case', variables.id.toString(), identity?.getPrincipal().toString() ?? 'anon'],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', identity?.getPrincipal().toString() ?? 'anon'],
      });
    },
  });
}

// ─── Dashboard ──────────────────────────────────────────────────────────────────

export function useGetDashboard() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<import('../backend').Dashboard>({
    queryKey: ['dashboard', identity?.getPrincipal().toString() ?? 'anon'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getDashboard();
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 0,
    retry: (failureCount, error) => {
      const msg = String(error);
      if (msg.includes('Unauthorized') || msg.includes('Only users')) return false;
      return failureCount < 2;
    },
  });
}

// ─── OpenAI Config ──────────────────────────────────────────────────────────────

export function useGetOpenAIConfig() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<OpenAIConfig | null>({
    queryKey: ['openAIConfig', identity?.getPrincipal().toString() ?? 'anon'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getOpenAIConfig();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}

export function useSaveOpenAIConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setOpenAIConfig(apiKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['openAIConfig', identity?.getPrincipal().toString() ?? 'anon'],
      });
    },
  });
}

export function useValidateOpenAIConfig() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['validateOpenAIConfig', identity?.getPrincipal().toString() ?? 'anon'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.validateOpenAIConfig();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 30_000,
  });
}

// ─── User Role ──────────────────────────────────────────────────────────────────

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<import('../backend').UserRole>({
    queryKey: ['callerUserRole', identity?.getPrincipal().toString() ?? 'anon'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}
