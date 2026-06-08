# WriteUp

**WriteUp** is an Intelligent Tutoring System (ITS) that gives Vietnamese ESL
students grade-calibrated feedback on their English writing. It runs a
conversational, two-track feedback model (direct correction for grammar,
Socratic questioning for ideas and vocabulary) grounded in the Vietnam MOET
*Global Success* / *Tiếng Anh* textbook series and CEFR-aligned rubrics for
Grades 6–12.

The app also includes a peer space where students read each other's anonymous
drafts, leave comments and questions, post "learning questions" (struggles),
and earn points on a class leaderboard.

## Tech stack

| Layer       | Technology                                           |
| ----------- | ---------------------------------------------------- |
| Frontend    | React 19 + Vite, React Router                        |
| Backend     | Node.js + Express                                    |
| AI          | Anthropic Claude API (`@anthropic-ai/sdk`)           |
| Database    | Supabase (PostgreSQL) — optional via mock mode       |
| Deployment  | Frontend on Vercel · Backend on Railway              |

## Project structure

```
WriteUp/
├── README.md                 # this file
├── package.json              # root scripts (start backend)
└── WriteUp/
    ├── .env.example          # backend env template
    ├── package.json          # backend dependencies
    ├── src/                  # Express server + feedback engine
    │   ├── app.js
    │   ├── routes/           # /api conversation + grade routes
    │   └── lib/              # conversationEngine, rubric, curriculum, supabase
    └── client/
        ├── .env.example      # frontend env template
        ├── package.json      # frontend dependencies
        └── src/              # React app (pages, components, hooks)
```

## Running locally

### Prerequisites

- Node.js 18+ and npm
- An [Anthropic API key](https://console.anthropic.com/)
- (Optional) A [Supabase](https://app.supabase.com/) project — or use mock mode

### 1. Backend

```bash
cd WriteUp
npm install
cp .env.example .env        # then fill in the values
npm run dev                 # starts Express on http://localhost:3000
```

Set `MOCK_SUPABASE=true` in `.env` to run without a database (sessions are held
in memory). Leave `SUPABASE_URL` / `SUPABASE_ANON_KEY` blank when mocking.

### 2. Frontend

```bash
cd WriteUp/client
npm install
cp .env.example .env.local  # set VITE_API_URL=http://localhost:3000
npm run dev                 # starts Vite on http://localhost:5173
```

Open <http://localhost:5173>.

## Environment variables

### Backend (`WriteUp/.env`)

| Variable            | Required | Description                                              |
| ------------------- | -------- | -------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | yes      | Anthropic Claude API key                                 |
| `SUPABASE_URL`      | if not mocking | Supabase project URL                               |
| `SUPABASE_ANON_KEY` | if not mocking | Supabase anon/public key                           |
| `MOCK_SUPABASE`     | no       | `true` to bypass Supabase with in-memory sessions        |
| `PORT`              | no       | Server port (default `3000`)                             |
| `CLIENT_URL`        | no       | Extra allowed CORS origin (default: Vercel + localhost)  |

### Frontend (`WriteUp/client/.env.local`)

| Variable       | Required | Description                                  |
| -------------- | -------- | -------------------------------------------- |
| `VITE_API_URL` | yes      | Base URL of the backend API                  |

> **Security:** Real `.env` files are git-ignored. Never commit API keys.
> Only `.env.example` templates belong in the repo.

## Deployment

### Frontend — Vercel

- Root directory: `WriteUp/client`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://writeup-production.up.railway.app`
- SPA rewrites are configured in `WriteUp/vercel.json`.

Live: <https://writeup-delta.vercel.app>

### Backend — Railway

- Root directory: `WriteUp`
- Start command: `npm start` (`node src/app.js`)
- Environment variables: `ANTHROPIC_API_KEY`, `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, `MOCK_SUPABASE`, and optionally `CLIENT_URL`.

Live: <https://writeup-production.up.railway.app>

Set production secrets in each platform's dashboard — they are intentionally
kept out of version control.
