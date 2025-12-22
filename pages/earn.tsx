import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth-context";
import { get, post } from "../lib/api-client";
import styles from "../styles/Earn.module.css";

interface FeedItem {
  slotId: number;
  campaignId: number;
  industry: string;
  linkType: string;
  placementFormat: string;
  creditReward: number;
  publisherNotes: string | null;
  createdAt: string;
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
  const [proofUrls, setProofUrls] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<"browse" | "mywork">("browse");
  const [error, setError] = useState("");

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

  if (loading) {
    return <Layout title="Earn Credits - LinkExchange"><div className={styles.loading}>Loading...</div></Layout>;
  }

  if (!user) {
    return null;
  }

  return (
    <Layout title="Earn Credits - LinkExchange">
      <div className={styles.container}>
        <h1>Earn Credits</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "browse" ? styles.active : ""}`}
            onClick={() => setActiveTab("browse")}
          >
            Browse Opportunities
          </button>
          <button
            className={`${styles.tab} ${activeTab === "mywork" ? styles.active : ""}`}
            onClick={() => setActiveTab("mywork")}
          >
            My Work ({mySlots.length})
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {activeTab === "browse" && (
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
                      <th>Industry</th>
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
                          <span className={styles.industryBadge}>{item.industry}</span>
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
        )}

        {activeTab === "mywork" && (
          <div className={styles.workSection}>
            {mySlots.length === 0 ? (
              <p className={styles.empty}>You have not reserved any slots yet.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Your Site</th>
                      <th>Target</th>
                      <th>Type</th>
                      <th>Format</th>
                      <th>Reward</th>
                      <th>Status</th>
                      <th>Proof / Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mySlots.map((slot) => {
                      const linkType = slot.linkType || slot.campaign.linkType;
                      const placementFormat = slot.placementFormat || slot.campaign.placementFormat;
                      const targetUrl = slot.targetUrl || slot.campaign.targetUrl;
                      const targetKeyword = slot.targetKeyword || slot.campaign.targetKeyword;
                      const isBrandMention = linkType === "brand_mention";

                      return (
                        <tr key={slot.id}>
                          <td>{slot.asset?.domain || "—"}</td>
                          <td className={styles.targetCell}>
                            {isBrandMention ? (
                              <span className={styles.keyword}>{targetKeyword}</span>
                            ) : (
                              <>
                                <a href={targetUrl} target="_blank" rel="noopener noreferrer" className={styles.targetLink}>
                                  {targetUrl.length > 30 ? targetUrl.slice(0, 30) + "..." : targetUrl}
                                </a>
                                <span className={styles.keyword}>{targetKeyword}</span>
                              </>
                            )}
                          </td>
                          <td>{formatLinkType(linkType)}</td>
                          <td>{formatPlacement(placementFormat)}</td>
                          <td>
                            <span className={styles.reward}>{slot.campaign.creditReward}</span>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[slot.status]}`}>
                              {slot.status}
                            </span>
                          </td>
                          <td className={styles.actionCell}>
                            {slot.status === "reserved" && (
                              <div className={styles.submitRow}>
                                <input
                                  type="text"
                                  placeholder="Proof URL"
                                  value={proofUrls[slot.id] || ""}
                                  onChange={(e) => setProofUrls((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                                  className={styles.proofInput}
                                />
                                <button
                                  onClick={() => handleSubmitProof(slot.id)}
                                  disabled={submitting === slot.id}
                                  className={styles.submitBtn}
                                >
                                  {submitting === slot.id ? "..." : "Submit"}
                                </button>
                              </div>
                            )}
                            {slot.status === "submitted" && (
                              <span className={styles.pendingText}>Pending review</span>
                            )}
                            {slot.status === "approved" && (
                              <span className={styles.approvedText}>Credits added</span>
                            )}
                            {slot.status === "rejected" && (
                              <span className={styles.rejectedText}>Rejected</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
