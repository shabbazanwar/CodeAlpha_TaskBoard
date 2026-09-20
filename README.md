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

## API

All routes return JSON and expect JSON. Errors have the shape
`{ "error": string, "details"?: { field: string[] } }`.

### Roles

Every project has a `ProjectMember` row per participant, including the owner.

| Role     | Can do                                                        |
| -------- | ------------------------------------------------------------- |
| `OWNER`  | Everything, including inviting and promoting members           |
| `ADMIN`  | Everything except being the owner; can invite members          |
| `MEMBER` | Read the project; create, edit, move and delete boards & tasks |

### Status codes

| Code  | Meaning                                                                       |
| ----- | ----------------------------------------------------------------------------- |
| `401` | Not signed in                                                                 |
| `403` | Signed in and a member, but the role is too low (for example inviting)         |
| `404` | The resource does not exist **or** the caller is not a member of its project   |
| `409` | Conflict — duplicate email on register, or the invitee is already a member     |
| `422` | Validation failed, or the assignee/board does not belong to this project       |

`404` covers non-members deliberately: answering `403` would confirm that a
project ID is real to someone who has no business knowing.

### Routes

| Method   | Route                          | Who                     | Notes                                          |
| -------- | ------------------------------ | ----------------------- | ---------------------------------------------- |
| `POST`   | `/api/auth/register`           | anyone                  | Creates a user; `409` if the email is taken     |
| `*`      | `/api/auth/[...nextauth]`      | anyone                  | NextAuth sign-in, sign-out and session          |
| `GET`    | `/api/projects`                | signed in               | Projects the caller owns or belongs to          |
| `POST`   | `/api/projects`                | signed in               | Caller becomes `OWNER`; seeds three columns     |
| `GET`    | `/api/projects/[id]`           | project member          | Full board: columns, tasks, members             |
| `POST`   | `/api/projects/[id]/members`   | **owner or admin**      | Invite by email; `404` if no such account       |
| `POST`   | `/api/projects/[id]/boards`    | project member          | Appends a column                                |
| `PATCH`  | `/api/boards/[id]`             | project member          | Rename and/or reposition                        |
| `POST`   | `/api/boards/[id]/tasks`       | project member          | Appends a card                                  |
| `GET`    | `/api/tasks/[id]`              | project member          | Task with its comment thread                    |
| `PATCH`  | `/api/tasks/[id]`              | project member          | Edit, move column, reorder, assign              |
| `DELETE` | `/api/tasks/[id]`              | project member          | Renumbers the column afterwards                 |
| `POST`   | `/api/tasks/[id]/comments`     | project member          | Adds a comment authored by the caller           |

### Rules enforced server-side

- Membership is checked on **every** route above, not just authentication.
  `lib/authz.ts` is the only place that check is written.
- Only `OWNER` and `ADMIN` may add members.
- A task can only be assigned to someone who is a member of that project.
- A task can only be moved to a board **in the same project**, so membership of
  a second project cannot be used to move cards across projects.
- `position` is a gap-free integer per column. Moving or deleting a task
  renumbers the affected columns inside one transaction.

## Build phases

- [x] **Phase 0** — scaffold: Next.js + Tailwind + Prisma wiring, no features
- [x] **Phase 1** — User model, NextAuth credentials auth, protected routes
- [x] **Phase 2** — Project / ProjectMember / Board / Task / Comment schema + seed
- [x] **Phase 3** — API routes with auth and membership checks
- [ ] **Phase 4** — Core UI (projects list, board view, task detail)
- [ ] **Phase 5** — Drag-and-drop
- [ ] **Phase 6** — Real-time updates via Socket.io
- [ ] **Phase 7** — Polish and deploy
