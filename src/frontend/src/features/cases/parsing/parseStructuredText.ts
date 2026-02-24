import type { CaseFormData } from '../types';
import { parseSpecies, parseSex } from '../validation';

/**
 * Parses structured text containing case information in label:value format
 * and returns a partial CaseFormData object with successfully extracted fields.
 * Enhanced to handle voice dictation variations and natural language patterns.
 */
export function parseStructuredText(text: string): Partial<CaseFormData> {
  console.log('[parseStructuredText] Starting parse operation', {
    textLength: text.length,
    timestamp: new Date().toISOString(),
  });

  const result: Partial<CaseFormData> = {};
  const lines = text.split('\n').map((line) => line.trim());

  console.log('[parseStructuredText] Processing lines', {
    totalLines: lines.length,
    nonEmptyLines: lines.filter((l) => l.length > 0).length,
  });

  // Enhanced field patterns with voice dictation variations
  // IMPORTANT: Order matters! More specific patterns must come before general ones
  const patterns = {
    medicalRecordNumber: /(?:medical\s*record\s*(?:number|#|no\.?)?|mrn|record\s*(?:number|#|no\.?)?|the\s*medical\s*record\s*number\s*is|medical\s*record\s*is)\s*:?\s*(.+)/i,
    ownerLastName: /(?:owner\s*(?:last\s*)?name|owner|last\s*name|surname|the\s*owner\s*(?:last\s*)?name\s*is|owner\s*is)\s*:?\s*(.+)/i,
    petName: /(?:pet\s*name|patient\s*name|animal\s*name|the\s*pet\s*name\s*is|pet\s*is|patient\s*is)\s*:?\s*(.+)/i,
    arrivalDate: /(?:arrival\s*date|admission\s*date|admit\s*date|date\s*of\s*arrival|the\s*arrival\s*date\s*is|arrived\s*on)\s*:?\s*(.+)/i,
    dateOfBirth: /(?:date\s*of\s*birth|dob|birth\s*date|birthday|the\s*date\s*of\s*birth\s*is|born\s*on)\s*:?\s*(.+)/i,
    species: /(?:species|the\s*species\s*is)\s*:?\s*(.+)/i,
    sex: /(?:sex|gender|the\s*sex\s*is|the\s*gender\s*is)\s*:?\s*(.+)/i,
    breed: /(?:breed|the\s*breed\s*is)\s*:?\s*(.+)/i,
    presentingComplaint: /(?:presenting\s*complaint|chief\s*complaint|complaint|reason\s*for\s*visit|the\s*presenting\s*complaint\s*is|the\s*complaint\s*is|reason\s*is)\s*:?\s*(.+)/i,
  };

  let matchCount = 0;

  lines.forEach((line, index) => {
    if (!line) return;

    console.log('[parseStructuredText] Processing line', { index, line });

    // Try to match each field pattern
    for (const [field, pattern] of Object.entries(patterns)) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const value = match[1].trim();
        console.log('[parseStructuredText] Field matched', {
          field,
          value,
          line: index,
        });

        // Parse based on field type
        try {
          if (field === 'species') {
            const parsed = parseSpeciesWithVoiceVariations(value);
            if (parsed) {
              result.species = parsed as any;
              matchCount++;
              console.log('[parseStructuredText] Species parsed', { value, parsed });
            }
          } else if (field === 'sex') {
            const parsed = parseSexWithVoiceVariations(value);
            if (parsed) {
              result.sex = parsed as any;
              matchCount++;
              console.log('[parseStructuredText] Sex parsed', { value, parsed });
            }
          } else if (field === 'arrivalDate' || field === 'dateOfBirth') {
            const parsed = parseDate(value);
            if (parsed) {
              result[field] = parsed;
              matchCount++;
              console.log('[parseStructuredText] Date parsed', {
                field,
                value,
                parsed: parsed.toISOString(),
              });
            } else {
              console.warn('[parseStructuredText] Date parsing failed', {
                field,
                value,
              });
            }
          } else {
            // String fields
            result[field as keyof CaseFormData] = value as any;
            matchCount++;
          }
        } catch (error) {
          console.error('[parseStructuredText] Error parsing field', {
            field,
            value,
            error,
          });
        }

        break; // Stop checking other patterns for this line
      }
    }
  });

  console.log('[parseStructuredText] Parse complete', {
    matchCount,
    fields: Object.keys(result),
    timestamp: new Date().toISOString(),
  });

  return result;
}

/**
 * Enhanced species parser with voice dictation variations
 */
function parseSpeciesWithVoiceVariations(value: string): string | null {
  const normalized = value.toLowerCase().trim();
  
  // Handle common voice dictation variations
  if (normalized.match(/\b(canine|dog|dogs)\b/)) {
    return 'canine';
  }
  if (normalized.match(/\b(feline|cat|cats)\b/)) {
    return 'feline';
  }
  if (normalized.match(/\b(other|exotic|bird|reptile|rabbit|ferret)\b/)) {
    return 'other';
  }
  
  // Fallback to existing parser
  return parseSpecies(value);
}

/**
 * Enhanced sex parser with voice dictation variations
 */
function parseSexWithVoiceVariations(value: string): string | null {
  const normalized = value.toLowerCase().trim();
  
  // Handle common voice dictation variations
  if (normalized.match(/\b(male|m|intact\s*male)\b/) && !normalized.match(/\b(neutered|castrated)\b/)) {
    return 'male';
  }
  if (normalized.match(/\b(male\s*neutered|neutered\s*male|neutered|castrated|mn)\b/)) {
    return 'maleNeutered';
  }
  if (normalized.match(/\b(female|f|intact\s*female)\b/) && !normalized.match(/\b(spayed)\b/)) {
    return 'female';
  }
  if (normalized.match(/\b(female\s*spayed|spayed\s*female|spayed|fs)\b/)) {
    return 'femaleSpayed';
  }
  
  // Fallback to existing parser
  return parseSex(value);
}

/**
 * Parses a date string in various formats
 */
function parseDate(dateStr: string): Date | null {
  console.log('[parseStructuredText] Attempting to parse date', { dateStr });

  try {
    // Try ISO format first (YYYY-MM-DD)
    const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      console.log('[parseStructuredText] ISO date parsed', {
        input: dateStr,
        output: date.toISOString(),
      });
      return date;
    }

    // Try MM/DD/YYYY format
    const usMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (usMatch) {
      const [, month, day, year] = usMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      console.log('[parseStructuredText] US date format parsed', {
        input: dateStr,
        output: date.toISOString(),
      });
      return date;
    }

    // Try DD/MM/YYYY format
    const euMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (euMatch) {
      const [, day, month, year] = euMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      console.log('[parseStructuredText] EU date format parsed', {
        input: dateStr,
        output: date.toISOString(),
      });
      return date;
    }

    // Fallback to Date constructor
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      console.log('[parseStructuredText] Date constructor parsed', {
        input: dateStr,
        output: parsed.toISOString(),
      });
      return parsed;
    }

    console.warn('[parseStructuredText] All date parsing attempts failed', {
      dateStr,
    });
    return null;
  } catch (error) {
    console.error('[parseStructuredText] Date parsing error', {
      dateStr,
      error,
    });
    return null;
  }
}
