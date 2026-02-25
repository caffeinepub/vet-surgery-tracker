import { useState, useMemo } from 'react';
import { useGetAllCases } from '../../../hooks/useQueries';
import CaseCard from '../../cases/components/CaseCard';
import CasesSearchBar from '../../cases/components/CasesSearchBar';
import CasesSpeciesFilter from '../../cases/components/CasesSpeciesFilter';
import CasesTasksFilter from '../../cases/components/CasesTasksFilter';
import CasesSortControl from '../../cases/components/CasesSortControl';
import { searchCases } from '../../cases/search';
import {
  filterCasesBySpecies,
  filterCasesByTaskTypes,
  filterOutCompletedCases,
  filterCasesByAllTasksCompleted,
} from '../../cases/filtering';
import { sortCases, SORT_OPTIONS } from '../../cases/sorting';
import type { SurgeryCase, Species } from '../../../backend';
import { generateCasePdf } from '../../cases/pdf/generateCasePdf';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardViewProps {
  onNewCase: () => void;
  highlightedCaseId?: bigint | null;
}

export default function DashboardView({ onNewCase: _onNewCase, highlightedCaseId }: DashboardViewProps) {
  const { data: allCases = [], isLoading } = useGetAllCases();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Set<Species>>(new Set());
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(new Set());
  const [showAllTasksCompleted, setShowAllTasksCompleted] = useState(false);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[1].value);

  const filteredCases = useMemo(() => {
    let cases = allCases as SurgeryCase[];

    // Show/hide completed cases
    if (showAllTasksCompleted) {
      cases = filterCasesByAllTasksCompleted(cases);
    } else {
      cases = filterOutCompletedCases(cases);
    }

    // Species filter
    if (selectedSpecies.size > 0) {
      cases = filterCasesBySpecies(cases, selectedSpecies);
    }

    // Task types filter
    if (selectedTaskTypes.size > 0) {
      cases = filterCasesByTaskTypes(cases, selectedTaskTypes);
    }

    // Search
    if (searchQuery.trim()) {
      cases = searchCases(cases, searchQuery);
    }

    return sortCases(cases, sortOption);
  }, [allCases, searchQuery, selectedSpecies, selectedTaskTypes, showAllTasksCompleted, sortOption]);

  const handleExportPdf = () => {
    generateCasePdf(filteredCases);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <CasesSearchBar value={searchQuery} onChange={setSearchQuery} />
          <CasesSpeciesFilter selectedSpecies={selectedSpecies} onSpeciesChange={setSelectedSpecies} />
          <CasesTasksFilter
            selectedTaskTypes={selectedTaskTypes}
            onTaskTypesChange={setSelectedTaskTypes}
            showAllTasksCompleted={showAllTasksCompleted}
            onShowAllTasksCompletedChange={setShowAllTasksCompleted}
          />
          <CasesSortControl value={sortOption} onSortChange={setSortOption} />
          <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-1.5 h-8 text-xs">
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Cases grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No cases found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredCases.map((c) => (
            <CaseCard
              key={String(c.id)}
              surgeryCase={c}
              isHighlighted={
                highlightedCaseId !== null &&
                highlightedCaseId !== undefined &&
                c.id === highlightedCaseId
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
