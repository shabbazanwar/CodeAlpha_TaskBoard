# CodeAlpha_TaskBoard

A collaborative project management tool (projects, boards, tasks, comments) built with
Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma and PostgreSQL (Neon).

## Stack

| Concern   | Choice                              |
| --------- | ----------------------------------- |
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling   | Tailwind CSS                        |
| ORM       | Prisma 6                            |
| Database  | PostgreSQL (Neon)                   |

## Project structure

```
app/          routes and pages (App Router)
app/api/      route handlers
components/   shared React components
lib/          server/client helpers (lib/prisma.ts — Prisma singleton)
prisma/       schema.prisma and migrations
```

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill it in:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — Neon **pooled** connection string (the host contains `-pooler`).
     Used by the app at runtime.
   - `DIRECT_URL` — the same string **without** `-pooler`. Used by `prisma migrate`,
     which cannot run through the transaction pooler.
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`.

   Both connection strings are in the Neon console under your project → **Connect**
   (choose the *Prisma* snippet).

   > **Outbound port 5432 must be reachable.** Some home and office networks block it,
   > which surfaces as `P1001: Can't reach database server`. A mobile hotspot, VPN or
   > Cloudflare WARP gets around it.

3. Generate the Prisma client and run the app:

   ```bash
   npm run db:generate
   npm run dev
   ```

   The app runs at http://localhost:3000.

## Scripts

| Script                | Purpose                             |
| --------------------- | ----------------------------------- |
| `npm run dev`         | Start the dev server                |
| `npm run build`       | Production build                    |
| `npm run start`       | Serve the production build          |
| `npm run lint`        | ESLint                              |
| `npm run db:generate` | `prisma generate`                   |
| `npm run db:push`     | Push the schema without a migration |
| `npm run db:migrate`  | Create and apply a dev migration    |
| `npm run db:studio`   | Open Prisma Studio                  |

## Build phases

- [x] **Phase 0** — scaffold: Next.js + Tailwind + Prisma wiring, no features
- [ ] **Phase 1** — User model, NextAuth credentials auth, protected routes
- [ ] **Phase 2** — Project / ProjectMember / Board / Task / Comment schema + seed
- [ ] **Phase 3** — API routes with auth and membership checks
- [ ] **Phase 4** — Core UI (projects list, board view, task detail)
- [ ] **Phase 5** — Drag-and-drop
- [ ] **Phase 6** — Real-time updates via Socket.io
- [ ] **Phase 7** — Polish and deploy
