import { useState, useMemo } from 'react';
import { useGetAllCases } from '../../../hooks/useQueries';
import { useActor } from '../../../hooks/useActor';
import CaseCard from './CaseCard';
import CaseFormDialog from './CaseFormDialog';
import CasesSearchBar from './CasesSearchBar';
import CasesSortControl from './CasesSortControl';
import CasesSpeciesFilter from './CasesSpeciesFilter';
import CasesTasksFilter from './CasesTasksFilter';
import CsvImportExportPanel from './CsvImportExportPanel';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { filterCasesBySpecies, filterCasesByTaskTypes } from '../filtering';
import { searchCases } from '../search';
import { sortCases, type SortOption } from '../sorting';
import type { Species, CompletedTasks } from '../../../backend';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function CasesListView() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: cases = [], isLoading, error } = useGetAllCases();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('arrival-date-newest');
  const [selectedSpecies, setSelectedSpecies] = useState<Set<Species>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<keyof CompletedTasks>>(new Set());

  const filteredAndSortedCases = useMemo(() => {
    let result = cases;

    // Apply search
    if (searchQuery.trim()) {
      result = searchCases(result, searchQuery);
    }

    // Apply species filter
    result = filterCasesBySpecies(result, selectedSpecies);

    // Apply tasks filter
    result = filterCasesByTaskTypes(result, selectedTasks);

    // Apply sorting
    result = sortCases(result, sortOption);

    return result;
  }, [cases, searchQuery, sortOption, selectedSpecies, selectedTasks]);

  const hasActiveFilters = selectedSpecies.size > 0 || selectedTasks.size > 0;
  const totalCases = cases.length;
  const filteredCount = filteredAndSortedCases.length;

  const actorReady = !!actor && !actorFetching;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading cases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Cases</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load cases. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Surgery Cases</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {hasActiveFilters
              ? `Showing ${filteredCount} of ${totalCases} cases`
              : `${totalCases} total case${totalCases !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={() => setIsFormOpen(true)}
                    disabled={!actorReady}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Case
                  </Button>
                </div>
              </TooltipTrigger>
              {!actorReady && (
                <TooltipContent>
                  <p>Backend is initializing...</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* CSV Import/Export */}
      <CsvImportExportPanel cases={cases} />

      {/* Search, Sort, and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <CasesSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="flex gap-2">
          <CasesSpeciesFilter
            selectedSpecies={selectedSpecies}
            onSpeciesChange={setSelectedSpecies}
          />
          <CasesTasksFilter
            selectedTaskTypes={selectedTasks}
            onTaskTypesChange={setSelectedTasks}
          />
          <CasesSortControl value={sortOption} onSortChange={setSortOption} />
        </div>
      </div>

      {/* Cases Grid */}
      {filteredAndSortedCases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {hasActiveFilters || searchQuery.trim()
              ? 'No cases match your search or filters.'
              : 'No cases yet. Create your first case to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedCases.map((surgeryCase) => (
            <CaseCard key={surgeryCase.id.toString()} surgeryCase={surgeryCase} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CaseFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
}
