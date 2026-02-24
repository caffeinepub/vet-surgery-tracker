/**
 * CSV Schema for Veterinary Surgery Case Import/Export
 * 
 * Expected Format: 17 columns in the following order
 * 
 * Column Descriptions:
 * 1. Medical Record # - Unique identifier (required, text)
 * 2. Arrival Date - Date case arrived (required, M/D/YYYY format, e.g., "2/4/2026")
 * 3. Pet Name - Name of the animal (required, text)
 * 4. Owner Last Name - Last name of the owner (required, text)
 * 5. Species - Animal species (required, text: "canine", "feline", or "other")
 * 6. Breed - Breed of the animal (required, text)
 * 7. Sex - Sex/neuter status (required, text: "male", "maleNeutered", "female", "femaleSpayed")
 * 8. Date of Birth - Birth date (optional, M/D/YYYY format)
 * 9. Presenting Complaint - Chief complaint (optional, text)
 * 10. Notes - Case notes (optional, text)
 * 11. Discharge Notes - Additional notes (optional, text, not a checklist item)
 * 12. pDVM Notified - Checklist item (boolean: TRUE/FALSE, true/false, 1/0, yes/no, X for true)
 * 13. Labs - Checklist item (boolean: TRUE/FALSE, true/false, 1/0, yes/no, X for true)
 * 14. Histo - Checklist item (boolean: TRUE/FALSE, true/false, 1/0, yes/no, X for true)
 * 15. Surgery Report - Checklist item (boolean: TRUE/FALSE, true/false, 1/0, yes/no, X for true)
 * 16. Imaging - Checklist item (boolean: TRUE/FALSE, true/false, 1/0, yes/no, X for true)
 * 17. Culture - Checklist item (boolean: TRUE/FALSE, true/false, 1/0, yes/no, X for true)
 * 
 * Date Format: M/D/YYYY (e.g., 2/4/2026, 10/15/2025)
 * Boolean Format: TRUE/FALSE (case-insensitive), 1/0, yes/no, X (for true), empty/NO/FALSE (for false)
 * Species Values: canine, feline, other (case-insensitive)
 * Sex Values: male, maleNeutered, female, femaleSpayed (case-insensitive, spaces removed)
 * 
 * Checklist Field Mapping (CSV column → Backend field):
 * - "pDVM Notified" → pdvmNotified
 * - "Labs" → labs
 * - "Histo" → histo
 * - "Surgery Report" → surgeryReport
 * - "Imaging" → imaging
 * - "Culture" → culture
 * - "Discharge Notes" (text field) → dischargeNotes (always false in checklist, text goes to notes)
 */

export const CSV_HEADERS = [
  'Medical Record #',
  'Arrival Date',
  'Pet Name',
  'Owner Last Name',
  'Species',
  'Breed',
  'Sex',
  'Date of Birth',
  'Presenting Complaint',
  'Notes',
  'Discharge Notes',
  'pDVM Notified',
  'Labs',
  'Histo',
  'Surgery Report',
  'Imaging',
  'Culture',
] as const;

export type CsvRow = {
  'Medical Record #': string;
  'Arrival Date': string;
  'Pet Name': string;
  'Owner Last Name': string;
  'Species': string;
  'Breed': string;
  'Sex': string;
  'Date of Birth': string;
  'Presenting Complaint': string;
  'Notes': string;
  'Discharge Notes': string;
  'pDVM Notified': string;
  'Labs': string;
  'Histo': string;
  'Surgery Report': string;
  'Imaging': string;
  'Culture': string;
};

// Validation constants
export const VALID_SPECIES = ['canine', 'feline', 'other'] as const;
export const VALID_SEX = ['male', 'maleNeutered', 'female', 'femaleSpayed'] as const;
export const VALID_BOOLEAN_VALUES = ['true', 'false', '1', '0', 'yes', 'no', 'x'] as const;

// Date format regex
export const DATE_FORMAT_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
