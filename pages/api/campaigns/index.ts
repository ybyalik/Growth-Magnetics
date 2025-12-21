import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

interface TargetEntry {
  url: string;
  keyword: string;
  linkType: string;
  placementFormat: string;
}

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
      const { industry, quantity, creditReward, publisherNotes, targets } = req.body;

      if (!industry || !quantity || !creditReward) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!targets || !Array.isArray(targets) || targets.length !== quantity) {
        return res.status(400).json({ error: "Targets array must match quantity" });
      }

      const validLinkTypes = ["hyperlink_dofollow", "hyperlink_nofollow", "brand_mention"];
      const validFormats = ["guest_post", "niche_edit"];

      for (let i = 0; i < targets.length; i++) {
        const target = targets[i] as TargetEntry;
        if (!validLinkTypes.includes(target.linkType)) {
          return res.status(400).json({ error: `Invalid link type for link ${i + 1}` });
        }
        if (!validFormats.includes(target.placementFormat)) {
          return res.status(400).json({ error: `Invalid placement format for link ${i + 1}` });
        }
        const needsUrl = target.linkType !== "brand_mention";
        if (needsUrl && !target.url) {
          return res.status(400).json({ error: `Missing URL for link ${i + 1}` });
        }
        if (!target.keyword) {
          return res.status(400).json({ error: `Missing keyword for link ${i + 1}` });
        }
      }

      const totalCost = quantity * creditReward;
      if (user.dbUser.credits < totalCost) {
        return res.status(400).json({ error: "Insufficient credits" });
      }

      const now = new Date();
      const firstTarget = targets[0] as TargetEntry;
      
      db.update(schema.users)
        .set({ credits: user.dbUser.credits - totalCost, updatedAt: now })
        .where(eq(schema.users.id, user.dbUser.id))
        .run();

      const newCampaign = db.insert(schema.campaigns).values({
        ownerId: user.dbUser.id,
        targetUrl: firstTarget.url || firstTarget.keyword,
        targetKeyword: firstTarget.keyword,
        linkType: firstTarget.linkType as "hyperlink_dofollow" | "hyperlink_nofollow" | "brand_mention",
        placementFormat: firstTarget.placementFormat as "guest_post" | "niche_edit",
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
        const target = targets[i] as TargetEntry;
        db.insert(schema.slots).values({
          campaignId: newCampaign.id,
          targetUrl: target.url || null,
          targetKeyword: target.keyword,
          linkType: target.linkType,
          placementFormat: target.placementFormat,
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
        description: `Created campaign with ${quantity} links`,
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
