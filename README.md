# CS Prep — Gamified Exit Exam Preparation Platform

A full-stack, gamified exam preparation platform for Computer Science students. Built with Next.js and Supabase, it features practice questions, exit exam simulations, study notes, learning bytes, document management, progress tracking, and an admin dashboard.

## Features

- **Practice Questions** — Browse by topic, filter by difficulty/source/major, shuffle mode, quiz interface with scoring
- **Exit Exam Simulator** — Timed mock exams with question grid navigation, auto-submit, and review mode
- **Study Notes** — Searchable, filterable notes with markdown rendering, YouTube video embeds, and GitHub auto-fetch
- **Learning Bytes** — Hierarchical knowledge snippets (subject → sub-topic → byte) with markdown content and image support
- **Documents** — PDF documents stored in Supabase Storage, filterable by topic and major
- **Daily Challenge** — Randomized daily question to keep your streak alive
- **Progress & Gamification** — XP, daily streaks, levels (Beginner → Grandmaster), topic-wise accuracy, weak topic detection
- **Authentication** — Email/password auth via Supabase, guest mode, registration with avatar upload
- **Profile Management** — Editable profile with avatar, bio, major, gender
- **Admin Dashboard** — Manage users, questions (single/bulk/GitHub import), notes, bytes, and document uploads
- **Dark/Light Mode** — Full theme support with system preference detection and no flash

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **UI** | React 19, Tailwind CSS, Lucide Icons |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (email/password, session management) |
| **Storage** | Supabase Storage (avatars, PDFs, images) |
| **Content** | Markdown (react-markdown + remark-gfm), PDF (react-pdf) |
| **State** | React Hooks + localStorage (offline-first) |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/               # Login, registration
│   ├── dashboard/          # Main dashboard
│   ├── questions/          # Practice questions
│   ├── exam/               # Exit exam simulator
│   ├── notes/              # Study notes
│   ├── bytes/              # Learning bytes
│   ├── documents/          # PDF documents
│   ├── progress/           # Progress analytics
│   ├── stats/              # Statistics
│   ├── profile/            # User profile
│   └── admin/              # Admin panel (users, questions, notes, bytes, documents)
├── components/             # Reusable UI (AuthProvider, Sidebar, ThemeProvider, etc.)
└── lib/                    # Core logic
    ├── dataLoader.ts       # Data fetching abstraction
    ├── progressManager.ts  # localStorage CRUD + Supabase sync
    ├── gamification.ts     # XP, streaks, levels, mastery
    ├── supabaseClient.ts   # Supabase client
    ├── supabaseLoader.ts   # Supabase CRUD
    ├── supabaseProgress.ts # Remote progress sync
    ├── githubFetcher.ts    # GitHub raw content fetching
    └── parsers.ts          # Question parsing (JSON/markdown)
```

## Data Persistence

Progress is stored locally (localStorage) for offline/guest use and synced to Supabase for logged-in users. On login, local progress is merged with remote progress. Questions, notes, and bytes are fetched from Supabase with in-memory caching and static fallback files.

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.local.example)
# Start development server
npm run dev

# Build for production
npm run build
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build (static export) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
