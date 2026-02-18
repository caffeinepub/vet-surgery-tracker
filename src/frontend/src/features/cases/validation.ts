import type { Species, Sex } from '../../backend';

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

export function validateSpecies(value: string): Species | null {
  if (value === 'canine' || value === 'feline' || value === 'other') {
    return value as Species;
  }
  return null;
}

export function validateSex(value: string): Sex | null {
  if (value === 'male' || value === 'maleNeutered' || value === 'female' || value === 'femaleSpayed') {
    return value as Sex;
  }
  return null;
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

export function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function formatDate(date: Date | bigint | null): string {
  if (!date) return '';
  
  if (typeof date === 'bigint') {
    const milliseconds = Number(date / BigInt(1000000));
    date = new Date(milliseconds);
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function dateToNanoseconds(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1000000);
}

export function nanosecondsToDate(ns: bigint): Date {
  return new Date(Number(ns / BigInt(1000000)));
}

export function calculateAge(dateOfBirth: Date | bigint | null): string {
  if (!dateOfBirth) return '';
  
  let birthDate: Date;
  if (typeof dateOfBirth === 'bigint') {
    birthDate = nanosecondsToDate(dateOfBirth);
  } else {
    birthDate = dateOfBirth;
  }
  
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
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
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  } else {
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
  }
}
