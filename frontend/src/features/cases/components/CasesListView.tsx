import { useState, useMemo } from 'react';
import { useGetAllCases } from '../../../hooks/useQueries';
import CaseCard from './CaseCard';
import CasesSearchBar from './CasesSearchBar';
import CasesSpeciesFilter from './CasesSpeciesFilter';
import CasesTasksFilter from './CasesTasksFilter';
import CasesSortControl from './CasesSortControl';
import CsvImportExportPanel from './CsvImportExportPanel';
import { searchCases } from '../search';
import {
  filterCasesBySpecies,
  filterCasesByTaskTypes,
  filterOutCompletedCases,
  filterCasesByAllTasksCompleted,
} from '../filtering';
import { sortCases, SORT_OPTIONS } from '../sorting';
import type { SurgeryCase, Species } from '../../../backend';

interface CasesListViewProps {
  onNewCase: () => void;
}

export default function CasesListView({ onNewCase: _onNewCase }: CasesListViewProps) {
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-foreground">All Cases</h1>
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
          <CsvImportExportPanel cases={filteredCases} />
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
            <CaseCard key={String(c.id)} surgeryCase={c} />
          ))}
        </div>
      )}
    </div>
  );
}
