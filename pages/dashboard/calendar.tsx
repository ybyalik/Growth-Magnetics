import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../lib/auth-context";
import { get } from "../../lib/api-client";
import styles from "../../styles/Dashboard.module.css";

interface ReceivedLink {
  id: number;
  targetUrl: string;
  targetKeyword: string;
  linkType: string;
  placementFormat: string;
  creditReward: number;
  proofUrl: string;
  publisherDomain: string | null;
  receivedAt: string;
}

interface GivenLink {
  id: number;
  targetUrl: string;
  targetKeyword: string;
  linkType: string;
  placementFormat: string;
  proofUrl: string;
  yourDomain: string | null;
  creditReward: number;
  givenAt: string;
}

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

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarPage() {
  const { user, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const [receivedLinks, setReceivedLinks] = useState<ReceivedLink[]>([]);
  const [givenLinks, setGivenLinks] = useState<GivenLink[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isFirebaseConfigured) {
      fetchReceivedLinks();
      fetchGivenLinks();
    }
  }, [user, isFirebaseConfigured]);

  const fetchReceivedLinks = async () => {
    try {
      const response = await get(`/api/campaigns/received-links?firebaseUid=${user?.uid}`);
      if (response.ok) {
        const data = await response.json();
        setReceivedLinks(data.links || []);
      }
    } catch (error) {
      console.error("Error fetching received links:", error);
    }
  };

  const fetchGivenLinks = async () => {
    try {
      const response = await get(`/api/campaigns/given-links?firebaseUid=${user?.uid}`);
      if (response.ok) {
        const data = await response.json();
        setGivenLinks(data.links || []);
      }
    } catch (error) {
      console.error("Error fetching given links:", error);
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

  const getReceivedLinksForDate = (dateKey: string) => {
    return receivedLinks.filter((link) => {
      if (!link.receivedAt) return false;
      const linkDate = new Date(link.receivedAt);
      const linkDateKey = formatDateKey(linkDate.getFullYear(), linkDate.getMonth(), linkDate.getDate());
      return linkDateKey === dateKey;
    });
  };

  const getGivenLinksForDate = (dateKey: string) => {
    return givenLinks.filter((link) => {
      if (!link.givenAt) return false;
      const linkDate = new Date(link.givenAt);
      const linkDateKey = formatDateKey(linkDate.getFullYear(), linkDate.getMonth(), linkDate.getDate());
      return linkDateKey === dateKey;
    });
  };

  const getLinkCountsByDate = () => {
    const counts: Record<string, { received: number; given: number }> = {};
    
    receivedLinks.forEach((link) => {
      if (!link.receivedAt) return;
      const linkDate = new Date(link.receivedAt);
      const dateKey = formatDateKey(linkDate.getFullYear(), linkDate.getMonth(), linkDate.getDate());
      if (!counts[dateKey]) counts[dateKey] = { received: 0, given: 0 };
      counts[dateKey].received += 1;
    });
    
    givenLinks.forEach((link) => {
      if (!link.givenAt) return;
      const linkDate = new Date(link.givenAt);
      const dateKey = formatDateKey(linkDate.getFullYear(), linkDate.getMonth(), linkDate.getDate());
      if (!counts[dateKey]) counts[dateKey] = { received: 0, given: 0 };
      counts[dateKey].given += 1;
    });
    
    return counts;
  };

  const handleDateClick = (dateKey: string) => {
    setSelectedDate(dateKey);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    setSelectedDate(null);
  };

  if (loading) {
    return <DashboardLayout title="Link Calendar - Biznoz"><div className={styles.loading}>Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout title="Link Calendar - Biznoz">
      <div className={styles.dashboard}>
        <div className={styles.pageHeader}>
          <h1>Link Calendar</h1>
        </div>

        <div className={styles.tabContent}>
          <div className={styles.calendarLegend}>
            <span className={styles.legendItem}><span className={styles.legendDotReceived}></span> Received</span>
            <span className={styles.legendItem}><span className={styles.legendDotGiven}></span> Given</span>
          </div>

          <div className={styles.calendarWrapperLarge}>
            <div className={styles.calendarHeader}>
              <button onClick={() => navigateMonth(-1)} className={styles.calendarNavBtn}>
                &larr; Previous
              </button>
              <h2 className={styles.calendarTitle}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
              <button onClick={() => navigateMonth(1)} className={styles.calendarNavBtn}>
                Next &rarr;
              </button>
            </div>

            <div className={styles.calendarLarge}>
              <div className={styles.weekdaysLarge}>
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className={styles.calendarDaysLarge}>
                {Array.from({ length: getDaysInMonth(currentDate).startingDay }).map((_, i) => (
                  <div key={`empty-${i}`} className={styles.emptyDayLarge}></div>
                ))}

                {Array.from({ length: getDaysInMonth(currentDate).daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const counts = getLinkCountsByDate()[dateKey] || { received: 0, given: 0 };
                  const hasAnyLinks = counts.received > 0 || counts.given > 0;
                  const isToday = dateKey === formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

                  return (
                    <div
                      key={day}
                      className={`${styles.calendarDayLarge} ${hasAnyLinks ? styles.hasLinksLarge : ""} ${isToday ? styles.todayLarge : ""}`}
                      onClick={() => hasAnyLinks && handleDateClick(dateKey)}
                      style={{ cursor: hasAnyLinks ? "pointer" : "default" }}
                    >
                      <span className={styles.dayNumberLarge}>{day}</span>
                      <div className={styles.linkIndicators}>
                        {counts.received > 0 && (
                          <span className={styles.receivedCount}>{counts.received} received</span>
                        )}
                        {counts.given > 0 && (
                          <span className={styles.givenCount}>{counts.given} given</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {receivedLinks.length === 0 && givenLinks.length === 0 && (
            <div className={styles.emptyCalendar}>
              <h3>No link activity yet</h3>
              <p>When you receive or give links, they&apos;ll appear here on the calendar.</p>
            </div>
          )}

          {showPopup && selectedDate && (
            <div className={styles.popupOverlay} onClick={closePopup}>
              <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.popupHeader}>
                  <h3>
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </h3>
                  <button onClick={closePopup} className={styles.popupClose}>&times;</button>
                </div>
                
                <div className={styles.popupBody}>
                  {getReceivedLinksForDate(selectedDate).length > 0 && (
                    <div className={styles.popupSection}>
                      <h4 className={styles.popupSectionTitle}>
                        <span className={styles.legendDotReceived}></span> Links Received ({getReceivedLinksForDate(selectedDate).length})
                      </h4>
                      <div className={styles.popupLinks}>
                        {getReceivedLinksForDate(selectedDate).map((link) => (
                          <div key={`received-${link.id}`} className={styles.popupLinkCard}>
                            <div className={styles.popupLinkHeader}>
                              <span className={styles.popupKeyword}>{link.targetKeyword}</span>
                              <div className={styles.popupBadges}>
                                <span className={styles.popupBadge}>{formatLinkType(link.linkType)}</span>
                                <span className={styles.popupBadge}>{formatPlacement(link.placementFormat)}</span>
                                <span className={styles.popupBadgeCost}>-{link.creditReward} credits</span>
                              </div>
                            </div>
                            <div className={styles.popupLinkDetails}>
                              <div><strong>Target:</strong> <a href={link.targetUrl} target="_blank" rel="noopener noreferrer">{link.targetUrl}</a></div>
                              {link.publisherDomain && <div><strong>From:</strong> {link.publisherDomain}</div>}
                              {link.proofUrl && <div><strong>Proof:</strong> <a href={link.proofUrl} target="_blank" rel="noopener noreferrer">View</a></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {getGivenLinksForDate(selectedDate).length > 0 && (
                    <div className={styles.popupSection}>
                      <h4 className={styles.popupSectionTitle}>
                        <span className={styles.legendDotGiven}></span> Links Given ({getGivenLinksForDate(selectedDate).length})
                      </h4>
                      <div className={styles.popupLinks}>
                        {getGivenLinksForDate(selectedDate).map((link) => (
                          <div key={`given-${link.id}`} className={styles.popupLinkCard}>
                            <div className={styles.popupLinkHeader}>
                              <span className={styles.popupKeyword}>{link.targetKeyword}</span>
                              <div className={styles.popupBadges}>
                                <span className={styles.popupBadge}>{formatLinkType(link.linkType)}</span>
                                <span className={styles.popupBadge}>{formatPlacement(link.placementFormat)}</span>
                                <span className={styles.popupBadgeReward}>+{link.creditReward} credits</span>
                              </div>
                            </div>
                            <div className={styles.popupLinkDetails}>
                              <div><strong>Target:</strong> <a href={link.targetUrl} target="_blank" rel="noopener noreferrer">{link.targetUrl}</a></div>
                              {link.yourDomain && <div><strong>Your site:</strong> {link.yourDomain}</div>}
                              {link.proofUrl && <div><strong>Proof:</strong> <a href={link.proofUrl} target="_blank" rel="noopener noreferrer">View</a></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {getReceivedLinksForDate(selectedDate).length === 0 && getGivenLinksForDate(selectedDate).length === 0 && (
                    <p className={styles.empty}>No links on this date.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
