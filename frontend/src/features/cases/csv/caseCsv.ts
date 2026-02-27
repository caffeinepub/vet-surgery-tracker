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
      surgeryCase.task.dailySummaryCompleted ? 'TRUE' : 'FALSE',
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

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const errors: ImportError[] = [];
  const cases: ImportResult['cases'] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const line = lines[i];

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

    // Accept both 17 (legacy) and 18 (new with dailySummary) columns
    if (fields.length !== 17 && fields.length !== 18) {
      errors.push({
        row: rowNumber,
        field: 'row',
        message: `Expected 17 or 18 columns, found ${fields.length}`,
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

    // dailySummary is optional (18th column), default false for legacy 17-column files
    const dailySummaryStr = fields.length >= 18 ? fields[17] : 'FALSE';

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
        message: `Invalid date format: "${arrivalDateStr}". Expected M/D/YYYY`,
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
        message: `Invalid species: "${speciesStr}". Expected: canine, feline, or other`,
        value: speciesStr,
      });
      hasError = true;
    }

    const sex = parseSex(sexStr);
    if (!sex) {
      errors.push({
        row: rowNumber,
        field: 'Sex',
        message: `Invalid sex: "${sexStr}". Expected: male, maleNeutered, female, or femaleSpayed`,
        value: sexStr,
      });
      hasError = true;
    }

    if (hasError) continue;

    const dateOfBirth = dateOfBirthStr ? parseDate(dateOfBirthStr) : null;

    const task: Task = {
      dischargeNotesSelected: parseBoolean(dischargeNotesStr),
      dischargeNotesCompleted: false,
      pdvmNotifiedSelected: parseBoolean(pdvmNotifiedStr),
      pdvmNotifiedCompleted: false,
      labsSelected: parseBoolean(labsStr),
      labsCompleted: false,
      histoSelected: parseBoolean(histoStr),
      histoCompleted: false,
      surgeryReportSelected: parseBoolean(surgeryReportStr),
      surgeryReportCompleted: false,
      imagingSelected: parseBoolean(imagingStr),
      imagingCompleted: false,
      cultureSelected: parseBoolean(cultureStr),
      cultureCompleted: false,
      followUpSelected: false,
      followUpCompleted: false,
      dailySummarySelected: parseBoolean(dailySummaryStr),
      dailySummaryCompleted: false,
    };

    const existingCase = existingCases.find(
      (c) => c.medicalRecordNumber === medicalRecordNumber
    );

    cases.push({
      data: {
        medicalRecordNumber,
        arrivalDate: dateToNanoseconds(arrivalDate!),
        petName,
        ownerLastName,
        species: species!,
        breed: breed || '',
        sex: sex!,
        dateOfBirth: dateOfBirth ? dateToNanoseconds(dateOfBirth) : null,
        presentingComplaint: presentingComplaint || '',
        notes: notes || '',
        task,
      },
      existingCase,
    });
  }

  return { cases, errors };
}
