import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth-context";
import { get, post } from "../lib/api-client";
import styles from "../styles/Earn.module.css";

interface FeedItem {
  id: number;
  industry: string;
  linkType: string;
  placementFormat: string;
  creditReward: number;
  availableSlots: number;
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
  campaign: {
    targetUrl: string;
    targetKeyword: string;
    creditReward: number;
    industry: string;
    placementFormat: string;
  };
  asset: { domain: string } | null;
}

export default function Earn() {
  const { user, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [mySlots, setMySlots] = useState<MySlot[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
  const [reserving, setReserving] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [proofUrl, setProofUrl] = useState("");
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

  const handleReserve = async (campaignId: number) => {
    if (!selectedAsset) {
      setError("Please select an asset first");
      return;
    }

    setReserving(campaignId);
    setError("");

    try {
      const response = await post("/api/slots/reserve", { campaignId, assetId: selectedAsset });

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
    if (!proofUrl) {
      setError("Please enter a proof URL");
      return;
    }

    setSubmitting(slotId);
    setError("");

    try {
      const response = await post("/api/slots/submit", { slotId, proofUrl });

      if (response.ok) {
        setProofUrl("");
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
              <div className={styles.feedGrid}>
                {feed.map((item) => (
                  <div key={item.id} className={styles.feedCard}>
                    <div className={styles.feedHeader}>
                      <span className={styles.industry}>{item.industry}</span>
                      <span className={styles.slots}>{item.availableSlots} slot(s) left</span>
                    </div>
                    <div className={styles.feedDetails}>
                      <p><strong>Type:</strong> {item.linkType === "hyperlink" ? "Hyperlink" : "Brand Mention"}</p>
                      <p><strong>Format:</strong> {item.placementFormat === "guest_post" ? "Guest Post" : "Niche Edit"}</p>
                      {item.publisherNotes && (
                        <p className={styles.notes}><strong>Notes:</strong> {item.publisherNotes}</p>
                      )}
                    </div>
                    <div className={styles.feedFooter}>
                      <span className={styles.reward}>{item.creditReward} Credits</span>
                      <button
                        onClick={() => handleReserve(item.id)}
                        disabled={reserving === item.id || assets.length === 0 || !selectedAsset}
                        className={styles.reserveBtn}
                      >
                        {reserving === item.id ? "Reserving..." : "Reserve Slot"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "mywork" && (
          <div className={styles.workSection}>
            {mySlots.length === 0 ? (
              <p className={styles.empty}>You have not reserved any slots yet.</p>
            ) : (
              <div className={styles.workGrid}>
                {mySlots.map((slot) => (
                  <div key={slot.id} className={styles.workCard}>
                    <div className={styles.workHeader}>
                      <span className={`${styles.workStatus} ${styles[slot.status]}`}>
                        {slot.status}
                      </span>
                      <span className={styles.reward}>{slot.campaign.creditReward} Credits</span>
                    </div>
                    <div className={styles.workDetails}>
                      <p><strong>Your Site:</strong> {slot.asset?.domain || "-"}</p>
                      <p><strong>Target URL:</strong> <a href={slot.campaign.targetUrl} target="_blank" rel="noopener noreferrer">{slot.campaign.targetUrl}</a></p>
                      <p><strong>Anchor/Keyword:</strong> {slot.campaign.targetKeyword}</p>
                      <p><strong>Format:</strong> {slot.campaign.placementFormat === "guest_post" ? "Guest Post" : "Niche Edit"}</p>
                    </div>

                    {slot.status === "reserved" && (
                      <div className={styles.submitSection}>
                        <input
                          type="text"
                          placeholder="Enter proof URL (live link)"
                          value={proofUrl}
                          onChange={(e) => setProofUrl(e.target.value)}
                        />
                        <button
                          onClick={() => handleSubmitProof(slot.id)}
                          disabled={submitting === slot.id}
                        >
                          {submitting === slot.id ? "Submitting..." : "Submit Proof"}
                        </button>
                      </div>
                    )}

                    {slot.status === "submitted" && (
                      <p className={styles.pendingNote}>Waiting for admin review...</p>
                    )}

                    {slot.status === "approved" && (
                      <p className={styles.approvedNote}>Approved! Credits have been added to your account.</p>
                    )}

                    {slot.status === "rejected" && (
                      <p className={styles.rejectedNote}>Rejected. Please check admin notes and try again.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
