import { Question, Answer } from './types';

/**
 * Parse a CSV line handling quoted fields (supports commas inside quotes).
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Detect if the first row is a header row.
 */
function isHeaderRow(fields: string[]): boolean {
  const first = fields[0].toLowerCase().replace(/[^a-z]/g, '');
  return first === 'question' || first === 'questions';
}

/**
 * Parse CSV text into Question objects.
 *
 * Expected CSV format:
 *   Question, Answer1, Points1, Answer2, Points2, ...
 *
 * Example:
 *   "Name something green", "Grass", 42, "Trees", 20, "Money", 15
 *
 * - First row is auto-skipped if detected as a header
 * - Each row needs a question + at least one answer/points pair
 * - Answers are sorted by points descending
 */
export function parseCSVQuestions(csvText: string): Question[] {
  const lines = csvText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return [];

  let startIndex = 0;
  const firstFields = parseCSVLine(lines[0]);
  if (isHeaderRow(firstFields)) {
    startIndex = 1;
  }

  const questions: Question[] = [];
  const timestamp = Date.now();

  for (let i = startIndex; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 3) continue; // need question + at least 1 answer + points

    const questionText = fields[0];
    if (!questionText) continue;

    const answers: Answer[] = [];

    // Parse alternating answer/points pairs starting at index 1
    for (let j = 1; j + 1 < fields.length; j += 2) {
      const answerText = fields[j];
      const points = parseInt(fields[j + 1], 10);

      if (answerText && !isNaN(points) && points >= 0) {
        answers.push({ text: answerText, points });
      }
    }

    if (answers.length === 0) continue;

    // Sort by points descending (matches existing pattern)
    answers.sort((a, b) => b.points - a.points);

    questions.push({
      id: `q_csv_${timestamp}_${i}`,
      question: questionText,
      answers: answers.slice(0, 8), // max 8 answers
      isUsed: false,
    });
  }

  return questions;
}
