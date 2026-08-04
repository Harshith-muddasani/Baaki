# Baaki — Frontend

React + TypeScript + Vite SPA for the Baaki expense settlement backend. Tailwind v4 + shadcn/ui (Base UI variant, Nova preset).

## Running locally

Requires the backend running on `http://localhost:8080` (see the repo root `README`/`CLAUDE.md` for `docker compose up` + `./gradlew bootRun`).

```bash
npm install
npm run dev      # http://localhost:5173
```

Optional `.env` (see `.env.example`) to point at a different API base URL.

## Demo-mode auth

There is no `/auth/login` endpoint on the backend yet (see the repo's `CLAUDE.md` / tech spec §4). The **Sign in** tab on the login screen lets you pick any existing user from a list with no password check, and **Create account** registers a real user via `POST /users` and logs in as them immediately. This is a deliberate, clearly-labeled stand-in — not how real authentication would work — so the rest of the app (which needs a "current user") is demoable without blocking on building JWT auth first.

## Screens

- **Login** — demo sign-in / account creation
- **Groups** — list + create
- **Group detail** — tabbed: Expenses (all 4 split types: equal, exact, percentage, shares), Balances, Settle up (suggested settlements + custom recording), Members

## Scripts

- `npm run dev` — dev server
- `npm run build` — typecheck (`tsc -b`) + production build
- `npm run lint` — oxlint
