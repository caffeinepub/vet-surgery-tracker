import type { SurgeryCase, Species, Sex, Task } from '../../../backend';
import { CSV_HEADERS } from './caseCsvSchema';
import { parseDate, parseSpecies, parseSex, parseBoolean } from '../validation';
import { dateToNanoseconds } from '../validation';
import { getDefaultTaskSelections } from '../checklist';

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface ImportResult {
  cases: Array<{
    data: {
      medicalRecordNumber: string;
      arrivalDate: bigint;
      petName: string;
      ownerLastName: string;
      species: Species;
      breed: string;
      sex: Sex;
      dateOfBirth: bigint | null;
      presentingComplaint: string;
      notes: string;
      task: Task;
    };
    existingCase?: SurgeryCase;
  }>;
  errors: ImportError[];
}

export function exportCasesToCsv(cases: SurgeryCase[]): void {
  const rows: string[][] = [CSV_HEADERS.slice()];

  cases.forEach((surgeryCase) => {
    const arrivalDate = new Date(Number(surgeryCase.arrivalDate / 1_000_000n));
    const dateOfBirth = surgeryCase.dateOfBirth
      ? new Date(Number(surgeryCase.dateOfBirth / 1_000_000n))
      : null;

    rows.push([
      surgeryCase.medicalRecordNumber,
      `${arrivalDate.getMonth() + 1}/${arrivalDate.getDate()}/${arrivalDate.getFullYear()}`,
      surgeryCase.petName,
      surgeryCase.ownerLastName,
      surgeryCase.species,
      surgeryCase.breed,
      surgeryCase.sex,
      dateOfBirth ? `${dateOfBirth.getMonth() + 1}/${dateOfBirth.getDate()}/${dateOfBirth.getFullYear()}` : '',
      surgeryCase.presentingComplaint,
      surgeryCase.notes,
      surgeryCase.task.dischargeNotesCompleted ? 'TRUE' : 'FALSE',
      surgeryCase.task.pdvmNotifiedCompleted ? 'TRUE' : 'FALSE',
      surgeryCase.task.labsCompleted ? 'TRUE' : 'FALSE',
      surgeryCase.task.histoCompleted ? 'TRUE' : 'FALSE',
      surgeryCase.task.surgeryReportCompleted ? 'TRUE' : 'FALSE',
      surgeryCase.task.imagingCompleted ? 'TRUE' : 'FALSE',
      surgeryCase.task.cultureCompleted ? 'TRUE' : 'FALSE',
    ]);
  });

  const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `vet-surgery-cases-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function importCasesFromCsv(file: File, existingCases: SurgeryCase[]): Promise<ImportResult> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  console.log('[CSV Import] Starting import', {
    totalLines: lines.length,
    timestamp: new Date().toISOString(),
  });

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const errors: ImportError[] = [];
  const cases: ImportResult['cases'] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const line = lines[i];

    console.log(`[CSV Import] Processing row ${rowNumber}`, {
      lineLength: line.length,
      timestamp: new Date().toISOString(),
    });

    // Parse CSV row (handle quoted fields)
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());

    console.log(`[CSV Import] Row ${rowNumber} parsed into ${fields.length} fields`);

    if (fields.length !== 17) {
      errors.push({
        row: rowNumber,
        field: 'row',
        message: `Expected 17 columns, found ${fields.length}`,
      });
      continue;
    }

    const [
      medicalRecordNumber,
      arrivalDateStr,
      petName,
      ownerLastName,
      speciesStr,
      breed,
      sexStr,
      dateOfBirthStr,
      presentingComplaint,
      notes,
      dischargeNotesStr,
      pdvmNotifiedStr,
      labsStr,
      histoStr,
      surgeryReportStr,
      imagingStr,
      cultureStr,
    ] = fields;

    // Validate and parse fields
    let hasError = false;

    if (!medicalRecordNumber) {
      errors.push({ row: rowNumber, field: 'Medical Record #', message: 'Required field is empty' });
      hasError = true;
    }

    const arrivalDate = parseDate(arrivalDateStr);
    if (!arrivalDate) {
      errors.push({
        row: rowNumber,
        field: 'Arrival Date',
        message: 'Invalid date format (expected M/D/YYYY)',
        value: arrivalDateStr,
      });
      hasError = true;
    }

    if (!petName) {
      errors.push({ row: rowNumber, field: 'Pet Name', message: 'Required field is empty' });
      hasError = true;
    }

    if (!ownerLastName) {
      errors.push({ row: rowNumber, field: 'Owner Last Name', message: 'Required field is empty' });
      hasError = true;
    }

    const species = parseSpecies(speciesStr);
    if (!species) {
      errors.push({
        row: rowNumber,
        field: 'Species',
        message: 'Invalid species (expected canine, feline, or other)',
        value: speciesStr,
      });
      hasError = true;
    }

    if (!breed) {
      errors.push({ row: rowNumber, field: 'Breed', message: 'Required field is empty' });
      hasError = true;
    }

    const sex = parseSex(sexStr);
    if (!sex) {
      errors.push({
        row: rowNumber,
        field: 'Sex',
        message: 'Invalid sex (expected male, maleNeutered, female, or femaleSpayed)',
        value: sexStr,
      });
      hasError = true;
    }

    const dateOfBirth = dateOfBirthStr ? parseDate(dateOfBirthStr) : null;
    if (dateOfBirthStr && !dateOfBirth) {
      errors.push({
        row: rowNumber,
        field: 'Date of Birth',
        message: 'Invalid date format (expected M/D/YYYY)',
        value: dateOfBirthStr,
      });
    }

    // Parse task completion fields
    const dischargeNotesCompleted = parseBoolean(dischargeNotesStr);
    const pdvmNotifiedCompleted = parseBoolean(pdvmNotifiedStr);
    const labsCompleted = parseBoolean(labsStr);
    const histoCompleted = parseBoolean(histoStr);
    const surgeryReportCompleted = parseBoolean(surgeryReportStr);
    const imagingCompleted = parseBoolean(imagingStr);
    const cultureCompleted = parseBoolean(cultureStr);

    console.log(`[CSV Import] Row ${rowNumber} task fields parsed`, {
      dischargeNotesCompleted,
      pdvmNotifiedCompleted,
      labsCompleted,
      histoCompleted,
      surgeryReportCompleted,
      imagingCompleted,
      cultureCompleted,
    });

    if (hasError) {
      console.warn(`[CSV Import] Row ${rowNumber} has validation errors, skipping`);
      continue;
    }

    // Check if case already exists
    const existingCase = existingCases.find((c) => c.medicalRecordNumber === medicalRecordNumber);

    // Create task object with both selected and completed fields
    // For CSV import, we assume all tasks are selected if they have any value
    const task: Task = {
      dischargeNotesSelected: true,
      dischargeNotesCompleted,
      pdvmNotifiedSelected: true,
      pdvmNotifiedCompleted,
      labsSelected: true,
      labsCompleted,
      histoSelected: true,
      histoCompleted,
      surgeryReportSelected: true,
      surgeryReportCompleted,
      imagingSelected: true,
      imagingCompleted,
      cultureSelected: true,
      cultureCompleted,
    };

    cases.push({
      data: {
        medicalRecordNumber,
        arrivalDate: dateToNanoseconds(arrivalDate!),
        petName,
        ownerLastName,
        species: species!,
        breed,
        sex: sex!,
        dateOfBirth: dateOfBirth ? dateToNanoseconds(dateOfBirth) : null,
        presentingComplaint,
        notes,
        task,
      },
      existingCase,
    });

    console.log(`[CSV Import] Row ${rowNumber} successfully parsed`, {
      medicalRecordNumber,
      isUpdate: !!existingCase,
    });
  }

  console.log('[CSV Import] Import parsing complete', {
    totalRows: lines.length - 1,
    successfulCases: cases.length,
    errors: errors.length,
    timestamp: new Date().toISOString(),
  });

  return { cases, errors };
}
