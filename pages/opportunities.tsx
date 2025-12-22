import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth-context";
import { get, post } from "../lib/api-client";
import styles from "../styles/Earn.module.css";

interface DomainMetrics {
  domainRating: number | null;
  organicTraffic: number | null;
  backlinks: number | null;
  referringDomains: number | null;
  spamScore: number | null;
  summary: string | null;
}

interface FeedItem {
  slotId: number;
  campaignId: number;
  maskedDomain: string;
  industry: string;
  summary: string | null;
  linkType: string;
  placementFormat: string;
  creditReward: number;
  publisherNotes: string | null;
  createdAt: string;
  metrics: DomainMetrics | null;
}

interface Asset {
  id: number;
  domain: string;
  industry: string | null;
  status: string;
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

const formatLinkType = (type: string) => {
  switch (type) {
    case "hyperlink_dofollow": return "Dofollow";
    case "hyperlink_nofollow": return "Nofollow";
    case "brand_mention": return "Brand Mention";
    default: return type;
  }
};

const formatPlacement = (format: string) => {
  return format === "guest_post" ? "Guest Post" : "Niche Edit";
};

export default function Earn() {
  const { user, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [mySlots, setMySlots] = useState<MySlot[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
  const [reserving, setReserving] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [retrying, setRetrying] = useState<number | null>(null);
  const [proofUrls, setProofUrls] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<"browse" | "mywork">("browse");
  const [error, setError] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState<{ maskedDomain: string; metrics: DomainMetrics | null } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isFirebaseConfigured) {
      fetchFeed();
      fetchAssets();
      fetchMySlots();
    }
  }, [user, isFirebaseConfigured]);

  const fetchFeed = async () => {
    try {
      const response = await get("/api/campaigns/feed");
      if (response.ok) {
        const data = await response.json();
        setFeed(data.feed);
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await get("/api/assets");
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets.filter((a: Asset) => a.status === "approved"));
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

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

  const handleReserve = async (slotId: number) => {
    if (!selectedAsset) {
      setError("Please select an asset first");
      return;
    }

    setReserving(slotId);
    setError("");

    try {
      const response = await post("/api/slots/reserve", { slotId, assetId: selectedAsset });

      if (response.ok) {
        fetchFeed();
        fetchMySlots();
        setActiveTab("mywork");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to reserve slot");
      }
    } catch (error) {
      setError("Failed to reserve slot");
    } finally {
      setReserving(null);
    }
  };

  const handleSubmitProof = async (slotId: number) => {
    const proofUrl = proofUrls[slotId] || "";
    if (!proofUrl) {
      setError("Please enter a proof URL");
      return;
    }

    setSubmitting(slotId);
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
      setSubmitting(null);
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

  const handleCancel = async (slotId: number) => {
    if (!confirm("Are you sure you want to cancel this slot? It will be returned to the open pool.")) {
      return;
    }

    setCancelling(slotId);
    setError("");

    try {
      const response = await post("/api/slots/cancel", { slotId });

      if (response.ok) {
        fetchMySlots();
        fetchFeed();
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

  if (loading) {
    return <Layout title="Link Exchange Opportunities - LinkExchange"><div className={styles.loading}>Loading...</div></Layout>;
  }

  if (!user) {
    return null;
  }

  return (
    <Layout title="Link Exchange Opportunities - LinkExchange">
      <div className={styles.container}>
        <h1>Link Exchange Opportunities</h1>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.feedSection}>
            {assets.length > 0 && (
              <div className={styles.assetSelector}>
                <label>Select your website to use:</label>
                <select
                  value={selectedAsset || ""}
                  onChange={(e) => setSelectedAsset(Number(e.target.value) || null)}
                >
                  <option value="">Choose a website...</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.domain} ({asset.industry || "Any"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {assets.length === 0 && (
              <div className={styles.notice}>
                You need at least one approved website to reserve slots. 
                <Link href="/dashboard"> Add a website in your dashboard.</Link>
              </div>
            )}

            {feed.length === 0 ? (
              <p className={styles.empty}>No opportunities available right now. Check back later!</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Domain</th>
                      <th>Industry & Summary</th>
                      <th>Link Type</th>
                      <th>Format</th>
                      <th>Notes</th>
                      <th>Reward</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feed.map((item) => (
                      <tr key={item.slotId}>
                        <td>
                          <button
                            className={styles.maskedDomainBtn}
                            onClick={() => setSelectedMetrics({ maskedDomain: item.maskedDomain, metrics: item.metrics })}
                          >
                            {item.maskedDomain}
                          </button>
                        </td>
                        <td>
                          <div className={styles.industryContainer}>
                            <span className={styles.industryBadge}>{item.industry}</span>
                            {item.summary && <p className={styles.siteSummary}>{item.summary}</p>}
                          </div>
                        </td>
                        <td>{formatLinkType(item.linkType)}</td>
                        <td>{formatPlacement(item.placementFormat)}</td>
                        <td className={styles.notesCell}>
                          {item.publisherNotes || <span className={styles.muted}>—</span>}
                        </td>
                        <td>
                          <span className={styles.reward}>{item.creditReward}</span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleReserve(item.slotId)}
                            disabled={reserving === item.slotId || assets.length === 0 || !selectedAsset}
                            className={styles.reserveBtn}
                          >
                            {reserving === item.slotId ? "..." : "Reserve"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedMetrics && (
            <div className={styles.popupOverlay} onClick={() => setSelectedMetrics(null)}>
              <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.popupHeader}>
                  <h3>Domain Insights: {selectedMetrics.maskedDomain}</h3>
                  <button onClick={() => setSelectedMetrics(null)} className={styles.popupClose}>&times;</button>
                </div>
                <div className={styles.popupBody}>
                  {selectedMetrics.metrics ? (
                    <>
                      {selectedMetrics.metrics.summary && (
                        <div className={styles.metricsSummary}>
                          <p>{selectedMetrics.metrics.summary}</p>
                        </div>
                      )}
                      <div className={styles.metricsGrid}>
                        <div className={styles.metricCard}>
                          <span className={styles.metricLabel}>Domain Rating</span>
                          <span className={styles.metricValue}>{selectedMetrics.metrics.domainRating ?? "—"}</span>
                        </div>
                        <div className={styles.metricCard}>
                          <span className={styles.metricLabel}>Organic Traffic</span>
                          <span className={styles.metricValue}>{selectedMetrics.metrics.organicTraffic?.toLocaleString() ?? "—"}</span>
                        </div>
                        <div className={styles.metricCard}>
                          <span className={styles.metricLabel}>Backlinks</span>
                          <span className={styles.metricValue}>{selectedMetrics.metrics.backlinks?.toLocaleString() ?? "—"}</span>
                        </div>
                        <div className={styles.metricCard}>
                          <span className={styles.metricLabel}>Referring Domains</span>
                          <span className={styles.metricValue}>{selectedMetrics.metrics.referringDomains?.toLocaleString() ?? "—"}</span>
                        </div>
                        <div className={styles.metricCard}>
                          <span className={styles.metricLabel}>Spam Score</span>
                          <span className={styles.metricValue} style={{ color: (selectedMetrics.metrics.spamScore ?? 0) > 30 ? 'red' : 'inherit' }}>
                            {selectedMetrics.metrics.spamScore ?? "—"}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.noMetrics}>
                      <p>No metrics available for this domain yet.</p>
                      <p className={styles.noMetricsHint}>Metrics will be available once this domain is registered in our system.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
    </Layout>
  );
}
