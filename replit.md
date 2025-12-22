# LinkExchange - SEO Backlink Marketplace

## Overview
A web-based marketplace where users exchange SEO value (Backlinks or Brand Mentions) using a "Credit" currency. The platform is heavily curated with admin approval workflows.

## Current State
- **Tech Stack**: Next.js, React, TypeScript, Firebase Auth, SQLite with Drizzle ORM
- **Port**: 5000 (required for Replit webview)
- **Status**: Full application built, awaiting Firebase configuration

## Features Implemented

### Authentication
- Firebase Authentication with Google Sign-in
- User session management with AuthContext
- Protected routes for authenticated users

### User Dashboard (/dashboard)
- **My Assets Tab**: View and submit websites for admin review
- **Exchange History Tab**: View all credit transactions

### Asset Management
- Users submit websites (domains) for review
- Assets have status: pending, approved, rejected, disabled
- Approved assets can be used to earn credits

### Campaign System (/campaigns/new)
- Create campaigns to request backlinks
- Set target URL, keyword, link type, placement format
- Set industry, quantity, and credit reward per link
- Credits are deducted when creating campaigns

### Earn Credits (/earn)
- **Browse Opportunities**: View "blind feed" with industry, format, and credits (hides target URL)
- **My Work**: View reserved slots and submit proof URLs
- Reserve slots using approved assets
- Submit proof URL for admin verification

### Admin Panel (/admin)
- **Site Queue**: Review and approve/reject pending websites
- **Job Queue**: Verify completed work and release credits
- **User Management**: Add/remove credits, manage roles

### Link Calendar (/calendar)
- Monthly calendar view showing when links were received
- Click on any date to see details of links received that day
- Shows target URL, anchor text, link type, placement format, and publisher domain
- Navigate between months to view historical data

## Database Schema

### Tables
- `users`: Firebase UID, email, role, credits, status
- `assets`: Domain, industry, metrics, credit value, status
- `campaigns`: Target URL/keyword, link type, format, quantity, reward
- `slots`: Campaign slots for reservations and submissions
- `transactions`: Credit transfer history

## API Routes

### Auth
- `POST /api/auth/sync`: Sync Firebase user with database

### Assets
- `GET /api/assets`: Get user's assets
- `POST /api/assets`: Submit new asset

### Campaigns
- `GET /api/campaigns`: Get user's campaigns
- `POST /api/campaigns`: Create new campaign
- `GET /api/campaigns/feed`: Get blind feed
- `GET /api/campaigns/received-links`: Get approved links for user's campaigns (calendar data)

### Slots
- `POST /api/slots/reserve`: Reserve a slot
- `POST /api/slots/submit`: Submit proof URL
- `GET /api/slots/my-slots`: Get user's reserved slots

### Admin
- `GET/PUT /api/admin/assets`: Manage pending assets
- `GET/PUT /api/admin/slots`: Manage pending jobs
- `GET/PUT /api/admin/users`: Manage users and credits

## Environment Variables Required

### Firebase (Required for authentication)
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API key
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID

## Firebase Setup Instructions
1. Go to Firebase Console and create a new project
2. Add a web app to the project
3. Enable Google sign-in in Authentication settings
4. Add the Replit dev URL to authorized domains
5. Copy the project ID, API key, and app ID to environment variables

## Project Structure
```
pages/
  index.tsx          # SEO-optimized homepage
  _app.tsx           # App wrapper with AuthProvider
  earn.tsx           # Earn credits page
  dashboard/
    index.tsx        # User dashboard
  campaigns/
    new.tsx          # Create campaign
  admin/
    index.tsx        # Admin panel
  api/
    auth/            # Authentication routes
    assets/          # Asset management routes
    campaigns/       # Campaign routes
    slots/           # Slot management routes
    admin/           # Admin routes
    transactions/    # Transaction history
lib/
  firebase.ts        # Firebase configuration
  auth-context.tsx   # Auth context provider
db/
  index.ts           # Database connection
  schema.ts          # Drizzle schema
components/
  Layout.tsx         # Layout component
styles/
  globals.css        # Design system variables and base styles
  *.module.css       # CSS modules
data/
  marketplace.db     # SQLite database
```

## Design System

### Color Palette
- **Primary**: Indigo (#4F46E5) for buttons and interactive elements
- **Accent**: Purple (#7C3AED) for gradients
- **Backgrounds**: White (#FFFFFF) and Light Gray (#F5F7FA)
- **Text**: Dark Gray (#1F2937) for primary, muted grays for secondary
- **Status Indicators** (Traffic Light System):
  - Green (#10B981): Active/Success/Published
  - Yellow (#F59E0B): Pending/Processing/Scheduled
  - Gray (#9CA3AF): Draft/Idle/Disabled
  - Red (#EF4444): Error/Rejected

### Typography
- **Font**: Inter (Google Fonts)
- **Hierarchy**: Weight-based (Bold for headers, Regular for body)
- **Sizes**: Consistent scale from xs (0.75rem) to 4xl (2.5rem)

### Layout Principles
- Generous whitespace for breathability
- Card-based layouts with soft borders (1px #E5E7EB)
- Rounded corners (8-16px radius)
- Subtle shadows for depth

### CSS Architecture
All design tokens are defined as CSS variables in `globals.css` for easy maintenance and consistency across components.

## Development
Run with: `npm run dev`
Server runs on port 5000

## First-Time Setup
1. Configure Firebase credentials (see above)
2. Sign in with Google
3. First user can be made admin by manually updating the database
