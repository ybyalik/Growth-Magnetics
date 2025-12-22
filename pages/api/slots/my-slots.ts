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
    const slots = await db.query.slots.findMany({
      where: and(
        eq(schema.slots.publisherId, user.dbUser.id),
        ne(schema.slots.status, "open")
      ),
      orderBy: (slots, { desc }) => [desc(slots.reservedAt)],
    });

    const slotsWithCampaignInfo = await Promise.all(slots.map(async (slot) => {
      const campaign = await db.query.campaigns.findFirst({
        where: eq(schema.campaigns.id, slot.campaignId),
      });
      const asset = slot.publisherAssetId ? await db.query.assets.findFirst({
        where: eq(schema.assets.id, slot.publisherAssetId),
      }) : null;

      return {
        ...slot,
        targetUrl: slot.targetUrl,
        targetKeyword: slot.targetKeyword,
        linkType: slot.linkType,
        placementFormat: slot.placementFormat,
        creditReward: slot.creditReward,
        industry: slot.industry,
        campaign: {
          targetUrl: campaign?.targetUrl,
          targetKeyword: campaign?.targetKeyword,
          creditReward: campaign?.creditReward,
          industry: campaign?.industry,
          placementFormat: campaign?.placementFormat,
          linkType: campaign?.linkType,
        },
        asset: asset ? { domain: asset.domain } : null,
      };
    }));

    return res.status(200).json({ slots: slotsWithCampaignInfo });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
