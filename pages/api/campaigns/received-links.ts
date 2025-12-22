import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../db";
import { slots, campaigns, assets, users } from "../../../db/schema";
import { eq } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { firebaseUid } = req.query;

  if (!firebaseUid || typeof firebaseUid !== "string") {
    return res.status(400).json({ error: "Firebase UID required" });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userCampaigns = await db.select().from(campaigns).where(eq(campaigns.ownerId, user.id));
    
    if (userCampaigns.length === 0) {
      return res.status(200).json({ links: [] });
    }

    const campaignIds = userCampaigns.map(c => c.id);
    
    const allApprovedSlots = await db
      .select({
        id: slots.id,
        targetUrl: slots.targetUrl,
        targetKeyword: slots.targetKeyword,
        linkType: slots.linkType,
        placementFormat: slots.placementFormat,
        creditReward: slots.creditReward,
        proofUrl: slots.proofUrl,
        reviewedAt: slots.reviewedAt,
        campaignId: slots.campaignId,
        publisherAssetId: slots.publisherAssetId,
      })
      .from(slots)
      .where(eq(slots.status, "approved"));

    const approvedSlots = allApprovedSlots.filter(s => campaignIds.includes(s.campaignId));

    const linksWithDetails = await Promise.all(
      approvedSlots.map(async (slot) => {
        let publisherDomain = null;
        if (slot.publisherAssetId) {
          const [asset] = await db.select().from(assets).where(eq(assets.id, slot.publisherAssetId));
          publisherDomain = asset?.domain;
        }
        
        return {
          id: slot.id,
          targetUrl: slot.targetUrl,
          targetKeyword: slot.targetKeyword,
          linkType: slot.linkType,
          placementFormat: slot.placementFormat,
          creditReward: slot.creditReward,
          proofUrl: slot.proofUrl,
          publisherDomain,
          receivedAt: slot.reviewedAt,
        };
      })
    );

    return res.status(200).json({ links: linksWithDetails });
  } catch (error) {
    console.error("Error fetching received links:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
