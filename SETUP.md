# Setup Instructions

## Prerequisites
- Node.js 18+ installed
- Bun package manager installed
- Supabase account

## 1. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database Configuration (from Supabase)
DATABASE_URL=your_supabase_database_url
DIRECT_URL=your_supabase_direct_url

# Next.js Configuration
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
```

## 2. Supabase Setup

1. Create a new project in Supabase
2. Enable Email authentication in Authentication > Settings
3. Copy your project URL and anon key to `.env.local`
4. Get your database URL from Settings > Database

### 2.1 Storage Setup

1. Go to Supabase Dashboard > SQL Editor
2. Run the SQL script from `supabase-storage-setup.sql` to create the storage bucket and policies
3. This will create the `user-images` bucket with proper Row Level Security policies

## 3. Database Setup

Generate Prisma client and push schema to database:

```bash
bunx prisma generate
bunx prisma db push
```

## 4. Install Dependencies

```bash
bun install
```

## 5. Run Development Server

```bash
bun dev
```

## Features

✅ Magic link authentication via Supabase
✅ Protected dashboard routes
✅ User profile management
✅ Clean, responsive UI with shadcn/ui
✅ Sidebar navigation
✅ Settings page with form validation

## Usage

1. Visit `http://localhost:3000`
2. Enter your email to receive a magic link
3. Click the link to authenticate
4. Access dashboard and settings

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Authentication**: Supabase Auth (Magic Links)
- **Database**: PostgreSQL (via Supabase), Prisma ORM
- **Package Manager**: Bun