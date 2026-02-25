import React, { useState, useEffect, useRef } from 'react';
import { SurgeryCase, Species } from '../../../backend';
import { useGetAllCases } from '../../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import CaseCard from './CaseCard';
import CaseEditDialog from './CaseEditDialog';
import CaseFormDialog from './CaseFormDialog';
import CasesSearchBar from './CasesSearchBar';
import CasesSpeciesFilter from './CasesSpeciesFilter';
import CasesTasksFilter from './CasesTasksFilter';
import CasesSortControl from './CasesSortControl';
import CsvImportExportPanel from './CsvImportExportPanel';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { searchCases } from '../search';
import {
  filterCasesBySpecies,
  filterCasesByTaskTypes,
  filterCasesByAllTasksCompleted,
  filterOutCompletedCases,
} from '../filtering';
import { sortCases, SortOption } from '../sorting';
import { generateCasePdf } from '../pdf/generateCasePdf';

interface CasesListViewProps {
  highlightCaseId?: bigint | null;
  onHighlightClear?: () => void;
}

export default function CasesListView({ highlightCaseId, onHighlightClear }: CasesListViewProps) {
  const { data: cases, isLoading, error, refetch, isFetching } = useGetAllCases();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Set<Species>>(new Set());
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(new Set());
  const [showAllTasksCompleted, setShowAllTasksCompleted] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('arrival-date-newest');
  const [editingCase, setEditingCase] = useState<SurgeryCase | null>(null);
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const highlightedRef = useRef<HTMLDivElement | null>(null);

  const allCases = cases ?? [];

  useEffect(() => {
    if (highlightCaseId != null && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (highlightCaseId != null) {
      const timer = setTimeout(() => {
        onHighlightClear?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightCaseId, cases]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ['cases', identity?.getPrincipal().toString() ?? 'anon'],
    });
    refetch();
  };

  let filtered = [...allCases];

  if (selectedSpecies.size > 0) {
    filtered = filterCasesBySpecies(filtered, selectedSpecies);
  }

  if (selectedTaskTypes.size > 0) {
    filtered = filterCasesByTaskTypes(filtered, selectedTaskTypes);
  }

  if (showAllTasksCompleted) {
    filtered = filterCasesByAllTasksCompleted(filtered);
  } else {
    filtered = filterOutCompletedCases(filtered);
  }

  if (searchQuery.trim()) {
    filtered = searchCases(filtered, searchQuery);
  }

  filtered = sortCases(filtered, sortOption);

  const handleExportPdf = () => {
    generateCasePdf(allCases);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border pb-3 pt-1 -mx-4 px-4 md:-mx-6 md:px-6">
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sticky top bar: New Case + Export PDF buttons */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border pb-3 pt-1 -mx-4 px-4 md:-mx-6 md:px-6">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            title="Refresh cases"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPdf}
            className="flex items-center gap-1"
            title="Export cases with outstanding tasks to PDF"
            disabled={allCases.length === 0}
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            onClick={() => setNewCaseOpen(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            New Case
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load cases</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              {String(error).includes('Unauthorized') || String(error).includes('Only users')
                ? 'You do not have permission to view cases. Please ensure your account has been granted access.'
                : `Error: ${String(error)}`}
            </span>
            <Button variant="outline" size="sm" className="w-fit" onClick={handleRefresh}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters toolbar */}
      {!error && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 min-w-[200px]">
            <CasesSearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
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
          <CasesSortControl
            value={sortOption}
            onSortChange={setSortOption}
          />
          <CsvImportExportPanel cases={allCases} />
        </div>
      )}

      {/* Cases list */}
      {!error && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {allCases.length === 0 ? (
                <>
                  <div className="text-4xl mb-3">🐾</div>
                  <p className="text-lg font-medium text-foreground">No cases yet</p>
                  <p className="text-sm mt-1">
                    Create your first surgery case to get started tracking patient care tasks.
                  </p>
                  <Button onClick={() => setNewCaseOpen(true)} className="mt-4 gap-1">
                    <Plus className="h-4 w-4" />
                    New Case
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">No cases found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                  <Button
                    variant="outline"
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
                </>
              )}
            </div>
          ) : (
            filtered.map((surgeryCase) => {
              const isHighlighted = highlightCaseId != null && surgeryCase.id === highlightCaseId;
              return (
                <div
                  key={String(surgeryCase.id)}
                  ref={isHighlighted ? highlightedRef : null}
                >
                  <CaseCard
                    surgeryCase={surgeryCase}
                    onEditClick={() => setEditingCase(surgeryCase)}
                    highlighted={isHighlighted}
                  />
                </div>
              );
            })
          )}
        </div>
      )}

      {editingCase && (
        <CaseEditDialog
          surgeryCase={editingCase}
          open={!!editingCase}
          onOpenChange={(open) => { if (!open) setEditingCase(null); }}
        />
      )}

      <CaseFormDialog
        open={newCaseOpen}
        onOpenChange={setNewCaseOpen}
      />
    </div>
  );
}
