import { useState } from 'react';
import { useGetAllCases, useUpdateTask, useGetDashboard } from '../../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import type { SurgeryCase, Species } from '../../../backend';
import CaseCard from '../../cases/components/CaseCard';
import CasesSearchBar from '../../cases/components/CasesSearchBar';
import CasesSpeciesFilter from '../../cases/components/CasesSpeciesFilter';
import CasesTasksFilter from '../../cases/components/CasesTasksFilter';
import CasesSortControl from '../../cases/components/CasesSortControl';
import CaseFormDialog from '../../cases/components/CaseFormDialog';
import { searchCases } from '../../cases/search';
import {
  filterCasesBySpecies,
  filterCasesByTaskTypes,
  filterCasesByAllTasksCompleted,
  filterOutCompletedCases,
} from '../../cases/filtering';
import { sortCases, SORT_OPTIONS, type SortOption } from '../../cases/sorting';
import { CHECKLIST_ITEMS } from '../../cases/checklist';
import { generateCasePdf } from '../../cases/pdf/generateCasePdf';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Download, AlertCircle, RefreshCw, Activity, CheckCircle2, ClipboardList } from 'lucide-react';

interface DashboardViewProps {
  onNavigateToCase?: (caseId: bigint) => void;
}

export default function DashboardView({ onNavigateToCase }: DashboardViewProps) {
  const { data: cases, isLoading, error, refetch, isFetching } = useGetAllCases();
  const { data: dashboard } = useGetDashboard();
  const updateTask = useUpdateTask();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Set<Species>>(new Set());
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(new Set());
  const [showAllTasksCompleted, setShowAllTasksCompleted] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0].value);
  const [newCaseOpen, setNewCaseOpen] = useState(false);

  const allCases = cases ?? [];

  const handleTaskClick = async (caseId: bigint, taskKey: string, completed: boolean) => {
    const surgeryCase = allCases.find(c => c.id === caseId);
    if (!surgeryCase) return;

    const item = CHECKLIST_ITEMS.find(i => i.key === taskKey);
    if (!item) return;

    const updatedTask = {
      ...surgeryCase.task,
      [item.completedField]: completed,
    };

    await updateTask.mutateAsync({ id: caseId, task: updatedTask });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ['cases', identity?.getPrincipal().toString() ?? 'anon'],
    });
    queryClient.invalidateQueries({
      queryKey: ['dashboard', identity?.getPrincipal().toString() ?? 'anon'],
    });
    refetch();
  };

  const handleExportPdf = () => {
    generateCasePdf(allCases);
  };

  // Compute stats
  const totalCases = allCases.length;
  const activeCases = filterOutCompletedCases(allCases).length;
  const completedCases = totalCases - activeCases;
  const openTasksCount = dashboard ? Number(dashboard.openTasks) : 0;

  // Apply filters
  let filtered: SurgeryCase[];

  if (showAllTasksCompleted) {
    filtered = filterCasesByAllTasksCompleted(allCases);
  } else {
    filtered = filterOutCompletedCases(allCases);
  }

  if (selectedSpecies.size > 0) {
    filtered = filterCasesBySpecies(filtered, selectedSpecies);
  }

  if (selectedTaskTypes.size > 0) {
    filtered = filterCasesByTaskTypes(filtered, selectedTaskTypes);
  }

  if (searchQuery.trim()) {
    filtered = searchCases(filtered, searchQuery);
  }

  filtered = sortCases(filtered, sortOption);

  const getEmptyMessage = () => {
    if (allCases.length === 0) return 'No cases yet. Create your first case to get started.';
    if (showAllTasksCompleted) return 'No cases with all tasks completed match your filters.';
    return 'No active cases match your filters.';
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sticky top bar: stats + actions */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border pb-3 pt-1 -mx-4 px-4 md:-mx-6 md:px-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{activeCases}</span>
              <span className="text-muted-foreground">active</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-foreground">{completedCases}</span>
              <span className="text-muted-foreground">completed</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <ClipboardList className="h-4 w-4 text-amber-600" />
              <span className="font-semibold text-foreground">{openTasksCount}</span>
              <span className="text-muted-foreground">open tasks</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
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

      {/* Filters */}
      {!error && (
        <div className="flex flex-wrap items-center gap-2">
          <CasesSearchBar value={searchQuery} onChange={setSearchQuery} />
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
          <CasesSortControl value={sortOption} onSortChange={setSortOption} />
        </div>
      )}

      {/* Cases grid */}
      {!error && (
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {allCases.length === 0 ? (
              <div className="flex flex-col items-center gap-3">
                <div className="text-4xl">🐾</div>
                <p className="text-lg font-medium text-foreground">No cases yet</p>
                <p className="text-sm max-w-xs">
                  Create your first surgery case to get started tracking patient care tasks.
                </p>
                <Button onClick={() => setNewCaseOpen(true)} className="mt-2 gap-1">
                  <Plus className="h-4 w-4" />
                  New Case
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <p className="text-lg font-medium">{getEmptyMessage()}</p>
                <Button
                  variant="outline"
                  size="sm"
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
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <div
                key={String(c.id)}
                className="cursor-pointer"
                onClick={() => onNavigateToCase?.(c.id)}
              >
                <CaseCard
                  surgeryCase={c}
                  onTaskClick={handleTaskClick}
                  size="dashboard"
                />
              </div>
            ))}
          </div>
        )
      )}

      {/* New Case Dialog */}
      <CaseFormDialog
        open={newCaseOpen}
        onOpenChange={setNewCaseOpen}
      />
    </div>
  );
}
