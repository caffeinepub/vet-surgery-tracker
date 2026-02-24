import { Species, Sex } from '@/backend';

/**
 * Validates a medical record number
 */
export function validateMedicalRecordNumber(mrn: string): string | null {
  if (!mrn || mrn.trim().length === 0) {
    return 'Medical Record Number is required';
  }
  if (mrn.trim().length < 2) {
    return 'Medical Record Number must be at least 2 characters';
  }
  return null;
}

/**
 * Validates a pet name
 */
export function validatePetName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Pet Name is required';
  }
  if (name.trim().length < 2) {
    return 'Pet Name must be at least 2 characters';
  }
  return null;
}

/**
 * Validates an owner last name
 */
export function validateOwnerLastName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Owner Last Name is required';
  }
  if (name.trim().length < 2) {
    return 'Owner Last Name must be at least 2 characters';
  }
  return null;
}

/**
 * Validates a breed
 */
export function validateBreed(breed: string): string | null {
  if (!breed || breed.trim().length === 0) {
    return 'Breed is required';
  }
  if (breed.trim().length < 2) {
    return 'Breed must be at least 2 characters';
  }
  return null;
}

/**
 * Converts a Date object to nanoseconds (Time type for backend)
 */
export function dateToNanoseconds(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

/**
 * Converts nanoseconds (Time type from backend) to a Date object
 */
export function nanosecondsToDate(nanoseconds: bigint): Date {
  return new Date(Number(nanoseconds / BigInt(1_000_000)));
}

/**
 * Parses a date string in MM/DD/YYYY format
 * Returns null if the date is invalid
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim().length === 0) {
    return null;
  }

  // Try MM/DD/YYYY format first (prioritized for CSV imports)
  const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Validate the date is real
    if (
      !isNaN(date.getTime()) &&
      date.getMonth() === parseInt(month) - 1 &&
      date.getDate() === parseInt(day)
    ) {
      console.log('[parseDate] Successfully parsed MM/DD/YYYY format', {
        input: dateStr,
        output: date.toISOString(),
      });
      return date;
    }
  }

  // Try M/D/YYYY format (single digit month/day)
  const usShortMatch = dateStr.match(/^(\d{1})\/(\d{1})\/(\d{4})$/);
  if (usShortMatch) {
    const [, month, day, year] = usShortMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (
      !isNaN(date.getTime()) &&
      date.getMonth() === parseInt(month) - 1 &&
      date.getDate() === parseInt(day)
    ) {
      console.log('[parseDate] Successfully parsed M/D/YYYY format', {
        input: dateStr,
        output: date.toISOString(),
      });
      return date;
    }
  }

  // Try ISO format (YYYY-MM-DD)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (
      !isNaN(date.getTime()) &&
      date.getMonth() === parseInt(month) - 1 &&
      date.getDate() === parseInt(day)
    ) {
      console.log('[parseDate] Successfully parsed ISO format', {
        input: dateStr,
        output: date.toISOString(),
      });
      return date;
    }
  }

  console.warn('[parseDate] Failed to parse date string', { dateStr });
  return null;
}

/**
 * Formats a Date object as MM/DD/YYYY
 */
export function formatDate(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Parses a species string and returns the corresponding Species enum value
 */
export function parseSpecies(value: string): Species | null {
  const normalized = value.toLowerCase().trim();
  
  if (normalized === 'canine' || normalized === 'dog') {
    return Species.canine;
  }
  if (normalized === 'feline' || normalized === 'cat') {
    return Species.feline;
  }
  if (normalized === 'other' || normalized === 'exotic' || normalized === 'avian') {
    return Species.other;
  }
  
  console.warn('[parseSpecies] Unknown species value', { value });
  return null;
}

/**
 * Parses a sex string and returns the corresponding Sex enum value
 */
export function parseSex(value: string): Sex | null {
  const normalized = value.toLowerCase().trim();
  
  if (normalized === 'male' || normalized === 'm' || normalized === 'intact male') {
    return Sex.male;
  }
  if (normalized === 'male neutered' || normalized === 'neutered male' || normalized === 'mn' || normalized === 'neutered' || normalized === 'castrated') {
    return Sex.maleNeutered;
  }
  if (normalized === 'female' || normalized === 'f' || normalized === 'intact female') {
    return Sex.female;
  }
  if (normalized === 'female spayed' || normalized === 'spayed female' || normalized === 'fs' || normalized === 'spayed') {
    return Sex.femaleSpayed;
  }
  
  console.warn('[parseSex] Unknown sex value', { value });
  return null;
}

/**
 * Parses a boolean value from various string formats
 * Used for CSV imports
 */
export function parseBoolean(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  
  // TRUE values
  if (normalized === 'true' || normalized === 'yes' || normalized === 'x' || normalized === '1') {
    return true;
  }
  
  // FALSE values
  if (normalized === 'false' || normalized === 'no' || normalized === '' || normalized === '0') {
    return false;
  }
  
  console.warn('[parseBoolean] Ambiguous boolean value, defaulting to false', { value });
  return false;
}

/**
 * Converts a Species enum to a human-readable label
 */
export function speciesLabel(species: Species): string {
  switch (species) {
    case Species.canine:
      return 'Canine';
    case Species.feline:
      return 'Feline';
    case Species.other:
      return 'Other';
    default:
      return 'Unknown';
  }
}

/**
 * Converts a Sex enum to a human-readable label
 */
export function sexLabel(sex: Sex): string {
  switch (sex) {
    case Sex.male:
      return 'Male';
    case Sex.maleNeutered:
      return 'Male Neutered';
    case Sex.female:
      return 'Female';
    case Sex.femaleSpayed:
      return 'Female Spayed';
    default:
      return 'Unknown';
  }
}
