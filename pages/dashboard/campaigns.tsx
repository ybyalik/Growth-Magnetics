import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../lib/auth-context";
import { get, post } from "../../lib/api-client";
import styles from "../../styles/Dashboard.module.css";

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
}

export default function CampaignsPage() {
  const { user, loading, isFirebaseConfigured, refreshUser } = useAuth();
  const router = useRouter();
  const [campaignSlots, setCampaignSlots] = useState<CampaignSlot[]>([]);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isFirebaseConfigured) {
      fetchCampaigns();
    }
  }, [user, isFirebaseConfigured]);

  const fetchCampaigns = async () => {
    try {
      const response = await get("/api/campaigns");
      if (response.ok) {
        const data = await response.json();
        setCampaignSlots(data.slots || []);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const handleCancelOwnSlot = async (slotId: number) => {
    if (!confirm("Are you sure you want to cancel this link? You will receive a credit refund.")) {
      return;
    }

    setCancelling(slotId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await post(`/api/slots/${slotId}/cancel`, {});
      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        fetchCampaigns();
        if (refreshUser) refreshUser();
      } else {
        setError(data.error || "Failed to cancel link");
      }
    } catch (error) {
      setError("Failed to cancel link");
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return <DashboardLayout title="My Campaigns - Biznoz"><div className={styles.loading}>Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout title="My Campaigns - Biznoz">
      <div className={styles.dashboard}>
        <div className={styles.pageHeader}>
          <h1>My Campaigns</h1>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {successMessage && <p className={styles.success}>{successMessage}</p>}

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
                      {slot.status === "open" ? (
                        <button
                          onClick={() => handleCancelOwnSlot(slot.id)}
                          className={styles.cancelBtn}
                          disabled={cancelling === slot.id}
                        >
                          {cancelling === slot.id ? "..." : "Cancel"}
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
      </div>
    </DashboardLayout>
  );
}
