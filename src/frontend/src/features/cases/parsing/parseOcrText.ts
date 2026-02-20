/**
 * Preprocesses raw OCR text output by normalizing whitespace, removing noise,
 * correcting common character recognition errors, and cleaning artifacts.
 * This module is now primarily used as a fallback for text cleaning when AI
 * analysis returns semi-structured text instead of clean JSON.
 */

export function preprocessOcrText(rawText: string): string {
  console.log('[parseOcrText] Preprocessing OCR text', {
    inputLength: rawText.length,
    timestamp: new Date().toISOString(),
  });

  let processed = rawText;

  // Normalize line endings
  processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove excessive whitespace while preserving single spaces
  processed = processed.replace(/[ \t]+/g, ' ');

  // Normalize multiple newlines to maximum of 2
  processed = processed.replace(/\n{3,}/g, '\n\n');

  // Remove leading/trailing whitespace from each line
  processed = processed
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  // Common OCR character corrections
  const corrections: Array<[RegExp, string]> = [
    // O/0 confusion in numbers
    [/\b([A-Z]{2,})O(\d)/g, '$10$2'], // e.g., "MRO123" -> "MR0123"
    [/\b(\d+)O(\d+)\b/g, '$10$2'], // e.g., "1O23" -> "1023"

    // I/1/l confusion
    [/\b([A-Z]{2,})I(\d)/g, '$11$2'], // e.g., "MRI123" -> "MR1123"
    [/\bl(\d)/g, '1$1'], // lowercase l before digit -> 1

    // Common punctuation errors
    [/\s+([,.:;!?])/g, '$1'], // Remove space before punctuation
    [/([,.:;])\s*([,.:;])/g, '$1'], // Remove duplicate punctuation
  ];

  corrections.forEach(([pattern, replacement]) => {
    processed = processed.replace(pattern, replacement);
  });

  // Remove common OCR artifacts
  const artifacts = [
    /[|]{2,}/g, // Multiple pipes
    /_{3,}/g, // Multiple underscores
    /[-]{4,}/g, // Multiple dashes (but keep 1-3 for dates)
    /[~`]/g, // Tilde and backtick
  ];

  artifacts.forEach((pattern) => {
    processed = processed.replace(pattern, '');
  });

  // Final cleanup
  processed = processed.trim();

  console.log('[parseOcrText] Preprocessing complete', {
    outputLength: processed.length,
    linesRemoved: rawText.split('\n').length - processed.split('\n').length,
    timestamp: new Date().toISOString(),
  });

  return processed;
}
