# MANGU Web Foundation Reference

## Default foundation

| Area | Standard |
| --- | --- |
| Quality | Formatting, linting, type checks, unit tests, and end-to-end coverage proportional to risk |
| Validation | Validate inputs at the boundary; keep privileged calls server-side |
| Security | Least-privilege services, environment validation, and no tracked secrets |
| Operations | CI, health/readiness checks, and structured production error monitoring |

## Optional service modules

| Capability | Use when | Rule |
| --- | --- | --- |
| Supabase | Managed Postgres, auth, storage, or RLS is required | Keep migrations project-owned. |
| Stripe | The product accepts payments | Verify signatures and test idempotency. |
| Resend | Transactional email is required | Keep templates and send contract together. |
| OpenAI | The product needs AI workflows | Keep keys server-only and define failure/cost controls. |
| Sentry | A deployed product needs error visibility | Keep context privacy-safe. |
| Upstash | Public, paid, authenticated, or costly APIs need abuse controls | Rate limit at the trust boundary. |

## Reuse decision

- Use a **template repository** for a starter app and its configuration.
- Use an **agent skill** for operating standards and decision rules.
- Use a **published package** only for versioned code with two or more genuine
  consumers, such as shared lint configuration or UI primitives.

Do not publish a package merely to share a document or a starter application.
