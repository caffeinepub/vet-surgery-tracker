import type { CaseFormData } from '../types';
import { parseSpecies, parseSex } from '../validation';
import { Species, Sex } from '@/backend';

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
  
  // Normalize text for better parsing
  const normalizedText = text.toLowerCase();

  console.log('[parseStructuredText] Processing text', {
    originalLength: text.length,
    normalizedLength: normalizedText.length,
  });

  // Enhanced field patterns with voice dictation variations
  // These patterns match "field name" followed by the value
  const patterns = {
    medicalRecordNumber: /(?:medical\s*record\s*(?:number|#|no\.?)?|mrn|record\s*(?:number|#|no\.?)?)\s*:?\s*([a-z0-9\-]+)/i,
    ownerLastName: /(?:owner\s*(?:last\s*)?name|owner|last\s*name|surname)\s*:?\s*([a-z]+(?:\s+[a-z]+)?)/i,
    petName: /(?:pet\s*name|patient\s*name|animal\s*name)\s*:?\s*([a-z]+(?:\s+[a-z]+)?)/i,
    arrivalDate: /(?:arrival\s*date|admission\s*date|admit\s*date|date\s*of\s*arrival|arrived\s*on)\s*:?\s*(.+?)(?=\s*(?:pet\s*name|owner|species|breed|sex|date\s*of\s*birth|presenting|$))/i,
    dateOfBirth: /(?:date\s*of\s*birth|dob|birth\s*date|birthday|born\s*on)\s*:?\s*(.+?)(?=\s*(?:presenting|complaint|$))/i,
    species: /(?:species)\s*:?\s*([a-z]+)/i,
    sex: /(?:sex|gender)\s*:?\s*([a-z\s]+?)(?=\s*(?:date\s*of\s*birth|dob|presenting|complaint|$))/i,
    breed: /(?:breed)\s*:?\s*([a-z\s]+?)(?=\s*(?:sex|gender|date\s*of\s*birth|dob|presenting|complaint|$))/i,
    presentingComplaint: /(?:presenting\s*complaint|chief\s*complaint|complaint|reason\s*for\s*visit)\s*:?\s*(.+?)$/i,
  };

  let matchCount = 0;

  // Try to match each field pattern against the entire text
  for (const [field, pattern] of Object.entries(patterns)) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim();
      console.log('[parseStructuredText] Field matched', {
        field,
        value,
        pattern: pattern.source,
      });

      // Parse based on field type
      try {
        if (field === 'species') {
          const parsed = parseSpeciesWithVoiceVariations(value);
          if (parsed) {
            result.species = parsed;
            matchCount++;
            console.log('[parseStructuredText] Species parsed', { value, parsed });
          }
        } else if (field === 'sex') {
          const parsed = parseSexWithVoiceVariations(value);
          if (parsed) {
            result.sex = parsed;
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
          // String fields - capitalize properly
          const capitalizedValue = capitalizeWords(value);
          result[field as keyof CaseFormData] = capitalizedValue as any;
          matchCount++;
        }
      } catch (error) {
        console.error('[parseStructuredText] Error parsing field', {
          field,
          value,
          error,
        });
      }
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
  
  // Handle common voice dictation variations
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
 * Enhanced sex parser with voice dictation variations
 */
function parseSexWithVoiceVariations(value: string): Sex | null {
  const normalized = value.toLowerCase().trim();
  
  // Handle common voice dictation variations
  if (normalized.match(/\b(male\s*neutered|neutered\s*male|neutered|castrated|mn)\b/)) {
    return Sex.maleNeutered;
  }
  if (normalized.match(/\b(female\s*spayed|spayed\s*female|spayed|fs)\b/)) {
    return Sex.femaleSpayed;
  }
  if (normalized.match(/\b(male|m|intact\s*male)\b/) && !normalized.match(/\b(neutered|castrated)\b/)) {
    return Sex.male;
  }
  if (normalized.match(/\b(female|f|intact\s*female)\b/) && !normalized.match(/\b(spayed)\b/)) {
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

    // Try MM/DD/YYYY format
    const usMatch = trimmed.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
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
        
        // Try to extract day and year
        let day: number | null = null;
        let year: number | null = null;
        
        // Parse day (first number after month name)
        if (dayPart[0] && numberWords[dayPart[0]]) {
          day = parseInt(numberWords[dayPart[0]]);
        } else if (dayPart[0] && /^\d+$/.test(dayPart[0])) {
          day = parseInt(dayPart[0]);
        }
        
        // Parse year (remaining parts)
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
      // Try to parse as MMDDYYYY
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
    
    // First number is month
    if (numberWords[spokenNumbers[0]]) {
      month = parseInt(numberWords[spokenNumbers[0]]);
    } else if (/^\d+$/.test(spokenNumbers[0])) {
      month = parseInt(spokenNumbers[0]);
    }
    
    // Second number is day
    if (numberWords[spokenNumbers[1]]) {
      day = parseInt(numberWords[spokenNumbers[1]]);
    } else if (/^\d+$/.test(spokenNumbers[1])) {
      day = parseInt(spokenNumbers[1]);
    }
    
    // Remaining numbers form the year
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
