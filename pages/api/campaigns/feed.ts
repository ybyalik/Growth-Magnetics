import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq, and, ne } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

const extractDomain = (url: string | null): string => {
  if (!url) return "";
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const maskDomain = (url: string | null): string => {
  if (!url) return "";
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.replace(/^www\./, "");
    const lastDotIndex = hostname.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return "*".repeat(hostname.length);
    }
    const name = hostname.slice(0, lastDotIndex);
    const extension = hostname.slice(lastDotIndex);
    return "*".repeat(name.length) + extension;
  } catch {
    return "***.*";
  }
};

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const openSlots = await db
      .select({
        slotId: schema.slots.id,
        targetUrl: schema.slots.targetUrl,
        targetKeyword: schema.slots.targetKeyword,
        linkType: schema.slots.linkType,
        placementFormat: schema.slots.placementFormat,
        slotCreditReward: schema.slots.creditReward,
        slotIndustry: schema.slots.industry,
        campaignId: schema.campaigns.id,
        campaignIndustry: schema.campaigns.industry,
        campaignCreditReward: schema.campaigns.creditReward,
        campaignTargetUrl: schema.campaigns.targetUrl,
        publisherNotes: schema.campaigns.publisherNotes,
        createdAt: schema.slots.createdAt,
        ownerId: schema.campaigns.ownerId,
      })
      .from(schema.slots)
      .innerJoin(schema.campaigns, eq(schema.slots.campaignId, schema.campaigns.id))
      .where(
        and(
          eq(schema.slots.status, "open"),
          eq(schema.campaigns.status, "active"),
          ne(schema.campaigns.ownerId, user.dbUser.id)
        )
      )
      .orderBy(schema.slots.createdAt);

    const allAssets = await db.select().from(schema.assets);
    const assetsByDomain: Record<string, typeof allAssets[0]> = {};
    allAssets.forEach((asset) => {
      assetsByDomain[asset.domain.toLowerCase()] = asset;
    });

    const blindFeed = openSlots.map((slot) => {
      const targetUrl = slot.targetUrl || slot.campaignTargetUrl;
      const domain = extractDomain(targetUrl);
      const asset = assetsByDomain[domain.toLowerCase()];
      
      return {
        slotId: slot.slotId,
        campaignId: slot.campaignId,
        maskedDomain: maskDomain(targetUrl),
        industry: slot.slotIndustry || slot.campaignIndustry,
        linkType: slot.linkType || "hyperlink_dofollow",
        placementFormat: slot.placementFormat || "guest_post",
        creditReward: slot.slotCreditReward || slot.campaignCreditReward,
        publisherNotes: slot.publisherNotes,
        createdAt: slot.createdAt,
        metrics: asset ? {
          domainRating: asset.domainRating,
          organicTraffic: asset.organicTraffic,
          backlinks: asset.backlinks,
          referringDomains: asset.referringDomains,
          spamScore: asset.spamScore,
          summary: asset.summary,
        } : null,
      };
    });

    return res.status(200).json({ feed: blindFeed });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
