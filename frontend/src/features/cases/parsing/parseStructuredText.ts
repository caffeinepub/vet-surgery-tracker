import type { CaseFormData } from '../types';
import { parseSpecies, parseSex } from '../validation';
import { Species, Sex } from '@/backend';

/**
 * Parses structured text containing case information in label:value format
 * and returns a partial CaseFormData object with successfully extracted fields.
 *
 * Strategy: split into lines and match each line against known field labels.
 * This prevents values from bleeding across line boundaries.
 */
export function parseStructuredText(text: string): Partial<CaseFormData> {
  console.log('[parseStructuredText] Starting parse operation', {
    textLength: text.length,
    timestamp: new Date().toISOString(),
  });

  const result: Partial<CaseFormData> = {};

  // Split into lines and process each one
  const lines = text.split(/\r?\n/);

  let matchCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Each line is expected to be "Label: Value" or "Label Value"
    // We try to split on the first colon
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const labelRaw = line.substring(0, colonIdx).trim().toLowerCase();
    const valueRaw = line.substring(colonIdx + 1).trim();

    if (!valueRaw) continue;

    // Determine which field this label maps to
    const field = resolveFieldLabel(labelRaw);
    if (!field) continue;

    console.log('[parseStructuredText] Field matched', { field, labelRaw, valueRaw });

    try {
      if (field === 'species') {
        const parsed = parseSpeciesWithVoiceVariations(valueRaw);
        if (parsed) {
          result.species = parsed;
          matchCount++;
          console.log('[parseStructuredText] Species parsed', { valueRaw, parsed });
        }
      } else if (field === 'sex') {
        const parsed = parseSexWithVoiceVariations(valueRaw);
        if (parsed) {
          result.sex = parsed;
          matchCount++;
          console.log('[parseStructuredText] Sex parsed', { valueRaw, parsed });
        }
      } else if (field === 'arrivalDate' || field === 'dateOfBirth') {
        const parsed = parseDate(valueRaw);
        if (parsed) {
          result[field] = parsed;
          matchCount++;
          console.log('[parseStructuredText] Date parsed', {
            field,
            valueRaw,
            parsed: parsed.toISOString(),
          });
        } else {
          console.warn('[parseStructuredText] Date parsing failed', { field, valueRaw });
        }
      } else {
        // String fields — capitalize properly, use only the value on this line
        const capitalizedValue = capitalizeWords(valueRaw);
        result[field as keyof CaseFormData] = capitalizedValue as any;
        matchCount++;
      }
    } catch (error) {
      console.error('[parseStructuredText] Error parsing field', { field, valueRaw, error });
    }
  }

  console.log('[parseStructuredText] Parse complete', {
    matchCount,
    fields: Object.keys(result),
    timestamp: new Date().toISOString(),
  });

  return result;
}

/**
 * Maps a normalized label string to a CaseFormData field key.
 * Returns null if the label is not recognized.
 */
function resolveFieldLabel(label: string): keyof CaseFormData | null {
  const normalized = label.toLowerCase().replace(/\s+/g, ' ').trim();

  // Medical Record Number
  if (
    normalized === 'mrn' ||
    normalized === 'medical record number' ||
    normalized === 'medical record' ||
    normalized === 'record number' ||
    normalized === 'record no' ||
    normalized === 'record #'
  ) {
    return 'medicalRecordNumber';
  }

  // Arrival Date
  if (
    normalized === 'arrival date' ||
    normalized === 'admission date' ||
    normalized === 'admit date' ||
    normalized === 'date of arrival' ||
    normalized === 'arrived on'
  ) {
    return 'arrivalDate';
  }

  // Pet Name
  if (
    normalized === 'pet name' ||
    normalized === 'patient name' ||
    normalized === 'animal name' ||
    normalized === 'pet'
  ) {
    return 'petName';
  }

  // Owner Last Name
  if (
    normalized === 'owner name' ||
    normalized === 'owner last name' ||
    normalized === 'owner' ||
    normalized === 'last name' ||
    normalized === 'surname'
  ) {
    return 'ownerLastName';
  }

  // Species
  if (normalized === 'species') {
    return 'species';
  }

  // Breed
  if (normalized === 'breed') {
    return 'breed';
  }

  // Sex / Gender
  if (normalized === 'sex' || normalized === 'gender') {
    return 'sex';
  }

  // Date of Birth
  if (
    normalized === 'date of birth' ||
    normalized === 'dob' ||
    normalized === 'birth date' ||
    normalized === 'birthday' ||
    normalized === 'born on' ||
    normalized === 'date of birth '
  ) {
    return 'dateOfBirth';
  }

  // Presenting Complaint
  if (
    normalized === 'presenting complaint' ||
    normalized === 'chief complaint' ||
    normalized === 'complaint' ||
    normalized === 'reason for visit' ||
    normalized === 'presenting'
  ) {
    return 'presentingComplaint';
  }

  // Notes
  if (normalized === 'notes' || normalized === 'note' || normalized === 'additional notes') {
    return 'notes';
  }

  return null;
}

