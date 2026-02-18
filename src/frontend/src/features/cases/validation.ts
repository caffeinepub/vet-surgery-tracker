import { Species, Sex } from '../../backend';

export function validateMedicalRecordNumber(value: string): string | null {
  if (!value.trim()) {
    return 'Medical Record # is required';
  }
  return null;
}

export function validatePetName(value: string): string | null {
  if (!value.trim()) {
    return 'Pet Name is required';
  }
  return null;
}

export function validateOwnerLastName(value: string): string | null {
  if (!value.trim()) {
    return 'Owner Last Name is required';
  }
  return null;
}

export function validateBreed(value: string): string | null {
  if (!value.trim()) {
    return 'Breed is required';
  }
  return null;
}

export function parseSpecies(value: string): Species | null {
  const normalized = value.trim().toLowerCase();
  
  // Direct matches
  if (normalized === 'canine' || normalized === 'dog' || normalized === 'dogs') {
    return Species.canine;
  }
  if (normalized === 'feline' || normalized === 'cat' || normalized === 'cats') {
    return Species.feline;
  }
  if (normalized === 'other') {
    return Species.other;
  }
  
  // Partial matches
  if (normalized.includes('dog') || normalized.includes('canine')) {
    return Species.canine;
  }
  if (normalized.includes('cat') || normalized.includes('feline')) {
    return Species.feline;
  }
  
  return null;
}

export function validateSpecies(value: string): Species | null {
  return parseSpecies(value);
}

export function parseSex(value: string): Sex | null {
  const normalized = value.trim().toLowerCase().replace(/[\s\-_()]/g, '');
  
  // Direct matches
  if (normalized === 'male' || normalized === 'm') {
    return Sex.male;
  }
  if (normalized === 'maleneutered' || normalized === 'mn' || normalized === 'neutered' || normalized === 'castrated') {
    return Sex.maleNeutered;
  }
  if (normalized === 'female' || normalized === 'f') {
    return Sex.female;
  }
  if (normalized === 'femalespayed' || normalized === 'fs' || normalized === 'spayed') {
    return Sex.femaleSpayed;
  }
  
  // Partial matches
  if (normalized.includes('neutered') || normalized.includes('castrated')) {
    return Sex.maleNeutered;
  }
  if (normalized.includes('spayed')) {
    return Sex.femaleSpayed;
  }
  if (normalized.includes('male') && !normalized.includes('female')) {
    return Sex.male;
  }
  if (normalized.includes('female')) {
    return Sex.female;
  }
  
  return null;
}

export function validateSex(value: string): Sex | null {
  return parseSex(value);
}

export function validateDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  if (isNaN(value.getTime())) {
    return 'Invalid date';
  }
  return null;
}

export function parseDateString(value: string): Date | null {
  if (!value || !value.trim()) return null;
  
  const trimmed = value.trim();
  
  // Try ISO format first (YYYY-MM-DD)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime()) && date.getFullYear() === parseInt(year)) {
      return date;
    }
  }
  
  // Try slash-separated formats (MM/DD/YYYY or DD/MM/YYYY)
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, first, second, year] = slashMatch;
    const firstNum = parseInt(first);
    const secondNum = parseInt(second);
    const yearNum = parseInt(year);
    
    // Try US format (MM/DD/YYYY) first if first number could be a valid month
    if (firstNum >= 1 && firstNum <= 12) {
      const usDate = new Date(yearNum, firstNum - 1, secondNum);
      if (!isNaN(usDate.getTime()) && 
          usDate.getFullYear() === yearNum && 
          usDate.getMonth() === firstNum - 1 && 
          usDate.getDate() === secondNum) {
        return usDate;
      }
    }
    
    // Try EU format (DD/MM/YYYY) if US format failed or first number is > 12
    if (secondNum >= 1 && secondNum <= 12) {
      const euDate = new Date(yearNum, secondNum - 1, firstNum);
      if (!isNaN(euDate.getTime()) && 
          euDate.getFullYear() === yearNum && 
          euDate.getMonth() === secondNum - 1 && 
          euDate.getDate() === firstNum) {
        return euDate;
      }
    }
  }
  
  // Try natural language parsing as last resort (e.g., "January 15, 2024")
  const naturalDate = new Date(trimmed);
  if (!isNaN(naturalDate.getTime())) {
    return naturalDate;
  }
  
  return null;
}

export function parseDate(value: string): Date | null {
  return parseDateString(value);
}

export function formatDate(date: Date | bigint | null): string {
  if (!date) return '';
  
  if (typeof date === 'bigint') {
    date = nanosecondsToDate(date);
  }
  
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function calculateAge(dateOfBirth: Date | bigint): string {
  let birthDate: Date;
  
  if (typeof dateOfBirth === 'bigint') {
    birthDate = nanosecondsToDate(dateOfBirth);
  } else {
    birthDate = dateOfBirth;
  }
  
  if (!(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
    return 'Unknown';
  }
  
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // Adjust if the day hasn't occurred yet this month
  if (today.getDate() < birthDate.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  
  if (years === 0 && months === 0) {
    return 'Less than 1 month';
  } else if (years === 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  } else if (months === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } else {
    return `${years} ${years === 1 ? 'year' : 'years'}, ${months} ${months === 1 ? 'month' : 'months'}`;
  }
}

export function dateToNanoseconds(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

export function nanosecondsToDate(nanoseconds: bigint): Date {
  return new Date(Number(nanoseconds / BigInt(1_000_000)));
}

export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/[\s\-_()]/g, '');
}

export function extractPattern(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
}
