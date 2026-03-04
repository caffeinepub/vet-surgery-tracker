import { Sex, Species } from "@/backend";
import type { CaseFormData } from "../types";
import { parseSex, parseSpecies } from "../validation";

/**
 * Parses structured text containing case information in various formats:
 * - "Label: Value" line-by-line format
 * - Comma-separated inline format: "Patient: Max, MRN: 12345, Species: Canine"
 * - Mixed prose with embedded labeled data
 *
 * Returns a partial CaseFormData object with successfully extracted fields.
 */
export function parseStructuredText(text: string): Partial<CaseFormData> {
  const result: Partial<CaseFormData> = {};

  // Normalize the text: replace common separators to produce a unified token stream
  // Strategy: first try line-by-line, then try comma-separated within each line
  const segments = extractSegments(text);

  let _matchCount = 0;

  for (const { label: labelRaw, value: valueRaw } of segments) {
    if (!labelRaw || !valueRaw) continue;

    const field = resolveFieldLabel(labelRaw.trim().toLowerCase());
    if (!field) continue;

    try {
      if (field === "species") {
        const parsed = parseSpeciesWithVoiceVariations(valueRaw);
        if (parsed) {
          result.species = parsed;
          _matchCount++;
        }
      } else if (field === "sex") {
        const parsed = parseSexWithVoiceVariations(valueRaw);
        if (parsed) {
          result.sex = parsed;
          _matchCount++;
        }
      } else if (field === "arrivalDate" || field === "dateOfBirth") {
        const parsed = parseDate(valueRaw);
        if (parsed) {
          result[field] = parsed;
          _matchCount++;
        }
      } else {
        // String fields — preserve original casing for names/breeds, capitalize for others
        const processedValue = shouldPreserveCase(field)
          ? valueRaw.trim()
          : capitalizeWords(valueRaw);
        result[field as keyof CaseFormData] = processedValue as any;
        _matchCount++;
      }
    } catch (_error) {
      // Silently skip fields that fail to parse
    }
  }

  return result;
}

/**
 * Extracts label-value pairs from text supporting multiple formats:
 * 1. Line-by-line "Label: Value"
 * 2. Comma-separated "Label: Value, Label: Value"
 * 3. Mixed formats
 */
function extractSegments(
  text: string,
): Array<{ label: string; value: string }> {
  const segments: Array<{ label: string; value: string }> = [];

  // Split into lines first
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check if this line contains multiple comma-separated label:value pairs
    // by looking for patterns like "Word(s): Value, Word(s): Value"
    const hasMultiplePairs = /[^:]+:[^,]+,\s*[^:]+:/.test(line);

    if (hasMultiplePairs) {
      // Split on commas that are followed by a label pattern (word(s) then colon)
      // Use a lookahead to split only at comma+space+label+colon boundaries
      const parts = splitOnLabelBoundaries(line);
      for (const part of parts) {
        const colonIdx = part.indexOf(":");
        if (colonIdx === -1) continue;
        const label = part.substring(0, colonIdx).trim();
        const value = part.substring(colonIdx + 1).trim();
        if (label && value) {
          segments.push({ label, value });
        }
      }
    } else {
      // Standard single "Label: Value" line
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const label = line.substring(0, colonIdx).trim();
      const value = line.substring(colonIdx + 1).trim();
      if (label && value) {
        segments.push({ label, value });
      }
    }
  }

  return segments;
}

/**
 * Splits a comma-separated string at boundaries where a new label starts.
 * A label boundary is: comma followed by optional whitespace followed by
 * one or more words followed by a colon.
 */
function splitOnLabelBoundaries(line: string): string[] {
  // Find all positions where a new "Label:" pattern starts after a comma
  const parts: string[] = [];
  // Match pattern: optional leading comma+space, then capture label:value
  const regex = /(?:^|,\s*)([^,]+?:[^,]+)/g;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop pattern
  while ((match = regex.exec(line)) !== null) {
    const part = match[1].trim();
    if (part) parts.push(part);
  }

  return parts.length > 0 ? parts : [line];
}

