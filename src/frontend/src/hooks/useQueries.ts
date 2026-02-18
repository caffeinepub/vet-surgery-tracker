import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { SurgeryCase, UserProfile, Checklist, Species, Sex } from '../backend';

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

export function useGetAllCases() {
  const { actor, isFetching } = useActor();

  return useQuery<SurgeryCase[]>({
    queryKey: ['cases'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCases();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      medicalRecordNumber: string;
      petName: string;
      ownerLastName: string;
      species: Species;
      breed: string;
      sex: Sex;
      dateOfBirth: bigint | null;
      presentingComplaint: string;
      notes: string;
      checklist: Checklist;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCase(
        params.medicalRecordNumber,
        params.petName,
        params.ownerLastName,
        params.species,
        params.breed,
        params.sex,
        params.dateOfBirth,
        params.presentingComplaint,
        params.notes,
        params.checklist
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
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
      petName: string;
      ownerLastName: string;
      species: Species;
      breed: string;
      sex: Sex;
      dateOfBirth: bigint | null;
      presentingComplaint: string;
      notes: string;
      checklist: Checklist;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCase(
        params.id,
        params.medicalRecordNumber,
        params.petName,
        params.ownerLastName,
        params.species,
        params.breed,
        params.sex,
        params.dateOfBirth,
        params.presentingComplaint,
        params.notes,
        params.checklist
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
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
    },
  });
}

export function useUpdateChecklist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; checklist: Checklist }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateChecklist(params.id, params.checklist);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}
