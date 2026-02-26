import React, { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, RefreshCw, PlusCircle, Stethoscope } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllCases } from '../../../hooks/useQueries';
import type { SurgeryCase } from '../../../backend';
import { Species } from '../../../backend';
import { CaseCard } from './CaseCard';
import CasesSearchBar from './CasesSearchBar';
import CasesSpeciesFilter from './CasesSpeciesFilter';
import CasesTasksFilter from './CasesTasksFilter';
import CasesSortControl from './CasesSortControl';
import CaseFormDialog from './CaseFormDialog';
import CsvImportExportPanel from './CsvImportExportPanel';
import { filterBySpecies, filterByTaskTypes, filterOutCompletedCases, filterAllTasksCompleted } from '../filtering';
import { searchCases } from '../search';
import { sortCases, SORT_OPTIONS } from '../sorting';
import type { SortOption } from '../sorting';

interface CasesListViewProps {
  highlightCaseId?: number | null;
  onHighlightClear?: () => void;
}

export function CasesListView({ highlightCaseId, onHighlightClear }: CasesListViewProps) {
  const queryClient = useQueryClient();
  const { data: cases, isLoading, error, refetch } = useGetAllCases();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Set<Species>>(new Set());
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(new Set());
  const [showAllTasksCompleted, setShowAllTasksCompleted] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0].value as SortOption);
  const [newCaseOpen, setNewCaseOpen] = useState(false);

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

    filtered = sortCases(filtered, sortOption);

    return filtered;
  }, [allCases, selectedSpecies, selectedTaskTypes, showAllTasksCompleted, searchQuery, sortOption]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
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
          <Button size="lg" onClick={() => setNewCaseOpen(true)} className="gap-2">
            <PlusCircle className="h-5 w-5" />
            Add First Case
          </Button>
        </div>

        {/* CSV import/export still available even when empty */}
        <div className="border-t border-border px-4 py-3">
          <CsvImportExportPanel cases={[]} />
        </div>

        <CaseFormDialog open={newCaseOpen} onOpenChange={setNewCaseOpen} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky top bar */}
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
            showAllTasksCompleted={showAllTasksCompleted}
            onTaskTypesChange={setSelectedTaskTypes}
            onShowAllTasksCompletedChange={setShowAllTasksCompleted}
          />
          <div className="ml-auto">
            <CasesSortControl value={sortOption} onSortChange={setSortOption} />
          </div>
        </div>
      </div>

      {/* Cases list */}
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
              isHighlighted={highlightCaseId != null && Number(surgeryCase.id) === highlightCaseId}
              onHighlightClear={onHighlightClear}
            />
          ))
        )}
      </div>

      {/* CSV import/export */}
      <div className="border-t border-border px-4 py-3">
        <CsvImportExportPanel cases={allCases} />
      </div>

      <CaseFormDialog open={newCaseOpen} onOpenChange={setNewCaseOpen} />
    </div>
  );
}
