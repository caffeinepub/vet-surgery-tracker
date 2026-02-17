import { useState } from 'react';
import { useGetAllCases } from '../../../hooks/useQueries';
import CaseCard from './CaseCard';
import CaseFormDialog from './CaseFormDialog';
import CasesSearchBar from './CasesSearchBar';
import CsvImportExportPanel from './CsvImportExportPanel';
import { searchCases } from '../search';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function CasesListView() {
  const { data: cases = [], isLoading } = useGetAllCases();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredCases = searchCases(cases, searchQuery);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-blue-900 dark:text-blue-100 font-medium">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-100">Surgery Cases</h2>
          <p className="text-blue-700 dark:text-blue-300 mt-1">
            {cases.length} {cases.length === 1 ? 'case' : 'cases'} total
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 max-w-2xl">
          <CasesSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <CsvImportExportPanel cases={cases} />
      </div>

      {filteredCases.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-blue-300 dark:border-gray-600">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
            {searchQuery ? 'No cases found' : 'No cases yet'}
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-6">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Get started by creating your first surgery case'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Case
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCases.map((surgeryCase) => (
            <CaseCard key={surgeryCase.id.toString()} surgeryCase={surgeryCase} />
          ))}
        </div>
      )}

      <CaseFormDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  );
}
