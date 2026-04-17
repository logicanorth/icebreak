# Icebreak — Architecture & Engineering Rules

## What This Is
AI cold email personalizer. Free: 5 emails/day. Pro: $29/mo, unlimited + bulk CSV.
Live at: https://icebreak-silk.vercel.app
Stack: Next.js 15, TypeScript, Tailwind, Supabase, Stripe, Resend, Vercel.

---

## Architecture Rules (Non-Negotiable)

### 1. Every paid feature must actually exist before it appears in marketing copy
Do not list a feature on the pricing page unless it is fully built and accessible to Pro users.
Removing features from copy is NOT an acceptable fix — build them.

### 2. Stripe payment must result in a real account
After a user pays, they must receive:
- A magic link email (via Resend) letting them access their Pro account
- A persistent session (httpOnly cookie, signed JWT) that survives browser refresh
- A login path (`/login`) so they can re-authenticate from any device
localStorage flags are NOT acceptable for Pro gating. They are session-local and gameable.

### 3. Pro gating is server-side only
Every Pro API endpoint checks the session cookie server-side against Supabase.
Client-side Pro checks (localStorage, URL params) are only for UX hints — never for access control.

### 4. Auth flow
- Magic link only (no passwords)
- Flow: email → Resend sends signed token → `/auth/callback?token=xxx` → httpOnly cookie
- Cookie: `icebreak_session`, httpOnly, Secure, SameSite=Lax, 30-day expiry
- JWT payload: `{ email, exp }`
- JWT_SECRET stored in Vercel env vars (never in code)

### 5. Stripe webhook is the source of truth for subscription status
- Endpoint: `/api/webhook/stripe`
- Events handled: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- On `checkout.session.completed`: upsert user in Supabase, send magic link email
- On `subscription.deleted`: set `subscription_status = 'canceled'` in Supabase
- Always verify webhook signature with `STRIPE_WEBHOOK_SECRET`

### 6. Database schema (Supabase)
```sql
users:
  id              uuid PK default gen_random_uuid()
  email           text UNIQUE NOT NULL
  stripe_customer_id    text
  stripe_subscription_id text
  subscription_status   text DEFAULT 'inactive'  -- active | inactive | canceled | past_due
  created_at      timestamptz DEFAULT now()

magic_tokens:
  id         uuid PK default gen_random_uuid()
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE
  token      text UNIQUE NOT NULL
  expires_at timestamptz NOT NULL
  used       boolean DEFAULT false
  created_at timestamptz DEFAULT now()
```

### 7. Pro features that must be fully built
- **Unlimited emails/day**: enforced server-side; no rate limit for users with active subscription
- **Bulk CSV upload** (`/tool/bulk`): upload CSV (name, title, company_url, offer columns), server processes each row, returns downloadable results CSV
- **Export to CSV**: single email results can be downloaded as CSV from the tool page

### 8. Environment variables (all required)
```
ANTHROPIC_API_KEY        # Claude API
STRIPE_SECRET_KEY        # Stripe live secret
STRIPE_WEBHOOK_SECRET    # Stripe webhook signing secret
SUPABASE_URL             # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY # Supabase service role (server-side only)
RESEND_API_KEY           # Email sending
JWT_SECRET               # 32+ char random string for signing session tokens
```

### 9. Deployment
- Platform: Vercel
- Deploy: `VERCEL_TOKEN=... VERCEL_ORG_ID=... VERCEL_PROJECT_ID=... bunx vercel deploy --prod --yes`
- Do NOT use `--token=` flag syntax (broken). Use env var instead.
- Project: `prj_dEcmPJrN9flCqBYzREs8jG4ER6hC`, team: `team_RRK0U4cVgTOvRcdE5UaenyGK`

### 10. Test account
Operator test account email is stored in Supabase with `subscription_status = 'active'`.
Always maintain a working test Pro session for QA.

---

## Pages & Routes

| Path | Description |
|------|-------------|
| `/` | Landing page with pricing |
| `/tool` | Email generator (free + pro) |
| `/tool/bulk` | Bulk CSV generator (pro only) |
| `/login` | Email input → magic link |
| `/auth/callback` | Magic link handler → sets cookie |
| `/api/generate` | POST: generate one email |
| `/api/generate/bulk` | POST: process CSV, returns results (pro only) |
| `/api/checkout` | POST: create Stripe checkout session |
| `/api/webhook/stripe` | POST: handle Stripe events |
| `/api/portal` | POST: create Stripe customer portal session |
| `/api/auth/send-link` | POST: send magic link to email |
| `/api/auth/verify` | GET: verify token, set cookie |
| `/api/pro/status` | GET: check current user's pro status |

---

## What Happened Before (Do Not Repeat)
- Features listed in pricing were not built (CSV upload, export, priority speed)
- "Get Pro" button navigated to `/?upgrade=1` instead of calling Stripe checkout
- Post-payment "pro status" was set via localStorage — easily cleared, not portable, gameable
- No login page existed, so Pro users had no way to re-access their account
These were architectural failures. They are now documented here to prevent recurrence.
