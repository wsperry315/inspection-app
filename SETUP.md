# MoveCheck — Setup Guide

## Prerequisites
- Node.js 18+ (install from https://nodejs.org)
- A Supabase account (free at https://supabase.com)

## 1. Supabase setup

1. Create a new project at supabase.com
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key

## 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## 4. Usage

### As a landlord:
1. Sign up at `/signup` and choose **Landlord**
2. Go to **Properties** → add your first property
3. Click **New inspection** on a property
4. Enter tenant name + email, choose move-in or move-out
5. Copy the generated link and send it to your tenant

### As a tenant:
- Open the link your landlord sent (no account needed)
- Enter your name, walk through each room
- Rate each item (Excellent / Good / Fair / Poor / N/A)
- Add photos by tapping the camera area
- Sign at the end and submit

### PDF report:
- From the landlord's inspection detail page, click **Download PDF**

## App structure

```
src/
  app/
    page.tsx                    — Landing page
    login/                      — Auth
    signup/
    landlord/
      dashboard/                — Stats overview
      properties/               — Property + inspection management
      inspections/[id]/         — Inspection detail + PDF download
    tenant/
      inspect/[id]/             — Tenant inspection flow (no auth required)
      dashboard/                — Tenant's inspection list
    api/auth/signout/
  components/
    inspection/
      TenantInspectionFlow.tsx  — Room-by-room UI with photo upload
      InspectionPDFDownload.tsx — Client PDF trigger
      generatePDF.tsx           — @react-pdf/renderer document
  lib/supabase/                 — Browser + server + middleware clients
  types/                        — TypeScript types + default room/item templates
supabase/
  schema.sql                    — Full database schema + RLS policies
```
