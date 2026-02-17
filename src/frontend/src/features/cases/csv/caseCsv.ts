import type { SurgeryCase, Species, Sex, Checklist } from '../../../backend';
import { CSV_HEADERS, type CsvRow } from './caseCsvSchema';
import { formatDate, dateToNanoseconds, validateSpecies, validateSex } from '../validation';

export function exportCasesToCsv(cases: SurgeryCase[]): void {
  const rows: string[][] = [Array.from(CSV_HEADERS)];

  for (const surgeryCase of cases) {
    rows.push([
      surgeryCase.medicalRecordNumber,
      formatDate(surgeryCase.arrivalDate),
      surgeryCase.petName,
      surgeryCase.ownerLastName,
      surgeryCase.species,
      surgeryCase.breed,
      surgeryCase.sex,
      surgeryCase.dateOfBirth ? formatDate(surgeryCase.dateOfBirth) : '',
      surgeryCase.presentingComplaint,
      surgeryCase.notes,
      surgeryCase.checklist.dischargeNotes ? 'true' : 'false',
      surgeryCase.checklist.pdvmNotified ? 'true' : 'false',
      surgeryCase.checklist.labs ? 'true' : 'false',
      surgeryCase.checklist.histo ? 'true' : 'false',
      surgeryCase.checklist.surgeryReport ? 'true' : 'false',
      surgeryCase.checklist.imaging ? 'true' : 'false',
      surgeryCase.checklist.culture ? 'true' : 'false',
    ]);
  }

  const csvContent = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
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

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  cases: Array<{
    data: {
      medicalRecordNumber: string;
      petName: string;
      ownerLastName: string;
      species: Species;
      breed: string;
      sex: Sex;
      dateOfBirth: bigint | null;
      presentingComplaint: string;
      notes: string;
      checklist: Checklist;
    };
    existingCase?: SurgeryCase;
  }>;
  errors: ImportError[];
}

export async function importCasesFromCsv(file: File, existingCases: SurgeryCase[]): Promise<ImportResult> {
  const text = await file.text();
  const lines = text.split('\n').filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const result: ImportResult = {
    cases: [],
    errors: [],
  };

  const headers = parseCsvLine(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0 || values.every((v) => !v.trim())) continue;

    const row: Partial<CsvRow> = {};
    headers.forEach((header, index) => {
      row[header as keyof CsvRow] = values[index] || '';
    });

    try {
      const medicalRecordNumber = row['Medical Record #']?.trim() || '';
      if (!medicalRecordNumber) {
        result.errors.push({ row: i + 1, field: 'Medical Record #', message: 'Required field is missing' });
        continue;
      }

      const petName = row['Pet Name']?.trim() || '';
      if (!petName) {
        result.errors.push({ row: i + 1, field: 'Pet Name', message: 'Required field is missing' });
        continue;
      }

      const ownerLastName = row['Owner Last Name']?.trim() || '';
      if (!ownerLastName) {
        result.errors.push({ row: i + 1, field: 'Owner Last Name', message: 'Required field is missing' });
        continue;
      }

      const speciesValue = row['Species']?.trim().toLowerCase() || 'canine';
      const species = validateSpecies(speciesValue);
      if (!species) {
        result.errors.push({ row: i + 1, field: 'Species', message: `Invalid species: ${speciesValue}` });
        continue;
      }

      const breed = row['Breed']?.trim() || '';
      if (!breed) {
        result.errors.push({ row: i + 1, field: 'Breed', message: 'Required field is missing' });
        continue;
      }

      const sexValue = row['Sex']?.trim().toLowerCase().replace(/\s+/g, '') || 'male';
      const sex = validateSex(sexValue);
      if (!sex) {
        result.errors.push({ row: i + 1, field: 'Sex', message: `Invalid sex: ${sexValue}` });
        continue;
      }

      let dateOfBirth: bigint | null = null;
      const dobString = row['Date of Birth']?.trim();
      if (dobString) {
        const dobDate = new Date(dobString);
        if (!isNaN(dobDate.getTime())) {
          dateOfBirth = dateToNanoseconds(dobDate);
        }
      }

      const presentingComplaint = row['Presenting Complaint']?.trim() || '';
      const notes = row['Notes']?.trim() || '';

      const checklist: Checklist = {
        dischargeNotes: parseBool(row['Discharge Notes']),
        pdvmNotified: parseBool(row['pDVM Notified']),
        labs: parseBool(row['Labs']),
        histo: parseBool(row['Histo']),
        surgeryReport: parseBool(row['Surgery Report']),
        imaging: parseBool(row['Imaging']),
        culture: parseBool(row['Culture']),
      };

      const arrivalDateString = row['Arrival Date']?.trim();
      let arrivalDate = new Date();
      if (arrivalDateString) {
        const parsed = new Date(arrivalDateString);
        if (!isNaN(parsed.getTime())) {
          arrivalDate = parsed;
        }
      }

      const existingCase = existingCases.find(
        (c) =>
          c.medicalRecordNumber === medicalRecordNumber &&
          formatDate(c.arrivalDate) === formatDate(dateToNanoseconds(arrivalDate))
      );

      result.cases.push({
        data: {
          medicalRecordNumber,
          petName,
          ownerLastName,
          species,
          breed,
          sex,
          dateOfBirth,
          presentingComplaint,
          notes,
          checklist,
        },
        existingCase,
      });
    } catch (error) {
      result.errors.push({
        row: i + 1,
        field: 'general',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.trim().toLowerCase();
  return lower === 'true' || lower === '1' || lower === 'yes';
}
