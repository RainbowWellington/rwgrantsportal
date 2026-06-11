# AGENTS.md

This document provides an overview of the project structure for developers and AI agents working on this codebase.

## Project Overview

A Grants Portal application with a public-facing grant application form (embeddable via iframe) and a protected admin portal for managing applications, updating statuses, adding comments, and managing admin users. Authentication is handled by Clerk.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Database | Neon (Postgres) via `@neondatabase/serverless` + Drizzle ORM |
| Authentication | Clerk (`@clerk/tanstack-react-start`) |
| File Storage | Vercel Blob (`@vercel/blob`) |
| Email | Resend HTTP API |
| Icons | Lucide React |
| Language | TypeScript 5.7 (strict mode) |
| Deployment | Vercel |

## Directory Structure

```
├── db/
│   ├── schema.ts              # Drizzle ORM table definitions (applications, comments, adminUsers, assessments, fundingRounds)
│   └── index.ts               # Database client (drizzle-orm/neon-http, lazy Proxy pattern)
├── drizzle.config.ts          # Drizzle Kit config (migrations output to drizzle/migrations/)
├── drizzle/
│   └── migrations/            # Auto-generated SQL migrations (DO NOT edit applied migrations)
├── src/
│   ├── components/
│   │   ├── CallbackHandler.tsx # No-op: Clerk handles OAuth callbacks internally
│   │   └── StatusBadge.tsx    # Application status badge component + status constants
│   ├── lib/
│   │   ├── assessment.ts      # Scoring criteria & weighting logic
│   │   ├── auth.ts            # getServerUser() – server-side Clerk auth
│   │   ├── email.ts           # Email sending via Resend HTTP API
│   │   ├── generate-application-pdf.ts # jsPDF generation
│   │   └── identity-context.tsx # useIdentity() hook + ClerkProvider re-export
│   ├── middleware/
│   │   └── identity.ts        # TanStack Start middleware (identityMiddleware, requireAuthMiddleware, requireAdminRoleMiddleware)
│   ├── routes/
│   │   ├── __root.tsx         # Root layout: ClerkProvider, global styles
│   │   ├── index.tsx          # Landing page with links to apply and admin login
│   │   ├── apply.tsx          # Public grant application form (embeddable via iframe)
│   │   ├── login.tsx          # Login page (Clerk sign-in UI)
│   │   ├── login/factor-one.tsx # MFA factor selection
│   │   ├── reset-password.tsx # Password reset
│   │   ├── admin.tsx          # Admin layout with sidebar, auth guard, auto-register first admin
│   │   └── admin/
│   │       ├── index.tsx      # Admin dashboard with application statistics
│   │       ├── applications.tsx # Applications list with search and status filter
│   │       ├── applications/$id.tsx # Application detail: view data, change status, comments
│   │       ├── assessments.tsx # Assessment scoring interface
│   │       ├── criteria.tsx   # Assessment criteria reference
│   │       ├── grants-overview.tsx # Data export/reporting
│   │       ├── rounds.tsx     # Funding rounds management
│   │       ├── rounds/$id.tsx # Round detail view
│   │       └── users.tsx      # Admin user management (add/remove by email)
│   ├── server/
│   │   ├── admin-users.ts     # Server functions: CRUD admin users, auto-register first admin
│   │   ├── applications.ts    # Server functions: submit, list, get, update status, stats
│   │   ├── assessments.ts     # Server functions: scoring CRUD
│   │   ├── comments.ts        # Server functions: get and add comments
│   │   ├── funding-rounds.ts  # Server functions: funding round CRUD
│   │   └── uploads.ts         # Server functions: Vercel Blob upload/download
│   ├── router.tsx             # TanStack Router setup
│   └── styles.css             # Global Tailwind CSS styles
├── vercel.json                # Permissive iframe headers for /apply route
├── package.json
├── tsconfig.json
└── vite.config.ts             # Vite plugins: TanStack Start, React, Tailwind, Nitro
```

## Key Concepts

### Authentication Architecture

