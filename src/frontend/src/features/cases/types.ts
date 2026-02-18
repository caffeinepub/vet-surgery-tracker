import type { Species, Sex } from '../../backend';

export const SPECIES_OPTIONS = [
  { value: 'canine', label: 'Canine' },
  { value: 'feline', label: 'Feline' },
  { value: 'other', label: 'Other' },
] as const;

export const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'maleNeutered', label: 'Male (Neutered)' },
  { value: 'female', label: 'Female' },
  { value: 'femaleSpayed', label: 'Female (Spayed)' },
] as const;

export interface CaseFormData {
  medicalRecordNumber: string;
  arrivalDate: Date | null;
  petName: string;
  ownerLastName: string;
  species: Species;
  breed: string;
  sex: Sex;
  dateOfBirth: Date | null;
  presentingComplaint: string;
  notes: string;
}
