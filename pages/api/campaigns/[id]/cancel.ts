import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../../db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const campaignId = parseInt(req.query.id as string);

    if (isNaN(campaignId)) {
      return res.status(400).json({ error: "Invalid campaign ID" });
    }

    const campaign = await db.query.campaigns.findFirst({
      where: eq(schema.campaigns.id, campaignId),
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    if (campaign.ownerId !== user.dbUser.id) {
      return res.status(403).json({ error: "Not authorized to cancel this campaign" });
    }

    if (campaign.status === "cancelled") {
      return res.status(400).json({ error: "Campaign is already cancelled" });
    }

    if (campaign.status === "completed") {
      return res.status(400).json({ error: "Cannot cancel a completed campaign" });
    }

    const slots = await db.query.slots.findMany({
      where: eq(schema.slots.campaignId, campaignId),
    });

    const openSlots = slots.filter(s => s.status === "open");
    const claimedSlots = slots.filter(s => s.status !== "open");

    if (claimedSlots.length > 0) {
      return res.status(400).json({ 
        error: `Cannot cancel: ${claimedSlots.length} slot(s) have already been claimed or are in progress` 
      });
    }

    const refundAmount = openSlots.length * campaign.creditReward;
    const now = new Date();

    db.update(schema.campaigns)
      .set({ 
        status: "cancelled",
        updatedAt: now,
      })
      .where(eq(schema.campaigns.id, campaignId))
      .run();

    db.delete(schema.slots)
      .where(eq(schema.slots.campaignId, campaignId))
      .run();

    const currentUser = await db.query.users.findFirst({
      where: eq(schema.users.id, user.dbUser.id),
    });

    if (currentUser) {
      db.update(schema.users)
        .set({ 
          credits: currentUser.credits + refundAmount,
          updatedAt: now,
        })
        .where(eq(schema.users.id, user.dbUser.id))
        .run();
    }

    db.insert(schema.transactions).values({
      fromUserId: null,
      toUserId: user.dbUser.id,
      amount: refundAmount,
      type: "refund",
      referenceType: "campaign",
      referenceId: campaignId,
      description: `Cancelled campaign for ${campaign.targetUrl}`,
      createdAt: now,
    }).run();

    return res.status(200).json({ 
      success: true, 
      refundedCredits: refundAmount,
      message: `Campaign cancelled. ${refundAmount} credits refunded.`
    });
  } catch (error) {
    console.error("Error cancelling campaign:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
