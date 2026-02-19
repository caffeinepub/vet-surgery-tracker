import { useState } from 'react';
import { useGetAllCases } from '../../../hooks/useQueries';
import CaseCard from './CaseCard';
import CaseFormDialog from './CaseFormDialog';
import CasesSearchBar from './CasesSearchBar';
import CasesSortControl from './CasesSortControl';
import CsvImportExportPanel from './CsvImportExportPanel';
import { searchCases } from '../search';
import { sortCases, type SortOption } from '../sorting';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function CasesListView() {
  const { data: cases = [], isLoading } = useGetAllCases();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('arrival-date-newest');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Apply search filter first, then sort
  const filteredCases = searchCases(cases, searchQuery);
  const sortedCases = sortCases(filteredCases, sortOption);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-6 mb-8">
        <img 
          src="/assets/image-1.png" 
          alt="Surgery Case Log" 
          className="h-24 w-24 rounded-2xl shadow-md"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Surgery Cases</h2>
          <p className="text-muted-foreground mt-1">
            {cases.length} {cases.length === 1 ? 'case' : 'cases'} total
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1 max-w-3xl">
          <div className="flex-1">
            <CasesSearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <CasesSortControl value={sortOption} onSortChange={setSortOption} />
        </div>
        <CsvImportExportPanel cases={cases} />
      </div>

      {sortedCases.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border-2 border-dashed">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery ? 'No cases found' : 'No cases yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Get started by creating your first surgery case'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Case
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortedCases.map((surgeryCase) => (
            <CaseCard key={surgeryCase.id.toString()} surgeryCase={surgeryCase} />
          ))}
        </div>
      )}

      <CaseFormDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  );
}
