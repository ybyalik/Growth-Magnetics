import { useEffect, useState } from "react";
import { useRouter } from "next/router";
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
  status: string;
  createdAt: string;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  direction: string;
  description: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const { user, dbUser, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"assets" | "history">("assets");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isFirebaseConfigured) {
      fetchAssets();
      fetchTransactions();
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

  const handleSubmitAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await post("/api/assets", { domain: newDomain, industry: newIndustry });

      if (response.ok) {
        setNewDomain("");
        setNewIndustry("");
        fetchAssets();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to submit asset");
      }
    } catch (error) {
      setError("Failed to submit asset");
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
            My Assets
          </button>
          <button
            className={`${styles.tab} ${activeTab === "history" ? styles.active : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Exchange History
          </button>
        </div>

        {activeTab === "assets" && (
          <div className={styles.tabContent}>
            <div className={styles.addAsset}>
              <h2>Add New Website</h2>
              <form onSubmit={handleSubmitAsset} className={styles.assetForm}>
                <input
                  type="text"
                  placeholder="Domain (e.g., example.com)"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  required
                />
                <select
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                >
                  <option value="">Select Industry</option>
                  <option value="tech">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="health">Health</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="travel">Travel</option>
                  <option value="food">Food</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="other">Other</option>
                </select>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit for Review"}
                </button>
              </form>
              {error && <p className={styles.error}>{error}</p>}
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
                      <th>Industry</th>
                      <th>Status</th>
                      <th>Credit Value</th>
                      <th>Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr key={asset.id}>
                        <td>{asset.domain}</td>
                        <td>{asset.industry || "-"}</td>
                        <td>
                          <span className={`${styles.status} ${styles[asset.status]}`}>
                            {asset.status}
                          </span>
                        </td>
                        <td>{asset.status === "approved" ? `${asset.creditValue} credits` : "-"}</td>
                        <td>{asset.qualityTier || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className={styles.tabContent}>
            <h2>Exchange History</h2>
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
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