/**
 * Whether a field's value should preserve original casing (e.g., names)
 */
function shouldPreserveCase(field: keyof CaseFormData): boolean {
  return field === "medicalRecordNumber" || field === "notes";
}

/**
 * Maps a normalized label string to a CaseFormData field key.
 * Returns null if the label is not recognized.
 */
function resolveFieldLabel(label: string): keyof CaseFormData | null {
  const normalized = label.toLowerCase().replace(/\s+/g, " ").trim();

  // Medical Record Number
  if (
    normalized === "mrn" ||
    normalized === "medical record number" ||
    normalized === "medical record" ||
    normalized === "record number" ||
    normalized === "record no" ||
    normalized === "record #" ||
    normalized === "patient id" ||
    normalized === "patient number" ||
    normalized === "chart number" ||
    normalized === "chart #" ||
    normalized === "chart no"
  ) {
    return "medicalRecordNumber";
  }

  // Arrival Date
  if (
    normalized === "arrival date" ||
    normalized === "admission date" ||
    normalized === "admit date" ||
    normalized === "date of arrival" ||
    normalized === "arrived on" ||
    normalized === "date" ||
    normalized === "visit date" ||
    normalized === "appointment date"
  ) {
    return "arrivalDate";
  }

  // Pet Name
  if (
    normalized === "pet name" ||
    normalized === "patient name" ||
    normalized === "animal name" ||
    normalized === "pet" ||
    normalized === "patient" ||
    normalized === "name" ||
    normalized === "animal"
  ) {
    return "petName";
  }

  // Owner Last Name
  if (
    normalized === "owner name" ||
    normalized === "owner last name" ||
    normalized === "owner" ||
    normalized === "last name" ||
    normalized === "surname" ||
    normalized === "client name" ||
    normalized === "client last name" ||
    normalized === "client"
  ) {
    return "ownerLastName";
  }

  // Species
  if (
    normalized === "species" ||
    normalized === "type" ||
    normalized === "animal type"
  ) {
    return "species";
  }

  // Breed
  if (
    normalized === "breed" ||
    normalized === "breed/mix" ||
    normalized === "breed / mix"
  ) {
    return "breed";
  }

  // Sex / Gender
  if (
    normalized === "sex" ||
    normalized === "gender" ||
    normalized === "reproductive status" ||
    normalized === "sex/reproductive status"
  ) {
    return "sex";
  }

  // Date of Birth
  if (
    normalized === "date of birth" ||
    normalized === "dob" ||
    normalized === "birth date" ||
    normalized === "birthday" ||
    normalized === "born on" ||
    normalized === "date of birth " ||
    normalized === "age/dob" ||
    normalized === "birthdate"
  ) {
    return "dateOfBirth";
  }

  // Presenting Complaint
  if (
    normalized === "presenting complaint" ||
    normalized === "chief complaint" ||
    normalized === "complaint" ||
    normalized === "reason for visit" ||
    normalized === "presenting" ||
    normalized === "reason" ||
    normalized === "problem" ||
    normalized === "chief problem" ||
    normalized === "presenting problem"
  ) {
    return "presentingComplaint";
  }

  // Notes
  if (
    normalized === "notes" ||
    normalized === "note" ||
    normalized === "additional notes" ||
    normalized === "comments" ||
    normalized === "remarks"
  ) {
    return "notes";
  }

  return null;
}

/**
 * Capitalizes words in a string
 */
function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Enhanced species parser with voice dictation variations
 */
