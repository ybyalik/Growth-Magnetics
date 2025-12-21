import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useAuth } from "../../lib/auth-context";
import { get, put } from "../../lib/api-client";
import styles from "../../styles/Admin.module.css";

interface PendingAsset {
  id: number;
  domain: string;
  industry: string | null;
  createdAt: string;
  owner: { email: string; displayName: string | null };
}

interface PendingSlot {
  id: number;
  proofUrl: string;
  submittedAt: string;
  campaign: {
    targetUrl: string;
    targetKeyword: string;
    creditReward: number;
    ownerEmail: string;
  };
  publisher: { email: string; displayName: string | null };
  asset: { domain: string };
}

interface User {
  id: number;
  email: string;
  displayName: string | null;
  role: string;
  credits: number;
  status: string;
  createdAt: string;
}

export default function AdminPanel() {
  const { user, dbUser, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sites" | "jobs" | "users">("sites");
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);
  const [pendingSlots, setPendingSlots] = useState<PendingSlot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [assetForm, setAssetForm] = useState({
    industry: "",
    domainRating: "",
    traffic: "",
    qualityTier: "",
    creditValue: "50",
    adminNotes: "",
  });

  const [creditForm, setCreditForm] = useState({
    userId: null as number | null,
    amount: "",
    reason: "",
  });

  useEffect(() => {
    if (!loading && (!user || dbUser?.role !== "admin")) {
      router.push("/");
    }
  }, [user, dbUser, loading, router]);

  useEffect(() => {
    if (dbUser?.role === "admin" && isFirebaseConfigured) {
      fetchPendingAssets();
      fetchPendingSlots();
      fetchUsers();
    }
  }, [dbUser, isFirebaseConfigured]);

  const fetchPendingAssets = async () => {
    try {
      const response = await get("/api/admin/assets?status=pending");
      if (response.ok) {
        const data = await response.json();
        setPendingAssets(data.assets);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  const fetchPendingSlots = async () => {
    try {
      const response = await get("/api/admin/slots");
      if (response.ok) {
        const data = await response.json();
        setPendingSlots(data.slots);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await get("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleAssetAction = async (assetId: number, action: "approve" | "reject") => {
    setProcessing(assetId);
    setError("");

    try {
      const response = await put("/api/admin/assets", {
        assetId,
        action,
        ...assetForm,
        domainRating: assetForm.domainRating ? parseInt(assetForm.domainRating) : null,
        traffic: assetForm.traffic ? parseInt(assetForm.traffic) : null,
        creditValue: parseInt(assetForm.creditValue) || 50,
      });

      if (response.ok) {
        fetchPendingAssets();
        setAssetForm({
          industry: "",
          domainRating: "",
          traffic: "",
          qualityTier: "",
          creditValue: "50",
          adminNotes: "",
        });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to process asset");
      }
    } catch (error) {
      setError("Failed to process asset");
    } finally {
      setProcessing(null);
    }
  };

  const handleSlotAction = async (slotId: number, action: "approve" | "reject") => {
    setProcessing(slotId);
    setError("");

    try {
      const response = await put("/api/admin/slots", { slotId, action });

      if (response.ok) {
        fetchPendingSlots();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to process slot");
      }
    } catch (error) {
      setError("Failed to process slot");
    } finally {
      setProcessing(null);
    }
  };

  const handleUserAction = async (userId: number, action: string, amount?: string, reason?: string) => {
    setProcessing(userId);
    setError("");

    try {
      const response = await put("/api/admin/users", { userId, action, amount, reason });

      if (response.ok) {
        fetchUsers();
        setCreditForm({ userId: null, amount: "", reason: "" });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to process user");
      }
    } catch (error) {
      setError("Failed to process user");
    } finally {
      setProcessing(null);
    }
  };

  if (loading || !dbUser || dbUser.role !== "admin") {
    return <Layout title="Admin - LinkExchange"><div className={styles.loading}>Loading...</div></Layout>;
  }

  return (
    <Layout title="Admin Panel - LinkExchange">
      <div className={styles.container}>
        <h1>Admin Panel</h1>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{pendingAssets.length}</span>
            <span className={styles.statLabel}>Pending Sites</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{pendingSlots.length}</span>
            <span className={styles.statLabel}>Pending Jobs</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{users.length}</span>
            <span className={styles.statLabel}>Total Users</span>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "sites" ? styles.active : ""}`}
            onClick={() => setActiveTab("sites")}
          >
            Site Queue ({pendingAssets.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "jobs" ? styles.active : ""}`}
            onClick={() => setActiveTab("jobs")}
          >
            Job Queue ({pendingSlots.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "users" ? styles.active : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {activeTab === "sites" && (
          <div className={styles.queue}>
            {pendingAssets.length === 0 ? (
              <p className={styles.empty}>No pending sites to review.</p>
            ) : (
              pendingAssets.map((asset) => (
                <div key={asset.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>{asset.domain}</h3>
                    <span className={styles.date}>{new Date(asset.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className={styles.owner}>Submitted by: {asset.owner.email}</p>
                  
                  <div className={styles.assetFormGrid}>
                    <div className={styles.formGroup}>
                      <label>Industry</label>
                      <select
                        value={assetForm.industry}
                        onChange={(e) => setAssetForm({ ...assetForm, industry: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option value="tech">Technology</option>
                        <option value="finance">Finance</option>
                        <option value="health">Health</option>
                        <option value="lifestyle">Lifestyle</option>
                        <option value="travel">Travel</option>
                        <option value="business">Business</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>DR</label>
                      <input
                        type="number"
                        placeholder="0-100"
                        value={assetForm.domainRating}
                        onChange={(e) => setAssetForm({ ...assetForm, domainRating: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Traffic</label>
                      <input
                        type="number"
                        placeholder="Monthly"
                        value={assetForm.traffic}
                        onChange={(e) => setAssetForm({ ...assetForm, traffic: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Quality</label>
                      <select
                        value={assetForm.qualityTier}
                        onChange={(e) => setAssetForm({ ...assetForm, qualityTier: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="platinum">Platinum</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Credit Value</label>
                      <input
                        type="number"
                        placeholder="50"
                        value={assetForm.creditValue}
                        onChange={(e) => setAssetForm({ ...assetForm, creditValue: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      className={styles.approveBtn}
                      onClick={() => handleAssetAction(asset.id, "approve")}
                      disabled={processing === asset.id}
                    >
                      Approve
                    </button>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => handleAssetAction(asset.id, "reject")}
                      disabled={processing === asset.id}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "jobs" && (
          <div className={styles.queue}>
            {pendingSlots.length === 0 ? (
              <p className={styles.empty}>No pending jobs to review.</p>
            ) : (
              pendingSlots.map((slot) => (
                <div key={slot.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>Job #{slot.id}</h3>
                    <span className={styles.reward}>{slot.campaign.creditReward} Credits</span>
                  </div>
                  <div className={styles.jobDetails}>
                    <p><strong>Publisher:</strong> {slot.publisher.email} ({slot.asset.domain})</p>
                    <p><strong>Campaign Owner:</strong> {slot.campaign.ownerEmail}</p>
                    <p><strong>Target URL:</strong> <a href={slot.campaign.targetUrl} target="_blank" rel="noopener noreferrer">{slot.campaign.targetUrl}</a></p>
                    <p><strong>Keyword:</strong> {slot.campaign.targetKeyword}</p>
                    <p><strong>Proof URL:</strong> <a href={slot.proofUrl} target="_blank" rel="noopener noreferrer">{slot.proofUrl}</a></p>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.approveBtn}
                      onClick={() => handleSlotAction(slot.id, "approve")}
                      disabled={processing === slot.id}
                    >
                      Approve & Transfer Credits
                    </button>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => handleSlotAction(slot.id, "reject")}
                      disabled={processing === slot.id}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className={styles.userList}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Credits</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.displayName || "-"}</td>
                    <td>
                      <span className={`${styles.role} ${styles[u.role]}`}>{u.role}</span>
                    </td>
                    <td>{u.credits}</td>
                    <td>
                      <span className={`${styles.status} ${styles[u.status]}`}>{u.status}</span>
                    </td>
                    <td>
                      <div className={styles.userActions}>
                        <button
                          onClick={() => setCreditForm({ userId: u.id, amount: "", reason: "" })}
                          className={styles.smallBtn}
                        >
                          Adjust Credits
                        </button>
                        {u.role !== "admin" ? (
                          <button
                            onClick={() => handleUserAction(u.id, "make_admin")}
                            className={styles.smallBtn}
                            disabled={processing === u.id}
                          >
                            Make Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction(u.id, "remove_admin")}
                            className={styles.smallBtn}
                            disabled={processing === u.id}
                          >
                            Remove Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {creditForm.userId && (
              <div className={styles.modal}>
                <div className={styles.modalContent}>
                  <h3>Adjust Credits</h3>
                  <div className={styles.formGroup}>
                    <label>Amount</label>
                    <input
                      type="number"
                      value={creditForm.amount}
                      onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Reason</label>
                    <input
                      type="text"
                      value={creditForm.reason}
                      onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })}
                      placeholder="Reason for adjustment"
                    />
                  </div>
                  <div className={styles.modalActions}>
                    <button
                      onClick={() => handleUserAction(creditForm.userId!, "add_credits", creditForm.amount, creditForm.reason)}
                      className={styles.approveBtn}
                    >
                      Add Credits
                    </button>
                    <button
                      onClick={() => handleUserAction(creditForm.userId!, "remove_credits", creditForm.amount, creditForm.reason)}
                      className={styles.rejectBtn}
                    >
                      Remove Credits
                    </button>
                    <button
                      onClick={() => setCreditForm({ userId: null, amount: "", reason: "" })}
                      className={styles.cancelBtn}
                    >
                      Cancel
                    </button>
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
