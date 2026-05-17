import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import {
  DEFAULT_GLOBAL_CONTENT,
  mergeWithDefaults,
  type GlobalContent,
  type ResolvedGlobalContent,
} from './global-content-types';

export {
  DEFAULT_GLOBAL_CONTENT,
  mergeWithDefaults,
  type GlobalContent,
} from './global-content-types';

// Server-side: fetch the single admin's row + merge with defaults.
// `publicMode` uses the service-role client so the public dealroom page
// (no auth context) can read it.
export async function getGlobalContent(
  publicMode = false
): Promise<ResolvedGlobalContent> {
  try {
    const supabase = publicMode ? createServiceRoleClient() : createServerSupabaseClient();
    const { data } = await supabase.from('global_content').select('content').limit(1).single();
    const stored = (data?.content || {}) as GlobalContent;
    return mergeWithDefaults(stored);
  } catch {
    return DEFAULT_GLOBAL_CONTENT;
  }
}
