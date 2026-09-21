# Sunday Bakery

Weekly **bake-box pre-order** flow for an East Rand pilot: PWA-style front end with an Express API and **PayFast** checkout, plus email notifications via Nodemailer.

## Stack

- Node.js 18+ / Express
- dotenv, nodemailer
- PayFast payment integration
- Playwright (dev / smoke)

## Setup

```bash
cp .env.example .env
# fill PayFast + SMTP placeholders - never commit .env
npm install
npm start
```

Dev with reload:

```bash
npm run dev
```

Smoke check:

```bash
npm run smoke
```

## Screenshots

Optional: order form / confirmation UI under `docs/screenshots/`.

## Security

Live PayFast merchant keys and SMTP passwords belong only in local `.env` (gitignored). This repository ships `.env.example` with empty placeholders.
