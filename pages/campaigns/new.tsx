import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useAuth } from "../../lib/auth-context";
import { post } from "../../lib/api-client";
import styles from "../../styles/Campaign.module.css";

export default function NewCampaign() {
  const { user, dbUser, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    targetUrl: "",
    targetKeyword: "",
    linkType: "hyperlink",
    placementFormat: "guest_post",
    industry: "",
    quantity: 1,
    creditReward: 50,
    publisherNotes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalCost = formData.quantity * formData.creditReward;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "creditReward" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!formData.targetUrl || !formData.targetKeyword || !formData.industry) {
      setError("Please fill in all required fields");
      setSubmitting(false);
      return;
    }

    if ((dbUser?.credits || 0) < totalCost) {
      setError("Insufficient credits for this campaign");
      setSubmitting(false);
      return;
    }

    try {
      const response = await post("/api/campaigns", formData);

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
          <div className={styles.formGroup}>
            <label htmlFor="targetUrl">Target URL *</label>
            <input
              type="url"
              id="targetUrl"
              name="targetUrl"
              value={formData.targetUrl}
              onChange={handleChange}
              placeholder="https://example.com/page-to-boost"
              required
            />
            <span className={styles.hint}>The page you want backlinks pointing to</span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="targetKeyword">Target Keyword / Brand Name *</label>
            <input
              type="text"
              id="targetKeyword"
              name="targetKeyword"
              value={formData.targetKeyword}
              onChange={handleChange}
              placeholder="e.g., best SEO tool"
              required
            />
            <span className={styles.hint}>The anchor text or brand name for the link</span>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="linkType">Link Type *</label>
              <select
                id="linkType"
                name="linkType"
                value={formData.linkType}
                onChange={handleChange}
              >
                <option value="hyperlink">Hyperlink (dofollow)</option>
                <option value="brand_mention">Unlinked Brand Mention</option>
              </select>
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
                max="100"
                required
              />
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
            <label htmlFor="publisherNotes">Publisher Notes (Optional)</label>
            <textarea
              id="publisherNotes"
              name="publisherNotes"
              value={formData.publisherNotes}
              onChange={handleChange}
              placeholder="Special instructions for publishers (e.g., No AI content, specific angle)"
              rows={4}
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
