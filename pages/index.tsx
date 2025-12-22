import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const { user, dbUser, loading, isFirebaseConfigured, signIn, logOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPlanName = () => {
    if (dbUser?.role === "admin") return "Admin";
    return "Free Plan";
  };
  
  const siteName = "Biznoz.com";
  const siteUrl = "https://biznoz.com";
  const pageTitle = "Biznoz.com - Premium Backlink & Brand Mention Marketplace";
  const pageDescription = "Exchange high-quality backlinks and brand mentions using credits. Join our curated marketplace where every website is vetted and every link is verified by experts.";
  const keywords = "backlinks, brand mentions, SEO marketplace, link building, guest posts, niche edits, domain rating, link exchange, SEO credits";
  const ogImage = `${siteUrl}/og-image.png`;

  return (
    <div className={styles.container}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={keywords} />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="author" content={siteName} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        <link rel="canonical" href={siteUrl} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Biznoz.com - Premium Backlink Marketplace" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={siteUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content="Biznoz.com - Premium Backlink Marketplace" />
        
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
          <Link href="/" className={styles.logo} aria-label="Biznoz Home">{siteName}</Link>
          <div className={styles.navLinks}>
            {user ? (
              <>
                <Link href="/earn">Earn</Link>
                <Link href="/campaigns/new">New Campaign</Link>
                {dbUser?.role === "admin" && (
                  <Link href="/admin" className={styles.adminLink}>Admin</Link>
                )}
                
                <div className={styles.userPanel} ref={menuRef}>
                  <button 
                    className={styles.userButton}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <span className={styles.userCredits}>{dbUser?.credits || 0}</span>
                    <span className={styles.userAvatar}>
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className={styles.userMenu}>
                      <div className={styles.userInfo}>
                        <div className={styles.userEmail}>{user.email}</div>
                        <div className={styles.userPlan}>{getPlanName()}</div>
                      </div>
                      <div className={styles.userCreditsDisplay}>
                        <span className={styles.creditsLabel}>Credits</span>
                        <span className={styles.creditsValue}>{dbUser?.credits || 0}</span>
                      </div>
                      <div className={styles.menuDivider}></div>
                      <Link href="/dashboard" className={styles.menuItem} onClick={() => setShowUserMenu(false)}>
                        Dashboard
                      </Link>
                      <Link href="/earn" className={styles.menuItem} onClick={() => setShowUserMenu(false)}>
                        Earn Credits
                      </Link>
                      <Link href="/campaigns/new" className={styles.menuItem} onClick={() => setShowUserMenu(false)}>
                        Create Campaign
                      </Link>
                      <div className={styles.menuDivider}></div>
                      <button onClick={logOut} className={styles.signOutBtn}>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <a href="#features">Features</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#" className={styles.secondaryNavBtn}>Book a Call</a>
                {isFirebaseConfigured ? (
                  <button onClick={signIn} className={styles.signupBtn} disabled={loading}>
                    {loading ? "Loading..." : "Get Started"}
                  </button>
                ) : (
                  <span className={styles.configNotice}>Setup Required</span>
                )}
              </>
            )}
          </div>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.badgeDot}></span>
              Trusted by SEO professionals
            </div>
            <h1 className={styles.title}>
              Build Authority with<br /><span className={styles.highlight}>Quality Backlinks</span>
            </h1>
            <p className={styles.subtitle}>
              The curated marketplace where every website is vetted and every link placement is verified. 
              Exchange SEO value using credits — no money changes hands between users.
            </p>
            <div className={styles.ctaButtons}>
              {user ? (
                <Link href="/dashboard" className={styles.primaryBtn}>Go to Dashboard</Link>
              ) : isFirebaseConfigured ? (
                <button onClick={signIn} className={styles.primaryBtn} disabled={loading}>
                  Start Earning Credits
                </button>
              ) : (
                <span className={styles.setupNotice}>Configure Firebase to enable authentication</span>
              )}
              <a href="#how-it-works" className={styles.secondaryBtn}>See How It Works</a>
            </div>
            <div className={styles.logoBar}>
              <p className={styles.logoBarText}>Trusted by leading companies</p>
              <div className={styles.logoGrid}>
                <span>TripAdvisor</span>
                <span>Adobe</span>
                <span>Shopify</span>
                <span>Airbnb</span>
                <span>Slack</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.statsSection}>
          <div className={styles.statsContainer}>
            <div className={styles.statsContent}>
              <h2>Smarter Visibility for Your Brand</h2>
              <p>
                Our AI-powered platform helps you discover the best opportunities for high-quality backlinks 
                that actually move the needle for your SEO rankings.
              </p>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>4.9/5</span>
                  <span className={styles.statLabel}>User Rating</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>100%</span>
                  <span className={styles.statLabel}>Verified Links</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>24h</span>
                  <span className={styles.statLabel}>Avg. Review</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>500+</span>
                  <span className={styles.statLabel}>Active Sites</span>
                </div>
              </div>
            </div>
            <div className={styles.mascotImage}>
              <img src="/mascot-search.webp" alt="Biznoz mascot searching" />
            </div>
          </div>
        </section>

        <section id="features" className={styles.features} aria-label="Platform Features">
          <h2 className={styles.sectionTitle}>Everything You Need to Grow Your Brand</h2>
          <p className={styles.sectionSubtitle}>
            Every aspect of our platform is designed to ensure you get real, high-quality backlinks that move the needle.
          </p>
          <div className={styles.grid}>
            <article className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <h3>Curated Quality</h3>
              <p>Every website is manually reviewed and rated by our admin team before it can participate in the marketplace.</p>
            </article>

            <article className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3>Verified Placements</h3>
              <p>All link placements and brand mentions are verified by admins before credits are transferred.</p>
            </article>

            <article className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                  <path d="M12 18V6"/>
                </svg>
              </div>
              <h3>Credit Economy</h3>
              <p>Exchange SEO value fairly using our credit system. Earn credits by providing links, spend them to receive links.</p>
            </article>
          </div>
        </section>

        <section id="how-it-works" className={styles.howItWorks} aria-label="How It Works">
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtitle}>
            Get started in minutes. Our streamlined process makes link building simple.
          </p>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <h3>Submit Your Sites</h3>
              <p>Add your websites for admin review. Once approved, they become active earning assets in the marketplace.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <h3>Browse or Create</h3>
              <p>Find link opportunities on our board or create campaigns to get backlinks pointing to your sites.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <h3>Exchange & Verify</h3>
              <p>Complete orders and get admin verification. Credits transfer only after quality approval.</p>
            </div>
          </div>
        </section>

        <section className={styles.testimonials}>
          <h2 className={styles.sectionTitle}>Loved by SEO Professionals</h2>
          <p className={styles.sectionSubtitle}>
            See what our users have to say about their experience.
          </p>
          <div className={styles.testimonialGrid}>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialRating}>4.9/5</div>
              <div className={styles.testimonialStars}>★★★★★</div>
              <p className={styles.testimonialText}>
                "Finally a platform that delivers real, quality backlinks. The verification process gives me confidence."
              </p>
              <div className={styles.testimonialAuthor}>Sarah M., SEO Manager</div>
            </div>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialRating}>5.0/5</div>
              <div className={styles.testimonialStars}>★★★★★</div>
              <p className={styles.testimonialText}>
                "The credit system is genius. I can earn while I build my own link profile. Win-win!"
              </p>
              <div className={styles.testimonialAuthor}>Mike T., Agency Owner</div>
            </div>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialRating}>4.8/5</div>
              <div className={styles.testimonialStars}>★★★★★</div>
              <p className={styles.testimonialText}>
                "Best link building platform I've used. Admin verification ensures quality every time."
              </p>
              <div className={styles.testimonialAuthor}>Lisa K., Content Strategist</div>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <div className={styles.ctaContent}>
            <div className={styles.ctaMascot}>
              <img src="/mascot-desk.webp" alt="Biznoz mascot at desk" />
            </div>
            <div className={styles.ctaText}>
              <h2>Ready to Build Your Authority?</h2>
              <p>Join our marketplace and start building quality backlinks today. No credit card required.</p>
              {user ? (
                <Link href="/dashboard" className={styles.primaryBtn}>Go to Dashboard</Link>
              ) : isFirebaseConfigured ? (
                <button onClick={signIn} className={styles.primaryBtn} disabled={loading}>
                  Create Free Account
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4>{siteName}</h4>
            <p>Premium backlink and brand mention marketplace with admin-verified quality. Built for SEO professionals who value results.</p>
          </div>
          <div className={styles.footerSection}>
            <h4>Platform</h4>
            <nav aria-label="Platform links">
              <Link href="/earn">Earn Credits</Link>
              <Link href="/campaigns/new">Campaigns</Link>
              <Link href="/dashboard">Dashboard</Link>
            </nav>
          </div>
          <div className={styles.footerSection}>
            <h4>Resources</h4>
            <nav aria-label="Resource links">
              <a href="#how-it-works">How It Works</a>
              <a href="#features">Features</a>
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
