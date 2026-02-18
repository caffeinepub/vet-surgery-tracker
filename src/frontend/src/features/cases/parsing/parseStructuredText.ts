import { parseSpecies, parseSex, parseDateString } from '../validation';
import type { CaseFormData } from '../types';

/**
 * Parses structured text containing case information in label:value format
 * and returns a partial CaseFormData object with successfully extracted fields.
 * 
 * Expected format:
 * MRN: 12345
 * Arrival date: 2/18/2026
 * Pet Name: Buddy
 * Owner name: Smith
 * Species: Canine
 * Sex: Male Neutered
 * Breed: Golden Retriever
 * DOB: 1/15/2016
 * Surgery Date: 2/18/2026
 * Presenting Complaint: Torn ACL
 */
export function parseStructuredText(text: string): Partial<CaseFormData> {
  const result: Partial<CaseFormData> = {};
  
  if (!text || !text.trim()) {
    return result;
  }

  // Helper function to escape special regex characters
  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Helper function to extract value after a label
  const extractValue = (label: string): string | null => {
    // Escape special regex characters in the label
    const escapedLabel = escapeRegex(label);
    // Create regex that matches the label followed by colon and captures the value
    // Handles variations in spacing around the colon
    const regex = new RegExp(`${escapedLabel}\\s*:\\s*(.+?)(?=\\n|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  // Helper function to try multiple label variations
  const extractValueWithVariations = (labels: string[]): string | null => {
    for (const label of labels) {
      const value = extractValue(label);
      if (value) return value;
    }
    return null;
  };

  // Extract Medical Record Number
  const mrn = extractValue('MRN');
  if (mrn) {
    result.medicalRecordNumber = mrn;
  }

  // Extract Arrival Date
  const arrivalDateStr = extractValue('Arrival date');
  if (arrivalDateStr) {
    const arrivalDate = parseDateString(arrivalDateStr);
    if (arrivalDate) {
      result.arrivalDate = arrivalDate;
    }
  }

  // Extract Pet Name
  const petName = extractValue('Pet Name');
  if (petName) {
    result.petName = petName;
  }

  // Extract Owner Last Name
  const ownerName = extractValue('Owner name');
  if (ownerName) {
    result.ownerLastName = ownerName;
  }

  // Extract Species
  const speciesStr = extractValue('Species');
  if (speciesStr) {
    const species = parseSpecies(speciesStr);
    if (species) {
      result.species = species;
    }
  }

  // Extract Sex
  const sexStr = extractValue('Sex');
  if (sexStr) {
    const sex = parseSex(sexStr);
    if (sex) {
      result.sex = sex;
    }
  }

  // Extract Breed
  const breed = extractValue('Breed');
  if (breed) {
    result.breed = breed;
  }

  // Extract Date of Birth - try multiple label variations
  const dobStr = extractValueWithVariations([
    'DOB',
    'D.O.B.',
    'D.O.B',
    'Date of Birth',
    'Birth Date',
    'Birthdate',
    'Birthday',
    'Born'
  ]);
  if (dobStr) {
    const dob = parseDateString(dobStr);
    if (dob) {
      result.dateOfBirth = dob;
    }
  }

  // Extract Presenting Complaint
  const complaint = extractValue('Presenting Complaint');
  if (complaint) {
    result.presentingComplaint = complaint;
  }

  // Note: Surgery Date is not part of the case form, so we don't extract it
  // Note: AGE is not extracted as we have DOB instead

  return result;
}
