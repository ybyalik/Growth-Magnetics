import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../../db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const slotId = parseInt(req.query.id as string);

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

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    if (campaign.ownerId !== user.dbUser.id) {
      return res.status(403).json({ error: "Not authorized to cancel this slot" });
    }

    if (slot.status !== "open") {
      return res.status(400).json({ error: "Can only cancel open slots" });
    }

    const refundAmount = slot.creditReward || campaign.creditReward;
    const now = new Date();

    db.delete(schema.slots)
      .where(eq(schema.slots.id, slotId))
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
      referenceType: "slot",
      referenceId: slotId,
      description: `Cancelled link for ${slot.targetUrl || slot.targetKeyword}`,
      createdAt: now,
    }).run();

    const remainingSlots = await db.query.slots.findMany({
      where: eq(schema.slots.campaignId, campaign.id),
    });

    if (remainingSlots.length === 0) {
      db.update(schema.campaigns)
        .set({ 
          status: "cancelled",
          updatedAt: now,
        })
        .where(eq(schema.campaigns.id, campaign.id))
        .run();
    }

    return res.status(200).json({ 
      success: true, 
      refundedCredits: refundAmount,
      message: `Link cancelled. ${refundAmount} credits refunded.`
    });
  } catch (error) {
    console.error("Error cancelling slot:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
