# Solarheld Dealroom App — Claude Code Context

## Project

Next.js 14 (App Router) + Supabase + Anthropic + Resend. Personalized digital offer pages for solar sales. German-first, EN fallback in `src/lib/i18n.ts`. Brand color `#E97E1C`.

- **Public dealroom:** `/d/[slug]` — customer-facing sales surface
- **Admin dashboard:** `/dashboard/*` — sales lead UI
- **API:** `/api/ai/{generate,transcribe}`, `/api/email/*`, `/api/cron/email-flows`, `/api/track`, `/api/unsubscribe`, `/api/upload`, `/api/revalidate`
- **DB tables:** admin_users, team_members, customers, dealrooms, dealroom_documents, tracking_events, references, templates, email_logs, email_flows, email_flow_logs

## Design System

**Always read [DESIGN.md](DESIGN.md) before making any visual or UI decision.**

All font choices, colors, spacing, motion, elevation, and aesthetic direction are defined there. Do not deviate without explicit user approval. In design-review or QA mode, flag any code that doesn't match DESIGN.md.

The system was set by `/design-consultation` on 2026-05-17:
- **Aesthetic:** Swiss Modernist Clarity (not Editorial-Magazine)
- **Memorable thing:** "Das wirkt klar & einfach — ich verstehe sofort was ich kriege"
- **Type:** PP Neue Montreal (paid) or Geist (free fallback) — one-family monosystem. Plus Jakarta Sans retired.
- **Neutrals:** stone-warm, not cool slate
- **Brand-orange:** atmospheric accent only, max 1 CTA + 1 accent + glow per section (current 40+ tinted backgrounds get audited out)
- **Dark mode:** required, actually implemented (CSS vars + `.dark` overrides)

## Known State

- **Auth:** Real Supabase Auth wired up. Middleware enforces session on `/dashboard/*` and on `/api/*` (minus public allowlist: `/api/track`, `/api/unsubscribe`, `/api/cron/email-flows`, `/api/revalidate`). API routes use `supabase.auth.getUser()` for defense in depth.
- **RLS:** Migration written at `supabase/migrations/20260517_enable_rls.sql` — **must be run manually in Supabase Dashboard → SQL Editor** before going live. Without it, the DB is wide-open at the row level even if the API is gated.
- **Tests:** Playwright smoke suite at `e2e/smoke.spec.ts` (8 tests, covers auth gates, public allowlist, login render, manifest, no-console-errors). Run via `npm run test:e2e`.
- **CI/CD:** Vercel auto-deploy from `main`.
- **Cron:** `/api/cron/email-flows` daily 08:00 UTC, requires `CRON_SECRET`.

## Setup checklist before going live

1. **Create admin auth user**: Supabase Dashboard → Authentication → Users → Add user. Email: your admin email + password. The login page uses `signInWithPassword` so the user must exist in `auth.users`.
2. **Run RLS migration**: paste `supabase/migrations/20260517_enable_rls.sql` into Supabase SQL Editor and run. Idempotent.
3. **Run global-content migration** (if not already done): `supabase/migrations/20260517_global_content.sql`.
4. **Env vars in Vercel**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `OPENAI_API_KEY` (optional, for Whisper transcription).

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. Key routing:

- Design system / plan review → `/design-consultation` or `/plan-design-review`
- Visual polish on live site → `/design-review`
- Ship / deploy / PR → `/ship` or push directly to main (solo repo)
- QA / testing site behavior → `/qa` or `/qa-only`
- Bugs / errors → `/investigate`
- Code review / diff check → `/review`
- Save / resume context → `/context-save` / `/context-restore`
