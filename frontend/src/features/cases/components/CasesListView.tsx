import React, { useState, useEffect, useRef } from 'react';
import { SurgeryCase, Species } from '../../../backend';
import { useGetAllCases } from '../../../hooks/useQueries';
import CaseCard from './CaseCard';
import CaseEditDialog from './CaseEditDialog';
import CaseFormDialog from './CaseFormDialog';
import CasesSearchBar from './CasesSearchBar';
import CasesSpeciesFilter from './CasesSpeciesFilter';
import CasesTasksFilter from './CasesTasksFilter';
import CasesSortControl from './CasesSortControl';
import CsvImportExportPanel from './CsvImportExportPanel';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { searchCases } from '../search';
import { filterCasesBySpecies, filterCasesByTaskTypes, filterCasesByAllTasksCompleted, filterOutCompletedCases } from '../filtering';
import { sortCases, SortOption } from '../sorting';
import { generateCasePdf } from '../pdf/generateCasePdf';

interface CasesListViewProps {
  highlightCaseId?: bigint | null;
  onHighlightClear?: () => void;
}

export default function CasesListView({ highlightCaseId, onHighlightClear }: CasesListViewProps) {
  const { data: cases = [], isLoading } = useGetAllCases();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Set<Species>>(new Set());
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(new Set());
  const [showAllTasksCompleted, setShowAllTasksCompleted] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('arrival-date-newest');
  const [editingCase, setEditingCase] = useState<SurgeryCase | null>(null);
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const highlightedRef = useRef<HTMLDivElement | null>(null);

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

  let filtered = [...cases];

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
    generateCasePdf(cases);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
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
        <CsvImportExportPanel cases={cases} />
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

      {/* Cases list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No cases found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
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
