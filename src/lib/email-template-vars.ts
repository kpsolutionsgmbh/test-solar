/**
 * Single source of truth for which {{variables}} are valid in email-flow
 * subject_template and body_template strings. Keep in sync with the
 * substitution map in src/app/api/email-flows/send/route.ts.
 */
export const KNOWN_TEMPLATE_VARS = new Set<string>([
  'anrede',
  'vorname',
  'nachname',
  'firma',
  'produkt',
  'ansprechpartner_name',
  'ansprechpartner_email',
  'ansprechpartner_telefon',
  'dealroom_link',
  'r', // German plural-form suffix ('Sehr geehrte{{r}}')
]);

/**
 * Find variables in a template string that aren't in the known set.
 * Returns the unknown names (without {{}} wrappers). Empty array = valid.
 */
export function findUnknownVars(template: string): string[] {
  const pattern = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  const seen = new Set<string>();
  const unknown: string[] = [];
  let match;
  while ((match = pattern.exec(template)) !== null) {
    const name = match[1];
    if (KNOWN_TEMPLATE_VARS.has(name)) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    unknown.push(name);
  }
  return unknown;
}

/**
 * Validate both subject and body against the known-var set. Returns an
 * error message ready to display to the admin, or null if all vars valid.
 */
export function validateTemplate(subject: string, body: string): string | null {
  const unknown = [
    ...findUnknownVars(subject || ''),
    ...findUnknownVars(body || ''),
  ];
  const dedup = Array.from(new Set(unknown));
  if (dedup.length === 0) return null;
  const list = dedup.map(v => `{{${v}}}`).join(', ');
  return `Unbekannte Variablen: ${list}. Erlaubt sind: ${Array.from(KNOWN_TEMPLATE_VARS)
    .map(v => `{{${v}}}`)
    .join(', ')}`;
}
