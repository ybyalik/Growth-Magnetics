import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    const slotId = parseInt(id as string);

    if (isNaN(slotId)) {
      return res.status(400).json({ error: "Invalid slot ID" });
    }

    const slot = await db.query.slots.findFirst({
      where: eq(schema.slots.id, slotId),
    });

    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }

    const campaign = await db.query.campaigns.findFirst({
      where: eq(schema.campaigns.id, slot.campaignId),
    });

    let publisherDomain = null;
    if (slot.publisherAssetId) {
      const asset = await db.query.assets.findFirst({
        where: eq(schema.assets.id, slot.publisherAssetId),
      });
      publisherDomain = asset?.domain || null;
    }

    const enrichedSlot = {
      ...slot,
      targetUrl: slot.targetUrl || campaign?.targetUrl,
      targetKeyword: slot.targetKeyword || campaign?.targetKeyword,
      linkType: slot.linkType || campaign?.linkType,
      placementFormat: slot.placementFormat || campaign?.placementFormat,
      creditReward: slot.creditReward || campaign?.creditReward,
      industry: slot.industry || campaign?.industry,
      publisherDomain,
      campaignStatus: campaign?.status,
    };

    return res.status(200).json({ slot: enrichedSlot });
  } catch (error) {
    console.error("Error fetching slot:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
