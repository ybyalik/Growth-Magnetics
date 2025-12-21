import React, { ReactNode } from "react";
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
            LinkExchange
          </Link>

          <div className={styles.navLinks}>
            {!isFirebaseConfigured ? (
              <span className={styles.configNotice}>Firebase not configured</span>
            ) : user ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/earn">Earn Credits</Link>
                <Link href="/campaigns/new">Create Campaign</Link>
                {dbUser?.role === "admin" && (
                  <Link href="/admin" className={styles.adminLink}>Admin</Link>
                )}
                <span className={styles.credits}>{dbUser?.credits || 0} Credits</span>
                <button onClick={logOut} className={styles.logoutBtn}>
                  Logout
                </button>
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
