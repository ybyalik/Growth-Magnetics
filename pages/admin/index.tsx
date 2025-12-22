import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useAuth } from "../../lib/auth-context";
import { get, put } from "../../lib/api-client";
import styles from "../../styles/Admin.module.css";

interface Asset {
  id: number;
  domain: string;
  industry: string | null;
  status: string;
  domainRating: number | null;
  traffic: number | null;
  qualityTier: string | null;
  creditValue: number | null;
  backlinks: number | null;
  referringDomains: number | null;
  spamScore: number | null;
  adminNotes: string | null;
  summary: string | null;
  organicTraffic: number | null;
  paidTraffic: number | null;
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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  const [pendingSlots, setPendingSlots] = useState<PendingSlot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedDomainMetrics, setSelectedDomainMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [refetchingAll, setRefetchingAll] = useState(false);

  const refetchAllMetrics = async () => {
    if (!confirm("This will refetch DataForSEO metrics for ALL domains. This may take a while and use API credits. Continue?")) {
      return;
    }
    setRefetchingAll(true);
    try {
      const response = await fetch("/api/admin/refetch-metrics", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchAssets();
      } else {
        alert("Failed to refetch metrics");
      }
    } catch (error) {
      console.error("Error refetching metrics:", error);
      alert("Error refetching metrics");
    } finally {
      setRefetchingAll(false);
    }
  };

