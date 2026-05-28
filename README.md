<div align="center">

# SpillTheTea

**Anonymous neighborhood tea, duties, rides, and chat — built for your community.**

[![Live Demo](https://img.shields.io/badge/demo-spilltheteahere.vercel.app-6366f1?style=for-the-badge)](https://spilltheteahere.vercel.app/)
[![GitHub](https://img.shields.io/badge/source-Girisankarsm%2FSpillTheTea-181717?style=for-the-badge&logo=github)](https://github.com/Girisankarsm/SpillTheTea)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

[Live app](https://spilltheteahere.vercel.app/) · [Repository](https://github.com/Girisankarsm/SpillTheTea) · [Report issue](https://github.com/Girisankarsm/SpillTheTea/issues)

</div>

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Database migrations](#database-migrations)
- [Authentication](#authentication)
- [Deploy](#deploy)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Links](#links)
- [License](#license)

---

## Overview

**SpillTheTea** is a progressive web app for local communities: post and discuss under **Tea** topics (with optional anonymity), explore conversations on a **map**, run small paid **duties**, coordinate **ride pooling**, and chat in real time with **DMs**, duty/ride threads, polls, GIFs, and push notifications.

Sign in with **Google** or **email** (password or magic link). Email sign-ups can require **inbox verification** before the account is fully active.

| | |
|---|---|
| **Production** | [https://spilltheteahere.vercel.app/](https://spilltheteahere.vercel.app/) |
| **Source code** | [https://github.com/Girisankarsm/SpillTheTea](https://github.com/Girisankarsm/SpillTheTea) |
| **Stack** | Next.js App Router · React · Supabase · Vercel |

---

## Features

| Area | What you get |
|------|----------------|
| **Tea** | Topics, anonymous posts, replies, upvotes, Hot/New sort, GIFs, images, share/QR, polls |
| **Map** | Browse and start topics geographically (open vs trending markers) |
| **Duties** | Post favors; helpers offer with a reward; pick, complete, pay in-app |
| **Ride pooling** | Pickup → drop; driver offers; live location; chat |
| **Messaging** | Topic boards, private DMs, duty & ride chat — **realtime** via Supabase |
| **Push (PWA)** | Web Push for DMs, duty chat, and ride chat |
| **Chakra** | Reputation from completed duties |
| **Profiles** | Display name, avatar, optional payment hints (privacy-aware) |
| **PWA** | Install to home screen for an app-like experience |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, React Server Components where applicable) |
| UI | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Backend | [Supabase](https://supabase.com/) — Auth, Postgres, Realtime, Storage |
| Maps | [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/) |
| State | [Zustand](https://zustand.docs.pmnd.dev/) |
| Hosting | [Vercel](https://vercel.com/) |
| Email (auth) | Supabase Auth + optional [Resend](https://resend.com/) SMTP |

---

## Getting started

### Prerequisites

- **Node.js** 20+ and **npm**
- A [Supabase](https://supabase.com/) project
- (Optional) [Giphy](https://developers.giphy.com/dashboard/) API key for GIF search
- (Optional) [Resend](https://resend.com/) account for reliable auth emails

### 1. Clone and install

```bash
git clone https://github.com/Girisankarsm/SpillTheTea.git
cd SpillTheTea
npm install
```

### 2. Configure environment

```bash
cp env.example .env.local
```

Edit `.env.local` — see [Environment variables](#environment-variables).

### 3. Supabase

Complete [Supabase setup](#supabase-setup) and run [migrations](#database-migrations).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The login page is at `/login`.

---

## Environment variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (e.g. `https://spilltheteahere.vercel.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase **anon** (public) key |
| `GIPHY_API_KEY` | Yes* | GIF search (*required for GIF picker) |
| `NEXT_PUBLIC_APP_ADMIN_USER_IDS` | No | Comma-separated Supabase user UUIDs — can close any topic |
| `NEXT_PUBLIC_APP_ADMIN_VISITOR_IDS` | No | Demo/local admin visitor IDs |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server-only; push delivery to other users |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | No | Web Push VAPID private key (never expose to client) |
| `VAPID_SUBJECT` | No | e.g. `mailto:hello@yourdomain.com` |

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

> **Security:** Never commit `.env.local`. Use Vercel **Environment Variables** for production.

---

## Supabase setup

### URL configuration

**Authentication → URL Configuration**

| Setting | Value |
|---------|--------|
| **Site URL** | `https://spilltheteahere.vercel.app` |
| **Redirect URLs** | `https://spilltheteahere.vercel.app/**`, `http://localhost:3000/**` |

Confirmation and OAuth flows return to `/auth/callback` on your domain.

### Providers

| Provider | Dashboard path | Notes |
|----------|----------------|-------|
| **Google** | Authentication → Providers → Google | OAuth client from Google Cloud; callback `https://<project>.supabase.co/auth/v1/callback` |
| **Email** | Authentication → Providers → Email | Password sign-up / sign-in; enable **Confirm email** for verify-before-login |

### Custom SMTP (recommended for auth email)

If confirmation or magic-link emails do not arrive, use **Authentication → Emails → SMTP** with [Resend](https://resend.com/docs/send-with-supabase-smtp):

| Field | Typical value |
|-------|----------------|
| Host | `smtp.resend.com` |
| Port | `465` or `587` (per Resend docs) |
| Username | `resend` |
| Password | Your Resend **API key** (`re_...`) |
| Sender email | Verified address (e.g. `onboarding@resend.dev` or `noreply@yourdomain.com`) |
| Sender name | `SpillTheTea` |

---

## Database migrations

Run SQL files **in order** in the Supabase SQL Editor: `supabase/migrations/`.

| # | File | Purpose |
|---|------|---------|
| 001 | `001_initial.sql` | Core schema |
| 002–007 | topics, profiles, polls, deletes | Topics & profiles |
| 008–015 | duties | Duties & offers |
| 010 | `010_chakra.sql` | Reputation |
| 013–018 | duty messages, realtime | Chat & live updates |
| 019–023 | rides | Pooling, messages, vehicles, live location |
| 021 | `021_push_subscriptions.sql` | Web Push |
| 024 | `024_message_upvotes.sql` | Upvotes & Hot/New |
| 025–028 | profiles | Payments & avatar security |

---

## Authentication

| Method | Flow |
|--------|------|
| **Google** | OAuth → `/auth/callback` → app |
| **Email + password** | Sign up → (optional) confirmation email → sign in |
| **Magic link** | Email OTP link → `/auth/callback` |

App logic (`src/lib/supabase/auth.ts`):

- Normalizes email (`trim` + lowercase) on sign-up and sign-in.
- Treats accounts as **pending** until `email_confirmed_at` is set when **Confirm email** is enabled.
- **Resend confirmation** from the login screen.

Legal acceptance (Terms + Privacy) is required before sign-in; a short-lived cookie is checked on `/auth/callback`.

---

## Deploy

| Step | Action |
|------|--------|
| 1 | Push to `develop` |
| 2 | GitHub Actions merges `develop` → `main` |
| 3 | Vercel deploys `main` to production |

Set all required env vars in **Vercel → Project → Settings → Environment Variables** (including `SUPABASE_SERVICE_ROLE_KEY` and VAPID keys for push).

**Production domain:** [spilltheteahere.vercel.app](https://spilltheteahere.vercel.app)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (webpack) |
| `npm run dev:turbo` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run start:network` | Production server on `0.0.0.0` (LAN testing) |
| `npm run lint` | ESLint |

---

## Project structure

```text
SpillTheTea/
├── src/
│   ├── app/              # Next.js App Router (pages, API routes)
│   │   ├── login/        # Auth UI
│   │   ├── auth/callback/# OAuth & email link handler
│   │   ├── topics/       # Tea feed & rooms
│   │   ├── explore/      # Map
│   │   ├── duties/       # Favors
│   │   └── rides/        # Ride pooling
│   ├── components/       # UI (LoginScreen, maps, chat, …)
│   └── lib/              # Supabase auth, store, types
├── supabase/migrations/  # Postgres migrations
├── public/               # PWA manifest, icons, SW
├── middleware.ts         # Auth gate for protected routes
└── env.example           # Environment template
```

---

## Links

| Resource | URL |
|----------|-----|
| **GitHub repository** | [github.com/Girisankarsm/SpillTheTea](https://github.com/Girisankarsm/SpillTheTea) |
| **Live application** | [spilltheteahere.vercel.app](https://spilltheteahere.vercel.app/) |
| **Supabase** | [supabase.com/dashboard](https://supabase.com/dashboard) |
| **Resend + Supabase SMTP** | [resend.com/docs/send-with-supabase-smtp](https://resend.com/docs/send-with-supabase-smtp) |

---

## License

Private project. All rights reserved.

---

<div align="center">

**[⬆ Back to top](#spillthetea)** · **[Star on GitHub](https://github.com/Girisankarsm/SpillTheTea)**

</div>