function parseSpeciesWithVoiceVariations(value: string): Species | null {
  const normalized = value.toLowerCase().trim();

  if (normalized.match(/\b(canine|dog|dogs)\b/)) {
    return Species.canine;
  }
  if (normalized.match(/\b(feline|cat|cats|kitty|kitten)\b/)) {
    return Species.feline;
  }
  if (
    normalized.match(
      /\b(other|exotic|bird|reptile|rabbit|ferret|avian|rodent|hamster|guinea pig)\b/,
    )
  ) {
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
  if (
    normalized.match(
      /\b(male\s*neutered|neutered\s*male|neutered|castrated|mn)\b/,
    )
  ) {
    return Sex.maleNeutered;
  }

  // Check for spayed female (most specific)
  if (normalized.match(/\b(female\s*spayed|spayed\s*female|spayed|fs)\b/)) {
    return Sex.femaleSpayed;
  }

  // Intact male or just male
  if (
    normalized.match(/\b(intact\s*male)\b/) ||
    normalized === "male" ||
    normalized === "m"
  ) {
    return Sex.male;
  }

  // Intact female or just female
  if (
    normalized.match(/\b(intact\s*female)\b/) ||
    normalized === "female" ||
    normalized === "f"
  ) {
    return Sex.female;
  }

  // Fallback to existing parser
  return parseSex(value);
}

/**
 * Parses a date string in various formats including spoken number sequences
 */
function parseDate(dateStr: string): Date | null {
  try {
    const trimmed = dateStr.trim();

    // Try to parse spoken number sequences first
    const spokenDate = parseSpokenDate(trimmed);
    if (spokenDate) return spokenDate;

    // Try MM/DD/YYYY or M/D/YYYY format
    const usMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (usMatch) {
      const [, month, day, year] = usMatch;
      const date = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day),
      );
      if (!Number.isNaN(date.getTime())) return date;
    }

    // Also try without anchors (in case there's trailing whitespace or extra chars)
    const usMatchLoose = trimmed.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (usMatchLoose) {
      const [, month, day, year] = usMatchLoose;
      const date = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day),
      );
      if (!Number.isNaN(date.getTime())) return date;
    }

    // Try ISO format (YYYY-MM-DD)
    const isoMatch = trimmed.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const date = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day),
      );
      if (!Number.isNaN(date.getTime())) return date;
    }

    // Fallback to Date constructor
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    return null;
  } catch {
    return null;
  }
}

/**
 * Parses spoken date formats like:
 * - "twelve fifteen twenty twenty four" -> 12/15/2024
 * - "december fifteen twenty twenty four" -> 12/15/2024
 */
