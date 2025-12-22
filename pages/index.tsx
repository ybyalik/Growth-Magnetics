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
            <div className={styles.heroText}>
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
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>100%</span>
                  <span className={styles.statLabel}>Admin Verified</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>24h</span>
                  <span className={styles.statLabel}>Avg. Review Time</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>0</span>
                  <span className={styles.statLabel}>Cash Transactions</span>
                </div>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.heroIllustration}>
                <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="200" cy="200" r="180" stroke="#00B2AC" strokeWidth="2" strokeDasharray="8 8" opacity="0.3"/>
                  <circle cx="200" cy="200" r="140" stroke="#00B2AC" strokeWidth="2" strokeDasharray="4 4" opacity="0.5"/>
                  <circle cx="200" cy="200" r="100" fill="#00B2AC" opacity="0.1"/>
                  <circle cx="200" cy="120" r="24" fill="#00B2AC"/>
                  <circle cx="120" cy="200" r="20" fill="#00B2AC" opacity="0.8"/>
                  <circle cx="280" cy="200" r="20" fill="#00B2AC" opacity="0.8"/>
                  <circle cx="200" cy="280" r="24" fill="#00B2AC"/>
                  <circle cx="140" cy="140" r="16" fill="#00B2AC" opacity="0.6"/>
                  <circle cx="260" cy="140" r="16" fill="#00B2AC" opacity="0.6"/>
                  <circle cx="140" cy="260" r="16" fill="#00B2AC" opacity="0.6"/>
                  <circle cx="260" cy="260" r="16" fill="#00B2AC" opacity="0.6"/>
                  <line x1="200" y1="144" x2="200" y2="256" stroke="#00B2AC" strokeWidth="2" opacity="0.4"/>
                  <line x1="144" y1="200" x2="256" y2="200" stroke="#00B2AC" strokeWidth="2" opacity="0.4"/>
                  <line x1="152" y1="152" x2="248" y2="248" stroke="#00B2AC" strokeWidth="1.5" opacity="0.3"/>
                  <line x1="248" y1="152" x2="152" y2="248" stroke="#00B2AC" strokeWidth="1.5" opacity="0.3"/>
                  <circle cx="200" cy="200" r="40" fill="white" stroke="#00B2AC" strokeWidth="3"/>
                  <path d="M190 200L196 206L210 192" stroke="#00B2AC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className={styles.features} aria-label="Platform Features">
          <h2 className={styles.sectionTitle}>Built for Quality</h2>
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
              <p>Every website is manually reviewed and rated by our admin team before it can participate in the marketplace. No PBNs, no spam.</p>
            </article>

            <article className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3>Verified Placements</h3>
              <p>All link placements and brand mentions are verified by admins before credits are transferred. You only pay for confirmed work.</p>
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
              <p>Exchange SEO value fairly using our credit system. Earn credits by providing links, spend them to receive links. No middleman fees.</p>
            </article>

            <article className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3>Privacy First</h3>
              <p>Your target URLs and keywords stay hidden until a publisher commits to your order. Protect your SEO strategy from competitors.</p>
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

        <section className={styles.linkTypes} aria-label="Link Types">
          <h2 className={styles.sectionTitle}>Flexible Link Types</h2>
          <p className={styles.sectionSubtitle}>
            Choose the link type that fits your SEO strategy.
          </p>
          <div className={styles.typeGrid}>
            <div className={styles.typeCard}>
              <h3>Guest Posts</h3>
              <p>Fresh, original content published on partner websites with contextual backlinks to your target pages.</p>
            </div>
            <div className={styles.typeCard}>
              <h3>Niche Edits</h3>
              <p>Links placed naturally within existing, indexed content for immediate SEO value and faster results.</p>
            </div>
            <div className={styles.typeCard}>
              <h3>Brand Mentions</h3>
              <p>Unlinked brand mentions to build authority and brand awareness across relevant publications.</p>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Ready to Build Your Authority?</h2>
          <p>Join our marketplace and start building quality backlinks today. No credit card required.</p>
          {user ? (
            <Link href="/dashboard" className={styles.primaryBtn}>Go to Dashboard</Link>
          ) : isFirebaseConfigured ? (
            <button onClick={signIn} className={styles.primaryBtn} disabled={loading}>
              Create Free Account
            </button>
          ) : null}
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
