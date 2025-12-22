import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq, and } from "drizzle-orm";

initializeDatabase();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { firebaseUid } = req.query;

    if (!firebaseUid || typeof firebaseUid !== "string") {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.firebaseUid, firebaseUid),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const approvedSlots = await db.query.slots.findMany({
      where: and(
        eq(schema.slots.publisherId, user.id),
        eq(schema.slots.status, "approved")
      ),
    });

    const givenLinks = await Promise.all(approvedSlots.map(async (slot) => {
      const campaign = await db.query.campaigns.findFirst({
        where: eq(schema.campaigns.id, slot.campaignId),
      });

      let yourDomain = null;
      if (slot.publisherAssetId) {
        const asset = await db.query.assets.findFirst({
          where: eq(schema.assets.id, slot.publisherAssetId),
        });
        yourDomain = asset?.domain || null;
      }

      return {
        id: slot.id,
        targetUrl: slot.targetUrl || campaign?.targetUrl || "",
        targetKeyword: slot.targetKeyword || campaign?.targetKeyword || "",
        linkType: slot.linkType || campaign?.linkType || "",
        placementFormat: slot.placementFormat || campaign?.placementFormat || "",
        proofUrl: slot.proofUrl || "",
        yourDomain,
        creditReward: slot.creditReward || campaign?.creditReward || 0,
        givenAt: slot.reviewedAt || slot.submittedAt,
      };
    }));

    return res.status(200).json({ links: givenLinks });
  } catch (error) {
    console.error("Error fetching given links:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
