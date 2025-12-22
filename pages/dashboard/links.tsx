import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../lib/auth-context";
import { get, post } from "../../lib/api-client";
import styles from "../../styles/Dashboard.module.css";

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
  switch (format) {
    case "guest_post": return "Guest Post";
    case "niche_edit": return "Niche Edit";
    default: return format;
  }
};

export default function LinksPage() {
  const { user, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const [mySlots, setMySlots] = useState<MySlot[]>([]);
  const [proofUrls, setProofUrls] = useState<Record<number, string>>({});
  const [submittingProof, setSubmittingProof] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [retrying, setRetrying] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isFirebaseConfigured) {
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

  if (loading) {
    return <DashboardLayout title="Links Submitted - Biznoz"><div className={styles.loading}>Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout title="Links Submitted - Biznoz">
      <div className={styles.dashboard}>
        <div className={styles.pageHeader}>
          <h1>Links Submitted</h1>
        </div>

        {error && <p className={styles.error}>{error}</p>}

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
      </div>
    </DashboardLayout>
  );
}
