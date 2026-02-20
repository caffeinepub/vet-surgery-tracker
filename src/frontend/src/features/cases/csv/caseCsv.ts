import type { SurgeryCase, Species, Sex, Checklist } from '../../../backend';
import { CSV_HEADERS, type CsvRow } from './caseCsvSchema';
import { dateToNanoseconds, validateSpecies, validateSex } from '../validation';

export function exportCasesToCsv(cases: SurgeryCase[]): void {
  const rows: string[][] = [Array.from(CSV_HEADERS)];

  for (const surgeryCase of cases) {
    rows.push([
      surgeryCase.medicalRecordNumber,
      formatDateToMDY(surgeryCase.arrivalDate),
      surgeryCase.petName,
      surgeryCase.ownerLastName,
      formatSpeciesLabel(surgeryCase.species),
      surgeryCase.breed,
      formatSexLabel(surgeryCase.sex),
      surgeryCase.dateOfBirth ? formatDateToMDY(surgeryCase.dateOfBirth) : '',
      surgeryCase.presentingComplaint,
      surgeryCase.notes,
      '', // Discharge Notes is a text field, not a boolean
      surgeryCase.checklist.pdvmNotified ? 'TRUE' : 'FALSE',
      surgeryCase.checklist.labs ? 'TRUE' : 'FALSE',
      surgeryCase.checklist.histo ? 'TRUE' : 'FALSE',
      surgeryCase.checklist.surgeryReport ? 'TRUE' : 'FALSE',
      surgeryCase.checklist.imaging ? 'TRUE' : 'FALSE',
      surgeryCase.checklist.culture ? 'TRUE' : 'FALSE',
    ]);
  }

  const csvContent = rows.map((row) => row.map((cell) => escapeCsvField(cell)).join(',')).join('\n');
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

function formatDateToMDY(date: Date | bigint): string {
  let dateObj: Date;
  
  if (typeof date === 'bigint') {
    dateObj = new Date(Number(date / BigInt(1_000_000)));
  } else {
    dateObj = date;
  }
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }
  
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  
  return `${month}/${day}/${year}`;
}

function formatSpeciesLabel(species: Species): string {
  switch (species) {
    case 'canine':
      return 'canine';
    case 'feline':
      return 'feline';
    case 'other':
      return 'other';
    default:
      return 'canine';
  }
}

function formatSexLabel(sex: Sex): string {
  switch (sex) {
    case 'male':
      return 'male';
    case 'maleNeutered':
      return 'maleNeutered';
    case 'female':
      return 'female';
    case 'femaleSpayed':
      return 'femaleSpayed';
    default:
      return 'male';
  }
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
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
      checklist: Checklist;
    };
    existingCase?: SurgeryCase;
  }>;
  errors: ImportError[];
}

