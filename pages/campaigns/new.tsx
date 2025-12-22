import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useAuth } from "../../lib/auth-context";
import { post } from "../../lib/api-client";
import styles from "../../styles/Campaign.module.css";

interface TargetEntry {
  url: string;
  keyword: string;
  linkType: string;
  placementFormat: string;
  creditReward: number;
  industry: string;
  publisherNotes: string;
}

export default function NewCampaign() {
  const { user, dbUser, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [targets, setTargets] = useState<TargetEntry[]>([
    { url: "", keyword: "", linkType: "hyperlink_dofollow", placementFormat: "guest_post", creditReward: 50, industry: "tech", publisherNotes: "" }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalCost = targets.reduce((sum, t) => sum + t.creditReward, 0);

  useEffect(() => {
    const newTargets: TargetEntry[] = [];
    for (let i = 0; i < quantity; i++) {
      newTargets.push(targets[i] || { 
        url: "", 
        keyword: "", 
        linkType: "hyperlink_dofollow", 
        placementFormat: "guest_post",
        creditReward: 50,
        industry: "tech",
        publisherNotes: ""
      });
    }
    setTargets(newTargets);
  }, [quantity]);

  const handleTargetChange = (index: number, field: keyof TargetEntry, value: string | number) => {
    const newTargets = [...targets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    setTargets(newTargets);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    for (let i = 0; i < targets.length; i++) {
      const needsUrl = targets[i].linkType !== "brand_mention";
      if (needsUrl && !targets[i].url) {
        setError(`Please enter a URL for link ${i + 1}`);
        setSubmitting(false);
        return;
      }
      if (!targets[i].keyword) {
        setError(`Please enter a keyword/anchor for link ${i + 1}`);
        setSubmitting(false);
        return;
      }
      if (!targets[i].industry) {
        setError(`Please select an industry for link ${i + 1}`);
        setSubmitting(false);
        return;
      }
      if (targets[i].creditReward < 10) {
        setError(`Credit reward must be at least 10 for link ${i + 1}`);
        setSubmitting(false);
        return;
      }
    }

    if ((dbUser?.credits || 0) < totalCost) {
      setError("Insufficient credits for this campaign");
      setSubmitting(false);
      return;
    }

    try {
      const response = await post("/api/campaigns", {
        quantity,
        targets,
      });

      if (response.ok) {
        await refreshUser();
        router.push("/dashboard");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create campaign");
      }
    } catch (error) {
      setError("Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Layout title="Create Campaign - LinkExchange"><div className={styles.loading}>Loading...</div></Layout>;
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <Layout title="Create Campaign - LinkExchange">
      <div className={styles.container}>
        <h1>Create New Campaign</h1>
        <p className={styles.subtitle}>Request backlinks or brand mentions for your website</p>

        <div className={styles.creditInfo}>
          <span>Your Balance: <strong>{dbUser?.credits || 0} Credits</strong></span>
          <span>Campaign Cost: <strong>{totalCost} Credits</strong></span>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="quantity">Number of Links *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                max="20"
                required
              />
              <span className={styles.hint}>How many backlinks do you need?</span>
            </div>
          </div>

          <div className={styles.targetsSection}>
            <h3>Link Details</h3>
            <p className={styles.hint}>Configure each link with its own settings</p>
            
            <div className={styles.targetHeader}>
              <span className={styles.colNum}>#</span>
              <span className={styles.colUrl}>Target URL</span>
              <span className={styles.colKeyword}>Anchor Text</span>
              <span className={styles.colType}>Type</span>
              <span className={styles.colFormat}>Format</span>
              <span className={styles.colIndustry}>Industry</span>
              <span className={styles.colCredits}>Credits</span>
            </div>

            {targets.map((target, index) => (
              <div key={index} className={styles.targetRowWrapper}>
                <div className={styles.targetRow}>
                  <span className={styles.targetNumber}>{index + 1}</span>
                  {target.linkType !== "brand_mention" ? (
                    <input
                      type="url"
                      placeholder="https://example.com/page"
                      value={target.url}
                      onChange={(e) => handleTargetChange(index, "url", e.target.value)}
                      className={styles.targetUrl}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="N/A for brand mention"
                      disabled
                      className={styles.targetUrl}
                    />
                  )}
                  <input
                    type="text"
                    placeholder={target.linkType === "brand_mention" ? "Brand name" : "Anchor text"}
                    value={target.keyword}
                    onChange={(e) => handleTargetChange(index, "keyword", e.target.value)}
                    className={styles.targetKeyword}
                  />
                  <select
                    value={target.linkType}
                    onChange={(e) => handleTargetChange(index, "linkType", e.target.value)}
                    className={styles.targetSelect}
                  >
                    <option value="hyperlink_dofollow">Dofollow</option>
                    <option value="hyperlink_nofollow">Nofollow</option>
                    <option value="brand_mention">Brand Mention</option>
                  </select>
                  <select
                    value={target.placementFormat}
                    onChange={(e) => handleTargetChange(index, "placementFormat", e.target.value)}
                    className={styles.targetSelect}
                  >
                    <option value="guest_post">Guest Post</option>
                    <option value="niche_edit">Niche Edit</option>
                  </select>
                  <select
                    value={target.industry}
                    onChange={(e) => handleTargetChange(index, "industry", e.target.value)}
                    className={styles.targetSelect}
                  >
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
                  <input
                    type="number"
                    value={target.creditReward}
                    onChange={(e) => handleTargetChange(index, "creditReward", parseInt(e.target.value) || 10)}
                    min="10"
                    max="1000"
                    className={styles.targetCredits}
                  />
                </div>
                <div className={styles.targetNotesRow}>
                  <input
                    type="text"
                    placeholder="Publisher notes (optional) - Special instructions for this link"
                    value={target.publisherNotes}
                    onChange={(e) => handleTargetChange(index, "publisherNotes", e.target.value)}
                    className={styles.targetNotes}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <h3>Campaign Summary</h3>
            <p><strong>Links Requested:</strong> {quantity}</p>
            <p className={styles.total}><strong>Total Cost:</strong> {totalCost} Credits</p>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting || (dbUser?.credits || 0) < totalCost}
          >
            {submitting ? "Creating..." : `Create Campaign (${totalCost} Credits)`}
          </button>
        </form>
      </div>
    </Layout>
  );
}
