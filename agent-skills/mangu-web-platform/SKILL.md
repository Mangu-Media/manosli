---
name: mangu-web-platform
description: Apply the MANGU Web Foundation standards when planning, scaffolding, reviewing, or modifying a web application that uses the MANGU stack. Use when a user mentions the MANGU foundation, MANGU-standard web stack, shared Redinc23 web conventions, or asks to make a project consistent with the MANGU web platform.
---

# MANGU Web Platform

Use this skill as a shared engineering baseline, not as a demand to copy the
MANGU Publishers product. Preserve the target project's stated requirements and
existing patterns when they are more specific.

## Apply the foundation

Default to strict TypeScript, accessible UI, validated inputs, clear
server/client boundaries, environment validation, CI, health/readiness checks,
and observability appropriate to a deployed product. Keep credentials and
privileged service calls server-only; never put real secrets in code, docs,
examples, tests, logs, or agent output.

Read [foundation.md](references/foundation.md) before selecting services,
extracting code, or making architecture decisions.

## Choose capabilities explicitly

Do not install Supabase, Stripe, Resend, OpenAI, Sentry, or Upstash merely
because another MANGU project uses them. Select one canonical auth provider and
one canonical data provider per project; do not copy an in-progress migration
state into a new project.

## Change rules

1. Prefer existing project patterns before creating abstractions.
2. Keep product models, feature routes, and business logic out of the shared
   foundation unless they have a deliberate cross-project contract.
3. Record an ADR before changing the deployment platform, auth provider, or
   primary database.
4. Keep payment webhooks idempotent and test duplicate delivery behavior.
5. Treat schema migrations as ordered, reviewable application changes.
6. Use one canonical production platform per project.

## Scope boundary

Do not import MANGU Publishers-specific models, product UX, Phoenix migration
rules, launch ledgers, domains, or legacy deployment artifacts into another
application. See [foundation.md](references/foundation.md) for the reusable
boundary.
