# SpillTheTea

**Live app:** [https://spill-the-tea-lilac.vercel.app/](https://spill-the-tea-lilac.vercel.app/)

Anonymous convo rooms, a map of open tea rooms, small paid favors (“duties”), polls, and profiles — sign in with Google to use the app.

## Features

- **Tea rooms** — open anonymous chat rooms, replies, GIFs, images, share/QR, polls
- **Map** — browse and start rooms on a map (yellow = open, fire = trending)
- **Duties** — post favors, helpers offer with a reward, pick one, complete, reward in-app
- **Chakra** — reputation earned from completed duties
- **Profiles** — anonymous display name and profile photo
- **Private chats** — DM someone from a room
- **PWA** — add to home screen on mobile for an app-like experience

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Supabase](https://supabase.com/) — auth, Postgres, realtime, storage
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Leaflet](https://leafletjs.com/) / react-leaflet — map
- [Vercel](https://vercel.com/) — hosting

## Local development

### 1. Clone and install

```bash
git clone https://github.com/Girisankarsm/SpillTheTea.git
cd SpillTheTea
npm install
```

### 2. Environment variables

Copy `env.example` to `.env.local` and fill in your values:

```bash
cp env.example .env.local
```

Required:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `GIPHY_API_KEY` | GIF search ([Giphy dashboard](https://developers.giphy.com/dashboard/)) |

Optional:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_ADMIN_USER_IDS` | Comma-separated user UUIDs who can close any tea room |
| `NEXT_PUBLIC_APP_ADMIN_VISITOR_IDS` | Local demo admin visitor IDs |

### 3. Supabase setup

1. Create a Supabase project and enable **Google** under Authentication → Providers.
2. In **Authentication → URL Configuration**, set:
   - **Site URL:** your production URL (e.g. `https://spill-the-tea-lilac.vercel.app`)
   - **Redirect URLs:** production URL, `http://localhost:3000/**`
3. Run SQL migrations in order in the Supabase SQL Editor (files in `supabase/migrations/`, `001` → `012`).

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Production deploys automatically:

1. Push to the `develop` branch
2. GitHub Actions merges `develop` → `main`
3. Vercel deploys `main` to production

Set the same environment variables in **Vercel → Project → Settings → Environment Variables**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | ESLint |

## Repository

- **GitHub:** [github.com/Girisankarsm/SpillTheTea](https://github.com/Girisankarsm/SpillTheTea)
- **Production:** [spill-the-tea-lilac.vercel.app](https://spill-the-tea-lilac.vercel.app/)

## License

Private project. All rights reserved.
