import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../lib/auth-context";
import { get, post } from "../../lib/api-client";
import styles from "../../styles/Dashboard.module.css";

interface Asset {
  id: number;
  domain: string;
  industry: string | null;
  categoryName: string | null;
  childCategories: string | null;
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
  metricsJson?: string | null;
}

export default function WebsitesPage() {
  const { user, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bulkDomains, setBulkDomains] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedDomainMetrics, setSelectedDomainMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isFirebaseConfigured) {
      fetchAssets();
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

  const fetchDomainMetrics = async (asset: Asset) => {
    setLoadingMetrics(true);
    try {
      const response = await get(`/api/admin/domain-metrics?domain=${asset.domain}`);
      if (response.ok) {
        const data = await response.json();
        let topCategories: string[] = [];
        try {
          if (asset.childCategories) {
            topCategories = JSON.parse(asset.childCategories);
          }
        } catch {}
        setSelectedDomainMetrics({ 
          ...data, 
          summary: asset.summary,
          primaryCategory: asset.categoryName || asset.industry,
          topCategories: topCategories
        });
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoadingMetrics(false);
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

  const handleSubmitAssets = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

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
    return <DashboardLayout title="My Websites - Biznoz"><div className={styles.loading}>Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout title="My Websites - Biznoz">
      <div className={styles.dashboard}>
        <div className={styles.pageHeader}>
          <h1>My Websites</h1>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {successMessage && <p className={styles.success}>{successMessage}</p>}

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

                {(selectedDomainMetrics.primaryCategory || (selectedDomainMetrics.topCategories && selectedDomainMetrics.topCategories.length > 0)) && (
                  <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #2e7d32' }}>
                    <label style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Auto-Detected Categories</label>
                    {selectedDomainMetrics.primaryCategory && (
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1b5e20', marginBottom: '8px' }}>
                        Primary: {selectedDomainMetrics.primaryCategory}
                      </div>
                    )}
                    {selectedDomainMetrics.topCategories && selectedDomainMetrics.topCategories.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedDomainMetrics.topCategories.map((cat: string, idx: number) => (
                          <span key={idx} style={{ 
                            padding: '4px 12px', 
                            background: 'white', 
                            borderRadius: '20px', 
                            fontSize: '13px',
                            border: '1px solid #c8e6c9'
                          }}>
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
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
      </div>
    </DashboardLayout>
  );
}
