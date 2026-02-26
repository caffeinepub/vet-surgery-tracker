import React, { useState, useMemo } from 'react';
import { Stethoscope, AlertCircle, Loader2, RefreshCw, ClipboardList, CheckCircle2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllCases, useGetDashboard } from '../../../hooks/useQueries';
import { useActor } from '../../../hooks/useActor';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import { CaseCard } from '../../cases/components/CaseCard';
import CasesSearchBar from '../../cases/components/CasesSearchBar';
import CasesSpeciesFilter from '../../cases/components/CasesSpeciesFilter';
import CasesTasksFilter from '../../cases/components/CasesTasksFilter';
import CasesSortControl from '../../cases/components/CasesSortControl';
import CaseFormDialog from '../../cases/components/CaseFormDialog';
import {
  filterBySpecies,
  filterByTaskTypes,
  filterOutCompletedCases,
  filterAllTasksCompleted,
} from '../../cases/filtering';
import { sortCases, SORT_OPTIONS } from '../../cases/sorting';
import type { SortOption } from '../../cases/sorting';
import { searchCases } from '../../cases/search';
import { Species } from '../../../backend';
import type { SurgeryCase } from '../../../backend';
import { getTotalOpenTasksCount } from '../utils/openTasksCalculation';
import { getRemainingChecklistItems } from '../../cases/checklist';

interface DashboardViewProps {
  onNavigateToCase?: (caseId: number) => void;
}

export default function DashboardView({ onNavigateToCase }: DashboardViewProps) {
  const { identity } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();

  const {
    data: cases,
    isLoading: casesLoading,
    isFetching: casesFetching,
    error: casesError,
    refetch: refetchCases,
  } = useGetAllCases();

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useGetDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Set<Species>>(new Set());
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(new Set());
  const [showAllTasksCompleted, setShowAllTasksCompleted] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0].value as SortOption);
  const [newCaseOpen, setNewCaseOpen] = useState(false);

  const isLoading = actorFetching || casesLoading || dashboardLoading;
  const hasError = !!casesError || !!dashboardError;
  const isAuthenticated = !!identity;

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

  const openTasksCount = dashboard?.openTasks ?? BigInt(getTotalOpenTasksCount(allCases));
  const totalCases = allCases.length;
  const activeCasesCount = allCases.filter((c) => getRemainingChecklistItems(c.task).length > 0).length;

  const handleRefetch = () => {
    refetchCases();
    refetchDashboard();
  };

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
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    const errorMessage =
      casesError instanceof Error
        ? casesError.message
        : dashboardError instanceof Error
        ? dashboardError.message
        : 'An unknown error occurred while loading cases.';

    return (
      <div className="p-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load cases</AlertTitle>
          <AlertDescription className="mt-1">{errorMessage}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleRefetch} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  // Empty database state
  if (totalCases === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Stats bar — zeroed out */}
        <div className="px-4 pt-4 pb-2 grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open Tasks</p>
              <p className="text-xl font-bold text-foreground">0</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Cases</p>
              <p className="text-xl font-bold text-foreground">0</p>
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="bg-primary/10 rounded-full p-6 mb-5">
            <Stethoscope className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No cases yet</h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Add your first veterinary surgery case to get started tracking patient workflows and tasks.
          </p>
          <Button size="lg" onClick={() => setNewCaseOpen(true)} className="gap-2">
            <PlusCircle className="h-5 w-5" />
            Add First Case
          </Button>
        </div>

        <CaseFormDialog open={newCaseOpen} onOpenChange={setNewCaseOpen} />
      </div>
    );
  }

  const hasActiveFilters =
    selectedSpecies.size > 0 ||
    selectedTaskTypes.size > 0 ||
    showAllTasksCompleted ||
    searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="px-4 pt-4 pb-2 grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Open Tasks</p>
            <p className="text-xl font-bold text-foreground">{openTasksCount.toString()}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Cases</p>
            <p className="text-xl font-bold text-foreground">{activeCasesCount}</p>
          </div>
        </div>
      </div>

      {/* Sticky filter/search toolbar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CasesSearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefetch}
              title="Refresh"
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
          <div className="ml-auto">
            <CasesSortControl value={sortOption} onSortChange={setSortOption} />
          </div>
        </div>
      </div>

      {/* Cases grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
              onNavigateToCase={onNavigateToCase}
            />
          ))
        )}
      </div>

      {casesFetching && !casesLoading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Refreshing cases…
        </div>
      )}

      <CaseFormDialog open={newCaseOpen} onOpenChange={setNewCaseOpen} />
    </div>
  );
}
