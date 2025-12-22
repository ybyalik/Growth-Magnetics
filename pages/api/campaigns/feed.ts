import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq, and, ne } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const openSlots = db
      .select({
        slotId: schema.slots.id,
        targetKeyword: schema.slots.targetKeyword,
        linkType: schema.slots.linkType,
        placementFormat: schema.slots.placementFormat,
        slotCreditReward: schema.slots.creditReward,
        slotIndustry: schema.slots.industry,
        campaignId: schema.campaigns.id,
        campaignIndustry: schema.campaigns.industry,
        campaignCreditReward: schema.campaigns.creditReward,
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
      .orderBy(schema.slots.createdAt)
      .all();

    const blindFeed = openSlots.map((slot) => ({
      slotId: slot.slotId,
      campaignId: slot.campaignId,
      industry: slot.slotIndustry || slot.campaignIndustry,
      linkType: slot.linkType || "hyperlink_dofollow",
      placementFormat: slot.placementFormat || "guest_post",
      creditReward: slot.slotCreditReward || slot.campaignCreditReward,
      publisherNotes: slot.publisherNotes,
      createdAt: slot.createdAt,
    }));

    return res.status(200).json({ feed: blindFeed });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
