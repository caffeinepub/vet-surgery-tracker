import type { SurgeryCase, Species, Sex, CompletedTasks } from '../../../backend';
import { CSV_HEADERS } from './caseCsvSchema';
import { parseDate, parseSpecies, parseSex } from '../validation';

export function exportCasesToCsv(cases: SurgeryCase[]): void {
  const headers = CSV_HEADERS.join(',');
  const rows = cases.map((surgeryCase) => [
    surgeryCase.medicalRecordNumber,
    new Date(Number(surgeryCase.arrivalDate) / 1_000_000).toLocaleDateString('en-US'),
    surgeryCase.petName,
    surgeryCase.ownerLastName,
    surgeryCase.species,
    surgeryCase.breed,
    surgeryCase.sex,
    surgeryCase.dateOfBirth ? new Date(Number(surgeryCase.dateOfBirth) / 1_000_000).toLocaleDateString('en-US') : '',
    surgeryCase.presentingComplaint,
    surgeryCase.notes,
    surgeryCase.completedTasks.dischargeNotes ? 'TRUE' : 'FALSE',
    surgeryCase.completedTasks.pdvmNotified ? 'TRUE' : 'FALSE',
    surgeryCase.completedTasks.labs ? 'TRUE' : 'FALSE',
    surgeryCase.completedTasks.histo ? 'TRUE' : 'FALSE',
    surgeryCase.completedTasks.surgeryReport ? 'TRUE' : 'FALSE',
    surgeryCase.completedTasks.imaging ? 'TRUE' : 'FALSE',
    surgeryCase.completedTasks.culture ? 'TRUE' : 'FALSE',
  ].map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','));

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `vet-surgery-cases-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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
      completedTasks: CompletedTasks;
    };
    existingCase?: SurgeryCase;
  }>;
  errors: ImportError[];
}

function parseBool(value: string): boolean {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'TRUE' || normalized === 'YES' || normalized === '1' || normalized === 'X') {
    return true;
  }
  if (normalized === 'FALSE' || normalized === 'NO' || normalized === '0' || normalized === '') {
    return false;
  }
  throw new Error(`Invalid boolean value: "${value}". Expected TRUE/FALSE, YES/NO, 1/0, X/empty`);
}

export async function importCasesFromCsv(file: File, existingCases: SurgeryCase[]): Promise<ImportResult> {
  console.log('[CSV Import] Starting import', {
    fileName: file.name,
    fileSize: file.size,
    existingCasesCount: existingCases.length,
    timestamp: new Date().toISOString(),
  });

  const text = await file.text();
  const lines = text.split('\n').filter((line) => line.trim());

  console.log('[CSV Import] File parsed', {
    totalLines: lines.length,
    headerLine: lines[0]?.substring(0, 100),
  });

  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  const errors: ImportError[] = [];
  const cases: ImportResult['cases'] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const line = lines[i];

    console.log(`[CSV Import] Processing row ${rowNumber}`, {
      linePreview: line.substring(0, 100),
    });

    try {
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

      if (fields.length !== CSV_HEADERS.length) {
        errors.push({
          row: rowNumber,
          field: 'row',
          message: `Expected ${CSV_HEADERS.length} columns, found ${fields.length}`,
        });
        console.error(`[CSV Import] Row ${rowNumber} column count mismatch`, {
          expected: CSV_HEADERS.length,
          actual: fields.length,
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

      console.log(`[CSV Import] Row ${rowNumber} checklist fields`, {
        dischargeNotesStr,
        pdvmNotifiedStr,
        labsStr,
        histoStr,
        surgeryReportStr,
        imagingStr,
        cultureStr,
      });

      // Validate required fields
      if (!medicalRecordNumber) {
        errors.push({
          row: rowNumber,
          field: 'Medical Record #',
          message: 'Medical Record Number is required',
        });
        continue;
      }

      if (!arrivalDateStr) {
        errors.push({
          row: rowNumber,
          field: 'Arrival Date',
          message: 'Arrival Date is required',
        });
        continue;
      }

      if (!petName) {
        errors.push({
          row: rowNumber,
          field: 'Pet Name',
          message: 'Pet Name is required',
        });
        continue;
      }

      if (!ownerLastName) {
        errors.push({
          row: rowNumber,
          field: 'Owner Last Name',
          message: 'Owner Last Name is required',
        });
        continue;
      }

      if (!breed) {
        errors.push({
          row: rowNumber,
          field: 'Breed',
          message: 'Breed is required',
        });
        continue;
      }

      // Parse dates
      const arrivalDateParsed = parseDate(arrivalDateStr);
      if (!arrivalDateParsed) {
        errors.push({
          row: rowNumber,
          field: 'Arrival Date',
          message: 'Invalid date format. Expected M/D/YYYY',
          value: arrivalDateStr,
        });
        continue;
      }

      let dateOfBirth: Date | null = null;
      if (dateOfBirthStr) {
        dateOfBirth = parseDate(dateOfBirthStr);
        if (!dateOfBirth) {
          errors.push({
            row: rowNumber,
            field: 'Date of Birth',
            message: 'Invalid date format. Expected M/D/YYYY',
            value: dateOfBirthStr,
          });
        }
      }

      // Parse species
      const speciesParsed = parseSpecies(speciesStr);
      if (!speciesParsed) {
        errors.push({
          row: rowNumber,
          field: 'Species',
          message: 'Invalid species. Expected: canine, feline, or other',
          value: speciesStr,
        });
        continue;
      }

      // Parse sex
      const sexParsed = parseSex(sexStr);
      if (!sexParsed) {
        errors.push({
          row: rowNumber,
          field: 'Sex',
          message: 'Invalid sex. Expected: male, maleNeutered, female, or femaleSpayed',
          value: sexStr,
        });
        continue;
      }

      // Parse checklist fields individually
      let dischargeNotes: boolean;
      let pdvmNotified: boolean;
      let labs: boolean;
      let histo: boolean;
      let surgeryReport: boolean;
      let imaging: boolean;
      let culture: boolean;

      try {
        dischargeNotes = parseBool(dischargeNotesStr);
        console.log(`[CSV Import] Row ${rowNumber} dischargeNotes parsed:`, dischargeNotes);
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: 'Discharge Notes',
          message: error instanceof Error ? error.message : 'Invalid boolean value',
          value: dischargeNotesStr,
        });
        continue;
      }

      try {
        pdvmNotified = parseBool(pdvmNotifiedStr);
        console.log(`[CSV Import] Row ${rowNumber} pdvmNotified parsed:`, pdvmNotified);
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: 'pDVM Notified',
          message: error instanceof Error ? error.message : 'Invalid boolean value',
          value: pdvmNotifiedStr,
        });
        continue;
      }

      try {
        labs = parseBool(labsStr);
        console.log(`[CSV Import] Row ${rowNumber} labs parsed:`, labs);
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: 'Labs',
          message: error instanceof Error ? error.message : 'Invalid boolean value',
          value: labsStr,
        });
        continue;
      }

      try {
        histo = parseBool(histoStr);
        console.log(`[CSV Import] Row ${rowNumber} histo parsed:`, histo);
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: 'Histo',
          message: error instanceof Error ? error.message : 'Invalid boolean value',
          value: histoStr,
        });
        continue;
      }

      try {
        surgeryReport = parseBool(surgeryReportStr);
        console.log(`[CSV Import] Row ${rowNumber} surgeryReport parsed:`, surgeryReport);
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: 'Surgery Report',
          message: error instanceof Error ? error.message : 'Invalid boolean value',
          value: surgeryReportStr,
        });
        continue;
      }

      try {
        imaging = parseBool(imagingStr);
        console.log(`[CSV Import] Row ${rowNumber} imaging parsed:`, imaging);
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: 'Imaging',
          message: error instanceof Error ? error.message : 'Invalid boolean value',
          value: imagingStr,
        });
        continue;
      }

      try {
        culture = parseBool(cultureStr);
        console.log(`[CSV Import] Row ${rowNumber} culture parsed:`, culture);
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: 'Culture',
          message: error instanceof Error ? error.message : 'Invalid boolean value',
          value: cultureStr,
        });
        continue;
      }

      const completedTasks: CompletedTasks = {
        dischargeNotes,
        pdvmNotified,
        labs,
        histo,
        surgeryReport,
        imaging,
        culture,
      };

      console.log(`[CSV Import] Row ${rowNumber} completedTasks object:`, completedTasks);

      // Check if case already exists
      const existingCase = existingCases.find(
        (c) => c.medicalRecordNumber === medicalRecordNumber
      );

      cases.push({
        data: {
          medicalRecordNumber,
          arrivalDate: BigInt(arrivalDateParsed.getTime()) * BigInt(1_000_000),
          petName,
          ownerLastName,
          species: speciesParsed,
          breed,
          sex: sexParsed,
          dateOfBirth: dateOfBirth ? BigInt(dateOfBirth.getTime()) * BigInt(1_000_000) : null,
          presentingComplaint,
          notes,
          completedTasks,
        },
        existingCase,
      });

      console.log(`[CSV Import] Row ${rowNumber} successfully parsed`, {
        medicalRecordNumber,
        isUpdate: !!existingCase,
      });
    } catch (error) {
      errors.push({
        row: rowNumber,
        field: 'row',
        message: error instanceof Error ? error.message : 'Unknown parsing error',
      });
      console.error(`[CSV Import] Row ${rowNumber} parsing error:`, error);
    }
  }

  console.log('[CSV Import] Import complete', {
    totalRows: lines.length - 1,
    successfulCases: cases.length,
    errors: errors.length,
    timestamp: new Date().toISOString(),
  });

  return { cases, errors };
}