- **Clerk** handles user authentication via `@clerk/tanstack-react-start`
- Server-side auth: `getServerUser()` in `src/lib/auth.ts` reads the Clerk JWT during SSR
- Client-side auth: `useIdentity()` hook from `src/lib/identity-context.tsx` wraps Clerk hooks
- Admin authorization: checked against the `admin_users` database table (allow-list by email)
- First user to log in is automatically registered as admin (bootstrap flow)
- Two roles: `admin` (full access) and `reviewer` (read/edit applications, no user management)

### Database

- **Neon** serverless Postgres via `@neondatabase/serverless` + `drizzle-orm/neon-http`
- Connection string read from `POSTGRES_URL` (or `DATABASE_URL` / `TEST_DB_URL`) **inside** `getDatabase()` — never at module load time
- Required env var: `POSTGRES_URL`

### File Storage

- **Vercel Blob** via `@vercel/blob` (`put()`, `head()`)
- Used for grant application file uploads (no auth required on upload — only the public `/apply` form uploads)
- Blob token auto-read by the SDK from `BLOB_READ_WRITE_TOKEN`

### Email

- **Resend** HTTP API (`https://api.resend.com/emails`)
- Required env var: `RESEND_API_KEY`
- Optional env var: `EMAIL_FROM` (defaults to hardcoded address)
- Admin notification address: `hello@rainbowwellington.org.nz` (hardcoded in `src/lib/email.ts`)

### Database Schema

Five tables:
- `applications` — Grant application submissions with all form fields, status, and file refs
- `comments` — Admin comments linked to applications
- `admin_users` — Email-based admin authorization list (roles: admin | reviewer)
- `assessments` — Scoring rubric entries per application per reviewer
- `fundingRounds` — Grant funding cycles (open/closed)

Schema changes: run `npx drizzle-kit generate` → `npx drizzle-kit migrate`.

### Embeddable Form

The `/apply` route is designed to work inside an iframe. `vercel.json` sets permissive `X-Frame-Options` and `Content-Security-Policy` headers for this route.

### Application Statuses

- `submitted` — Initial status when applicant submits
- `under_review` — Admin has started reviewing
- `approved` — Grant approved
- `declined` — Grant declined
- `more_info_needed` — Additional information requested
- `paid` — Payment issued
- `completed` — Process complete

### Assessment Scoring

Weighted rubric with 8 criteria (see `src/lib/assessment.ts`). Each scored 1–5.
Tiers: Tier 1 ≥80%, Tier 2 50–79%, Tier 3 <50%. Max award limited to 25% of grant pool.

### File-Based Routing (TanStack Router)

Routes are defined by files in `src/routes/`:
- `__root.tsx` — Root layout wrapping all pages
- `admin.tsx` — Layout route for `/admin/*` (renders sidebar + Outlet)
- `admin/*.tsx` — Child routes under the admin layout

### Server Functions

All database and storage operations go through TanStack Start server functions in `src/server/`. Admin operations use `requireAuthMiddleware` or `requireAdminRoleMiddleware`. The public `submitApplication` and `uploadFile` functions have no auth requirement.

## Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `POSTGRES_URL` | Neon database connection string |
| `CLERK_SECRET_KEY` | Clerk backend secret |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk frontend publishable key (build-time) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |
| `RESEND_API_KEY` | Email sending via Resend |
| `EMAIL_FROM` | Sender address for emails (optional) |

## Development Commands

```bash
npm run dev              # Start dev server (port 3000)
npx drizzle-kit generate # Generate migrations after schema changes
npx drizzle-kit migrate  # Apply pending migrations
```

## Conventions

### Naming
- Components: PascalCase
- Server functions: camelCase
- Routes: kebab-case files
- Database columns: snake_case (Postgres convention)

### Styling
- Tailwind CSS utility classes
- Consistent rounded corners (rounded-lg, rounded-xl, rounded-2xl)
- Indigo as primary color, gray for neutrals

### TypeScript
- Strict mode enabled
- Import paths use `@/` alias
- `.js` extension in imports for ES module compatibility

### State Management
- React hooks for local state
- Server functions for data fetching
- No global client-side store needed