/**
 * Capitalizes words in a string
 */
function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Enhanced species parser with voice dictation variations
 */
function parseSpeciesWithVoiceVariations(value: string): Species | null {
  const normalized = value.toLowerCase().trim();

  if (normalized.match(/\b(canine|dog|dogs)\b/)) {
    return Species.canine;
  }
  if (normalized.match(/\b(feline|cat|cats)\b/)) {
    return Species.feline;
  }
  if (normalized.match(/\b(other|exotic|bird|reptile|rabbit|ferret|avian)\b/)) {
    return Species.other;
  }

  // Fallback to existing parser
  return parseSpecies(value);
}

/**
 * Enhanced sex parser with voice dictation variations.
 * Handles multi-word values like "Neutered Male", "Spayed Female",
 * "Intact Male", "Intact Female".
 */
function parseSexWithVoiceVariations(value: string): Sex | null {
  const normalized = value.toLowerCase().trim();

  // Check for neutered/castrated male first (most specific)
  if (normalized.match(/\b(male\s*neutered|neutered\s*male|neutered|castrated|mn)\b/)) {
    return Sex.maleNeutered;
  }

  // Check for spayed female (most specific)
  if (normalized.match(/\b(female\s*spayed|spayed\s*female|spayed|fs)\b/)) {
    return Sex.femaleSpayed;
  }

  // Intact male or just male
  if (normalized.match(/\b(intact\s*male)\b/) || normalized === 'male' || normalized === 'm') {
    return Sex.male;
  }

  // Intact female or just female
  if (normalized.match(/\b(intact\s*female)\b/) || normalized === 'female' || normalized === 'f') {
    return Sex.female;
  }

  // Fallback to existing parser
  return parseSex(value);
}

/**
 * Parses a date string in various formats including spoken number sequences
 */
function parseDate(dateStr: string): Date | null {
  console.log('[parseStructuredText] Attempting to parse date', { dateStr });

  try {
    const trimmed = dateStr.trim();

    // Try to parse spoken number sequences first
    const spokenDate = parseSpokenDate(trimmed);
    if (spokenDate) {
      console.log('[parseStructuredText] Spoken date parsed', {
        input: dateStr,
        output: spokenDate.toISOString(),
      });
      return spokenDate;
    }

    // Try MM/DD/YYYY or M/D/YYYY format
    const usMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (usMatch) {
      const [, month, day, year] = usMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        console.log('[parseStructuredText] US date format parsed', {
          input: dateStr,
          output: date.toISOString(),
        });
        return date;
      }
    }

    // Also try without anchors (in case there's trailing whitespace or extra chars)
    const usMatchLoose = trimmed.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (usMatchLoose) {
      const [, month, day, year] = usMatchLoose;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        console.log('[parseStructuredText] US date format (loose) parsed', {
          input: dateStr,
          output: date.toISOString(),
        });
        return date;
      }
    }

    // Try ISO format (YYYY-MM-DD)
    const isoMatch = trimmed.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        console.log('[parseStructuredText] ISO date parsed', {
          input: dateStr,
          output: date.toISOString(),
        });
        return date;
      }
    }

    // Fallback to Date constructor
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      console.log('[parseStructuredText] Date constructor parsed', {
        input: dateStr,
        output: parsed.toISOString(),
      });
      return parsed;
    }

    console.warn('[parseStructuredText] All date parsing attempts failed', { dateStr });
    return null;
  } catch (error) {
    console.error('[parseStructuredText] Date parsing error', { dateStr, error });
    return null;
  }
}

/**
 * Parses spoken date formats like:
 * - "twelve fifteen twenty twenty four" -> 12/15/2024
 * - "one two one five two zero two four" -> 12/15/2024
 * - "december fifteen twenty twenty four" -> 12/15/2024
 */
