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
  referenceType: string | null;
  referenceId: number | null;
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

interface CampaignSlot {
  id: number;
  campaignId: number;
  targetUrl: string | null;
  targetKeyword: string | null;
  linkType: string | null;
  placementFormat: string | null;
  creditReward: number | null;
  industry: string | null;
  publisherId: number | null;
  proofUrl: string | null;
  status: string;
  createdAt: string;
  campaign: {
    id: number;
    publisherNotes: string | null;
    status: string;
    createdAt: string;
  } | null;
}

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

interface MySlot {
  id: number;
  status: string;
  proofUrl: string | null;
  targetUrl: string | null;
  targetKeyword: string | null;
  linkType: string | null;
  placementFormat: string | null;
  creditReward: number | null;
  industry: string | null;
  verified: boolean | null;
  verificationDetails: string | null;
  campaign: {
    targetUrl: string;
    targetKeyword: string;
    creditReward: number;
    industry: string;
    placementFormat: string;
    linkType: string;
  };
  asset: { domain: string } | null;
}

export default function Dashboard() {
  const { user, dbUser, loading, isFirebaseConfigured, refreshUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"assets" | "campaigns" | "history" | "calendar" | "work">("assets");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignSlots, setCampaignSlots] = useState<CampaignSlot[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receivedLinks, setReceivedLinks] = useState<ReceivedLink[]>([]);
  const [givenLinks, setGivenLinks] = useState<GivenLink[]>([]);
  const [mySlots, setMySlots] = useState<MySlot[]>([]);
  const [proofUrls, setProofUrls] = useState<Record<number, string>>({});
  const [bulkDomains, setBulkDomains] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittingProof, setSubmittingProof] = useState<number | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [retrying, setRetrying] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [expandedTransaction, setExpandedTransaction] = useState<number | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [loadingTransactionDetails, setLoadingTransactionDetails] = useState(false);
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
      fetchGivenLinks();
      fetchMySlots();
    }
  }, [user, isFirebaseConfigured]);

  const fetchMySlots = async () => {
    try {
      const response = await get("/api/slots/my-slots");
      if (response.ok) {
        const data = await response.json();
        setMySlots(data.slots);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

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
        setCampaignSlots(data.slots || []);
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

  const handleDeleteAsset = async (assetId: number) => {
    if (!confirm("Are you sure you want to delete this website? This action cannot be undone.")) {
      return;
    }

    setDeletingAsset(assetId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        fetchAssets();
      } else {
        setError(data.error || "Failed to delete website");
      }
    } catch (error) {
      setError("Failed to delete website");
    } finally {
      setDeletingAsset(null);
    }
  };

  const handleSubmitProof = async (slotId: number) => {
    const proofUrl = proofUrls[slotId] || "";
    if (!proofUrl) {
      setError("Please enter a proof URL");
      return;
    }

    setSubmittingProof(slotId);
    setError("");

    try {
      const response = await post("/api/slots/submit", { slotId, proofUrl });

      if (response.ok) {
        setProofUrls((prev) => ({ ...prev, [slotId]: "" }));
        fetchMySlots();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to submit proof");
      }
    } catch (error) {
      setError("Failed to submit proof");
    } finally {
      setSubmittingProof(null);
    }
  };

  const handleRetry = async (slotId: number) => {
    const proofUrl = proofUrls[slotId] || "";
    if (!proofUrl) {
      setError("Please enter a new proof URL");
      return;
    }

    setRetrying(slotId);
    setError("");

    try {
      const response = await post("/api/slots/retry", { slotId, proofUrl });

      if (response.ok) {
        setProofUrls((prev) => ({ ...prev, [slotId]: "" }));
        fetchMySlots();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to retry verification");
      }
    } catch (error) {
      setError("Failed to retry verification");
    } finally {
      setRetrying(null);
    }
  };

  const handleCancelSlot = async (slotId: number) => {
    if (!confirm("Are you sure you want to cancel this slot? It will be returned to the open pool.")) {
      return;
    }

    setCancelling(slotId);
    setError("");

    try {
      const response = await post("/api/slots/cancel", { slotId });

      if (response.ok) {
        fetchMySlots();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to cancel slot");
      }
    } catch (error) {
      setError("Failed to cancel slot");
    } finally {
      setCancelling(null);
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

  const toggleTransactionDetails = async (tx: Transaction) => {
    if (expandedTransaction === tx.id) {
      setExpandedTransaction(null);
      setTransactionDetails(null);
      return;
    }

    setExpandedTransaction(tx.id);
    setTransactionDetails(null);

    if (tx.referenceType === "slot" && tx.referenceId) {
      setLoadingTransactionDetails(true);
      try {
        const response = await get(`/api/slots/${tx.referenceId}`);
        if (response.ok) {
          const data = await response.json();
          setTransactionDetails(data.slot);
        }
      } catch (error) {
        console.error("Error fetching slot details:", error);
      } finally {
        setLoadingTransactionDetails(false);
      }
    } else if (tx.referenceType === "campaign" && tx.referenceId) {
      const campaign = campaigns.find(c => c.id === tx.referenceId);
      if (campaign) {
        setTransactionDetails(campaign);
      }
    }
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
            My Websites
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
            Credit History
          </button>
          <button
            className={`${styles.tab} ${activeTab === "work" ? styles.active : ""}`}
            onClick={() => setActiveTab("work")}
          >
            Links Submitted ({mySlots.length})
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
                      <th>Actions</th>
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
                        <td>
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className={styles.deleteBtn}
                            disabled={deletingAsset === asset.id}
                          >
                            {deletingAsset === asset.id ? "..." : "Delete"}
                          </button>
                        </td>
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
                      <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--color-text-primary)' }}>{selectedDomainMetrics.summary}</p>
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

          </div>
        )}

        {activeTab === "campaigns" && (
          <div className={styles.tabContent}>
            <div className={styles.campaignHeader}>
              <h2>Your Links</h2>
              <Link href="/campaigns/new" className={styles.newCampaignBtn}>Create New Campaign</Link>
            </div>
            {campaignSlots.length === 0 ? (
              <p className={styles.empty}>No links created yet. Create your first campaign to request backlinks!</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Type</th>
                    <th>Industry</th>
                    <th>Credits</th>
                    <th>Status</th>
                    <th>Proof</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignSlots.map((slot) => (
                    <tr key={slot.id}>
                      <td>
                        <div className={styles.targetCell}>
                          <strong className={styles.targetUrl}>{slot.targetUrl || slot.targetKeyword}</strong>
                          <span className={styles.targetKeyword}>{slot.targetKeyword}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.typeLabel}>{slot.linkType?.replace('_', ' ') || '-'}</span>
                      </td>
                      <td>{slot.industry || '-'}</td>
                      <td>{slot.creditReward}</td>
                      <td>
                        <span className={`${styles.status} ${styles[slot.status]}`}>
                          {slot.status}
                        </span>
                      </td>
                      <td>
                        {slot.proofUrl ? (
                          <a href={slot.proofUrl} target="_blank" rel="noopener noreferrer" className={styles.proofLink}>
                            View
                          </a>
                        ) : (
                          <span className={styles.noAction}>-</span>
                        )}
                      </td>
                      <td>
                        {slot.status === "open" && slot.campaign?.id ? (
                          <button
                            onClick={() => handleCancelCampaign(slot.campaign!.id)}
                            className={styles.cancelBtn}
                            disabled={cancelling === slot.campaign.id}
                          >
                            {cancelling === slot.campaign.id ? "..." : "Cancel"}
                          </button>
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
            <h2>Credit History</h2>
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
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <>
                      <tr 
                        key={tx.id} 
                        className={tx.referenceType ? styles.clickableRow : ""}
                        onClick={() => tx.referenceType && toggleTransactionDetails(tx)}
                      >
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
                        <td>
                          {tx.referenceType && (
                            <span className={styles.expandIcon}>
                              {expandedTransaction === tx.id ? "▼" : "▶"}
                            </span>
                          )}
                        </td>
                      </tr>
                      {expandedTransaction === tx.id && (
                        <tr key={`${tx.id}-details`} className={styles.detailsRow}>
                          <td colSpan={6}>
                            {loadingTransactionDetails ? (
                              <div className={styles.detailsLoading}>Loading details...</div>
                            ) : transactionDetails ? (
                              <div className={styles.transactionDetails}>
                                {tx.referenceType === "slot" && (
                                  <>
                                    <div className={styles.detailItem}>
                                      <strong>Target URL:</strong> {transactionDetails.targetUrl || "-"}
                                    </div>
                                    <div className={styles.detailItem}>
                                      <strong>Keyword:</strong> {transactionDetails.targetKeyword || "-"}
                                    </div>
                                    <div className={styles.detailItem}>
                                      <strong>Link Type:</strong> {transactionDetails.linkType?.replace("_", " ") || "-"}
                                    </div>
                                    <div className={styles.detailItem}>
                                      <strong>Industry:</strong> {transactionDetails.industry || "-"}
                                    </div>
                                    {transactionDetails.publisherDomain && (
                                      <div className={styles.detailItem}>
                                        <strong>Your Website:</strong> {transactionDetails.publisherDomain}
                                      </div>
                                    )}
                                    {transactionDetails.proofUrl && (
                                      <div className={styles.detailItem}>
                                        <strong>Proof URL:</strong>{" "}
                                        <a href={transactionDetails.proofUrl} target="_blank" rel="noopener noreferrer">
                                          View Link
                                        </a>
                                      </div>
                                    )}
                                  </>
                                )}
                                {tx.referenceType === "campaign" && (
                                  <>
                                    <div className={styles.detailItem}>
                                      <strong>Target URL:</strong> {transactionDetails.targetUrl || "-"}
                                    </div>
                                    <div className={styles.detailItem}>
                                      <strong>Keyword:</strong> {transactionDetails.targetKeyword || "-"}
                                    </div>
                                    <div className={styles.detailItem}>
                                      <strong>Link Type:</strong> {transactionDetails.linkType?.replace("_", " ") || "-"}
                                    </div>
                                    <div className={styles.detailItem}>
                                      <strong>Quantity:</strong> {transactionDetails.quantity} slots
                                    </div>
                                    <div className={styles.detailItem}>
                                      <strong>Status:</strong> {transactionDetails.status}
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className={styles.detailsLoading}>No details available</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "work" && (
          <div className={styles.tabContent}>
            <h2>Links Submitted</h2>
            {mySlots.length === 0 ? (
              <p className={styles.empty}>You have not reserved any slots yet.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Your Site</th>
                    <th>Target</th>
                    <th>Type</th>
                    <th>Format</th>
                    <th>Reward</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mySlots.map((slot) => {
                    const linkType = slot.linkType || slot.campaign.linkType;
                    const placementFormat = slot.placementFormat || slot.campaign.placementFormat;
                    const targetUrl = slot.targetUrl || slot.campaign.targetUrl;
                    const targetKeyword = slot.targetKeyword || slot.campaign.targetKeyword;
                    const creditReward = slot.creditReward || slot.campaign.creditReward;
                    const isBrandMention = linkType === "brand_mention";

                    return (
                      <tr key={slot.id}>
                        <td>{slot.asset?.domain || "—"}</td>
                        <td>
                          {isBrandMention ? (
                            <span>{targetKeyword}</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <a href={targetUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                {targetUrl.length > 30 ? targetUrl.slice(0, 30) + "..." : targetUrl}
                              </a>
                              <span style={{ fontSize: '12px', color: '#666' }}>{targetKeyword}</span>
                            </div>
                          )}
                        </td>
                        <td>{formatLinkType(linkType)}</td>
                        <td>{formatPlacement(placementFormat)}</td>
                        <td>{creditReward}</td>
                        <td>
                          <span className={`${styles.status} ${styles[slot.status]}`}>
                            {slot.status}
                          </span>
                        </td>
                        <td>
                          {slot.status === "reserved" && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                placeholder="Proof URL"
                                value={proofUrls[slot.id] || ""}
                                onChange={(e) => setProofUrls((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', width: '150px' }}
                              />
                              <button
                                onClick={() => handleSubmitProof(slot.id)}
                                disabled={submittingProof === slot.id}
                                className={styles.submitBtn}
                                style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                              >
                                {submittingProof === slot.id ? "..." : "Submit"}
                              </button>
                              <button
                                onClick={() => handleCancelSlot(slot.id)}
                                disabled={cancelling === slot.id}
                                style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid #ccc', backgroundColor: 'transparent', fontSize: '12px', cursor: 'pointer' }}
                              >
                                {cancelling === slot.id ? "..." : "Cancel"}
                              </button>
                            </div>
                          )}
                          {slot.status === "submitted" && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ color: 'red', fontSize: '11px', fontWeight: '600' }}>Verification failed</span>
                              {slot.verificationDetails && (() => {
                                try {
                                  const details = JSON.parse(slot.verificationDetails);
                                  if (Array.isArray(details)) {
                                    const failureReasons = details.filter((d: string) => 
                                      d.toLowerCase().includes('mismatch') || 
                                      d.toLowerCase().includes('not found') ||
                                      d.toLowerCase().includes('error') ||
                                      d.toLowerCase().includes('failed')
                                    );
                                    return (
                                      <ul style={{ margin: '4px 0 0 0', padding: '0 0 0 16px', fontSize: '11px', color: '#666' }}>
                                        {(failureReasons.length > 0 ? failureReasons : details).map((detail: string, idx: number) => (
                                          <li key={idx}>{detail}</li>
                                        ))}
                                      </ul>
                                    );
                                  }
                                  return <span style={{ fontSize: '11px', color: '#666' }}>{slot.verificationDetails}</span>;
                                } catch {
                                  return <span style={{ fontSize: '11px', color: '#666' }}>{slot.verificationDetails}</span>;
                                }
                              })()}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  type="text"
                                  placeholder="New Proof URL"
                                  value={proofUrls[slot.id] || ""}
                                  onChange={(e) => setProofUrls((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', width: '150px' }}
                                />
                                <button
                                  onClick={() => handleRetry(slot.id)}
                                  disabled={retrying === slot.id}
                                  style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                                >
                                  {retrying === slot.id ? "..." : "Retry"}
                                </button>
                                <button
                                  onClick={() => handleCancelSlot(slot.id)}
                                  disabled={cancelling === slot.id}
                                  style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid #ccc', backgroundColor: 'transparent', fontSize: '12px', cursor: 'pointer' }}
                                >
                                  {cancelling === slot.id ? "..." : "Cancel"}
                                </button>
                              </div>
                            </div>
                          )}
                          {slot.status === "approved" && (
                            <span style={{ color: 'green', fontSize: '12px' }}>Verified</span>
                          )}
                          {slot.status === "rejected" && (
                            <span style={{ color: 'red', fontSize: '12px' }}>Rejected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "calendar" && (
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
        )}
      </div>
    </Layout>
  );
}
