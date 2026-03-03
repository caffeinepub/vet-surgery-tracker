import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, RefreshCw, PlusCircle, Stethoscope, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllCases } from '../../../hooks/useQueries';
import { getFriendlyErrorMessage, isCanisterUnavailableError } from '../../../hooks/useQueries';
import { useActor } from '../../../hooks/useActor';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import type { SurgeryCase } from '../../../backend';
import { Species } from '../../../backend';
import CaseCard from './CaseCard';
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
  const [isRetrying, setIsRetrying] = useState(false);

  // Refs for scrolling to highlighted card
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const scrolledRef = useRef<number | null>(null);

  const isLoading = actorFetching || casesLoading;
  const isAuthenticated = !!identity;

  const handleRefresh = useCallback(async () => {
    setIsRetrying(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['cases'] });
      await refetch();
    } finally {
      setIsRetrying(false);
    }
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
    const sorted = sortCases(filtered, sortOption);

    // If a highlighted case is not in the filtered list, inject it at the top
    if (
      highlightCaseId !== null &&
      highlightCaseId !== undefined &&
      !sorted.some((c) => Number(c.id) === highlightCaseId)
    ) {
      const targetCase = allCases.find((c) => Number(c.id) === highlightCaseId);
      if (targetCase) {
        return [targetCase, ...sorted];
      }
    }

    return sorted;
  }, [allCases, selectedSpecies, selectedTaskTypes, showAllTasksCompleted, searchQuery, sortOption, highlightCaseId]);

  // Scroll to highlighted card when it becomes available
  useEffect(() => {
    if (
      highlightCaseId === null ||
      highlightCaseId === undefined ||
      scrolledRef.current === highlightCaseId
    ) {
      return;
    }

    const key = String(highlightCaseId);
    const el = cardRefs.current.get(key);
    if (el) {
      // Small delay to ensure layout is complete
      const timer = setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        scrolledRef.current = highlightCaseId;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightCaseId, filteredAndSortedCases]);

  // Auto-clear highlight after 3 seconds
  useEffect(() => {
    if (highlightCaseId === null || highlightCaseId === undefined) {
      scrolledRef.current = null;
      return;
    }
    const timer = setTimeout(() => {
      onHighlightClear?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [highlightCaseId, onHighlightClear]);

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

  // Error state — always show a friendly message, never raw IC error details
  if (error) {
    const friendlyMessage = getFriendlyErrorMessage(error);
    const isUnavailable = isCanisterUnavailableError(error);

    return (
      <div className="p-6 space-y-4 max-w-lg">
        <Alert variant="destructive">
          {isUnavailable ? (
            <WifiOff className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>Unable to load cases</AlertTitle>
          <AlertDescription className="mt-1">{friendlyMessage}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRetrying}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying…' : 'Retry'}
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

        {showCsvPanel && (
          <div className="px-4 pb-6">
            <CsvImportExportPanel cases={allCases} />
          </div>
        )}

        <CaseFormDialog
          open={newCaseOpen}
          onOpenChange={setNewCaseOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <CasesSearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <Button
            size="sm"
            onClick={() => setNewCaseOpen(true)}
            className="gap-1.5 shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">New Case</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <CasesSpeciesFilter
            selectedSpecies={selectedSpecies}
            onSpeciesChange={setSelectedSpecies}
          />
          <CasesTasksFilter
            selectedTaskTypes={selectedTaskTypes}
            onTaskTypesChange={setSelectedTaskTypes}
          />
          <CasesSortControl value={sortOption} onSortChange={setSortOption} />

          <button
            onClick={() => setShowAllTasksCompleted((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              showAllTasksCompleted
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {showAllTasksCompleted ? 'Showing completed' : 'Show completed'}
          </button>

          <button
            onClick={() => setShowCsvPanel((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary/50 transition-colors"
          >
            CSV
          </button>

          {casesFetching && !casesLoading && (
            <span className="text-xs text-muted-foreground ml-auto">Refreshing…</span>
          )}
        </div>

        {showCsvPanel && (
          <div className="pt-1">
            <CsvImportExportPanel cases={allCases} />
          </div>
        )}
      </div>

      {/* Case count summary */}
      <div className="px-4 py-2 text-xs text-muted-foreground">
        {hasActiveFilters
          ? `${filteredAndSortedCases.length} of ${totalCases} cases`
          : `${totalCases} case${totalCases !== 1 ? 's' : ''}`}
      </div>

      {/* Cases list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {filteredAndSortedCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Stethoscope className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No cases match your current filters.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecies(new Set());
                setSelectedTaskTypes(new Set());
                setShowAllTasksCompleted(false);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          filteredAndSortedCases.map((surgeryCase) => {
            const key = String(surgeryCase.id);
            const isHighlighted =
              highlightCaseId !== null &&
              highlightCaseId !== undefined &&
              Number(surgeryCase.id) === highlightCaseId;

            return (
              <CaseCard
                key={key}
                ref={(el) => {
                  cardRefs.current.set(key, el);
                }}
                surgeryCase={surgeryCase}
                isHighlighted={isHighlighted}
              />
            );
          })
        )}
      </div>

      <CaseFormDialog
        open={newCaseOpen}
        onOpenChange={setNewCaseOpen}
      />
    </div>
  );
}
