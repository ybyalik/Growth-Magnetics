import React, { ReactNode, useState, useRef, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "../lib/auth-context";
import styles from "../styles/Layout.module.css";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = "LinkExchange" }: LayoutProps) {
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

  return (
    <div className={styles.container}>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            <img src="/biznoz-logo.webp" alt="Biznoz.com" className={styles.logoImage} />
          </Link>

          <div className={styles.navLinks}>
            {!isFirebaseConfigured ? (
              <span className={styles.configNotice}>Firebase not configured</span>
            ) : user ? (
              <>
                <Link href="/earn">Earn</Link>
                <Link href="/campaigns/new">New Campaign</Link>
                
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
                      {dbUser?.role === "admin" && (
                        <>
                          <div className={styles.menuDivider}></div>
                          <Link href="/admin" className={styles.menuItem} onClick={() => setShowUserMenu(false)}>
                            Admin Panel
                          </Link>
                        </>
                      )}
                      <div className={styles.menuDivider}></div>
                      <button onClick={logOut} className={styles.signOutBtn}>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button onClick={signIn} className={styles.loginBtn} disabled={loading}>
                {loading ? "Loading..." : "Sign in with Google"}
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} LinkExchange. All rights reserved.</p>
      </footer>
    </div>
  );
}
