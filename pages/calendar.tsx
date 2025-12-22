import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import Layout from "../components/Layout";
import styles from "../styles/Calendar.module.css";

interface ReceivedLink {
  id: number;
  targetUrl: string;
  targetKeyword: string;
  linkType: string;
  placementFormat: string;
  proofUrl: string;
  publisherDomain: string | null;
  receivedAt: string;
}

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const [links, setLinks] = useState<ReceivedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchReceivedLinks();
    }
  }, [user]);

  const fetchReceivedLinks = async () => {
    try {
      const res = await fetch(`/api/campaigns/received-links?firebaseUid=${user?.uid}`);
      const data = await res.json();
      setLinks(data.links || []);
    } catch (error) {
      console.error("Error fetching links:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getLinksForDate = (dateKey: string) => {
    return links.filter((link) => {
      if (!link.receivedAt) return false;
      const linkDate = new Date(link.receivedAt);
      const linkDateKey = formatDateKey(
        linkDate.getFullYear(),
        linkDate.getMonth(),
        linkDate.getDate()
      );
      return linkDateKey === dateKey;
    });
  };

  const getLinkCountByDate = () => {
    const counts: Record<string, number> = {};
    links.forEach((link) => {
      if (!link.receivedAt) return;
      const linkDate = new Date(link.receivedAt);
      const dateKey = formatDateKey(
        linkDate.getFullYear(),
        linkDate.getMonth(),
        linkDate.getDate()
      );
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    return counts;
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    setSelectedDate(null);
  };

  const formatLinkType = (type: string) => {
    switch (type) {
      case "hyperlink_dofollow": return "Dofollow";
      case "hyperlink_nofollow": return "Nofollow";
      case "brand_mention": return "Brand Mention";
      default: return type;
    }
  };

  const formatPlacement = (format: string) => {
    switch (format) {
      case "guest_post": return "Guest Post";
      case "niche_edit": return "Niche Edit";
      default: return format;
    }
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const linkCounts = getLinkCountByDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const selectedLinks = selectedDate ? getLinksForDate(selectedDate) : [];

  if (authLoading || loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className={styles.container}>
          <p>Please sign in to view your link calendar.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Link Calendar</h1>
          <p className={styles.subtitle}>Track when you received backlinks to your websites</p>
        </div>

        <div className={styles.calendarWrapper}>
          <div className={styles.calendarHeader}>
            <button onClick={() => navigateMonth(-1)} className={styles.navBtn}>
              &larr; Previous
            </button>
            <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <button onClick={() => navigateMonth(1)} className={styles.navBtn}>
              Next &rarr;
            </button>
          </div>

          <div className={styles.calendar}>
            <div className={styles.weekdays}>
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className={styles.days}>
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className={styles.emptyDay}></div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateKey = formatDateKey(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                  day
                );
                const count = linkCounts[dateKey] || 0;
                const isSelected = selectedDate === dateKey;
                const isToday = dateKey === formatDateKey(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  new Date().getDate()
                );

                return (
                  <div
                    key={day}
                    className={`${styles.day} ${count > 0 ? styles.hasLinks : ""} ${isSelected ? styles.selected : ""} ${isToday ? styles.today : ""}`}
                    onClick={() => setSelectedDate(dateKey)}
                  >
                    <span className={styles.dayNumber}>{day}</span>
                    {count > 0 && (
                      <span className={styles.linkCount}>{count} link{count > 1 ? "s" : ""}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {selectedDate && (
          <div className={styles.detailsPanel}>
            <h3>
              Links received on {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </h3>

            {selectedLinks.length === 0 ? (
              <p className={styles.noLinks}>No links received on this date.</p>
            ) : (
              <div className={styles.linksList}>
                {selectedLinks.map((link) => (
                  <div key={link.id} className={styles.linkCard}>
                    <div className={styles.linkHeader}>
                      <span className={styles.keyword}>{link.targetKeyword}</span>
                      <div className={styles.badges}>
                        <span className={styles.badge}>{formatLinkType(link.linkType)}</span>
                        <span className={styles.badge}>{formatPlacement(link.placementFormat)}</span>
                      </div>
                    </div>
                    <div className={styles.linkDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Target URL:</span>
                        <a href={link.targetUrl} target="_blank" rel="noopener noreferrer" className={styles.url}>
                          {link.targetUrl}
                        </a>
                      </div>
                      {link.publisherDomain && (
                        <div className={styles.detailRow}>
                          <span className={styles.label}>Published on:</span>
                          <span>{link.publisherDomain}</span>
                        </div>
                      )}
                      {link.proofUrl && (
                        <div className={styles.detailRow}>
                          <span className={styles.label}>Proof:</span>
                          <a href={link.proofUrl} target="_blank" rel="noopener noreferrer" className={styles.url}>
                            View Link
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {links.length === 0 && (
          <div className={styles.emptyState}>
            <h3>No links received yet</h3>
            <p>When publishers complete work for your campaigns, you'll see them here.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
