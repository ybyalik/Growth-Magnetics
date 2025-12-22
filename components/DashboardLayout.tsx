import React, { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../lib/auth-context";
import styles from "../styles/DashboardLayout.module.css";

interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: string;
  active?: boolean;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  navItems?: NavItem[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function DashboardLayout({ 
  children, 
  title = "Dashboard - Biznoz", 
  navItems,
  activeTab,
  onTabChange
}: DashboardLayoutProps) {
  const { user, dbUser, logOut } = useAuth();
  const router = useRouter();

  const defaultNavItems: NavItem[] = [
    { label: "My Websites", icon: "globe", href: "/dashboard", active: router.pathname === "/dashboard" && activeTab === "assets" },
    { label: "My Campaigns", icon: "campaign", href: "/dashboard", active: activeTab === "campaigns" },
    { label: "Links Submitted", icon: "link", href: "/dashboard", active: activeTab === "work" },
    { label: "Link Calendar", icon: "calendar", href: "/dashboard", active: activeTab === "calendar" },
    { label: "Credit History", icon: "history", href: "/dashboard", active: activeTab === "history" },
  ];

  const items = navItems || defaultNavItems;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "globe": return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      );
      case "campaign": return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      );
      case "link": return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      );
      case "calendar": return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      );
      case "history": return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      );
      case "opportunities": return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      );
      case "new-campaign": return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      );
      case "admin": return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      );
      default: return null;
    }
  };

  const handleNavClick = (item: NavItem, tabName: string) => {
    if (item.onClick) {
      item.onClick();
    } else if (onTabChange) {
      onTabChange(tabName);
    }
  };

  const getTabName = (label: string) => {
    switch (label) {
      case "My Websites": return "assets";
      case "My Campaigns": return "campaigns";
      case "Links Submitted": return "work";
      case "Link Calendar": return "calendar";
      case "Credit History": return "history";
      default: return "";
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            <img src="/biznoz-logo.webp" alt="Biznoz" className={styles.logoImage} />
          </Link>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>Dashboard</div>
            {items.map((item, index) => (
              <button
                key={index}
                className={`${styles.navItem} ${item.active ? styles.active : ""}`}
                onClick={() => handleNavClick(item, getTabName(item.label))}
              >
                <span className={styles.navIcon}>{getIcon(item.icon)}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>Actions</div>
            <Link href="/opportunities" className={styles.navItem}>
              <span className={styles.navIcon}>{getIcon("opportunities")}</span>
              <span className={styles.navLabel}>Opportunities</span>
            </Link>
            <Link href="/campaigns/new" className={styles.navItem}>
              <span className={styles.navIcon}>{getIcon("new-campaign")}</span>
              <span className={styles.navLabel}>New Campaign</span>
            </Link>
          </div>

          {dbUser?.role === "admin" && (
            <div className={styles.navSection}>
              <div className={styles.navSectionTitle}>Admin</div>
              <Link href="/admin" className={`${styles.navItem} ${router.pathname === "/admin" ? styles.active : ""}`}>
                <span className={styles.navIcon}>{getIcon("admin")}</span>
                <span className={styles.navLabel}>Admin Panel</span>
              </Link>
            </div>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.creditsCard}>
            <div className={styles.creditsLabel}>Available Credits</div>
            <div className={styles.creditsValue}>{dbUser?.credits || 0}</div>
          </div>

          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userEmail}>{user?.email || "User"}</div>
              <div className={styles.userRole}>{dbUser?.role === "admin" ? "Admin" : "Member"}</div>
            </div>
          </div>

          <button onClick={logOut} className={styles.signOutBtn}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
