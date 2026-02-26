import React, { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetAllCases, useGetDashboard } from '../../../hooks/useQueries';
import type { SurgeryCase } from '../../../backend';
import { Species } from '../../../backend';
import { CaseCard } from '../../cases/components/CaseCard';
import CasesSearchBar from '../../cases/components/CasesSearchBar';
import CasesSpeciesFilter from '../../cases/components/CasesSpeciesFilter';
import CasesTasksFilter from '../../cases/components/CasesTasksFilter';
import CasesSortControl from '../../cases/components/CasesSortControl';
import CaseFormDialog from '../../cases/components/CaseFormDialog';
import { filterBySpecies, filterByTaskTypes, filterOutCompletedCases, filterAllTasksCompleted } from '../../cases/filtering';
import { searchCases } from '../../cases/search';
import { sortCases, SORT_OPTIONS } from '../../cases/sorting';
import type { SortOption } from '../../cases/sorting';
import { getTotalOpenTasksCount } from '../utils/openTasksCalculation';
import { getRemainingChecklistItems } from '../../cases/checklist';

interface DashboardViewProps {
  onNavigateToCase?: (caseId: number) => void;
}

export function DashboardView({ onNavigateToCase }: DashboardViewProps) {
  const queryClient = useQueryClient();
  const { data: cases, isLoading: casesLoading, error: casesError, refetch: refetchCases } = useGetAllCases();
  const { data: dashboard, isLoading: dashboardLoading, refetch: refetchDashboard } = useGetDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Set<Species>>(new Set());
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(new Set());
  const [showAllTasksCompleted, setShowAllTasksCompleted] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0].value as SortOption);
  const [newCaseOpen, setNewCaseOpen] = useState(false);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['cases'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    refetchCases();
    refetchDashboard();
  }, [queryClient, refetchCases, refetchDashboard]);

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

    filtered = sortCases(filtered, sortOption);

    return filtered;
  }, [allCases, selectedSpecies, selectedTaskTypes, showAllTasksCompleted, searchQuery, sortOption]);

  const openTasksCount = dashboard?.openTasks ?? BigInt(getTotalOpenTasksCount(allCases));
  const totalCases = allCases.length;
  const activeCasesCount = allCases.filter((c) => getRemainingChecklistItems(c.task).length > 0).length;

  const isLoading = casesLoading || dashboardLoading;

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

  if (casesError) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load cases.{' '}
            <button onClick={handleRefresh} className="underline font-medium">
              Try again
            </button>
          </AlertDescription>
        </Alert>
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
              onClick={handleRefresh}
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
            showAllTasksCompleted={showAllTasksCompleted}
            onTaskTypesChange={setSelectedTaskTypes}
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
            {totalCases === 0 ? (
              <div>
                <p className="text-lg font-medium mb-1">No cases yet</p>
                <p className="text-sm">Create your first case using the + button above.</p>
              </div>
            ) : hasActiveFilters ? (
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

      <CaseFormDialog open={newCaseOpen} onOpenChange={setNewCaseOpen} />
    </div>
  );
}
