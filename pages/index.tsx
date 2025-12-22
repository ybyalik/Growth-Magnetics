import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const { user, dbUser, loading, isFirebaseConfigured, signIn, logOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
  const pageTitle = "Biznoz.com - Get Quality Backlinks Without the Hassle";
  const pageDescription = "Stop wasting time on cold outreach. Join thousands of marketers exchanging high-quality backlinks through our curated marketplace.";

  return (
    <div className={styles.container}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>{siteName}</Link>
          <button 
            className={styles.mobileMenuBtn} 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className={`${styles.navLinks} ${showMobileMenu ? styles.navLinksOpen : ''}`}>
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
                <a href="#how-it-works">How It Works</a>
                <a href="#features">Services</a>
                <a href="#" className={styles.secondaryNavBtn}>Book a Call</a>
                {isFirebaseConfigured ? (
                  <button onClick={signIn} className={styles.signupBtn} disabled={loading}>
                    {loading ? "Loading..." : "Create an Account"}
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
            <h1 className={styles.title}>
              Get Quality Backlinks<br />Without the Hassle
            </h1>
            <p className={styles.subtitle}>
              Stop wasting hours on cold outreach that goes nowhere. Our marketplace connects you 
              with vetted publishers ready to place your links today.
            </p>
            <div className={styles.ctaButtons}>
              {user ? (
                <Link href="/dashboard" className={styles.primaryBtn}>Go to Dashboard</Link>
              ) : isFirebaseConfigured ? (
                <button onClick={signIn} className={styles.primaryBtn} disabled={loading}>
                  Create an Account
                </button>
              ) : (
                <span className={styles.setupNotice}>Configure Firebase to enable authentication</span>
              )}
              <a href="#" className={styles.secondaryBtn}>Book a Call</a>
            </div>
            <div className={styles.logoBar}>
              <div className={styles.logoGrid}>
                <span>TripAdvisor</span>
                <span>Adobe</span>
                <span>Shopify</span>
                <span>Airbnb</span>
                <span>Slack</span>
                <span>HubSpot</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.audienceSection}>
          <div className={styles.audienceHeader}>
            <span className={styles.sectionLabel}>Who We Help —</span>
            <h2 className={styles.sectionTitle}>Built for Marketers Who Value Their Time</h2>
            <p className={styles.sectionSubtitle}>
              Whether you&apos;re building links for yourself or for clients, we make it simple to get results.
            </p>
          </div>
          <div className={styles.audienceGrid}>
            <div className={styles.audienceCard}>
              <div className={styles.audienceIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <h3>Small Businesses</h3>
              <p>Get your website ranking without hiring an expensive agency. Simple, transparent pricing.</p>
            </div>
            <div className={styles.audienceCard}>
              <div className={styles.audienceIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </div>
              <h3>E-Commerce Stores</h3>
              <p>Build authority for your product pages and category pages. Drive organic traffic that converts.</p>
            </div>
            <div className={styles.audienceCard}>
              <div className={styles.audienceIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Agencies & Freelancers</h3>
              <p>Scale your client work without adding headcount. White-label friendly with bulk discounts.</p>
            </div>
            <div className={styles.audienceCard}>
              <div className={styles.audienceIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h3>SaaS Companies</h3>
              <p>Compete for competitive keywords in your space. Build the authority your software deserves.</p>
            </div>
          </div>
        </section>

        <section className={styles.statsSection}>
          <div className={styles.statsContainer}>
            <div className={styles.statsContent}>
              <h2>Trusted by Marketers. Built to Scale.</h2>
              <p>
                When you join our marketplace, you get access to a network of vetted publishers 
                who are ready to work with you. No more cold emails. No more waiting weeks for a response.
              </p>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>4.9/5</span>
                  <span className={styles.statLabel}>Average Rating</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>10K+</span>
                  <span className={styles.statLabel}>Links Placed</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>48hr</span>
                  <span className={styles.statLabel}>Avg. Turnaround</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>100%</span>
                  <span className={styles.statLabel}>Verified Sites</span>
                </div>
              </div>
            </div>
            <div className={styles.mascotImage}>
              <img src="/mascot-search.webp" alt="Biznoz mascot" />
            </div>
          </div>
        </section>

        <section className={styles.testimonials}>
          <div className={styles.testimonialHeader}>
            <span className={styles.sectionLabel}>Testimonials —</span>
            <h2 className={styles.sectionTitle}>What Our Users Are Saying</h2>
          </div>
          <div className={styles.testimonialGrid}>
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialText}>
                &quot;I was spending 20 hours a week on outreach before I found this platform. 
                Now I can focus on strategy while the links come to me. Game changer.&quot;
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>MK</div>
                <div>
                  <div className={styles.authorName}>Marcus K.</div>
                  <div className={styles.authorRole}>SEO Consultant</div>
                </div>
              </div>
            </div>
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialText}>
                &quot;We&apos;ve tried other link building services. The difference here is the quality control. 
                Every site is actually checked before we place a link.&quot;
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>JR</div>
                <div>
                  <div className={styles.authorName}>Jennifer R.</div>
                  <div className={styles.authorRole}>Agency Owner</div>
                </div>
              </div>
            </div>
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialText}>
                &quot;The credit system makes it fair for everyone. I earn credits by placing links 
                on my sites, then use those credits to get links for my clients. Win-win.&quot;
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>DL</div>
                <div>
                  <div className={styles.authorName}>David L.</div>
                  <div className={styles.authorRole}>Digital Marketer</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className={styles.features}>
          <h2 className={styles.sectionTitle}>Everything You Need to Grow Your Brand</h2>
          <p className={styles.sectionSubtitle}>
            Access campaigns and tools built specifically for SEO professionals.
          </p>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <h3>Guest Posts</h3>
              <p>Get contextual links placed within fresh, relevant content on quality blogs in your niche.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <h3>Niche Edits</h3>
              <p>Add your link to existing, indexed content that already has authority and traffic.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                  <path d="M12 18V6"/>
                </svg>
              </div>
              <h3>Credit System</h3>
              <p>No money changes hands between users. Earn credits by publishing, spend them to get links.</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className={styles.howItWorks}>
          <span className={styles.sectionLabel}>How It Works —</span>
          <h2 className={styles.sectionTitle}>Get Started in Minutes</h2>
          <p className={styles.sectionSubtitle}>
            No complicated onboarding. No lengthy approval process. Just sign up and start building links.
          </p>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <h3>Create Your Account</h3>
              <p>Sign up for free and submit your websites for review. Most sites are approved within 24 hours.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <h3>Browse Opportunities</h3>
              <p>Find link opportunities that match your niche, or create campaigns to attract publishers to you.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <h3>Get Links, Track Results</h3>
              <p>Once a link is placed, our team verifies it before releasing credits. Full transparency, always.</p>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <div className={styles.ctaContent}>
            <div className={styles.ctaMascot}>
              <img src="/mascot-desk.webp" alt="Get started" />
            </div>
            <div className={styles.ctaText}>
              <h2>Ready to Stop Chasing Links?</h2>
              <p>Create your free account and start building quality backlinks today. No credit card required.</p>
              {user ? (
                <Link href="/dashboard" className={styles.primaryBtn}>Go to Dashboard</Link>
              ) : isFirebaseConfigured ? (
                <button onClick={signIn} className={styles.primaryBtn} disabled={loading}>
                  Get Started Now
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
            <p>The smarter way to build backlinks. Join thousands of marketers who&apos;ve stopped wasting time on cold outreach.</p>
          </div>
          <div className={styles.footerSection}>
            <h4>Platform</h4>
            <nav>
              <Link href="/earn">Earn Credits</Link>
              <Link href="/campaigns/new">Campaigns</Link>
              <Link href="/dashboard">Dashboard</Link>
            </nav>
          </div>
          <div className={styles.footerSection}>
            <h4>Resources</h4>
            <nav>
              <a href="#how-it-works">How It Works</a>
              <a href="#features">Services</a>
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