function parseSpokenDate(dateStr: string): Date | null {
  const normalized = dateStr.toLowerCase().trim();

  // Month name mapping
  const monthNames: { [key: string]: number } = {
    january: 1, jan: 1,
    february: 2, feb: 2,
    march: 3, mar: 3,
    april: 4, apr: 4,
    may: 5,
    june: 6, jun: 6,
    july: 7, jul: 7,
    august: 8, aug: 8,
    september: 9, sep: 9, sept: 9,
    october: 10, oct: 10,
    november: 11, nov: 11,
    december: 12, dec: 12,
  };

  // Number word mapping
  const numberWords: { [key: string]: string } = {
    zero: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9',
    ten: '10', eleven: '11', twelve: '12', thirteen: '13', fourteen: '14',
    fifteen: '15', sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19',
    twenty: '20', thirty: '30', forty: '40', fifty: '50',
  };

  // Try month name format: "december fifteen twenty twenty four"
  for (const [monthName, monthNum] of Object.entries(monthNames)) {
    if (normalized.includes(monthName)) {
      const parts = normalized.split(monthName).map(p => p.trim());
      if (parts.length === 2) {
        const dayPart = parts[1].split(/\s+/);

        let day: number | null = null;
        let year: number | null = null;

        if (dayPart[0] && numberWords[dayPart[0]]) {
          day = parseInt(numberWords[dayPart[0]]);
        } else if (dayPart[0] && /^\d+$/.test(dayPart[0])) {
          day = parseInt(dayPart[0]);
        }

        const yearParts = dayPart.slice(1);
        if (yearParts.length > 0) {
          year = parseSpokenYear(yearParts.join(' '));
        }

        if (day && year) {
          const date = new Date(year, monthNum - 1, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
    }
  }

  // Try digit-by-digit format: "one two one five two zero two four"
  const words = normalized.split(/\s+/);
  if (words.length >= 8) {
    const digits: string[] = [];
    for (const word of words) {
      if (numberWords[word]) {
        digits.push(numberWords[word]);
      }
    }

    if (digits.length >= 8) {
      const month = parseInt(digits[0] + digits[1]);
      const day = parseInt(digits[2] + digits[3]);
      const year = parseInt(digits[4] + digits[5] + digits[6] + digits[7]);

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
  }

  // Try word-form format: "twelve fifteen twenty twenty four"
  const spokenNumbers = normalized.split(/\s+/).filter(w => numberWords[w] || /^\d+$/.test(w));
  if (spokenNumbers.length >= 3) {
    let month: number | null = null;
    let day: number | null = null;
    let year: number | null = null;

    if (numberWords[spokenNumbers[0]]) {
      month = parseInt(numberWords[spokenNumbers[0]]);
    } else if (/^\d+$/.test(spokenNumbers[0])) {
      month = parseInt(spokenNumbers[0]);
    }

    if (numberWords[spokenNumbers[1]]) {
      day = parseInt(numberWords[spokenNumbers[1]]);
    } else if (/^\d+$/.test(spokenNumbers[1])) {
      day = parseInt(spokenNumbers[1]);
    }

    const yearParts = spokenNumbers.slice(2);
    year = parseSpokenYear(yearParts.join(' '));

    if (month && day && year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

/**
 * Parses spoken year like "twenty twenty four" -> 2024
 */
function parseSpokenYear(yearStr: string): number | null {
  const numberWords: { [key: string]: string } = {
    zero: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9',
    ten: '10', eleven: '11', twelve: '12', thirteen: '13', fourteen: '14',
    fifteen: '15', sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19',
    twenty: '20', thirty: '30', forty: '40', fifty: '50',
  };

  const words = yearStr.toLowerCase().trim().split(/\s+/);

  // Try to parse as compound numbers like "twenty twenty four"
  if (words.length === 3) {
    const first = numberWords[words[0]] || words[0];
    const second = numberWords[words[1]] || words[1];
    const third = numberWords[words[2]] || words[2];

    if (/^\d+$/.test(first) && /^\d+$/.test(second) && /^\d+$/.test(third)) {
      const year = parseInt(first) * 100 + parseInt(second) + parseInt(third);
      if (year >= 1900 && year <= 2100) {
        return year;
      }
    }
  }

  // Try to parse as two parts like "twenty twenty-four"
  if (words.length === 2) {
    const first = numberWords[words[0]] || words[0];
    const second = numberWords[words[1]] || words[1];

    if (/^\d+$/.test(first) && /^\d+$/.test(second)) {
      const year = parseInt(first) * 100 + parseInt(second);
      if (year >= 1900 && year <= 2100) {
        return year;
      }
    }
  }

  // Try digit-by-digit: "two zero two four"
  if (words.length === 4) {
    const digits = words.map(w => numberWords[w] || w);
    if (digits.every(d => /^\d$/.test(d))) {
      const year = parseInt(digits.join(''));
      if (year >= 1900 && year <= 2100) {
        return year;
      }
    }
  }

  return null;
}
