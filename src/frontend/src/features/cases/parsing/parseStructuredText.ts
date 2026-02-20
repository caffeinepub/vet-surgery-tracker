import type { CaseFormData } from '../types';
import { parseSpecies, parseSex } from '../validation';

/**
 * Parses structured text containing case information in label:value format
 * and returns a partial CaseFormData object with successfully extracted fields.
 * This parser now serves as a fallback for AI responses that return semi-structured
 * text instead of clean JSON, as well as for the Quick Fill feature.
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

  // Field patterns with various label formats
  const patterns = {
    medicalRecordNumber: /(?:medical\s*record\s*(?:number|#|no\.?)?|mrn|record\s*(?:number|#|no\.?)?)\s*:?\s*(.+)/i,
    petName: /(?:pet\s*name|patient\s*name|name)\s*:?\s*(.+)/i,
    ownerLastName: /(?:owner(?:\s*last)?\s*name|owner|last\s*name)\s*:?\s*(.+)/i,
    arrivalDate: /(?:arrival\s*date|admission\s*date|date\s*of\s*arrival)\s*:?\s*(.+)/i,
    dateOfBirth: /(?:date\s*of\s*birth|dob|birth\s*date)\s*:?\s*(.+)/i,
    species: /(?:species)\s*:?\s*(.+)/i,
    sex: /(?:sex|gender)\s*:?\s*(.+)/i,
    breed: /(?:breed)\s*:?\s*(.+)/i,
    presentingComplaint: /(?:presenting\s*complaint|chief\s*complaint|complaint|reason\s*for\s*visit)\s*:?\s*(.+)/i,
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
            const parsed = parseSpecies(value);
            if (parsed) {
              result.species = parsed as any;
              matchCount++;
              console.log('[parseStructuredText] Species parsed', { value, parsed });
            }
          } else if (field === 'sex') {
            const parsed = parseSex(value);
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
