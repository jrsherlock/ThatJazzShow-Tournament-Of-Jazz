# Tournament of Jazz

A March Madness-style 64-artist jazz bracket competition app for **That Jazz Show** on 89.7 KRUI-FM.

Fans fill out their brackets predicting which jazz legends will advance through 6 rounds, add per-matchup commentary, and compete on a scored leaderboard as the hosts reveal their master bracket live on-air.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 — "Speakeasy Nightclub" theme (dark blacks, gold accents, Playfair Display + Inter)
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Drag & Drop:** dnd-kit (desktop drag, mobile tap-to-select)
- **OG Images:** next/og for dynamic share cards
- **Hosting:** Vercel

## Features

### For Fans
- **Interactive bracket builder** — drag-and-drop on desktop, tap-to-select on mobile
- **Matchup preview modals** — host-written analysis, featured tracks, fun facts for every Round 1 matchup
- **Per-matchup commentary** — write your reasoning for each pick
- **Shareable brackets** — unique URL for each submission with dynamic OG image
- **Social sharing** — Facebook, LinkedIn, and Instagram download
- **Live leaderboard** — ESPN-style escalating scoring (1/2/4/8/16/32 pts per round, 192 max)

### For Hosts
- **Artist management** — CRUD for all 64 artists with photos, bios, era, instrument, featured tracks
- **Matchup preview editor** — write "Game Day" content for all 32 Round 1 matchups
- **Master bracket editor** — set the correct answers
- **Round-by-round reveal** — reveal results one round at a time on the show
- **Submissions viewer** — browse all participant brackets and scores

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with tournament info and countdown |
| `/play` | Interactive bracket builder |
| `/bracket/[accessToken]` | View a submitted bracket (shareable) |
| `/leaderboard` | Scored rankings (ISR, 60s revalidation) |
| `/admin` | Dashboard (password-protected) |
| `/admin/artists` | Artist CRUD |
| `/admin/matchup-previews` | Matchup preview editor |
| `/admin/master-bracket` | Master bracket editor |
| `/admin/reveal` | Round reveal controls |
| `/admin/submissions` | View all brackets |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=your-admin-password
```

The service role key is found in your Supabase dashboard under **Settings > API**. It bypasses RLS for admin operations (artist management, master bracket, reveal controls).

### Database Schema

The app uses 5 tables: `artists`, `tournament`, `master_bracket`, `matchup_previews`, `submissions`. RLS is enabled on all tables with public read policies.

### Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

1. Push to GitHub
2. Import the repo on [Vercel](https://vercel.com)
3. Add the environment variables above
4. Deploy

## Bracket Structure

4 regions (Vocalists, Band Leaders, Composers, Soloists) x 16 artists each. Standard March Madness seeding:

```
1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
```

32 Round 1 -> 16 Round 2 -> 8 Sweet 16 -> 4 Elite 8 -> 2 Final Four -> 1 Championship = **63 total picks**.

## Scoring

| Round | Games | Points per correct pick |
|-------|-------|------------------------|
| Round of 64 | 32 | 1 |
| Round of 32 | 16 | 2 |
| Sweet 16 | 8 | 4 |
| Elite 8 | 4 | 8 |
| Final Four | 2 | 16 |
| Championship | 1 | 32 |

**Max possible: 192 points.** Scoring only counts rounds that have been revealed by the hosts.

## Host Setup Flow

1. Log in to `/admin` with your admin password
2. Create a tournament
3. Add 64 artists with bios, photos, and featured tracks
4. Write matchup preview content for all 32 Round 1 matchups
5. Set your master bracket (correct answers)
6. Open the tournament for submissions
7. After the deadline, reveal results round-by-round on the show

## License

Private — built for That Jazz Show on KRUI 89.7 FM.
