import React, { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, RefreshCw, PlusCircle, Stethoscope, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllCases } from '../../../hooks/useQueries';
import { useActor } from '../../../hooks/useActor';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import type { SurgeryCase } from '../../../backend';
import { Species } from '../../../backend';
import { CaseCard } from './CaseCard';
import CasesSearchBar from './CasesSearchBar';
import CasesSpeciesFilter from './CasesSpeciesFilter';
import CasesTasksFilter from './CasesTasksFilter';
import CasesSortControl from './CasesSortControl';
import CaseFormDialog from './CaseFormDialog';
import CsvImportExportPanel from './CsvImportExportPanel';
import {
  filterBySpecies,
  filterByTaskTypes,
  filterOutCompletedCases,
  filterAllTasksCompleted,
} from '../filtering';
import { searchCases } from '../search';
import { sortCases, SORT_OPTIONS } from '../sorting';
import type { SortOption } from '../sorting';

interface CasesListViewProps {
  highlightCaseId?: number | null;
  onHighlightClear?: () => void;
}

export default function CasesListView({ highlightCaseId, onHighlightClear }: CasesListViewProps) {
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();

  const {
    data: cases,
    isLoading: casesLoading,
    isFetching: casesFetching,
    error,
    refetch,
  } = useGetAllCases();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Set<Species>>(new Set());
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(new Set());
  const [showAllTasksCompleted, setShowAllTasksCompleted] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0].value as SortOption);
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const [showCsvPanel, setShowCsvPanel] = useState(false);

  const isLoading = actorFetching || casesLoading;
  const isAuthenticated = !!identity;

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['cases'] });
    refetch();
  }, [queryClient, refetch]);

  const allCases: SurgeryCase[] = cases ?? [];

  const filteredAndSortedCases = useMemo(() => {
    let filtered = [...allCases];
    filtered = filterBySpecies(filtered, selectedSpecies);
    filtered = filterByTaskTypes(filtered, selectedTaskTypes);
    if (showAllTasksCompleted) {
      filtered = filterAllTasksCompleted(filtered);
    } else {
      filtered = filterOutCompletedCases(filtered);
    }
    if (searchQuery.trim()) {
      filtered = searchCases(filtered, searchQuery.trim());
    }
    return sortCases(filtered, sortOption);
  }, [allCases, selectedSpecies, selectedTaskTypes, showAllTasksCompleted, searchQuery, sortOption]);

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Stethoscope className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Please log in to view your cases.</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred while loading cases.';

    return (
      <div className="p-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load cases</AlertTitle>
          <AlertDescription className="mt-1">{errorMessage}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleRefresh} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  const totalCases = allCases.length;
  const hasActiveFilters =
    selectedSpecies.size > 0 ||
    selectedTaskTypes.size > 0 ||
    showAllTasksCompleted ||
    searchQuery.trim().length > 0;

  // Empty database state — no cases at all
  if (totalCases === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="bg-primary/10 rounded-full p-6 mb-5">
            <Stethoscope className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No cases yet</h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Add your first veterinary surgery case to start tracking patient workflows and tasks.
          </p>
          <div className="flex gap-3">
            <Button size="lg" onClick={() => setNewCaseOpen(true)} className="gap-2">
              <PlusCircle className="h-5 w-5" />
              Add First Case
            </Button>
            <Button size="lg" variant="outline" onClick={() => setShowCsvPanel((v) => !v)}>
              Import CSV
            </Button>
          </div>
        </div>

        {/* CSV import/export still available even when empty */}
        {showCsvPanel && (
          <div className="border-t border-border px-4 py-3">
            <CsvImportExportPanel cases={[]} />
          </div>
        )}

        <CaseFormDialog open={newCaseOpen} onOpenChange={setNewCaseOpen} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky top bar — offset by header height (top-14) so it sticks below the app header */}
      <div className="sticky top-14 z-10 bg-background border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CasesSearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              title="Refresh cases"
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setNewCaseOpen(true)} size="sm">
              + New Case
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CasesSpeciesFilter
            selectedSpecies={selectedSpecies}
            onSpeciesChange={setSelectedSpecies}
          />
          <CasesTasksFilter
            selectedTaskTypes={selectedTaskTypes}
            onTaskTypesChange={setSelectedTaskTypes}
            showAllTasksCompleted={showAllTasksCompleted}
            onShowAllTasksCompletedChange={setShowAllTasksCompleted}
          />
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCsvPanel((v) => !v)}
              className="text-xs"
            >
              {showCsvPanel ? 'Hide CSV' : 'CSV Import/Export'}
            </Button>
            <CasesSortControl value={sortOption} onSortChange={setSortOption} />
          </div>
        </div>
      </div>

      {/* CSV panel */}
      {showCsvPanel && (
        <div className="border-b border-border px-4 py-3 bg-muted/30">
          <CsvImportExportPanel cases={allCases} />
        </div>
      )}

      {/* Cases list */}
      <div className="flex-1 p-4 space-y-3">
        {casesFetching && !casesLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm pb-1">
            <Loader2 className="w-4 h-4 animate-spin" />
            Refreshing cases…
          </div>
        )}

        {filteredAndSortedCases.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {hasActiveFilters ? (
              <div>
                <p className="text-lg font-medium mb-1">No cases match your filters</p>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-1">All tasks completed!</p>
                <p className="text-sm">Toggle the filter to view completed cases.</p>
              </div>
            )}
          </div>
        ) : (
          filteredAndSortedCases.map((surgeryCase) => (
            <CaseCard
              key={surgeryCase.id.toString()}
              surgeryCase={surgeryCase}
              isHighlighted={
                highlightCaseId !== null &&
                highlightCaseId !== undefined &&
                Number(surgeryCase.id) === highlightCaseId
              }
              onHighlightClear={onHighlightClear}
            />
          ))
        )}
      </div>

      <CaseFormDialog open={newCaseOpen} onOpenChange={setNewCaseOpen} />
    </div>
  );
}
