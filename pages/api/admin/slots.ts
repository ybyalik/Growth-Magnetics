import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq, and } from "drizzle-orm";
import { requireAdmin, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method === "GET") {
    try {
      const slots = await db.query.slots.findMany({
        where: eq(schema.slots.status, "submitted"),
        orderBy: (slots, { asc }) => [asc(slots.submittedAt)],
      });

      const slotsWithDetails = await Promise.all(slots.map(async (slot) => {
        const campaign = await db.query.campaigns.findFirst({
          where: eq(schema.campaigns.id, slot.campaignId),
        });
        const publisher = slot.publisherId ? await db.query.users.findFirst({
          where: eq(schema.users.id, slot.publisherId),
        }) : null;
        const asset = slot.publisherAssetId ? await db.query.assets.findFirst({
          where: eq(schema.assets.id, slot.publisherAssetId),
        }) : null;
        const campaignOwner = campaign ? await db.query.users.findFirst({
          where: eq(schema.users.id, campaign.ownerId),
        }) : null;

        return {
          ...slot,
          campaign: campaign ? {
            targetUrl: campaign.targetUrl,
            targetKeyword: campaign.targetKeyword,
            creditReward: campaign.creditReward,
            ownerEmail: campaignOwner?.email,
          } : null,
          publisher: publisher ? { email: publisher.email, displayName: publisher.displayName } : null,
          asset: asset ? { domain: asset.domain } : null,
        };
      }));

      return res.status(200).json({ slots: slotsWithDetails });
    } catch (error) {
      console.error("Error fetching slots:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { slotId, action, adminNotes } = req.body;

      if (!slotId || !action) {
        return res.status(400).json({ error: "Slot ID and action are required" });
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

      const now = new Date();

      if (action === "approve") {
        await db.update(schema.slots)
          .set({
            status: "approved",
            adminNotes: adminNotes || null,
            reviewedAt: now,
          })
          .where(eq(schema.slots.id, slotId));

        if (slot.publisherId) {
          const publisher = await db.query.users.findFirst({
            where: eq(schema.users.id, slot.publisherId),
          });

          if (publisher) {
            await db.update(schema.users)
              .set({ 
                credits: publisher.credits + campaign.creditReward,
                updatedAt: now,
              })
              .where(eq(schema.users.id, publisher.id));

            await db.insert(schema.transactions).values({
              fromUserId: campaign.ownerId,
              toUserId: publisher.id,
              amount: campaign.creditReward,
              type: "earn",
              referenceType: "slot",
              referenceId: slot.id,
              description: `Earned credits for completing slot on campaign`,
              createdAt: now,
            });
          }
        }

        const completedSlots = await db.query.slots.findMany({
          where: and(
            eq(schema.slots.campaignId, campaign.id),
            eq(schema.slots.status, "approved")
          ),
        });

        if (completedSlots.length >= campaign.quantity) {
          await db.update(schema.campaigns)
            .set({ status: "completed", updatedAt: now })
            .where(eq(schema.campaigns.id, campaign.id));
        }
      } else if (action === "reject") {
        await db.update(schema.slots)
          .set({
            status: "rejected",
            adminNotes: adminNotes || null,
            reviewedAt: now,
          })
          .where(eq(schema.slots.id, slotId));
      }

      const updatedSlot = await db.query.slots.findFirst({
        where: eq(schema.slots.id, slotId),
      });

      return res.status(200).json({ slot: updatedSlot });
    } catch (error) {
      console.error("Error updating slot:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default requireAdmin(handler);
