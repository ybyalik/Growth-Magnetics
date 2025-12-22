import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";
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

interface FullDomainMetrics {
  domain: string;
  rank: number;
  backlinks: number;
  referring_domains: number;
  organic_traffic: number;
  paid_traffic: number;
  country: string;
  language_code: string;
  referring_links_types: Record<string, number>;
  referring_links_tld: Record<string, number>;
  referring_links_countries: Record<string, number>;
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
  const [selectedMetrics, setSelectedMetrics] = useState<{ maskedDomain: string; metrics: FullDomainMetrics | null; loading: boolean } | null>(null);

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

  const handleDomainClick = async (item: FeedItem) => {
    setSelectedMetrics({ maskedDomain: item.maskedDomain, metrics: null, loading: true });
    
    try {
      const response = await get(`/api/campaigns/feed/metrics?slotId=${item.slotId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedMetrics({ 
          maskedDomain: item.maskedDomain, 
          metrics: { ...data, summary: item.summary },
          loading: false 
        });
      } else {
        setSelectedMetrics({ 
          maskedDomain: item.maskedDomain, 
          metrics: null,
          loading: false 
        });
      }
    } catch (error) {
      console.error("Error fetching domain metrics:", error);
      setSelectedMetrics({ 
        maskedDomain: item.maskedDomain, 
        metrics: null,
        loading: false 
      });
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
    return <DashboardLayout title="Opportunities - Biznoz"><div className={styles.loading}>Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout title="Opportunities - Biznoz">
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1>Link Exchange Opportunities</h1>
        </div>

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
                            onClick={() => handleDomainClick(item)}
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
              <div className={styles.popupContent} style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
                <div className={styles.popupHeader}>
                  <h3>Domain Insights: {selectedMetrics.maskedDomain}</h3>
                  <button onClick={() => setSelectedMetrics(null)} className={styles.popupClose}>&times;</button>
                </div>
                <div className={styles.popupBody}>
                  {selectedMetrics.loading ? (
                    <div className={styles.noMetrics}>
                      <p>Loading metrics...</p>
                    </div>
                  ) : selectedMetrics.metrics ? (
                    <>
                      {selectedMetrics.metrics.summary && (
                        <div style={{ padding: '15px', background: 'var(--color-primary-light, #fff5f5)', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid var(--color-primary)' }}>
                          <label style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Website Summary</label>
                          <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--color-text-primary)' }}>{selectedMetrics.metrics.summary}</p>
                        </div>
                      )}
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                          <label style={{ fontSize: '12px', color: '#666' }}>Rank</label>
                          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>#{selectedMetrics.metrics.rank || "—"}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                          <label style={{ fontSize: '12px', color: '#666' }}>Backlinks</label>
                          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{selectedMetrics.metrics.backlinks?.toLocaleString() || "—"}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                          <label style={{ fontSize: '12px', color: '#666' }}>Ref. Domains</label>
                          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{selectedMetrics.metrics.referring_domains?.toLocaleString() || "—"}</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '8px' }}>
                          <label style={{ fontSize: '12px', color: '#2e7d32' }}>Organic Traffic</label>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32' }}>{selectedMetrics.metrics.organic_traffic?.toLocaleString() || '0'}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
                          <label style={{ fontSize: '12px', color: '#e65100' }}>Paid Traffic</label>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e65100' }}>{selectedMetrics.metrics.paid_traffic?.toLocaleString() || '0'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '30px' }}>
                        <div style={{ padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
                          <label style={{ fontSize: '12px', color: '#1565c0' }}>Country</label>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1565c0' }}>{selectedMetrics.metrics.country === 'WW' ? 'Worldwide' : selectedMetrics.metrics.country || 'N/A'}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f3e5f5', borderRadius: '8px' }}>
                          <label style={{ fontSize: '12px', color: '#7b1fa2' }}>Language</label>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7b1fa2' }}>{selectedMetrics.metrics.language_code?.toUpperCase() || 'EN'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <h4 style={{ marginBottom: '10px' }}>Link Types</h4>
                          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {Object.entries(selectedMetrics.metrics.referring_links_types || {}).map(([key, val]) => (
                              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                                <span>{key}</span>
                                <strong>{(val as number)?.toLocaleString()}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 style={{ marginBottom: '10px' }}>Top TLDs</h4>
                          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {Object.entries(selectedMetrics.metrics.referring_links_tld || {}).map(([key, val]) => (
                              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                                <span>.{key}</span>
                                <strong>{(val as number)?.toLocaleString()}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '20px' }}>
                        <h4 style={{ marginBottom: '10px' }}>Countries Distribution</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {Object.entries(selectedMetrics.metrics.referring_links_countries || {})
                            .filter(([key]) => key !== '')
                            .slice(0, 10)
                            .map(([key, val]) => (
                              <div key={key} style={{ padding: '6px 12px', background: '#eee', borderRadius: '4px', fontSize: '12px' }}>
                                {key === 'WW' ? 'Worldwide' : key}: {(val as number)?.toLocaleString()}
                              </div>
                            ))}
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
    </DashboardLayout>
  );
}
