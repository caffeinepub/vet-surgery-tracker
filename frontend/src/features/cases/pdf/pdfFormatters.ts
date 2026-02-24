import type { Species, Sex, Time } from '../../../backend';

/**
 * Formats a Time (bigint nanoseconds) to MM/DD/YYYY string for PDF display
 */
export function formatDateForPdf(time: Time): string {
  if (!time || time === 0n) {
    return 'Unknown';
  }
  
  try {
    // Convert nanoseconds to milliseconds
    const milliseconds = Number(time / 1_000_000n);
    const date = new Date(milliseconds);
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error('Error formatting date for PDF:', error);
    return 'Invalid Date';
  }
}

/**
 * Converts Species enum to readable text for PDF display
 */
export function formatSpeciesForPdf(species: Species): string {
  switch (species) {
    case 'canine':
      return 'Canine';
    case 'feline':
      return 'Feline';
    case 'other':
      return 'Other';
    default:
      return 'Unknown';
  }
}

/**
 * Converts Sex enum to readable text for PDF display
 */
export function formatSexForPdf(sex: Sex): string {
  switch (sex) {
    case 'male':
      return 'Male';
    case 'maleNeutered':
      return 'Male (Neutered)';
    case 'female':
      return 'Female';
    case 'femaleSpayed':
      return 'Female (Spayed)';
    default:
      return 'Unknown';
  }
}

/**
 * Truncates text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formats remaining tasks list for PDF display
 */
export function formatRemainingTasksForPdf(taskLabels: string[]): string {
  if (taskLabels.length === 0) {
    return 'All tasks completed';
  }
  return taskLabels.join(', ');
}
