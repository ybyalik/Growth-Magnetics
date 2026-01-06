import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import styles from "../styles/Home.module.css";

const clientLogos = [
  { name: "L'Oreal", id: "loreal" },
  { name: "Dentsu", id: "dentsu" },
  { name: "Samsung", id: "samsung" },
  { name: "Uber", id: "uber" },
  { name: "Lufthansa", id: "lufthansa" },
  { name: "Cision", id: "cision" },
  { name: "Coinbase", id: "coinbase" },
  { name: "Shopify", id: "shopify" },
];

const Home: NextPage = () => {
  const { user, dbUser, loading, isFirebaseConfigured, signIn, logOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
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
  
  const siteName = "Biznoz";
  const siteUrl = "https://biznoz.com";
  const pageTitle = "Biznoz - Get Quality Backlinks Without the Hassle";
  const pageDescription = "Stop wasting time on cold outreach. Join thousands of marketers exchanging high-quality backlinks through our curated marketplace.";

  const faqItems = [
    {
      q: "What is a backlink marketplace?",
      a: "A backlink marketplace connects website owners who want to build quality links (advertisers) with publishers who have websites willing to host those links. Instead of cold outreach, you can browse available opportunities and place links through our curated platform."
    },
    {
      q: "How does the credit system work?",
      a: "Credits are our internal currency. You earn credits by publishing links on your websites, and spend credits to get links placed on other sites. No money changes hands between users - it's a fair exchange system that rewards active participants."
    },
    {
      q: "How do I get started?",
      a: "Simply create a free account, submit your websites for review (most are approved within 24 hours), and start browsing opportunities. You can either earn credits by publishing links or create campaigns to attract publishers to your content."
    },
    {
      q: "What types of links can I get?",
      a: "We offer guest posts (new content with contextual links), niche edits (links added to existing indexed content), and brand mentions. All link placements are verified by our team before credits are released."
    },
    {
      q: "Is there a minimum commitment?",
      a: "No minimum commitment required. Access is free - you only use credits when you publish or receive links. Start small and scale as you see results."
    }
  ];

  const visibleFaqs = showAllFaqs ? faqItems : faqItems.slice(0, 3);

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
          <Link href={user ? "/dashboard" : "/"} className={styles.logo}>
            <Image src="/biznoz-logo.webp" alt={siteName} width={120} height={36} className={styles.logoImage} priority />
          </Link>
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
                <Link href="/opportunities">Opportunities</Link>
                <Link href="/campaigns/new">New Campaign</Link>
                {dbUser?.role === "admin" && (
                  <Link href="/admin" className={styles.adminLink}>Admin</Link>
                )}
                
                <div className={styles.userPanel} ref={menuRef}>
                  <button 
                    className={styles.userButton}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
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
                      <Link href="/opportunities" className={styles.menuItem} onClick={() => setShowUserMenu(false)}>
                        Opportunities
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
                    {loading ? "Loading..." : "Try Biznoz"}
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
              <h1 className={styles.title}>
                Be a reference in AI<br />answers &amp; search<br />engines results!
              </h1>
              <p className={styles.subtitle}>
                Boost your brand visibility with articles on trusted channels: sites, digital 
                press agencies, and influencer pages to increase your online visibility and reputation.
              </p>
              <div className={styles.ctaButtons}>
                {user ? (
                  <Link href="/dashboard" className={styles.primaryBtn}>Go to Dashboard</Link>
                ) : isFirebaseConfigured ? (
                  <button onClick={signIn} className={styles.outlineBtn} disabled={loading}>
                    Request a demo
                  </button>
                ) : (
                  <span className={styles.setupNotice}>Configure Firebase to enable authentication</span>
                )}
              </div>
            </div>
            <div className={styles.heroVisual}>
              <Image src="/mascot-map.webp" alt="Biznoz mascot" width={380} height={400} className={styles.heroImage} priority />
            </div>
          </div>
        </section>

        <section className={styles.logoSection}>
          <p className={styles.logoSectionLabel}>2,000+ international companies and agencies already trust Biznoz.</p>
          <div className={styles.logoGrid}>
            {clientLogos.map((logo) => (
              <span key={logo.id} className={styles.logoItem}>{logo.name}</span>
            ))}
          </div>
        </section>

        <section className={styles.auditSection}>
          <div className={styles.auditContent}>
            <h2>Ask for your SEO Audit</h2>
            <p>
              Our SEO Experts will analyze your site to identify new opportunities for 
              link building. Discover the best strategy to boost your organic rankings.
            </p>
          </div>
          <div className={styles.auditVisual}>
            <Image src="/mascot-search.webp" alt="SEO Audit" width={280} height={280} />
          </div>
        </section>

        <section className={styles.platformSection}>
          <div className={styles.platformLogo}>
            <span className={styles.platformBrand}>{siteName}<sup>+</sup></span>
          </div>
          <p className={styles.platformText}>
            Use our experts for your own campaigns - leverage our in-house team to build 
            high-quality backlinks profile, by using the tools in our platform.
          </p>
        </section>

        <section className={styles.yellowSection}>
          <div className={styles.yellowContent}>
            <div className={styles.yellowText}>
              <h2>Develop your reputation quickly with {siteName}</h2>
              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <span className={styles.featureHighlight}>The world&apos;s largest catalog of premium media</span>
                  <p>Access 10,000+ vetted publishers across every industry and niche.</p>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureHighlight}>Centralize your media buying</span>
                  <p>Manage all your link campaigns from one dashboard.</p>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureHighlight}>Free access, exclusive offers</span>
                  <p>Start building your profile without upfront costs.</p>
                </div>
              </div>
            </div>
            <div className={styles.yellowLogos}>
              <div className={styles.partnerLogos}>
                <span>Getfluence</span>
                <span>FastWeb</span>
                <span>MediaHub</span>
                <span>N-Threads</span>
                <span>Ajourney</span>
                <span>TechPress</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.knowledgeSection}>
          <span className={styles.sectionLabel}>SEO Knowledge &amp; Public Relations</span>
          <div className={styles.knowledgeGrid}>
            <div className={styles.knowledgeCard}>
              <p className={styles.knowledgeQuestion}>What is the best content strategy for visibility in ChatGPT Search?</p>
              <p className={styles.knowledgeDesc}>The latest content strategy to get visibility in ChatGPT Search made for those who are affiliate websites looking to boost their organic traffic.</p>
              <a href="#" className={styles.readMoreBtn}>Read More</a>
            </div>
            <div className={styles.knowledgeCard}>
              <p className={styles.knowledgeQuestion}>SEO strategy: boost your visibility with guest netlinking</p>
              <p className={styles.knowledgeDesc}>Guest posting remains one of the most effective strategies to gain quality backlinks and authority in developing your brand.</p>
              <a href="#" className={styles.readMoreBtn}>Read More</a>
            </div>
            <div className={styles.knowledgeCard}>
              <p className={styles.knowledgeQuestion}>Indexing guide: How to ensure your articles are visible in Google search results?</p>
              <p className={styles.knowledgeDesc}>A practical guide to help you understand how to publish a profitable indexing strategy on Google.</p>
              <a href="#" className={styles.readMoreBtn}>Read More</a>
            </div>
          </div>
        </section>

        <section id="how-it-works" className={styles.howItWorks}>
          <h2 className={styles.sectionTitle}>How does it work?</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <h3>Add your media with offers and conditions</h3>
              <p>Submit your websites for review. Set your terms and pricing for guest posts.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <h3>Receive proposals and choose who you want to work with</h3>
              <p>Browse opportunities that match your niche. Accept or decline proposals.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <h3>Manage your campaigns on our optimized platform</h3>
              <p>Track progress, communicate with publishers, and monitor results.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>4</span>
              <h3>Easily withdraw your earnings 30 days after publication</h3>
              <p>Once links are verified, credits are released and ready to use.</p>
            </div>
          </div>
          <div className={styles.stepsAction}>
            {user ? (
              <Link href="/dashboard" className={styles.primaryBtn}>Go to Dashboard</Link>
            ) : isFirebaseConfigured ? (
              <button onClick={signIn} className={styles.primaryBtn} disabled={loading}>
                Try it for Free
              </button>
            ) : null}
          </div>
        </section>

        <section className={styles.trustSection}>
          <p className={styles.trustLabel}>2,000+ international companies and agencies already trust {siteName}.</p>
          <div className={styles.trustLogos}>
            {clientLogos.map((logo) => (
              <span key={`trust-${logo.id}`} className={styles.trustLogo}>{logo.name}</span>
            ))}
          </div>
        </section>

        <section className={styles.faq}>
          <div className={styles.faqContainer}>
            <h2 className={styles.sectionTitle}>FAQ</h2>
            <div className={styles.faqList}>
              {visibleFaqs.map((item, i) => (
                <div key={i} className={`${styles.faqItem} ${openFaq === i ? styles.faqItemOpen : ''}`}>
                  <button className={styles.faqQuestion} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{item.q}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points={openFaq === i ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/>
                    </svg>
                  </button>
                  <div className={styles.faqAnswer}>
                    <p>{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
            {!showAllFaqs && faqItems.length > 3 && (
              <div className={styles.faqAction}>
                <button onClick={() => setShowAllFaqs(true)} className={styles.seeMoreBtn}>
                  See more
                </button>
              </div>
            )}
          </div>
        </section>

        <section className={styles.cta}>
          <div className={styles.ctaContent}>
            <div className={styles.ctaText}>
              <h2>Give yourself the visibility your company deserves</h2>
              <p>Apply {siteName} now for your sponsored content and SEO campaigns.</p>
            </div>
            <div className={styles.ctaAction}>
              {user ? (
                <Link href="/dashboard" className={styles.primaryBtn}>Go to Dashboard</Link>
              ) : isFirebaseConfigured ? (
                <button onClick={signIn} className={styles.primaryBtn} disabled={loading}>
                  Create an account
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
            <div className={styles.languageSelect}>
              <span>English</span>
            </div>
          </div>
          <div className={styles.footerSection}>
            <h4>For advertisers</h4>
            <nav>
              <Link href="/opportunities">Opportunities</Link>
              <Link href="/campaigns/new">Campaigns</Link>
            </nav>
          </div>
          <div className={styles.footerSection}>
            <h4>For publishers</h4>
            <nav>
              <Link href="/dashboard">Dashboard</Link>
              <a href="#how-it-works">How It Works</a>
            </nav>
          </div>
          <div className={styles.footerSection}>
            <h4>Our services</h4>
            <nav>
              <a href="#features">Guest Posts</a>
              <a href="#features">Niche Edits</a>
            </nav>
          </div>
          <div className={styles.footerSection}>
            <h4>Help Center</h4>
            <nav>
              <a href="#">FAQ</a>
              <a href="#">Contact</a>
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
