import { useRef } from 'react';
import type { SurgeryCase } from '../../../backend';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { exportCasesToCsv, importCasesFromCsv } from '../csv/caseCsv';
import { useCreateCase, useUpdateCase } from '../../../hooks/useQueries';
import { toast } from 'sonner';

interface CsvImportExportPanelProps {
  cases: SurgeryCase[];
}

export default function CsvImportExportPanel({ cases }: CsvImportExportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createCase = useCreateCase();
  const updateCase = useUpdateCase();

  const handleExport = () => {
    try {
      exportCasesToCsv(cases);
      toast.success('Cases exported successfully');
    } catch (error) {
      toast.error('Failed to export cases');
      console.error('Export error:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await importCasesFromCsv(file, cases);

      if (result.errors.length > 0) {
        toast.error(`Import completed with ${result.errors.length} error(s). Check console for details.`);
        console.error('Import errors:', result.errors);
      }

      let successCount = 0;
      let errorCount = 0;

      for (const caseData of result.cases) {
        try {
          if (caseData.existingCase) {
            await updateCase.mutateAsync({
              id: caseData.existingCase.id,
              ...caseData.data,
            });
          } else {
            await createCase.mutateAsync(caseData.data);
          }
          successCount++;
        } catch (error) {
          errorCount++;
          console.error('Failed to save case:', error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} case(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} case(s)`);
      }
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error('Import error:', error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={cases.length === 0}
        className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900"
      >
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900"
      >
        <Upload className="mr-2 h-4 w-4" />
        Import CSV
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
}
