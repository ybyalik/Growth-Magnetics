# LinkExchange - SEO Backlink Marketplace

## Overview
A web-based marketplace where users exchange SEO value (Backlinks or Brand Mentions) using a "Credit" currency. The platform is heavily curated with admin approval workflows.

## Current State
- **Tech Stack**: Next.js, React, TypeScript, CSS Modules
- **Port**: 5000 (required for Replit webview)
- **Status**: Homepage with SEO optimization complete

## SEO Implementation (Frontend)
The homepage includes comprehensive SEO meta tags:

### Primary Meta Tags
- Title tag optimized for target keywords
- Meta description with compelling copy
- Keywords meta tag with relevant terms
- Robots directive set to index/follow
- Language and author meta tags
- Viewport configuration for mobile

### Open Graph / Social Media
- og:type, og:url, og:title, og:description
- og:site_name and og:locale
- Twitter card meta tags

### Structured Data (JSON-LD)
- WebSite schema with search action
- Organization schema with brand info

### SEO Best Practices
- Semantic HTML5 elements (header, main, footer, section, article, nav)
- Proper heading hierarchy (h1 > h2 > h3)
- Descriptive link text
- ARIA labels for accessibility
- Responsive design

## Project Structure
```
pages/
  index.tsx      # SEO-optimized homepage
  _app.tsx       # App wrapper
  api/hello.ts   # API route example
styles/
  globals.css    # Global styles
  Home.module.css # Homepage component styles
public/
  favicon.ico
```

## Development
Run with: `npm run dev`
Server runs on port 5000

## Planned Features
- User authentication system
- Asset (website) submission and admin review
- Campaign/order creation
- Credit-based transaction system
- Admin panel for moderation
