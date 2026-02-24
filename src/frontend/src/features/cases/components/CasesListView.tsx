import { useState, useMemo, useEffect, useRef } from 'react';
import { useGetAllCases } from '../../../hooks/useQueries';
import { useActor } from '../../../hooks/useActor';
import type { SurgeryCase } from '../../../backend';
import CaseCard from './CaseCard';
import CaseFormDialog from './CaseFormDialog';
import CasesSearchBar from './CasesSearchBar';
import CasesSortControl from './CasesSortControl';
import CasesSpeciesFilter from './CasesSpeciesFilter';
import CasesTasksFilter from './CasesTasksFilter';
import CsvImportExportPanel from './CsvImportExportPanel';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { filterCasesBySpecies, filterCasesByTaskTypes, filterOutCompletedCases, filterCasesByAllTasksCompleted } from '../filtering';
import { searchCases } from '../search';
import { sortCases, type SortOption } from '../sorting';
import type { Species } from '../../../backend';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CasesListViewProps {
  selectedCaseId?: bigint | null;
  onClearSelectedCase?: () => void;
  isNewCaseDialogOpen?: boolean;
  onNewCaseDialogChange?: (open: boolean) => void;
}

export default function CasesListView({ 
  selectedCaseId, 
  onClearSelectedCase,
  isNewCaseDialogOpen = false,
  onNewCaseDialogChange
}: CasesListViewProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: cases = [], isLoading, error } = useGetAllCases();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<SurgeryCase | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('arrival-date-oldest');
  const [selectedSpecies, setSelectedSpecies] = useState<Set<Species>>(new Set());
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(new Set());
  const [showAllTasksCompleted, setShowAllTasksCompleted] = useState(false);
  const [highlightedCaseId, setHighlightedCaseId] = useState<bigint | null>(null);
  const caseRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Sync external dialog state
  useEffect(() => {
    if (isNewCaseDialogOpen !== undefined) {
      setIsFormOpen(isNewCaseDialogOpen);
    }
  }, [isNewCaseDialogOpen]);

  const filteredAndSortedCases = useMemo(() => {
    let result = cases;

    // Apply search
    if (searchQuery.trim()) {
      result = searchCases(result, searchQuery);
    }

    // Apply species filter
    result = filterCasesBySpecies(result, selectedSpecies);

    // Apply "all tasks completed" filter logic
    if (showAllTasksCompleted) {
      // Show only cases where all tasks are completed
      result = filterCasesByAllTasksCompleted(result);
    } else {
      // Default: hide cases where all tasks are completed
      result = filterOutCompletedCases(result);
    }

    // Apply tasks filter
    result = filterCasesByTaskTypes(result, selectedTaskTypes);

    // Apply sorting
    result = sortCases(result, sortOption);

    return result;
  }, [cases, searchQuery, sortOption, selectedSpecies, selectedTaskTypes, showAllTasksCompleted]);

  // Handle scrolling to and highlighting the selected case
  useEffect(() => {
    if (selectedCaseId !== null && selectedCaseId !== undefined) {
      const caseIdStr = selectedCaseId.toString();
      const caseElement = caseRefs.current.get(caseIdStr);
      
      if (caseElement) {
        // Small delay to ensure rendering is complete
        setTimeout(() => {
          caseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedCaseId(selectedCaseId);
          
          // Clear highlight after animation
          setTimeout(() => {
            setHighlightedCaseId(null);
            if (onClearSelectedCase) {
              onClearSelectedCase();
            }
          }, 2000);
        }, 100);
      }
    }
  }, [selectedCaseId, filteredAndSortedCases, onClearSelectedCase]);

  const handleFormOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (onNewCaseDialogChange) {
      onNewCaseDialogChange(open);
    }
    if (!open) {
      setEditingCase(undefined);
    }
  };

  const handleEdit = (surgeryCase: SurgeryCase) => {
    setEditingCase(surgeryCase);
    handleFormOpenChange(true);
  };

  const handleNewCase = () => {
    setEditingCase(undefined);
    handleFormOpenChange(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-foreground font-medium">Loading cases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load cases. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Cases</h2>
          <p className="text-muted-foreground mt-1">
            {filteredAndSortedCases.length} {filteredAndSortedCases.length === 1 ? 'case' : 'cases'}
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button onClick={handleNewCase} disabled={!actor || actorFetching}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Case
                </Button>
              </div>
            </TooltipTrigger>
            {(!actor || actorFetching) && (
              <TooltipContent>
                <p>Connecting to backend...</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Search, Sort, and Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <CasesSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <CasesSortControl value={sortOption} onSortChange={setSortOption} />
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
        </div>
      </div>

      {/* CSV Import/Export */}
      <CsvImportExportPanel cases={cases} />

      {/* Cases List */}
      {filteredAndSortedCases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {cases.length === 0
              ? 'No cases yet. Create your first case to get started.'
              : 'No cases match your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedCases.map((surgeryCase) => (
            <div
              key={surgeryCase.id.toString()}
              ref={(el) => {
                if (el) {
                  caseRefs.current.set(surgeryCase.id.toString(), el);
                } else {
                  caseRefs.current.delete(surgeryCase.id.toString());
                }
              }}
            >
              <CaseCard
                surgeryCase={surgeryCase}
                onEdit={handleEdit}
                isHighlighted={highlightedCaseId?.toString() === surgeryCase.id.toString()}
              />
            </div>
          ))}
        </div>
      )}

      {/* Case Form Dialog */}
      <CaseFormDialog
        open={isFormOpen}
        onOpenChange={handleFormOpenChange}
        existingCase={editingCase}
      />
    </div>
  );
}
