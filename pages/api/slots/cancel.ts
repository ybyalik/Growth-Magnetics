import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { slotId } = req.body;

    if (!slotId) {
      return res.status(400).json({ error: "Slot ID is required" });
    }

    const slot = await db.query.slots.findFirst({
      where: and(
        eq(schema.slots.id, slotId),
        eq(schema.slots.publisherId, user.dbUser.id)
      ),
    });

    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }

    if (slot.status !== "reserved" && slot.status !== "submitted") {
      return res.status(400).json({ error: "Only reserved or submitted slots can be cancelled" });
    }

    const now = new Date();

    await db.update(schema.slots)
      .set({
        status: "open",
        publisherId: null,
        publisherAssetId: null,
        proofUrl: null,
        reservedAt: null,
        submittedAt: null,
        reviewedAt: null,
        verified: null,
        verificationDetails: null,
      })
      .where(eq(schema.slots.id, slotId))
      ;

    return res.status(200).json({ success: true, message: "Slot cancelled and returned to pool" });
  } catch (error) {
    console.error("Error cancelling slot:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
