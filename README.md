# DFM Platform

AI-powered DFM review platform. Upload your PRD and BOM, get FMEA report, project charter, and build timeline in minutes.

**Live at:** https://www.dfmplatform.com

---

## Setup Instructions

### 1. Supabase Database

1. Go to https://supabase.com → your project
2. Click **SQL Editor** → **New Query**
3. Paste the entire contents of `supabase-schema.sql`
4. Click **Run**

That creates all tables, security policies, and the storage bucket.

### 2. Environment Variables

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://fpukswvrvpzqbtlvvqws.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### 3. Install & Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 4. Deploy to Vercel

1. Go to https://vercel.com → **Add New Project**
2. Import from GitHub: `hansstam86/dfmplatform`
3. Add environment variables (same as `.env.local`)
4. Deploy

### 5. Connect Custom Domain

1. In Vercel: **Settings → Domains** → add `www.dfmplatform.com`
2. In GoDaddy DNS for dfmplatform.com:
   - CNAME: `www` → `cname.vercel-dns.com`
   - A: `@` → `76.76.21.21`

---

## File Structure

```
app/
  auth/
    login/page.tsx       — Login page
    signup/page.tsx      — Signup page
    signout/route.ts     — Sign out handler
  dashboard/page.tsx     — Projects dashboard
  projects/
    new/page.tsx         — New project wizard
    [id]/
      page.tsx           — Project detail (server)
      ProjectClient.tsx  — Project detail (client)
  api/
    generate/route.ts    — AI generation endpoint
    question/route.ts    — Q&A endpoint
lib/
  supabase.ts            — Browser Supabase client
  supabase-server.ts     — Server Supabase client
```

---

## How It Works

1. User signs up / logs in (Supabase Auth)
2. Creates a project — fills in product details, uploads PRD + BOM
3. Clicks Generate — calls `/api/generate` which:
   - Reads document text from Supabase Storage
   - Sends to Claude API with structured prompt
   - Saves FMEA, charter, and timeline as JSON to `outputs` table
4. User downloads PDF outputs
5. User asks up to 10 refinement questions via `/api/question`
