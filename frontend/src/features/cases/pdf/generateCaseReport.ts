import type { SurgeryCase } from '../../../backend';
import { formatDateForCsv, formatSpeciesForCsv, formatSexForCsv } from './reportFormatters';
import { getRemainingChecklistItems } from '../checklist';

/**
 * Generates and downloads a CSV report of all surgery cases with their remaining tasks
 * CSV format is chosen as it's universally compatible and doesn't require external dependencies
 */
export function generateCaseReport(cases: SurgeryCase[]): void {
  // CSV headers
  const headers = [
    'MRN',
    'Owner Last Name',
    'Pet Name',
    'Species',
    'Breed',
    'Sex',
    'Arrival Date',
    'Date of Birth',
    'Presenting Complaint',
    'Notes',
    'Remaining Tasks',
  ];

  // Convert cases to CSV rows
  const rows = cases.map(caseItem => {
    const remainingTasks = getRemainingChecklistItems(caseItem.task);
    const tasksList = remainingTasks.length > 0 
      ? remainingTasks.map(t => t.label).join('; ')
      : 'All tasks completed';
    
    return [
      escapeCsvField(caseItem.medicalRecordNumber),
      escapeCsvField(caseItem.ownerLastName),
      escapeCsvField(caseItem.petName),
      escapeCsvField(formatSpeciesForCsv(caseItem.species)),
      escapeCsvField(caseItem.breed),
      escapeCsvField(formatSexForCsv(caseItem.sex)),
      escapeCsvField(formatDateForCsv(caseItem.arrivalDate)),
      escapeCsvField(caseItem.dateOfBirth ? formatDateForCsv(caseItem.dateOfBirth) : 'Unknown'),
      escapeCsvField(caseItem.presentingComplaint || '-'),
      escapeCsvField(caseItem.notes || '-'),
      escapeCsvField(tasksList),
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `surgery-cases-report-${timestamp}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escapes a field for CSV format by wrapping in quotes if it contains special characters
 */
function escapeCsvField(field: string): string {
  if (!field) return '""';
  
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  
  return field;
}
