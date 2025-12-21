import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useAuth } from "../../lib/auth-context";
import { post } from "../../lib/api-client";
import styles from "../../styles/Campaign.module.css";

interface TargetEntry {
  url: string;
  keyword: string;
}

export default function NewCampaign() {
  const { user, dbUser, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    linkType: "hyperlink_dofollow",
    placementFormat: "guest_post",
    industry: "",
    quantity: 1,
    creditReward: 50,
    publisherNotes: "",
  });
  const [targets, setTargets] = useState<TargetEntry[]>([{ url: "", keyword: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalCost = formData.quantity * formData.creditReward;

  useEffect(() => {
    const newTargets: TargetEntry[] = [];
    for (let i = 0; i < formData.quantity; i++) {
      newTargets.push(targets[i] || { url: "", keyword: "" });
    }
    setTargets(newTargets);
  }, [formData.quantity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "creditReward" ? parseInt(value) || 1 : value,
    }));
  };

  const handleTargetChange = (index: number, field: "url" | "keyword", value: string) => {
    const newTargets = [...targets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    setTargets(newTargets);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const needsTargetUrl = formData.linkType !== "brand_mention";
    
    for (let i = 0; i < targets.length; i++) {
      if (needsTargetUrl && !targets[i].url) {
        setError(`Please enter a URL for link ${i + 1}`);
        setSubmitting(false);
        return;
      }
      if (!targets[i].keyword) {
        setError(`Please enter a keyword/anchor for link ${i + 1}`);
        setSubmitting(false);
        return;
      }
    }

    if (!formData.industry) {
      setError("Please select an industry");
      setSubmitting(false);
      return;
    }

    if ((dbUser?.credits || 0) < totalCost) {
      setError("Insufficient credits for this campaign");
      setSubmitting(false);
      return;
    }

    try {
      const response = await post("/api/campaigns", {
        ...formData,
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
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                max="20"
                required
              />
              <span className={styles.hint}>How many backlinks do you need?</span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="creditReward">Credits per Link *</label>
              <input
                type="number"
                id="creditReward"
                name="creditReward"
                value={formData.creditReward}
                onChange={handleChange}
                min="10"
                max="1000"
                required
              />
              <span className={styles.hint}>Higher rewards attract better publishers</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="linkType">Link Type *</label>
            <select
              id="linkType"
              name="linkType"
              value={formData.linkType}
              onChange={handleChange}
            >
              <option value="hyperlink_dofollow">Hyperlink (dofollow)</option>
              <option value="hyperlink_nofollow">Hyperlink (nofollow)</option>
              <option value="brand_mention">Unlinked Brand Mention</option>
            </select>
            <span className={styles.hint}>
              {formData.linkType === "brand_mention" 
                ? "Your brand name will be mentioned without a link" 
                : formData.linkType === "hyperlink_nofollow"
                ? "Link with rel=\"nofollow\" attribute"
                : "Standard link that passes SEO value"}
            </span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="placementFormat">Placement Format *</label>
            <select
              id="placementFormat"
              name="placementFormat"
              value={formData.placementFormat}
              onChange={handleChange}
            >
              <option value="guest_post">Guest Post (New Article)</option>
              <option value="niche_edit">Niche Edit (Existing Content)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="industry">Target Industry *</label>
            <select
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              required
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
          </div>

          <div className={styles.targetsSection}>
            <h3>Target URLs & Anchor Texts</h3>
            <p className={styles.hint}>Enter a different URL and anchor text for each link</p>
            
            {targets.map((target, index) => (
              <div key={index} className={styles.targetRow}>
                <span className={styles.targetNumber}>{index + 1}</span>
                {formData.linkType !== "brand_mention" && (
                  <input
                    type="url"
                    placeholder="https://example.com/page"
                    value={target.url}
                    onChange={(e) => handleTargetChange(index, "url", e.target.value)}
                    className={styles.targetUrl}
                  />
                )}
                <input
                  type="text"
                  placeholder={formData.linkType === "brand_mention" ? "Brand name" : "Anchor text"}
                  value={target.keyword}
                  onChange={(e) => handleTargetChange(index, "keyword", e.target.value)}
                  className={styles.targetKeyword}
                />
              </div>
            ))}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="publisherNotes">Publisher Notes (Optional)</label>
            <textarea
              id="publisherNotes"
              name="publisherNotes"
              value={formData.publisherNotes}
              onChange={handleChange}
              placeholder="Special instructions for publishers (e.g., No AI content, specific angle)"
              rows={3}
            />
          </div>

          <div className={styles.summary}>
            <h3>Campaign Summary</h3>
            <p><strong>Links Requested:</strong> {formData.quantity}</p>
            <p><strong>Credits per Link:</strong> {formData.creditReward}</p>
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
