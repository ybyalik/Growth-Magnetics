import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";
import { verifyLink } from "../../../lib/link-verifier";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { slotId, proofUrl } = req.body;

    if (!slotId || !proofUrl) {
      return res.status(400).json({ error: "Slot ID and Proof URL are required" });
    }

    const slot = await db.query.slots.findFirst({
      where: and(
        eq(schema.slots.id, slotId),
        eq(schema.slots.publisherId, user.dbUser.id),
        eq(schema.slots.status, "submitted")
      ),
    });

    if (!slot) {
      return res.status(404).json({ error: "Submitted slot not found" });
    }

    if (slot.verified) {
      return res.status(400).json({ error: "This slot was already verified. Cannot retry." });
    }

    const verificationResult = await verifyLink({
      proofUrl,
      targetUrl: slot.targetUrl,
      targetKeyword: slot.targetKeyword || '',
      linkType: slot.linkType || 'hyperlink_dofollow',
    });

    const now = new Date();
    const newStatus = verificationResult.verified ? "approved" : "submitted";
    
    await db.update(schema.slots)
      .set({
        proofUrl,
        status: newStatus,
        submittedAt: now,
        reviewedAt: verificationResult.verified ? now : null,
        verified: verificationResult.verified,
        verificationDetails: JSON.stringify(verificationResult.details),
      })
      .where(eq(schema.slots.id, slotId))
      .run();

    if (verificationResult.verified) {
      const campaign = await db.query.campaigns.findFirst({
        where: eq(schema.campaigns.id, slot.campaignId),
      });

      if (campaign) {
        await db.update(schema.campaigns)
          .set({
            filledSlots: campaign.filledSlots + 1,
            updatedAt: now,
          })
          .where(eq(schema.campaigns.id, slot.campaignId))
          .run();

        const publisher = await db.query.users.findFirst({
          where: eq(schema.users.id, user.dbUser.id),
        });

        if (publisher) {
          const reward = slot.creditReward || campaign.creditReward;
          await db.update(schema.users)
            .set({
              credits: publisher.credits + reward,
              updatedAt: now,
            })
            .where(eq(schema.users.id, user.dbUser.id))
            .run();

          await db.insert(schema.transactions).values({
            fromUserId: campaign.ownerId,
            toUserId: user.dbUser.id,
            amount: reward,
            type: "earn",
            referenceType: "slot",
            referenceId: slotId,
            description: `Auto-verified link for ${slot.targetKeyword}`,
            createdAt: now,
          }).run();
        }
      }
    }

    const updatedSlot = await db.query.slots.findFirst({
      where: eq(schema.slots.id, slotId),
    });

    return res.status(200).json({ 
      slot: updatedSlot,
      verification: verificationResult,
    });
  } catch (error) {
    console.error("Error retrying verification:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
