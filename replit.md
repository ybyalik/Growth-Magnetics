# Biznoz.com - SEO Backlink Marketplace

## Overview
A web-based marketplace where users exchange SEO value (Backlinks or Brand Mentions) using a "Credit" currency. The platform is heavily curated with admin approval workflows.

## Current State
- **Tech Stack**: Next.js, React, TypeScript, Firebase Auth, PostgreSQL with Drizzle ORM
- **Database**: Replit PostgreSQL (development and production separation)
- **Port**: 5000 (required for Replit webview)
- **Status**: Full application built with separate dev/prod databases

## Features Implemented

### Authentication
- Firebase Authentication with Google Sign-in
- User session management with AuthContext
- Protected routes for authenticated users

### Opportunities (/opportunities)
- **Browse Opportunities**: View "blind feed" with industry, format, and credits (hides target URL)
- Reserve slots using approved assets

### User Dashboard (/dashboard)
- **My Websites Tab**: View and submit websites for admin review
- **Links Submitted Tab**: View reserved slots and submit proof URLs
- **Credit History Tab**: View all credit transactions

### Automatic Domain Metrics & Category Detection
- When a user adds a new domain, the system automatically:
  - Extracts the root domain from each target URL (handles subdomains like blog.example.com → example.com)
  - Checks if domain metrics already exist in the database
  - If not, fetches DataForSEO metrics (backlinks, rank, spam score)
  - **Auto-detects categories** using DataForSEO's `categories_for_domain/live` API
  - Assigns primary category + up to 3 child categories based on keywords the domain ranks for
  - Deduplicates to avoid redundant API calls for the same domain
- Uses PSL (Public Suffix List) for accurate root domain extraction (handles .co.uk, etc.)
- Categories shown in "My Websites" table for each submitted domain

### Automatic Link Verification
- When publishers submit proof URLs, the system automatically verifies:
  - Link presence: Checks if the target URL is linked on the page
  - Anchor text match: Verifies the anchor text matches the target keyword
  - Link type: Confirms dofollow/nofollow attribute matches requirements
  - Brand mentions: For brand mention campaigns, checks if the keyword appears on the page
- Auto-verified links immediately credit the publisher
- Failed verifications show detailed feedback (e.g., "Anchor text mismatch", "Link type mismatch")
- **Retry**: Publishers can retry verification with a new proof URL if verification fails
- **Cancel**: Publishers can cancel reserved or failed slots, returning them to the open pool

### Admin Panel (/admin)
- **Site Queue**: Review and approve/reject pending websites
- **User Management**: Add/remove credits, manage roles
- **Refetch Metrics**: Bulk refresh DataForSEO domain metrics

### User Dashboard (/dashboard) - Link Calendar Tab
- Large monthly calendar view showing link activity
- Shows both "links received" (from your campaigns) and "links given" (work you completed)
- Color-coded indicators: green for received, blue for given
- Click on any date with links to see details in a popup modal
- Navigate between months to view historical data

## Database Schema

### Tables
- `users`: Firebase UID, email, role, credits, status
- `assets`: Domain, industry, metrics, credit value, status
- `campaigns`: Target URL/keyword, link type, format, quantity, reward
- `slots`: Campaign slots for reservations and submissions
- `transactions`: Credit transfer history

### Category Selection (DataForSEO Integration)
- **CategoryPicker Component**: Hierarchical category picker supporting parent + up to 3 child categories
- Categories fetched from DataForSEO Labs Categories API with 24-hour caching
- Used in campaign creation for more precise industry targeting
- Stored as category codes (integer) with names for display

## API Routes

### Auth
- `POST /api/auth/sync`: Sync Firebase user with database

### Categories
- `GET /api/categories`: Fetch DataForSEO categories (24hr cached)

### Assets
- `GET /api/assets`: Get user's assets
- `POST /api/assets`: Submit new asset

### Campaigns
- `GET /api/campaigns`: Get user's campaigns
- `POST /api/campaigns`: Create new campaign (now with category codes)
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
    transactions/    # Credit History
lib/
  firebase.ts        # Firebase configuration
  auth-context.tsx   # Auth context provider
  link-verifier.ts   # Automatic link verification utility
db/
  index.ts           # PostgreSQL database connection
  schema.ts          # Drizzle schema (PostgreSQL)
drizzle.config.ts    # Drizzle configuration
components/
  Layout.tsx         # Layout component
  CategoryPicker.tsx # Hierarchical category selector
  DashboardLayout.tsx # Dashboard sidebar layout
styles/
  globals.css        # Design system variables and base styles
  *.module.css       # CSS modules
```

## Design System

### Typography (Updated Dec 2025)
- **Headings**: Archivo Black (Google Fonts) - Bold, distinctive display font
- **Body**: Plus Jakarta Sans - Modern, readable sans-serif
- **Philosophy**: Distinctive font pairing that stands out from generic agency sites

### Color Palette
- **Primary (Red-Orange)**: #E33D2F for CTA buttons and interactive elements
- **Secondary (Mustard Yellow)**: #FDC056 for highlight sections, accents, and accent underlines
- **Backgrounds**: 
  - Cream (#F7F5F2) for main background
  - Off-white (#FAFAF9) for subtle sections
  - White (#FFFFFF) for cards
- **Dark Sections**: Rich Black (#0F0F0F) with backdrop blur cards
- **Text**: 
  - Primary: #0F0F0F for headings
  - Secondary: #3D3D3D for body text
  - Muted: #8A8A8A for subtle text
- **Status Indicators** (Traffic Light System):
  - Green (#059669): Active/Success/Published
  - Yellow (#D97706): Pending/Processing/Scheduled
  - Gray (#6B7280): Draft/Idle/Disabled
  - Red (#DC2626): Error/Rejected

### Layout Principles
- Asymmetric hero layouts with floating visual elements
- Warm cream backgrounds instead of stark white
- Bold statements with accent underlines
- Floating cards with elevated shadows
- Subtle gradient overlays for depth

### Component Styling
- **Buttons**: Pill-shaped (fully rounded), Red-Orange primary with white text, Light Grey secondary
- **Cards**: White background, 20px border radius, soft shadow (0 4px 20px rgba(0,0,0,0.05))
- **Navbar**: Sticky, white background, pill-shaped CTA buttons
- **Hero**: White background, large centered headline, client logo bar below
- **Dark Sections**: Black (#111111) background, semi-transparent cards, white text
- **Feature Section**: Mustard Orange (#FDC056) background with floating white cards
- **Footer**: Solid black background, white text

### Mascot Images
Four mascot images available in `/public/`:
- `mascot-map.webp` - Dog with map
- `mascot-search.webp` - Dog searching
- `mascot-desk.webp` - Dog at computer desk
- `mascot-digging.webp` - Dog digging

### CSS Architecture
All design tokens are defined as CSS variables in `globals.css` for easy maintenance and consistency across components.

## Development
Run with: `npm run dev`
Server runs on port 5000

## First-Time Setup
1. Configure Firebase credentials (see above)
2. Sign in with Google
3. First user can be made admin by manually updating the database
