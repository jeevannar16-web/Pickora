import { Participant } from '../types/participant';

export type ValidationResult = {
  valid: boolean;
  message?: string;
};

export const MAX_PARTICIPANTS = 500;

export function validateName(name: string, existing: Participant[]): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, message: 'Name cannot be empty.' };
  }
  if (trimmed.length > 80) {
    return { valid: false, message: 'Name is too long (max 80 characters).' };
  }
  const dupe = existing.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  if (dupe) {
    return { valid: false, message: `"${trimmed}" is already in the list.` };
  }
  if (existing.length >= MAX_PARTICIPANTS) {
    return { valid: false, message: `Maximum of ${MAX_PARTICIPANTS} participants allowed.` };
  }
  return { valid: true };
}

export function validateParticipantCount(count: number, eligibleCount: number): ValidationResult {
  if (count < 1) {
    return { valid: false, message: 'Winner count must be at least one.' };
  }
  if (count > eligibleCount) {
    return { valid: false, message: `Cannot select ${count} winners from ${eligibleCount} eligible participants.` };
  }
  return { valid: true };
}

export function sanitizeWeight(raw: string | number): number | null {
  const n = typeof raw === 'number' ? raw : parseFloat(raw);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.min(n, 100);
}

export function validateCSVFile(file: { type: string; size: number; name: string }): ValidationResult {
  if (file.size === 0) {
    return { valid: false, message: 'The file is empty.' };
  }
  const isCsv = file.type.includes('csv') || file.name.toLowerCase().endsWith('.csv');
  if (!isCsv) {
    return { valid: false, message: 'Only CSV files are supported for import.' };
  }
  return { valid: true };
}

export function validateJSONFile(file: { type: string; size: number; name: string }): ValidationResult {
  if (file.size === 0) {
    return { valid: false, message: 'The file is empty.' };
  }
  const isJson = file.type.includes('json') || file.name.toLowerCase().endsWith('.json');
  if (!isJson) {
    return { valid: false, message: 'Only JSON files are supported for wheel import.' };
  }
  return { valid: true };
}