export async function importCasesFromCsv(file: File, existingCases: SurgeryCase[]): Promise<ImportResult> {
  console.log('[CSV Import] Starting import process', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    existingCasesCount: existingCases.length,
    timestamp: new Date().toISOString(),
  });

  const text = await file.text();
  console.log('[CSV Import] File read successfully', {
    textLength: text.length,
    timestamp: new Date().toISOString(),
  });

  const lines = text.split('\n').filter((line) => line.trim());

  if (lines.length === 0) {
    console.error('[CSV Import] CSV file is empty');
    throw new Error('CSV file is empty');
  }

  console.log('[CSV Import] File parsed into lines', {
    totalLines: lines.length,
    dataRows: lines.length - 1,
    timestamp: new Date().toISOString(),
  });

  const result: ImportResult = {
    cases: [],
    errors: [],
  };

  const headers = parseCsvLine(lines[0]);
  console.log('[CSV Import] Headers parsed', {
    headers,
    headerCount: headers.length,
    expectedCount: CSV_HEADERS.length,
    timestamp: new Date().toISOString(),
  });

  // Validate headers
  const missingHeaders = Array.from(CSV_HEADERS).filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    console.warn('[CSV Import] Missing expected headers', { missingHeaders });
  }

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    console.log(`[CSV Import] Processing row ${lineNumber}/${lines.length}`);

    const values = parseCsvLine(lines[i]);
    if (values.length === 0 || values.every((v) => !v.trim())) {
      console.log(`[CSV Import] Skipping empty row ${lineNumber}`);
      continue;
    }

    const row: Partial<CsvRow> = {};
    headers.forEach((header, index) => {
      row[header as keyof CsvRow] = values[index] || '';
    });

    console.log(`[CSV Import] Row ${lineNumber} data:`, {
      medicalRecordNumber: row['Medical Record #'],
      arrivalDate: row['Arrival Date'],
      petName: row['Pet Name'],
      species: row['Species'],
      sex: row['Sex'],
      checklistRaw: {
        pdvmNotified: row['pDVM Notified'],
        labs: row['Labs'],
        histo: row['Histo'],
        surgeryReport: row['Surgery Report'],
        imaging: row['Imaging'],
        culture: row['Culture'],
      }
    });

    try {
      // Validate Medical Record Number
      const medicalRecordNumber = row['Medical Record #']?.trim() || '';
      if (!medicalRecordNumber) {
        const error = { row: lineNumber, field: 'Medical Record #', message: 'Required field is missing' };
        result.errors.push(error);
        console.error(`[CSV Import] Row ${lineNumber} validation error:`, error);
        continue;
      }

      // Validate Pet Name
      const petName = row['Pet Name']?.trim() || '';
      if (!petName) {
        const error = { row: lineNumber, field: 'Pet Name', message: 'Required field is missing' };
        result.errors.push(error);
        console.error(`[CSV Import] Row ${lineNumber} validation error:`, error);
        continue;
      }

      // Validate Owner Last Name
      const ownerLastName = row['Owner Last Name']?.trim() || '';
      if (!ownerLastName) {
        const error = { row: lineNumber, field: 'Owner Last Name', message: 'Required field is missing' };
        result.errors.push(error);
        console.error(`[CSV Import] Row ${lineNumber} validation error:`, error);
        continue;
      }

      // Validate Species
      const speciesValue = row['Species']?.trim().toLowerCase() || 'canine';
      const species = validateSpecies(speciesValue);
      if (!species) {
        const error = { row: lineNumber, field: 'Species', message: `Invalid species: ${speciesValue}`, value: speciesValue };
        result.errors.push(error);
        console.error(`[CSV Import] Row ${lineNumber} validation error:`, error);
        continue;
      }

      // Validate Breed
      const breed = row['Breed']?.trim() || '';
      if (!breed) {
        const error = { row: lineNumber, field: 'Breed', message: 'Required field is missing' };
        result.errors.push(error);
        console.error(`[CSV Import] Row ${lineNumber} validation error:`, error);
        continue;
      }

      // Validate Sex
      const sexValue = row['Sex']?.trim().toLowerCase().replace(/\s+/g, '') || 'male';
      const sex = validateSex(sexValue);
      if (!sex) {
        const error = { row: lineNumber, field: 'Sex', message: `Invalid sex: ${sexValue}`, value: sexValue };
        result.errors.push(error);
        console.error(`[CSV Import] Row ${lineNumber} validation error:`, error);
        continue;
      }

      // Parse Date of Birth (optional)
      let dateOfBirth: bigint | null = null;
      const dobString = row['Date of Birth']?.trim();
      if (dobString) {
        const dobDate = parseMDYDate(dobString);
        if (dobDate) {
          dateOfBirth = dateToNanoseconds(dobDate);
          console.log(`[CSV Import] Row ${lineNumber} DOB parsed:`, { dobString, dobDate });
        } else {
          console.warn(`[CSV Import] Row ${lineNumber} DOB parsing failed:`, { dobString });
        }
      }

      // Parse Arrival Date (required)
      const arrivalDateString = row['Arrival Date']?.trim();
      if (!arrivalDateString) {
        const error = { row: lineNumber, field: 'Arrival Date', message: 'Required field is missing' };
        result.errors.push(error);
        console.error(`[CSV Import] Row ${lineNumber} validation error:`, error);
        continue;
      }

      const arrivalDate = parseMDYDate(arrivalDateString);
      if (!arrivalDate) {
        const error = { 
          row: lineNumber, 
          field: 'Arrival Date', 
          message: `Invalid date format: ${arrivalDateString}. Expected M/D/YYYY format.`,
          value: arrivalDateString
        };
        result.errors.push(error);
        console.error(`[CSV Import] Row ${lineNumber} validation error:`, error);
        continue;
      }

      const arrivalDateNs = dateToNanoseconds(arrivalDate);
      console.log(`[CSV Import] Row ${lineNumber} arrival date parsed:`, { arrivalDateString, arrivalDate, arrivalDateNs: arrivalDateNs.toString() });

      // Parse other fields
      const presentingComplaint = row['Presenting Complaint']?.trim() || '';
      const notes = row['Notes']?.trim() || '';
      const dischargeNotesText = row['Discharge Notes']?.trim() || '';

      // Parse checklist - CRITICAL: Extract each CSV column value into its own variable
      // to ensure proper independent parsing for each case
      const pdvmNotifiedRaw = row['pDVM Notified'] || '';
      const labsRaw = row['Labs'] || '';
      const histoRaw = row['Histo'] || '';
      const surgeryReportRaw = row['Surgery Report'] || '';
      const imagingRaw = row['Imaging'] || '';
      const cultureRaw = row['Culture'] || '';

      // Parse each boolean field independently
      const pdvmNotified = parseBool(pdvmNotifiedRaw);
      const labs = parseBool(labsRaw);
      const histo = parseBool(histoRaw);
      const surgeryReport = parseBool(surgeryReportRaw);
      const imaging = parseBool(imagingRaw);
      const culture = parseBool(cultureRaw);

      // Create a fresh checklist object for this specific case
      const checklist: Checklist = {
        dischargeNotes: false, // Always false - this is not a boolean field in the CSV
        pdvmNotified: pdvmNotified,
        labs: labs,
        histo: histo,
        surgeryReport: surgeryReport,
        imaging: imaging,
        culture: culture,
      };

      console.log(`[CSV Import] Row ${lineNumber} checklist parsed:`, {
        raw: {
          pdvmNotified: pdvmNotifiedRaw,
          labs: labsRaw,
          histo: histoRaw,
          surgeryReport: surgeryReportRaw,
          imaging: imagingRaw,
          culture: cultureRaw,
        },
        parsed: checklist,
      });

      // Check for existing case
      const existingCase = existingCases.find(
        (c) =>
          c.medicalRecordNumber === medicalRecordNumber &&
          formatDateToMDY(c.arrivalDate) === formatDateToMDY(arrivalDateNs)
      );

      if (existingCase) {
        console.log(`[CSV Import] Row ${lineNumber} matches existing case:`, { caseId: existingCase.id });
      } else {
        console.log(`[CSV Import] Row ${lineNumber} is a new case`);
      }

      result.cases.push({
        data: {
          medicalRecordNumber,
          arrivalDate: arrivalDateNs,
          petName,
          ownerLastName,
          species,
          breed,
          sex,
          dateOfBirth,
          presentingComplaint,
          notes: notes || dischargeNotesText, // Use discharge notes as notes if notes is empty
          checklist,
        },
        existingCase,
      });

      console.log(`[CSV Import] Row ${lineNumber} successfully parsed and added to import queue`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const importError = {
        row: lineNumber,
        field: 'general',
        message: errorMessage,
      };
      result.errors.push(importError);
      console.error(`[CSV Import] Row ${lineNumber} unexpected error:`, {
        error,
        errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  console.log('[CSV Import] Parsing complete', {
    totalRows: lines.length - 1,
    successfullyParsed: result.cases.length,
    errors: result.errors.length,
    timestamp: new Date().toISOString(),
  });

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
  if (!value) {
    console.log('[parseBool] Empty/undefined value, returning false');
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    console.log('[parseBool] Empty trimmed value, returning false');
    return false;
  }
  const lower = trimmed.toLowerCase();
  // Handle TRUE/FALSE, YES/NO, 1/0, X (as true), and empty/NO/FALSE (as false)
  const result = lower === 'true' || lower === '1' || lower === 'yes' || lower === 'x';
  console.log('[parseBool] Parsing:', { original: value, trimmed, lower, result });
  return result;
}

function parseMDYDate(dateString: string): Date | null {
  if (!dateString || !dateString.trim()) return null;
  
  const trimmed = dateString.trim();
  
  console.log('[CSV Date Parser] Attempting to parse:', trimmed);
  
  // Parse M/D/YYYY format (e.g., "2/4/2026", "10/15/2025")
  const mdyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    const yearNum = parseInt(year, 10);
    
    console.log('[CSV Date Parser] MDY match found:', { month: monthNum, day: dayNum, year: yearNum });
    
    // Validate month and day ranges
    if (monthNum < 1 || monthNum > 12) {
      console.error('[CSV Date Parser] Invalid month:', monthNum);
      return null;
    }
    if (dayNum < 1 || dayNum > 31) {
      console.error('[CSV Date Parser] Invalid day:', dayNum);
      return null;
    }
    
    const date = new Date(yearNum, monthNum - 1, dayNum);
    
    // Verify the date is valid (handles invalid dates like Feb 31)
    if (date.getFullYear() === yearNum && 
        date.getMonth() === monthNum - 1 && 
        date.getDate() === dayNum) {
      console.log('[CSV Date Parser] Valid date created:', date);
      return date;
    } else {
      console.error('[CSV Date Parser] Date validation failed:', { created: date, expected: { yearNum, monthNum, dayNum } });
    }
  }
  
  console.error('[CSV Date Parser] No valid format matched');
  return null;
}
