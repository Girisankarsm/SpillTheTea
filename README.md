<div align="center">

# SpillTheTea

**Anonymous neighborhood tea, duties, rides, and chat — built for your community.**

[![Live Demo](https://img.shields.io/badge/demo-spilltheteahere.vercel.app-6366f1?style=for-the-badge)](https://spilltheteahere.vercel.app/)
[![GitHub](https://img.shields.io/badge/source-Girisankarsm%2FSpillTheTea-181717?style=for-the-badge&logo=github)](https://github.com/Girisankarsm/SpillTheTea)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-Backend-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/atlas)
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
- [MongoDB Atlas setup](#mongodb-atlas-setup)
- [Authentication](#authentication)
- [Deploy](#deploy)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Links](#links)
- [License](#license)

---

## Overview

**SpillTheTea** is a progressive web app for local communities: post and discuss under **Tea** topics (with optional anonymity), explore conversations on a **map**, run small paid **duties**, coordinate **ride pooling**, and chat in real time with **DMs**, duty/ride threads, polls, GIFs, and push notifications.

Sign in with custom **email/password** auth or a **magic link**. Email sign-ups require inbox verification before the account is fully active.

| | |
|---|---|
| **Production** | [https://spilltheteahere.vercel.app/](https://spilltheteahere.vercel.app/) |
| **Source code** | [https://github.com/Girisankarsm/SpillTheTea](https://github.com/Girisankarsm/SpillTheTea) |
| **Stack** | Next.js App Router · React · MongoDB Atlas · Vercel |

---

## Features

| Area | What you get |
|------|----------------|
| **Tea** | Topics, anonymous posts, replies, upvotes, Hot/New sort, GIFs, images, share/QR, polls |
| **Map** | Browse and start topics geographically (open vs trending markers) |
| **Duties** | Post favors; helpers offer with a reward; pick, complete, pay in-app |
| **Ride pooling** | Pickup → drop; driver offers; live location; chat |
| **Messaging** | Topic boards, private DMs, duty & ride chat with server-owned APIs |
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
| Backend | [MongoDB Atlas](https://www.mongodb.com/atlas) + Next.js API routes |
| Maps | [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/) |
| State | [Zustand](https://zustand.docs.pmnd.dev/) |
| Hosting | [Vercel](https://vercel.com/) |
| Email (auth) | Custom auth + [Resend](https://resend.com/) email API |

---

## Getting started

### Prerequisites

- **Node.js** 20+ and **npm**
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
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

### 3. MongoDB Atlas

Complete [MongoDB Atlas setup](#mongodb-atlas-setup).

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
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `MONGODB_DB` | Yes | Database name (default: `spillthetea`) |
| `AUTH_SECRET` | Yes | Long random secret for signed session cookies |
| `RESEND_API_KEY` | Yes* | Sends verification and magic-link emails (*required for real email delivery) |
| `AUTH_EMAIL_FROM` | Yes* | Verified sender, e.g. `SpillTheTea <noreply@yourdomain.com>` |
| `GIPHY_API_KEY` | Yes* | GIF search (*required for GIF picker) |
| `NEXT_PUBLIC_APP_ADMIN_USER_IDS` | No | Comma-separated custom user IDs — can close any topic |
| `NEXT_PUBLIC_APP_ADMIN_VISITOR_IDS` | No | Demo/local admin visitor IDs |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | No | Web Push VAPID private key (never expose to client) |
| `VAPID_SUBJECT` | No | e.g. `mailto:hello@yourdomain.com` |

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

> **Security:** Never commit `.env.local`. Use Vercel **Environment Variables** for production.

---

## MongoDB Atlas setup

1. Create a MongoDB Atlas project and cluster.
2. Create a database user with read/write access.
3. Add your IP address in **Network Access** for local development.
4. Copy the Atlas connection string into `MONGODB_URI`.
5. Set `MONGODB_DB=spillthetea` or your preferred database name.

### Auth email with Resend

Verification and magic-link emails are sent through the [Resend email API](https://resend.com/docs/api-reference/emails/send):

| Field | Typical value |
|-------|----------------|
| `RESEND_API_KEY` | Your Resend API key (`re_...`) |
| `AUTH_EMAIL_FROM` | Verified address, e.g. `SpillTheTea <noreply@yourdomain.com>` |

---

## Authentication

| Method | Flow |
|--------|------|
| **Email + password** | Sign up → (optional) confirmation email → sign in |
| **Magic link** | Email link → `/api/auth/magic/verify` |

App logic:

- Normalizes email (`trim` + lowercase) on sign-up and sign-in.
- Treats accounts as **pending** until the verification link is clicked.
- **Resend confirmation** from the login screen.

Legal acceptance (Terms + Privacy) is required before sign-in and stored with the custom user record.

---

## Deploy

| Step | Action |
|------|--------|
| 1 | Push to `develop` |
| 2 | GitHub Actions merges `develop` → `main` |
| 3 | Vercel deploys `main` to production |

Set all required env vars in **Vercel → Project → Settings → Environment Variables** (including `MONGODB_URI`, `AUTH_SECRET`, `RESEND_API_KEY`, and VAPID keys for push).

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
│   │   ├── api/auth/    # Custom auth routes
│   │   ├── topics/       # Tea feed & rooms
│   │   ├── explore/      # Map
│   │   ├── duties/       # Favors
│   │   └── rides/        # Ride pooling
│   ├── components/       # UI (LoginScreen, maps, chat, …)
│   └── lib/              # MongoDB services, auth, store, types
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
| **MongoDB Atlas** | [mongodb.com/atlas](https://www.mongodb.com/atlas) |
| **Resend Email API** | [resend.com/docs/api-reference/emails/send](https://resend.com/docs/api-reference/emails/send) |

---

## License

Private project. All rights reserved.

---

<div align="center">

**[⬆ Back to top](#spillthetea)** · **[Star on GitHub](https://github.com/Girisankarsm/SpillTheTea)**

</div>
