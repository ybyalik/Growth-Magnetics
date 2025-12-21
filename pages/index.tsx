import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const siteName = "LinkExchange";
  const siteUrl = "https://linkexchange.com";
  const pageTitle = "LinkExchange - Premium Backlink & Brand Mention Marketplace";
  const pageDescription = "Exchange high-quality backlinks and brand mentions using credits. Join our curated marketplace where every website is vetted and every link is verified by experts.";
  const keywords = "backlinks, brand mentions, SEO marketplace, link building, guest posts, niche edits, domain rating, link exchange, SEO credits";
  const ogImage = `${siteUrl}/og-image.png`;

  return (
    <div className={styles.container}>
      <Head>
        {/* Primary Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={keywords} />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="author" content={siteName} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={siteUrl} />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="LinkExchange - Premium Backlink Marketplace" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={siteUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content="LinkExchange - Premium Backlink Marketplace" />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": siteName,
              "url": siteUrl,
              "description": pageDescription,
              "potentialAction": {
                "@type": "SearchAction",
                "target": `${siteUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": siteName,
              "url": siteUrl,
              "description": "Premium marketplace for exchanging SEO value through backlinks and brand mentions",
              "sameAs": []
            })
          }}
        />
      </Head>

      <header className={styles.header}>
        <nav className={styles.nav}>
          <a href="/" className={styles.logo} aria-label="LinkExchange Home">{siteName}</a>
          <div className={styles.navLinks}>
            <a href="/earn">Earn Credits</a>
            <a href="/campaigns">Campaigns</a>
            <a href="/login">Login</a>
            <a href="/signup" className={styles.signupBtn}>Get Started</a>
          </div>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.title}>
            Build Authority with <span className={styles.highlight}>Quality Backlinks</span>
          </h1>
          <p className={styles.subtitle}>
            The curated marketplace where every website is vetted and every link placement is verified. 
            Exchange SEO value using credits - no money changes hands between users.
          </p>
          <div className={styles.ctaButtons}>
            <a href="/signup" className={styles.primaryBtn}>Start Earning Credits</a>
            <a href="/how-it-works" className={styles.secondaryBtn}>How It Works</a>
          </div>
        </section>

        <section className={styles.features} aria-label="Platform Features">
          <h2 className={styles.sectionTitle}>Why Choose Our Platform</h2>
          <div className={styles.grid}>
            <article className={styles.card}>
              <h3>Curated Quality</h3>
              <p>Every website is manually reviewed and rated by our admin team before it can participate in the marketplace.</p>
            </article>

            <article className={styles.card}>
              <h3>Verified Placements</h3>
              <p>All link placements and brand mentions are verified by admins before credits are transferred. No scams, no low-quality links.</p>
            </article>

            <article className={styles.card}>
              <h3>Credit-Based Economy</h3>
              <p>Exchange SEO value fairly using our credit system. Earn credits by providing links, spend them to receive links.</p>
            </article>

            <article className={styles.card}>
              <h3>Privacy First</h3>
              <p>Your target URLs and keywords stay hidden until a publisher commits to your order. Protect your SEO strategy.</p>
            </article>
          </div>
        </section>

        <section className={styles.howItWorks} aria-label="How It Works">
          <h2 className={styles.sectionTitle}>Simple 3-Step Process</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <h3>Submit Your Assets</h3>
              <p>Add your websites for admin review. Once approved, they become active earning assets.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <h3>Browse or Create Orders</h3>
              <p>Find link opportunities on our board or create campaigns to get backlinks to your sites.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <h3>Exchange & Verify</h3>
              <p>Complete orders and get admin verification. Credits transfer only after quality approval.</p>
            </div>
          </div>
        </section>

        <section className={styles.linkTypes} aria-label="Link Types">
          <h2 className={styles.sectionTitle}>Supported Link Types</h2>
          <div className={styles.typeGrid}>
            <div className={styles.typeCard}>
              <h3>Guest Posts</h3>
              <p>Fresh, original content published on partner websites with contextual backlinks.</p>
            </div>
            <div className={styles.typeCard}>
              <h3>Niche Edits</h3>
              <p>Links placed naturally within existing, indexed content for immediate SEO value.</p>
            </div>
            <div className={styles.typeCard}>
              <h3>Brand Mentions</h3>
              <p>Unlinked brand mentions to build authority and brand awareness across the web.</p>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Ready to Grow Your SEO?</h2>
          <p>Join our marketplace and start building quality backlinks today.</p>
          <a href="/signup" className={styles.primaryBtn}>Create Free Account</a>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4>{siteName}</h4>
            <p>Premium backlink and brand mention marketplace with admin-verified quality.</p>
          </div>
          <div className={styles.footerSection}>
            <h4>Platform</h4>
            <nav aria-label="Platform links">
              <a href="/earn">Earn Credits</a>
              <a href="/campaigns">Campaigns</a>
              <a href="/pricing">Pricing</a>
            </nav>
          </div>
          <div className={styles.footerSection}>
            <h4>Resources</h4>
            <nav aria-label="Resource links">
              <a href="/how-it-works">How It Works</a>
              <a href="/faq">FAQ</a>
              <a href="/blog">Blog</a>
            </nav>
          </div>
          <div className={styles.footerSection}>
            <h4>Legal</h4>
            <nav aria-label="Legal links">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
            </nav>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
