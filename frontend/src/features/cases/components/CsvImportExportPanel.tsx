import { useRef, useState } from 'react';
import type { SurgeryCase, TaskOptions } from '../../../backend';
import { Button } from '@/components/ui/button';
import { Download, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { exportCasesToCsv, importCasesFromCsv, type ImportError } from '../csv/caseCsv';
import { useCreateCase, useUpdateCase } from '../../../hooks/useQueries';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CsvImportExportPanelProps {
  cases: SurgeryCase[];
}

export default function CsvImportExportPanel({ cases }: CsvImportExportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createCase = useCreateCase();
  const updateCase = useUpdateCase();
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  const handleExport = () => {
    try {
      console.log('[CSV Export] Starting export', { caseCount: cases.length });
      exportCasesToCsv(cases);
      toast.success('Cases exported successfully');
      console.log('[CSV Export] Export completed successfully');
    } catch (error) {
      toast.error('Failed to export cases');
      console.error('[CSV Export] Export error:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[CSV Import UI] Import started', {
      fileName: file.name,
      fileSize: file.size,
      timestamp: new Date().toISOString(),
    });

    setIsImporting(true);
    setImportErrors([]);
    setImportProgress(null);

    try {
      // Parse CSV file
      console.log('[CSV Import UI] Parsing CSV file...');
      const result = await importCasesFromCsv(file, cases);

      console.log('[CSV Import UI] CSV parsing complete', {
        casesToImport: result.cases.length,
        parseErrors: result.errors.length,
        timestamp: new Date().toISOString(),
      });

      // Display parsing errors
      if (result.errors.length > 0) {
        setImportErrors(result.errors);
        toast.error(`CSV parsing found ${result.errors.length} error(s). Check details below.`);
        console.error('[CSV Import UI] Parsing errors:', result.errors);
      }

      // If no cases to import, stop here
      if (result.cases.length === 0) {
        console.warn('[CSV Import UI] No valid cases to import');
        toast.warning('No valid cases found in CSV file');
        setIsImporting(false);
        return;
      }

      // Import cases to backend
      console.log('[CSV Import UI] Starting backend import', {
        totalCases: result.cases.length,
        timestamp: new Date().toISOString(),
      });

      let successCount = 0;
      let errorCount = 0;
      const backendErrors: ImportError[] = [];

      setImportProgress({ current: 0, total: result.cases.length });

      for (let i = 0; i < result.cases.length; i++) {
        const caseData = result.cases[i];
        const caseNumber = i + 1;

        console.log(`[CSV Import UI] Processing case ${caseNumber}/${result.cases.length}`, {
          medicalRecordNumber: caseData.data.medicalRecordNumber,
          isUpdate: !!caseData.existingCase,
          timestamp: new Date().toISOString(),
        });

        setImportProgress({ current: caseNumber, total: result.cases.length });

        try {
          if (caseData.existingCase) {
            console.log(`[CSV Import UI] Updating existing case ${caseData.existingCase.id}`);
            await updateCase.mutateAsync({
              id: caseData.existingCase.id,
              ...caseData.data,
            });
            console.log(`[CSV Import UI] Case ${caseData.existingCase.id} updated successfully`);
          } else {
            console.log('[CSV Import UI] Creating new case');
            // Convert Task to TaskOptions for new case creation
            const taskOptions: TaskOptions = {
              dischargeNotes: caseData.data.task.dischargeNotesSelected,
              pdvmNotified: caseData.data.task.pdvmNotifiedSelected,
              labs: caseData.data.task.labsSelected,
              histo: caseData.data.task.histoSelected,
              surgeryReport: caseData.data.task.surgeryReportSelected,
              imaging: caseData.data.task.imagingSelected,
              culture: caseData.data.task.cultureSelected,
              followUp: caseData.data.task.followUpSelected,
            };

            const newCase = await createCase.mutateAsync({
              medicalRecordNumber: caseData.data.medicalRecordNumber,
              arrivalDate: caseData.data.arrivalDate,
              petName: caseData.data.petName,
              ownerLastName: caseData.data.ownerLastName,
              species: caseData.data.species,
              breed: caseData.data.breed,
              sex: caseData.data.sex,
              dateOfBirth: caseData.data.dateOfBirth,
              presentingComplaint: caseData.data.presentingComplaint,
              notes: caseData.data.notes,
              taskOptions,
            });
            console.log(`[CSV Import UI] New case created with ID ${newCase.id}`);
          }
          successCount++;
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          backendErrors.push({
            row: caseNumber,
            field: 'backend',
            message: `Failed to save case: ${errorMessage}`,
          });
          console.error(`[CSV Import UI] Failed to save case ${caseNumber}:`, {
            error,
            errorMessage,
            caseData: caseData.data,
            timestamp: new Date().toISOString(),
          });
        }
      }

      console.log('[CSV Import UI] Import complete', {
        successCount,
        errorCount,
        totalProcessed: result.cases.length,
        timestamp: new Date().toISOString(),
      });

      // Update error list with backend errors
      if (backendErrors.length > 0) {
        setImportErrors((prev) => [...prev, ...backendErrors]);
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} case(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} case(s). Check details below.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to parse CSV file: ${errorMessage}`);
      console.error('[CSV Import UI] Critical import error:', {
        error,
        errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const groupErrorsByType = (errors: ImportError[]) => {
    const grouped: Record<string, ImportError[]> = {};
    errors.forEach((error) => {
      const key = error.field;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(error);
    });
    return grouped;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={cases.length === 0 || isImporting}
          className="border-primary/40 text-primary hover:bg-primary/10 dark:border-primary dark:text-primary dark:hover:bg-primary/20"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="border-primary/40 text-primary hover:bg-primary/10 dark:border-primary dark:text-primary dark:hover:bg-primary/20"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {importProgress && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Importing Cases</AlertTitle>
          <AlertDescription>
            Processing case {importProgress.current} of {importProgress.total}...
          </AlertDescription>
        </Alert>
      )}

      {importErrors.length > 0 && !isImporting && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Import Errors ({importErrors.length})</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(groupErrorsByType(importErrors)).map(([field, fieldErrors]) => (
                <div key={field}>
                  <p className="font-semibold text-xs uppercase tracking-wide">{field}</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {fieldErrors.map((err, idx) => (
                      <li key={idx} className="text-xs">
                        Row {err.row}: {err.message}
                        {err.value && <span className="opacity-70"> (got: "{err.value}")</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
