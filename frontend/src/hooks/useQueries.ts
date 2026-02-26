import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
import type {
  SurgeryCase,
  Task,
  TaskOptions,
  TaskType,
  UserProfile,
  Dashboard,
  OpenAIConfig,
  Species,
  Sex,
} from "../backend";

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
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

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Cases ───────────────────────────────────────────────────────────────────

export function useGetAllCases() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<SurgeryCase[]>({
    queryKey: ["cases", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.getAllCases();
      return result;
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: 2,
  });
}

export function useGetCase(id: bigint) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<SurgeryCase>({
    queryKey: ["case", id.toString(), identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCase(id);
    },
    enabled: !!actor && !actorFetching && !!identity,
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
      species: Species;
      breed: string;
      sex: Sex;
      dateOfBirth: bigint | null;
      presentingComplaint: string;
      notes: string;
      taskOptions: TaskOptions;
    }) => {
      if (!actor) throw new Error("Actor not available");
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
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
      species: Species;
      breed: string;
      sex: Sex;
      dateOfBirth: bigint | null;
      presentingComplaint: string;
      notes: string;
      task: Task;
    }) => {
      if (!actor) throw new Error("Actor not available");
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case", variables.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteCase(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; task: Task }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateTask(params.id, params.task);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case", variables.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTaskCompletion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; taskType: TaskType }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateTaskCompletion(params.id, params.taskType);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case", variables.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateRemainingTasks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; taskOptions: TaskOptions }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateRemainingTasks(params.id, params.taskOptions);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case", variables.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateCaseNotes() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; notes: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateCaseNotes(params.id, params.notes);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case", variables.id.toString()] });
    },
  });
}

export function useGetCasesByOwner(ownerLastName: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<SurgeryCase[]>({
    queryKey: ["casesByOwner", ownerLastName, identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCasesByOwner(ownerLastName);
    },
    enabled: !!actor && !actorFetching && !!identity && ownerLastName.length > 0,
  });
}

export function useSearchCasesByMRN(searchTerm: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<SurgeryCase[]>({
    queryKey: ["searchCases", searchTerm, identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.searchCasesByMedicalRecordNumber(searchTerm);
    },
    enabled: !!actor && !actorFetching && !!identity && searchTerm.length > 0,
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function useGetDashboard() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Dashboard>({
    queryKey: ["dashboard", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getDashboard();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: 2,
  });
}

// ─── OpenAI Config ───────────────────────────────────────────────────────────

export function useGetOpenAIConfig() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<OpenAIConfig | null>({
    queryKey: ["openAIConfig", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getOpenAIConfig();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}

export function useSaveOpenAIConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setOpenAIConfig(apiKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openAIConfig"] });
    },
  });
}

export function useValidateOpenAIConfig() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ["validateOpenAIConfig", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.validateOpenAIConfig();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["callerUserRole", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}