function parseSpokenDate(dateStr: string): Date | null {
  const normalized = dateStr.toLowerCase().trim();

  const monthNames: { [key: string]: number } = {
    january: 1,
    jan: 1,
    february: 2,
    feb: 2,
    march: 3,
    mar: 3,
    april: 4,
    apr: 4,
    may: 5,
    june: 6,
    jun: 6,
    july: 7,
    jul: 7,
    august: 8,
    aug: 8,
    september: 9,
    sep: 9,
    sept: 9,
    october: 10,
    oct: 10,
    november: 11,
    nov: 11,
    december: 12,
    dec: 12,
  };

  const numberWords: { [key: string]: string } = {
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    ten: "10",
    eleven: "11",
    twelve: "12",
    thirteen: "13",
    fourteen: "14",
    fifteen: "15",
    sixteen: "16",
    seventeen: "17",
    eighteen: "18",
    nineteen: "19",
    twenty: "20",
    thirty: "30",
    forty: "40",
    fifty: "50",
  };

  // Try month name format: "december fifteen twenty twenty four"
  for (const [monthName, monthNum] of Object.entries(monthNames)) {
    if (normalized.includes(monthName)) {
      const parts = normalized.split(monthName).map((p) => p.trim());
      if (parts.length === 2) {
        const dayPart = parts[1].split(/\s+/);
        let day: number | null = null;
        let year: number | null = null;

        if (dayPart[0] && numberWords[dayPart[0]]) {
          day = Number.parseInt(numberWords[dayPart[0]]);
        } else if (dayPart[0] && /^\d+$/.test(dayPart[0])) {
          day = Number.parseInt(dayPart[0]);
        }

        const yearParts = dayPart.slice(1);
        if (yearParts.length > 0) {
          year = parseSpokenYear(yearParts.join(" "));
        }

        if (day && year) {
          const date = new Date(year, monthNum - 1, day);
          if (!Number.isNaN(date.getTime())) return date;
        }
      }
    }
  }

  // Try digit-by-digit format: "one two one five two zero two four"
  const words = normalized.split(/\s+/);
  if (words.length >= 8) {
    const digits: string[] = [];
    for (const word of words) {
      if (numberWords[word]) digits.push(numberWords[word]);
    }

    if (digits.length >= 8) {
      const month = Number.parseInt(digits[0] + digits[1]);
      const day = Number.parseInt(digits[2] + digits[3]);
      const year = Number.parseInt(
        digits[4] + digits[5] + digits[6] + digits[7],
      );

      if (
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31 &&
        year >= 1900 &&
        year <= 2100
      ) {
        const date = new Date(year, month - 1, day);
        if (!Number.isNaN(date.getTime())) return date;
      }
    }
  }

  // Try word-form format: "twelve fifteen twenty twenty four"
  const spokenNumbers = normalized
    .split(/\s+/)
    .filter((w) => numberWords[w] || /^\d+$/.test(w));
  if (spokenNumbers.length >= 3) {
    let month: number | null = null;
    let day: number | null = null;
    let year: number | null = null;

    if (numberWords[spokenNumbers[0]]) {
      month = Number.parseInt(numberWords[spokenNumbers[0]]);
    } else if (/^\d+$/.test(spokenNumbers[0])) {
      month = Number.parseInt(spokenNumbers[0]);
    }

    if (numberWords[spokenNumbers[1]]) {
      day = Number.parseInt(numberWords[spokenNumbers[1]]);
    } else if (/^\d+$/.test(spokenNumbers[1])) {
      day = Number.parseInt(spokenNumbers[1]);
    }

    const yearParts = spokenNumbers.slice(2);
    year = parseSpokenYear(yearParts.join(" "));

    if (
      month &&
      day &&
      year &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      const date = new Date(year, month - 1, day);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }

  return null;
}

/**
 * Parses spoken year like "twenty twenty four" -> 2024
 */
function parseSpokenYear(yearStr: string): number | null {
  const numberWords: { [key: string]: string } = {
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    ten: "10",
    eleven: "11",
    twelve: "12",
    thirteen: "13",
    fourteen: "14",
    fifteen: "15",
    sixteen: "16",
    seventeen: "17",
    eighteen: "18",
    nineteen: "19",
    twenty: "20",
    thirty: "30",
    forty: "40",
    fifty: "50",
  };

  const words = yearStr.toLowerCase().trim().split(/\s+/);

  if (words.length === 3) {
    const first = numberWords[words[0]] || words[0];
    const second = numberWords[words[1]] || words[1];
    const third = numberWords[words[2]] || words[2];

    if (/^\d+$/.test(first) && /^\d+$/.test(second) && /^\d+$/.test(third)) {
      const year =
        Number.parseInt(first) * 100 +
        Number.parseInt(second) +
        Number.parseInt(third);
      if (year >= 1900 && year <= 2100) return year;
    }
  }

  if (words.length === 2) {
    const first = numberWords[words[0]] || words[0];
    const second = numberWords[words[1]] || words[1];

    if (/^\d+$/.test(first) && /^\d+$/.test(second)) {
      const year = Number.parseInt(first) * 100 + Number.parseInt(second);
      if (year >= 1900 && year <= 2100) return year;
    }
  }

  if (words.length === 4) {
    const digits = words.map((w) => numberWords[w] || w);
    if (digits.every((d) => /^\d$/.test(d))) {
      const year = Number.parseInt(digits.join(""));
      if (year >= 1900 && year <= 2100) return year;
    }
  }

  return null;
}
