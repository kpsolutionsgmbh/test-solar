import type { DealroomContent } from '@/types/database';

/**
 * Publish-gate: a dealroom must satisfy these invariants before its status
 * can be flipped to 'published' or 'signed'. Returns either { ok: true } or
 * a list of human-readable errors pointing to the exact field that's
 * missing, so the admin can fix it.
 *
 * Rule (from Solarheld product owner, 2026-05-18):
 *   Every situation_point MUST have an emoji OR a visual_type (animated
 *   preferred, static simple_icon allowed as fallback).
 *   Every concrete_benefit MUST have a non-empty value (the animated number).
 */
export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

const ANIMATED_TYPES = new Set([
  'counter_down',
  'counter_up',
  'rising_number',
  'comparison_bar',
  'percentage_ring',
]);
const ALL_VISUAL_TYPES = new Set([...ANIMATED_TYPES, 'simple_icon']);

export function validateForPublish(content: DealroomContent | null): ValidationResult {
  const errors: string[] = [];

  if (!content) {
    return { ok: false, errors: ['Kein Inhalt vorhanden. Bitte zuerst Content generieren.'] };
  }

  // Hero
  if (!content.hero_title || content.hero_title.trim() === '') {
    errors.push('Hero-Titel fehlt.');
  }

  // Pains
  if (!Array.isArray(content.situation_points) || content.situation_points.length === 0) {
    errors.push('Mindestens ein Pain-Point ist erforderlich.');
  } else {
    content.situation_points.forEach((p, i) => {
      const idx = i + 1;
      const hasEmoji = typeof p.emoji === 'string' && p.emoji.trim() !== '';
      const hasVisualType =
        typeof p.visual_type === 'string' && ALL_VISUAL_TYPES.has(p.visual_type);
      if (!hasEmoji && !hasVisualType) {
        errors.push(
          `Pain-Point ${idx} (${p.heading || p.text || 'unbenannt'}): weder Emoji noch Visualisierung — bitte ergänzen.`,
        );
      }
      // Soft warning: if it's animated, visual_data should not be completely empty
      if (
        hasVisualType &&
        p.visual_type &&
        ANIMATED_TYPES.has(p.visual_type) &&
        (!p.visual_data || Object.keys(p.visual_data).length === 0)
      ) {
        errors.push(
          `Pain-Point ${idx} hat visual_type "${p.visual_type}" aber keine Zahlen — bitte visual_data füllen.`,
        );
      }
    });
  }

  // Benefits — value is the animated counter
  if (!Array.isArray(content.concrete_benefits) || content.concrete_benefits.length === 0) {
    errors.push('Mindestens ein konkreter Benefit ist erforderlich.');
  } else {
    content.concrete_benefits.forEach((b, i) => {
      const idx = i + 1;
      const hasValue = typeof b.value === 'string' && b.value.trim() !== '' && b.value.trim() !== '—';
      if (!hasValue) {
        errors.push(
          `Benefit ${idx} (${b.label || 'unbenannt'}): Wert (Zahl/Visualisierung) fehlt.`,
        );
      }
    });
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Quick helper for UI: pretty-print the validator output for a toast.
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  return errors.map(e => `• ${e}`).join('\n');
}