  const fetchDomainMetricsData = async (assetId: number, domain: string) => {
    setLoadingMetrics(true);
    try {
      const response = await fetch(`/api/admin/domain-metrics?domain=${domain}`);
      if (response.ok) {
        const data = await response.json();
        // Add the summary from the asset list to the metrics data
        const asset = assets.find(a => a.id === assetId);
        setSelectedDomainMetrics({ ...data, summary: asset?.summary });
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoadingMetrics(false);
    }
  };

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
      fetchAssets();
      fetchPendingSlots();
      fetchUsers();
    }
  }, [dbUser, isFirebaseConfigured]);

  useEffect(() => {
    if (dbUser?.role === "admin" && isFirebaseConfigured) {
      fetchAssets();
    }
  }, [assetFilter]);

  const fetchAssets = async () => {
    try {
      const response = await get(`/api/admin/assets?status=${assetFilter}`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets);
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

  const handleAssetAction = async (assetId: number, action: "approve" | "reject" | "update" | "disable", newStatus?: string) => {
    setProcessing(assetId);
    setError("");

    try {
      const response = await put("/api/admin/assets", {
        assetId,
        action,
        status: newStatus,
        ...assetForm,
        domainRating: assetForm.domainRating ? parseInt(assetForm.domainRating) : null,
        traffic: assetForm.traffic ? parseInt(assetForm.traffic) : null,
        creditValue: parseInt(assetForm.creditValue) || 50,
      });

      if (response.ok) {
        fetchAssets();
        setEditingAssetId(null);
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

  const startEditingAsset = (asset: Asset) => {
    setEditingAssetId(asset.id);
    setAssetForm({
      industry: asset.industry || "",
      domainRating: asset.domainRating?.toString() || "",
      traffic: asset.traffic?.toString() || "",
      qualityTier: asset.qualityTier || "",
      creditValue: asset.creditValue?.toString() || "50",
      adminNotes: asset.adminNotes || "",
    });
  };

  const cancelEditing = () => {
    setEditingAssetId(null);
    setAssetForm({
      industry: "",
      domainRating: "",
      traffic: "",
      qualityTier: "",
      creditValue: "50",
      adminNotes: "",
    });
  };

  const pendingCount = assets.filter(a => a.status === "pending").length;

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
            <span className={styles.statValue}>{assets.length}</span>
            <span className={styles.statLabel}>Total Sites</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{pendingCount}</span>
            <span className={styles.statLabel}>Pending Review</span>
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
            Sites ({assets.length})
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
          <div className={styles.userList}>
            <div className={styles.filterBar}>
              <label>Filter by status:</label>
              <select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)}>
                <option value="all">All Sites</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="disabled">Disabled</option>
              </select>
              <button 
                onClick={refetchAllMetrics}
                disabled={refetchingAll}
                className={styles.refetchButton}
              >
                {refetchingAll ? "Refetching..." : "Refetch All Metrics"}
              </button>
            </div>

            {assets.length === 0 ? (
              <p className={styles.empty}>No sites found.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Rank</th>
                    <th>Traffic</th>
                    <th>Backlinks</th>
                    <th>Ref. Domains</th>
                    <th>Spam</th>
                    <th>Credits</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id}>
                      <td>
                        <div className={styles.siteCell}>
                          <strong 
                            style={{ cursor: 'pointer', color: 'var(--primary-color)' }}
                            onClick={() => fetchDomainMetricsData(asset.id, asset.domain)}
                          >
                            {asset.domain}
                          </strong>
                          <span className={styles.ownerEmail}>{asset.owner.email}</span>
                        </div>
                      </td>
                      <td>{asset.domainRating || "-"}</td>
                      <td>{asset.organicTraffic?.toLocaleString() || "-"}</td>
                      <td>{asset.backlinks?.toLocaleString() || "0"}</td>
                      <td>{asset.referringDomains?.toLocaleString() || "0"}</td>
                      <td>{asset.spamScore || "0"}</td>
                      <td>{asset.creditValue || 50}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[asset.status]}`}>{asset.status}</span>
                      </td>
                      <td>
                        <div className={styles.userActions}>
                          <button
                            onClick={() => startEditingAsset(asset)}
                            className={styles.smallBtn}
                          >
                            Edit
                          </button>
                          {asset.status === "pending" && (
                            <>
                              <button
                                onClick={() => {
                                  startEditingAsset(asset);
                                  handleAssetAction(asset.id, "approve");
                                }}
                                className={styles.smallBtnApprove}
                                disabled={processing === asset.id}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAssetAction(asset.id, "reject")}
                                className={styles.smallBtnReject}
                                disabled={processing === asset.id}
                              >
                                Reject
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm("Are you sure you want to delete this site permanently?")) {
                                    setProcessing(asset.id);
                                    try {
                                      const response = await fetch("/api/admin/assets", {
                                        method: "DELETE",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ assetId: asset.id }),
                                      });
                                      if (response.ok) fetchAssets();
                                    } catch (error) {
                                      console.error("Error deleting asset:", error);
                                    } finally {
                                      setProcessing(null);
                                    }
                                  }
                                }}
                                className={styles.smallBtnReject}
                                disabled={processing === asset.id}
                                style={{ backgroundColor: "#111111", marginLeft: "4px" }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {asset.status === "approved" && (
                            <>
                              <button
                                onClick={() => handleAssetAction(asset.id, "disable")}
                                className={styles.smallBtnReject}
                                disabled={processing === asset.id}
                              >
                                Disable
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm("Are you sure you want to delete this site permanently?")) {
                                    setProcessing(asset.id);
                                    try {
                                      const response = await fetch("/api/admin/assets", {
                                        method: "DELETE",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ assetId: asset.id }),
                                      });
                                      if (response.ok) fetchAssets();
                                    } catch (error) {
                                      console.error("Error deleting asset:", error);
                                    } finally {
                                      setProcessing(null);
                                    }
                                  }
                                }}
                                className={styles.smallBtnReject}
                                disabled={processing === asset.id}
                                style={{ backgroundColor: "#111111", marginLeft: "4px" }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {(asset.status === "rejected" || asset.status === "disabled") && (
                            <button
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this site permanently?")) {
                                  setProcessing(asset.id);
                                  try {
                                    const response = await fetch("/api/admin/assets", {
                                      method: "DELETE",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ assetId: asset.id }),
                                    });
                                    if (response.ok) fetchAssets();
                                  } catch (error) {
                                    console.error("Error deleting asset:", error);
                                  } finally {
                                    setProcessing(null);
                                  }
                                }
                              }}
                              className={styles.smallBtnReject}
                              disabled={processing === asset.id}
                              style={{ backgroundColor: "#111111" }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedDomainMetrics && (
              <div className={styles.modal}>
                <div className={styles.modalContent} style={{ maxWidth: '800px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ marginBottom: '4px' }}>Domain Insights: {selectedDomainMetrics.domain}</h3>
                    </div>
                    <button onClick={() => setSelectedDomainMetrics(null)} className={styles.smallBtn}>Close</button>
                  </div>

                  {selectedDomainMetrics.summary && (
                    <div style={{ padding: '15px', background: 'var(--color-primary-light)', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid var(--color-primary)' }}>
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
                            <strong>{val.toLocaleString()}</strong>
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
                            <strong>{val.toLocaleString()}</strong>
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
                            {key === 'WW' ? 'Worldwide' : key}: {val.toLocaleString()}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {editingAssetId && (
              <div className={styles.modal}>
                <div className={styles.modalContent}>
                  <h3>Edit Site</h3>
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
                      <label>Rank</label>
                      <input
                        type="number"
                        placeholder="0-100"
                        value={assetForm.domainRating}
                        disabled
                        style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                        title="Auto-fetched from DataForSEO"
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
                    <div className={styles.formGroup}>
                      <label>Admin Notes</label>
                      <input
                        type="text"
                        placeholder="Optional notes"
                        value={assetForm.adminNotes}
                        onChange={(e) => setAssetForm({ ...assetForm, adminNotes: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className={styles.modalActions}>
                    <button
                      onClick={() => {
                        const asset = assets.find(a => a.id === editingAssetId);
                        if (asset?.status === "pending") {
                          handleAssetAction(editingAssetId, "approve");
                        } else {
                          handleAssetAction(editingAssetId, "update");
                        }
                      }}
                      className={styles.approveBtn}
                      disabled={processing === editingAssetId}
                    >
                      {assets.find(a => a.id === editingAssetId)?.status === "pending" ? "Approve" : "Save Changes"}
                    </button>
                    <button
                      onClick={cancelEditing}
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
