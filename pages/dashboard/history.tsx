import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../lib/auth-context";
import { get } from "../../lib/api-client";
import styles from "../../styles/Dashboard.module.css";

interface Transaction {
  id: number;
  amount: number;
  type: string;
  direction: string;
  description: string | null;
  referenceType: string | null;
  referenceId: number | null;
  createdAt: string;
}

interface Campaign {
  id: number;
  targetUrl: string;
  targetKeyword: string;
  linkType: string;
  placementFormat: string;
  industry: string;
  quantity: number;
  filledSlots: number;
  creditReward: number;
  status: string;
  createdAt: string;
}

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
  publisherNotes: string | null;
  createdAt: string;
}

export default function HistoryPage() {
  const { user, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignSlots, setCampaignSlots] = useState<CampaignSlot[]>([]);
  const [expandedTransaction, setExpandedTransaction] = useState<number | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [loadingTransactionDetails, setLoadingTransactionDetails] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isFirebaseConfigured) {
      fetchTransactions();
      fetchCampaigns();
    }
  }, [user, isFirebaseConfigured]);

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

  const fetchCampaigns = async () => {
    try {
      const response = await get("/api/campaigns");
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns);
        setCampaignSlots(data.slots || []);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const toggleTransactionDetails = async (tx: Transaction) => {
    if (expandedTransaction === tx.id) {
      setExpandedTransaction(null);
      setTransactionDetails(null);
      return;
    }

    setExpandedTransaction(tx.id);
    setTransactionDetails(null);

    if (tx.referenceType === "slot" && tx.referenceId) {
      setLoadingTransactionDetails(true);
      try {
        const response = await get(`/api/slots/${tx.referenceId}`);
        if (response.ok) {
          const data = await response.json();
          setTransactionDetails(data.slot);
        }
      } catch (error) {
        console.error("Error fetching slot details:", error);
      } finally {
        setLoadingTransactionDetails(false);
      }
    } else if (tx.referenceType === "campaign" && tx.referenceId) {
      const campaign = campaigns.find(c => c.id === tx.referenceId);
      const slotsForCampaign = campaignSlots.filter(s => s.campaignId === tx.referenceId);
      if (campaign) {
        setTransactionDetails({ ...campaign, slots: slotsForCampaign });
      }
    }
  };

  if (loading) {
    return <DashboardLayout title="Credit History - Biznoz"><div className={styles.loading}>Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout title="Credit History - Biznoz">
      <div className={styles.dashboard}>
        <div className={styles.pageHeader}>
          <h1>Credit History</h1>
        </div>

        <div className={styles.tabContent}>
          <h2>Credit History</h2>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <>
                    <tr 
                      key={tx.id} 
                      className={tx.referenceType ? styles.clickableRow : ""}
                      onClick={() => tx.referenceType && toggleTransactionDetails(tx)}
                    >
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
                      <td>
                        {tx.referenceType && (
                          <span className={styles.expandIcon}>
                            {expandedTransaction === tx.id ? "▼" : "▶"}
                          </span>
                        )}
                      </td>
                    </tr>
                    {expandedTransaction === tx.id && (
                      <tr key={`${tx.id}-details`} className={styles.detailsRow}>
                        <td colSpan={6}>
                          {loadingTransactionDetails ? (
                            <div className={styles.detailsLoading}>Loading details...</div>
                          ) : transactionDetails ? (
                            <div className={styles.transactionDetails}>
                              {tx.referenceType === "slot" && (
                                <>
                                  <div className={styles.detailItem}>
                                    <strong>Target URL:</strong> {transactionDetails.targetUrl || "-"}
                                  </div>
                                  <div className={styles.detailItem}>
                                    <strong>Keyword:</strong> {transactionDetails.targetKeyword || "-"}
                                  </div>
                                  <div className={styles.detailItem}>
                                    <strong>Link Type:</strong> {transactionDetails.linkType?.replace("_", " ") || "-"}
                                  </div>
                                  <div className={styles.detailItem}>
                                    <strong>Industry:</strong> {transactionDetails.industry || "-"}
                                  </div>
                                  {transactionDetails.publisherDomain && (
                                    <div className={styles.detailItem}>
                                      <strong>Your Website:</strong> {transactionDetails.publisherDomain}
                                    </div>
                                  )}
                                  {transactionDetails.proofUrl && (
                                    <div className={styles.detailItem}>
                                      <strong>Proof URL:</strong>{" "}
                                      <a href={transactionDetails.proofUrl} target="_blank" rel="noopener noreferrer">
                                        View Link
                                      </a>
                                    </div>
                                  )}
                                </>
                              )}
                              {tx.referenceType === "campaign" && (
                                <>
                                  <div className={styles.detailItem} style={{ marginBottom: '12px' }}>
                                    <strong>Campaign Status:</strong> {transactionDetails.status} | <strong>Total Slots:</strong> {transactionDetails.quantity}
                                  </div>
                                  {transactionDetails.slots && transactionDetails.slots.length > 0 ? (
                                    <table className={styles.slotDetailsTable}>
                                      <thead>
                                        <tr>
                                          <th>#</th>
                                          <th>Target URL</th>
                                          <th>Keyword</th>
                                          <th>Type</th>
                                          <th>Industry</th>
                                          <th>Credits</th>
                                          <th>Status</th>
                                          <th>Notes</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {transactionDetails.slots.map((slot: any, idx: number) => (
                                          <tr key={slot.id}>
                                            <td>{idx + 1}</td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              {slot.targetUrl || "-"}
                                            </td>
                                            <td>{slot.targetKeyword || "-"}</td>
                                            <td>{slot.linkType?.replace("hyperlink_", "").replace("_", " ") || "-"}</td>
                                            <td>{slot.industry || "-"}</td>
                                            <td>{slot.creditReward || "-"}</td>
                                            <td>
                                              <span className={`${styles.status} ${styles[slot.status]}`}>
                                                {slot.status}
                                              </span>
                                            </td>
                                            <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              {slot.publisherNotes || "-"}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <div className={styles.detailItem}>No slot details available</div>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className={styles.detailsLoading}>No details available</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
