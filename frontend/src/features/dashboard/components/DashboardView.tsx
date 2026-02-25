import { useState } from 'react';
import { useGetAllCases, useUpdateTask } from '../../../hooks/useQueries';
import type { SurgeryCase, Species } from '../../../backend';
import CaseCard from '../../cases/components/CaseCard';
import CasesSearchBar from '../../cases/components/CasesSearchBar';
import CasesSpeciesFilter from '../../cases/components/CasesSpeciesFilter';
import CasesTasksFilter from '../../cases/components/CasesTasksFilter';
import CasesSortControl from '../../cases/components/CasesSortControl';
import CaseFormDialog from '../../cases/components/CaseFormDialog';
import { searchCases } from '../../cases/search';
import { filterCasesBySpecies, filterCasesByTaskTypes, filterOutCompletedCases } from '../../cases/filtering';
import { sortCases, SORT_OPTIONS } from '../../cases/sorting';
import type { SortOption } from '../../cases/sorting';
import { CHECKLIST_ITEMS } from '../../cases/checklist';
import { generateCasePdf } from '../../cases/pdf/generateCasePdf';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { getTotalOpenTasksCount } from '../utils/openTasksCalculation';

interface DashboardViewProps {
  onNavigateToCase?: (caseId: bigint) => void;
}

export default function DashboardView({ onNavigateToCase }: DashboardViewProps) {
  const { data: cases = [], isLoading } = useGetAllCases();
  const updateTask = useUpdateTask();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Set<Species>>(new Set());
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(new Set());
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0].value);
  const [newCaseOpen, setNewCaseOpen] = useState(false);

  const handleTaskClick = async (caseId: bigint, taskKey: string, completed: boolean) => {
    const surgeryCase = cases.find(c => c.id === caseId);
    if (!surgeryCase) return;

    const item = CHECKLIST_ITEMS.find(i => i.key === taskKey);
    if (!item) return;

    const updatedTask = {
      ...surgeryCase.task,
      [item.completedField]: completed,
    };

    await updateTask.mutateAsync({ id: caseId, task: updatedTask });
  };

  const handleExportPdf = () => {
    generateCasePdf(cases);
  };

  // Apply filters
  let filtered = filterOutCompletedCases(cases);

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

  const totalOpenTasks = getTotalOpenTasksCount(cases);

  return (
    <div className="flex flex-col gap-6">
      {/* Header row: Stats + action buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="bg-card border border-border rounded-lg px-5 py-3 flex flex-col">
            <span className="text-2xl font-bold text-foreground">{filtered.length}</span>
            <span className="text-xs text-muted-foreground">Active Cases</span>
          </div>
          <div className="bg-card border border-border rounded-lg px-5 py-3 flex flex-col">
            <span className="text-2xl font-bold text-foreground">{totalOpenTasks}</span>
            <span className="text-xs text-muted-foreground">Open Tasks</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportPdf}
            className="flex items-center gap-1"
            title="Export cases with outstanding tasks to PDF"
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <CasesSearchBar value={searchQuery} onChange={setSearchQuery} />
        <CasesSpeciesFilter
          selectedSpecies={selectedSpecies}
          onSpeciesChange={setSelectedSpecies}
        />
        <CasesTasksFilter
          selectedTaskTypes={selectedTaskTypes}
          onTaskTypesChange={setSelectedTaskTypes}
          showAllTasksCompleted={false}
          onShowAllTasksCompletedChange={() => {}}
        />
        <CasesSortControl value={sortOption} onSortChange={setSortOption} />
      </div>

      {/* Cases grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {cases.length === 0 ? 'No active cases.' : 'No cases match your filters.'}
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
      )}

      {/* New Case Dialog */}
      <CaseFormDialog
        open={newCaseOpen}
        onOpenChange={setNewCaseOpen}
      />
    </div>
  );
}
