import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq, and, ne, sql } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const campaigns = await db.query.campaigns.findMany({
      where: and(
        eq(schema.campaigns.status, "active"),
        ne(schema.campaigns.ownerId, user.dbUser.id),
        sql`${schema.campaigns.filledSlots} < ${schema.campaigns.quantity}`
      ),
      orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)],
    });

    const blindFeed = campaigns.map((campaign) => ({
      id: campaign.id,
      industry: campaign.industry,
      linkType: campaign.linkType,
      placementFormat: campaign.placementFormat,
      creditReward: campaign.creditReward,
      availableSlots: campaign.quantity - campaign.filledSlots,
      publisherNotes: campaign.publisherNotes,
      createdAt: campaign.createdAt,
    }));

    return res.status(200).json({ feed: blindFeed });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
