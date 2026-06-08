# BayouBuilt Digital

Marketing site + customer portal for BayouBuilt Digital — software sales and
local-business website services.

The public marketing pages are static files in [`public/`](public/). Dynamic
routes (auth + the customer dashboard) run in a small
[Hono](https://hono.dev) app on **Cloudflare Workers**, with **Supabase** for
auth and data. Sessions are stored in httpOnly/Secure cookies via
`@supabase/ssr`.

## Architecture

| Path | Served by |
| --- | --- |
| `/`, `/style.css`, `/assets/*`, `/pages/*`, `robots.txt`, `sitemap.xml` | Cloudflare static assets (`public/`) |
| `/login`, `/signup`, `/dashboard`, `/logout`, `/api/*` | the Worker (`src/index.js`) |

`run_worker_first` in [`wrangler.jsonc`](wrangler.jsonc) decides which routes hit
the Worker; everything else falls through to the static site.

## Prerequisites

- Node.js 20+
- A Supabase project (Auth enabled, email/password provider on)
- The schema from the project's SQL applied, plus
  [`db/migrations/0001_customers_provisioning.sql`](db/migrations/0001_customers_provisioning.sql)

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # then fill in your Supabase values
npm run dev                      # wrangler dev — http://localhost:8787
```

`wrangler dev` runs the exact Workers runtime locally (not Node), so local
behavior matches production.

### Required secrets

Set in `.dev.vars` locally (gitignored) and in production with
`wrangler secret put <NAME>`:

| Name | Notes |
| --- | --- |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only.** Bypasses RLS. Never expose. |

## Deploy

```bash
npm run build      # wrangler dry-run bundle check
npm run deploy     # wrangler deploy
```

## Schema notes / gaps

The provided dump (`BBD.sql`) is solid. Things to confirm when wiring payments
later:

- Several columns are `USER-DEFINED` enums not included in the dump:
  `products.type`, `orders.status` (`order_status`), `invoices.status`
  (`invoice_status`), `subscriptions.status` (`subscription_status`),
  `entitlements.source`. Those `CREATE TYPE` statements need to exist.
- `entitlements` has no uniqueness constraint — consider a unique index on
  `(customer_id, product_id, source, source_id)` to make webhook upserts
  idempotent.
- RLS policies are only defined here for `customers`. The other user-facing
  tables (`orders`, `subscriptions`, `entitlements`, `download_events`) will
  need "read own rows" policies before any user-scoped client touches them.

## Roadmap

- [x] Server + Supabase + email/password auth (signup/login/logout)
- [x] Gated `/dashboard`
- [ ] Stripe Checkout + webhooks → `orders`, `subscriptions`, `entitlements`
- [ ] Product catalog pages from `products` / `prices`
- [ ] Entitlement-gated file downloads from Supabase Storage (`product_files`)
