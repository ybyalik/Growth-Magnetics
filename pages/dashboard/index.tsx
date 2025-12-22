import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";
import { useAuth } from "../../lib/auth-context";
import { get, post } from "../../lib/api-client";
import styles from "../../styles/Dashboard.module.css";

interface Asset {
  id: number;
  domain: string;
  industry: string | null;
  domainRating: number | null;
  traffic: number | null;
  qualityTier: string | null;
  creditValue: number | null;
  backlinks: number | null;
  referringDomains: number | null;
  spamScore: number | null;
  status: string;
  createdAt: string;
  summary?: string | null;
  organicTraffic?: number | null;
  paidTraffic?: number | null;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  direction: string;
  description: string | null;
  createdAt: string;
}

interface Campaign {
  id: number;
  targetUrl: string;
  targetKeyword: string;
  linkType: string;
  placementFormat: string;
  industry: string;
  quantity: number;
  filledSlots: number;
  creditReward: number;
  status: string;
  createdAt: string;
}

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

export default function Dashboard() {
  const { user, dbUser, loading, isFirebaseConfigured, refreshUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"assets" | "campaigns" | "history" | "calendar">("assets");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receivedLinks, setReceivedLinks] = useState<ReceivedLink[]>([]);
  const [bulkDomains, setBulkDomains] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDomainMetrics, setSelectedDomainMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const fetchDomainMetrics = async (asset: Asset) => {
    setLoadingMetrics(true);
    try {
      const response = await get(`/api/admin/domain-metrics?domain=${asset.domain}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedDomainMetrics({ ...data, summary: asset.summary });
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isFirebaseConfigured) {
      fetchAssets();
      fetchCampaigns();
      fetchTransactions();
      fetchReceivedLinks();
    }
  }, [user, isFirebaseConfigured]);

  const fetchAssets = async () => {
    try {
      const response = await get("/api/assets");
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await get("/api/campaigns");
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await get("/api/transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

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
    return receivedLinks.filter((link) => {
      if (!link.receivedAt) return false;
      const linkDate = new Date(link.receivedAt);
      const linkDateKey = formatDateKey(linkDate.getFullYear(), linkDate.getMonth(), linkDate.getDate());
      return linkDateKey === dateKey;
    });
  };

  const getLinkCountByDate = () => {
    const counts: Record<string, number> = {};
    receivedLinks.forEach((link) => {
      if (!link.receivedAt) return;
      const linkDate = new Date(link.receivedAt);
      const dateKey = formatDateKey(linkDate.getFullYear(), linkDate.getMonth(), linkDate.getDate());
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

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleCancelCampaign = async (campaignId: number) => {
    if (!confirm("Are you sure you want to cancel this campaign? You will receive a refund for unclaimed slots.")) {
      return;
    }

    setCancelling(campaignId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await post(`/api/campaigns/${campaignId}/cancel`, {});
      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        fetchCampaigns();
        fetchTransactions();
        if (refreshUser) refreshUser();
      } else {
        setError(data.error || "Failed to cancel campaign");
      }
    } catch (error) {
      setError("Failed to cancel campaign");
    } finally {
      setCancelling(null);
    }
  };

  const handleSubmitAssets = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    // Parse domains from bulk input (one per line)
    const domains = bulkDomains
      .split(/\n/)
      .map(d => d.trim().toLowerCase())
      .filter(d => d.length > 0);

    if (domains.length === 0) {
      setError("Please enter at least one domain");
      setSubmitting(false);
      return;
    }

    try {
      const response = await post("/api/assets", { domains });

      if (response.ok) {
        const data = await response.json();
        setBulkDomains("");
        fetchAssets();
        setSuccessMessage(`Successfully submitted ${data.count} website(s) for review`);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to submit assets");
      }
    } catch (error) {
      setError("Failed to submit assets");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Layout title="Dashboard - LinkExchange"><div className={styles.loading}>Loading...</div></Layout>;
  }

  if (!user) {
    return null;
  }

  return (
    <Layout title="Dashboard - LinkExchange">
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <h1>Dashboard</h1>
          <div className={styles.userInfo}>
            <span>Welcome, {dbUser?.displayName || user.email}</span>
            <span className={styles.creditBadge}>{dbUser?.credits || 0} Credits</span>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "assets" ? styles.active : ""}`}
            onClick={() => setActiveTab("assets")}
          >
            My Assets
          </button>
          <button
            className={`${styles.tab} ${activeTab === "campaigns" ? styles.active : ""}`}
            onClick={() => setActiveTab("campaigns")}
          >
            My Campaigns
          </button>
          <button
            className={`${styles.tab} ${activeTab === "history" ? styles.active : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Exchange History
          </button>
          <button
            className={`${styles.tab} ${activeTab === "calendar" ? styles.active : ""}`}
            onClick={() => setActiveTab("calendar")}
          >
            Link Calendar
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {successMessage && <p className={styles.success}>{successMessage}</p>}

        {activeTab === "assets" && (
          <div className={styles.tabContent}>
            <div className={styles.addAsset}>
              <h2>Add Websites</h2>
              <p className={styles.hint}>Paste one or more domains below (one per line)</p>
              <form onSubmit={handleSubmitAssets} className={styles.bulkForm}>
                <textarea
                  placeholder={`example.com\nanother-site.com\nthird-domain.org`}
                  value={bulkDomains}
                  onChange={(e) => setBulkDomains(e.target.value)}
                  rows={5}
                  required
                />
                <button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit for Review"}
                </button>
              </form>
            </div>

            <div className={styles.assetList}>
              <h2>Your Websites</h2>
              {assets.length === 0 ? (
                <p className={styles.empty}>No websites submitted yet. Add your first website above!</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Domain</th>
                      <th>Rank</th>
                      <th>Traffic</th>
                      <th>Backlinks</th>
                      <th>Ref. Domains</th>
                      <th>Spam Score</th>
                      <th>Status</th>
                      <th>Credit Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr key={asset.id}>
                        <td>
                          <button
                            onClick={() => fetchDomainMetrics(asset)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
                          >
                            {asset.domain}
                          </button>
                        </td>
                        <td>{asset.domainRating || "-"}</td>
                        <td>{asset.organicTraffic?.toLocaleString() || "-"}</td>
                        <td>{asset.backlinks?.toLocaleString() || "0"}</td>
                        <td>{asset.referringDomains?.toLocaleString() || "0"}</td>
                        <td>
                          <span className={styles.spamScore} style={{ color: (asset.spamScore || 0) > 30 ? 'red' : 'inherit' }}>
                            {asset.spamScore || "0"}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.status} ${styles[asset.status]}`}>
                            {asset.status}
                          </span>
                        </td>
                        <td>{asset.status === "approved" ? `${asset.creditValue} credits` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {selectedDomainMetrics && (
              <div className={styles.modal}>
                <div className={styles.modalContent} style={{ maxWidth: '800px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '4px' }}>Domain Insights: {selectedDomainMetrics.domain}</h3>
                    <button onClick={() => setSelectedDomainMetrics(null)} className={styles.closeBtn}>Close</button>
                  </div>

                  {selectedDomainMetrics.summary && (
                    <div style={{ padding: '15px', background: 'var(--color-primary-light, #fff5f5)', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid var(--color-primary)' }}>
                      <label style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Website Summary</label>
                      <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--color-text-primary)' }}>"{selectedDomainMetrics.summary}"</p>
                    </div>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#666' }}>Rank</label>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>#{selectedDomainMetrics.rank}</div>
                    </div>
                    <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#666' }}>Backlinks</label>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{selectedDomainMetrics.backlinks?.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#666' }}>Ref. Domains</label>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{selectedDomainMetrics.referring_domains?.toLocaleString()}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#2e7d32' }}>Organic Traffic</label>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32' }}>{selectedDomainMetrics.organic_traffic?.toLocaleString() || '0'}</div>
                    </div>
                    <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#e65100' }}>Paid Traffic</label>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e65100' }}>{selectedDomainMetrics.paid_traffic?.toLocaleString() || '0'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '30px' }}>
                    <div style={{ padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#1565c0' }}>Country</label>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1565c0' }}>{selectedDomainMetrics.country === 'WW' ? 'Worldwide' : selectedDomainMetrics.country || 'N/A'}</div>
                    </div>
                    <div style={{ padding: '15px', background: '#f3e5f5', borderRadius: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#7b1fa2' }}>Language</label>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7b1fa2' }}>{selectedDomainMetrics.language_code?.toUpperCase() || 'EN'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <h4 style={{ marginBottom: '10px' }}>Link Types</h4>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {Object.entries(selectedDomainMetrics.referring_links_types || {}).map(([key, val]: [string, any]) => (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                            <span>{key}</span>
                            <strong>{val?.toLocaleString()}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 style={{ marginBottom: '10px' }}>Top TLDs</h4>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {Object.entries(selectedDomainMetrics.referring_links_tld || {}).map(([key, val]: [string, any]) => (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                            <span>.{key}</span>
                            <strong>{val?.toLocaleString()}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ marginBottom: '10px' }}>Countries Distribution</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {Object.entries(selectedDomainMetrics.referring_links_countries || {})
                        .filter(([key]) => key !== '')
                        .slice(0, 10)
                        .map(([key, val]: [string, any]) => (
                          <div key={key} style={{ padding: '6px 12px', background: '#eee', borderRadius: '4px', fontSize: '12px' }}>
                            {key === 'WW' ? 'Worldwide' : key}: {val?.toLocaleString()}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loadingMetrics && (
              <div className={styles.modal}>
                <div className={styles.modalContent}>
                  <p>Fetching domain insights...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "campaigns" && (
          <div className={styles.tabContent}>
            <div className={styles.campaignHeader}>
              <h2>Your Campaigns</h2>
              <Link href="/campaigns/new" className={styles.newCampaignBtn}>Create New Campaign</Link>
            </div>
            {campaigns.length === 0 ? (
              <p className={styles.empty}>No campaigns created yet. Create your first campaign to request backlinks!</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Type</th>
                    <th>Industry</th>
                    <th>Slots</th>
                    <th>Credits/Slot</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>
                        <div className={styles.targetCell}>
                          <strong className={styles.targetUrl}>{campaign.targetUrl}</strong>
                          <span className={styles.targetKeyword}>{campaign.targetKeyword}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.typeLabel}>{campaign.linkType.replace('_', ' ')}</span>
                      </td>
                      <td>{campaign.industry}</td>
                      <td>
                        <span className={styles.slotsProgress}>
                          {campaign.filledSlots} / {campaign.quantity}
                        </span>
                      </td>
                      <td>{campaign.creditReward}</td>
                      <td>
                        <span className={`${styles.status} ${styles[campaign.status]}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td>
                        {campaign.status === "active" && campaign.filledSlots === 0 ? (
                          <button
                            className={styles.cancelBtn}
                            onClick={() => handleCancelCampaign(campaign.id)}
                            disabled={cancelling === campaign.id}
                          >
                            {cancelling === campaign.id ? "Cancelling..." : "Cancel"}
                          </button>
                        ) : campaign.status === "active" && campaign.filledSlots > 0 ? (
                          <span className={styles.cannotCancel}>In progress</span>
                        ) : (
                          <span className={styles.noAction}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className={styles.tabContent}>
            <h2>Exchange History</h2>
            {transactions.length === 0 ? (
              <p className={styles.empty}>No transactions yet.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Direction</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td>{tx.type}</td>
                      <td>
                        <span className={`${styles.direction} ${styles[tx.direction]}`}>
                          {tx.direction === "received" ? "Received" : "Given"}
                        </span>
                      </td>
                      <td className={tx.direction === "received" ? styles.positive : styles.negative}>
                        {tx.direction === "received" ? "+" : "-"}{tx.amount}
                      </td>
                      <td>{tx.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "calendar" && (
          <div className={styles.tabContent}>
            <div className={styles.calendarWrapper}>
              <div className={styles.calendarHeader}>
                <button onClick={() => navigateMonth(-1)} className={styles.calendarNavBtn}>
                  &larr; Previous
                </button>
                <h2 className={styles.calendarTitle}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <button onClick={() => navigateMonth(1)} className={styles.calendarNavBtn}>
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

                <div className={styles.calendarDays}>
                  {Array.from({ length: getDaysInMonth(currentDate).startingDay }).map((_, i) => (
                    <div key={`empty-${i}`} className={styles.emptyDay}></div>
                  ))}

                  {Array.from({ length: getDaysInMonth(currentDate).daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const count = getLinkCountByDate()[dateKey] || 0;
                    const isSelected = selectedDate === dateKey;
                    const isToday = dateKey === formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

                    return (
                      <div
                        key={day}
                        className={`${styles.calendarDay} ${count > 0 ? styles.hasLinks : ""} ${isSelected ? styles.selectedDay : ""} ${isToday ? styles.today : ""}`}
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
              <div className={styles.linksDetail}>
                <h3>
                  Links received on {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </h3>

                {getLinksForDate(selectedDate).length === 0 ? (
                  <p className={styles.empty}>No links received on this date.</p>
                ) : (
                  <div className={styles.linksList}>
                    {getLinksForDate(selectedDate).map((link) => (
                      <div key={link.id} className={styles.linkCard}>
                        <div className={styles.linkCardHeader}>
                          <span className={styles.linkKeyword}>{link.targetKeyword}</span>
                          <div className={styles.linkBadges}>
                            <span className={styles.linkBadge}>{formatLinkType(link.linkType)}</span>
                            <span className={styles.linkBadge}>{formatPlacement(link.placementFormat)}</span>
                          </div>
                        </div>
                        <div className={styles.linkCardDetails}>
                          <div className={styles.linkDetailRow}>
                            <span className={styles.linkLabel}>Target URL:</span>
                            <a href={link.targetUrl} target="_blank" rel="noopener noreferrer" className={styles.linkUrl}>
                              {link.targetUrl}
                            </a>
                          </div>
                          {link.publisherDomain && (
                            <div className={styles.linkDetailRow}>
                              <span className={styles.linkLabel}>Published on:</span>
                              <span>{link.publisherDomain}</span>
                            </div>
                          )}
                          {link.proofUrl && (
                            <div className={styles.linkDetailRow}>
                              <span className={styles.linkLabel}>Proof:</span>
                              <a href={link.proofUrl} target="_blank" rel="noopener noreferrer" className={styles.linkUrl}>
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

            {receivedLinks.length === 0 && !selectedDate && (
              <div className={styles.emptyCalendar}>
                <h3>No links received yet</h3>
                <p>When publishers complete work for your campaigns, you&apos;ll see them here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
