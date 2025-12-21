import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method === "GET") {
    try {
      const campaigns = await db.query.campaigns.findMany({
        where: eq(schema.campaigns.ownerId, user.dbUser.id),
        orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)],
      });

      return res.status(200).json({ campaigns });
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { targetUrl, targetKeyword, linkType: rawLinkType, placementFormat, industry, quantity, creditReward, publisherNotes } = req.body;

      // Map form link type values to database values
      const linkType = rawLinkType === "brand_mention" ? "brand_mention" : "hyperlink";
      const needsTargetUrl = linkType !== "brand_mention";

      if ((needsTargetUrl && !targetUrl) || !targetKeyword || !rawLinkType || !placementFormat || !industry || !quantity || !creditReward) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const totalCost = quantity * creditReward;
      if (user.dbUser.credits < totalCost) {
        return res.status(400).json({ error: "Insufficient credits" });
      }

      const now = new Date();
      
      db.update(schema.users)
        .set({ credits: user.dbUser.credits - totalCost, updatedAt: now })
        .where(eq(schema.users.id, user.dbUser.id))
        .run();

      const newCampaign = db.insert(schema.campaigns).values({
        ownerId: user.dbUser.id,
        targetUrl: targetUrl || targetKeyword, // Use keyword as fallback for brand mentions
        targetKeyword,
        linkType,
        placementFormat,
        industry,
        quantity,
        filledSlots: 0,
        creditReward,
        publisherNotes: publisherNotes || null,
        status: "active",
        createdAt: now,
        updatedAt: now,
      }).returning().get();

      for (let i = 0; i < quantity; i++) {
        db.insert(schema.slots).values({
          campaignId: newCampaign.id,
          status: "open",
          createdAt: now,
        }).run();
      }

      db.insert(schema.transactions).values({
        fromUserId: user.dbUser.id,
        toUserId: null,
        amount: totalCost,
        type: "spend",
        referenceType: "campaign",
        referenceId: newCampaign.id,
        description: `Created campaign for ${targetUrl}`,
        createdAt: now,
      }).run();

      return res.status(201).json({ campaign: newCampaign });
    } catch (error) {
      console.error("Error creating campaign:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default requireAuth(handler);
