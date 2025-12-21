import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { slotId, assetId } = req.body;

    if (!slotId || !assetId) {
      return res.status(400).json({ error: "Slot ID and Asset ID are required" });
    }

    const asset = await db.query.assets.findFirst({
      where: and(
        eq(schema.assets.id, assetId),
        eq(schema.assets.ownerId, user.dbUser.id),
        eq(schema.assets.status, "approved")
      ),
    });

    if (!asset) {
      return res.status(400).json({ error: "You must have an approved asset to reserve a slot" });
    }

    const slot = await db.query.slots.findFirst({
      where: and(
        eq(schema.slots.id, slotId),
        eq(schema.slots.status, "open")
      ),
    });

    if (!slot) {
      return res.status(404).json({ error: "Slot not found or already taken" });
    }

    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(schema.campaigns.id, slot.campaignId),
        eq(schema.campaigns.status, "active")
      ),
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found or not active" });
    }

    if (campaign.ownerId === user.dbUser.id) {
      return res.status(400).json({ error: "You cannot reserve a slot on your own campaign" });
    }

    if (campaign.industry && asset.industry && campaign.industry !== asset.industry) {
      return res.status(400).json({ error: "Your asset industry does not match the campaign requirements" });
    }

    const now = new Date();
    db.update(schema.slots)
      .set({
        publisherId: user.dbUser.id,
        publisherAssetId: asset.id,
        status: "reserved",
        reservedAt: now,
      })
      .where(eq(schema.slots.id, slot.id))
      .run();

    db.update(schema.campaigns)
      .set({ 
        filledSlots: campaign.filledSlots + 1,
        updatedAt: now
      })
      .where(eq(schema.campaigns.id, slot.campaignId))
      .run();

    const updatedSlot = await db.query.slots.findFirst({
      where: eq(schema.slots.id, slot.id),
    });

    return res.status(200).json({ 
      slot: updatedSlot,
      campaign: {
        targetUrl: slot.targetUrl || campaign.targetUrl,
        targetKeyword: slot.targetKeyword || campaign.targetKeyword,
        publisherNotes: campaign.publisherNotes,
      }
    });
  } catch (error) {
    console.error("Error reserving slot:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
