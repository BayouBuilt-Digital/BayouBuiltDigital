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
| `STRIPE_SECRET_KEY` | Use the **test** key (`sk_test_…`) while developing. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` printed by `stripe listen` (local) or from the dashboard webhook (prod). |

## Testing the Stripe purchase flow (test mode)

The purchase flow is **login-gated** and fulfilled by a webhook — orders and
entitlements are written when Stripe confirms payment, not on redirect.

1. Apply [`db/migrations/0002_stashy_and_store_rls.sql`](db/migrations/0002_stashy_and_store_rls.sql)
   (seeds the Stashy product + a $12.00 price, adds store RLS).
2. Put your **test** Stripe secret key in `.dev.vars`.
3. In a second terminal, forward webhooks and copy the printed signing secret
   into `STRIPE_WEBHOOK_SECRET`:
   ```bash
   stripe listen --forward-to localhost:8787/api/stripe/webhook
   ```
4. `npm run dev`, sign in, go to **/products**, click **Buy Stashy**.
   - Signed out → you're redirected to `/login?next=/products` first.
5. Pay with test card `4242 4242 4242 4242` (any future expiry / any CVC).
6. You're returned to `/dashboard?purchase=success`; the webhook writes an
   `orders` + `order_items` row (`status='paid'`) and an `entitlements` row
   (`source='order'`), and **Stashy appears under "Your products."**

Trigger fulfillment without clicking through Checkout:
`stripe trigger checkout.session.completed` (note: a synthetic event won't carry
our metadata, so a real test purchase is the best end-to-end check).

Going live later = swap to live keys and point a dashboard webhook at
`https://<domain>/api/stripe/webhook`.

## Deploy

```bash
npm run build      # wrangler dry-run bundle check
npm run deploy     # wrangler deploy
# set production secrets once:
#   wrangler secret put SUPABASE_URL
#   wrangler secret put SUPABASE_ANON_KEY
#   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
#   wrangler secret put STRIPE_SECRET_KEY
#   wrangler secret put STRIPE_WEBHOOK_SECRET
```

## Schema notes

Confirmed against the live project — the enums already contain the values we
use: `product_type='digital'`, `order_status='paid'`, `entitlement_source='order'`.

Still worth doing later:

- `entitlements` has no uniqueness constraint. Webhook idempotency is currently
  handled via the `stripe_events` table (each event processed once), but a unique
  index on `(customer_id, product_id, source, source_id)` would add belt-and-suspenders.
- `subscriptions` / `invoices` / `download_events` still need "read own rows" RLS
  before any user-scoped (anon-key) client reads them. (The server uses the
  service-role key, which bypasses RLS.)

## Roadmap

- [x] Server + Supabase + email/password auth (signup/login/logout)
- [x] Gated `/dashboard` (Profile) with auth-aware navbar
- [x] Stripe Checkout (test mode) → `orders` / `order_items` / `entitlements`;
      login-gated purchase; Stashy shown under "Your products"
- [ ] Live product catalog rendered from `products` / `prices`
- [ ] Entitlement-gated file downloads from Supabase Storage (`product_files`)
- [ ] Subscriptions / invoices via Stripe Billing
