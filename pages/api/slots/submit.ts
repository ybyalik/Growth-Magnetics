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
    const { slotId, proofUrl } = req.body;

    if (!slotId || !proofUrl) {
      return res.status(400).json({ error: "Slot ID and Proof URL are required" });
    }

    const slot = await db.query.slots.findFirst({
      where: and(
        eq(schema.slots.id, slotId),
        eq(schema.slots.publisherId, user.dbUser.id),
        eq(schema.slots.status, "reserved")
      ),
    });

    if (!slot) {
      return res.status(404).json({ error: "Reserved slot not found" });
    }

    const now = new Date();
    db.update(schema.slots)
      .set({
        proofUrl,
        status: "submitted",
        submittedAt: now,
      })
      .where(eq(schema.slots.id, slotId))
      .run();

    const updatedSlot = await db.query.slots.findFirst({
      where: eq(schema.slots.id, slotId),
    });

    return res.status(200).json({ slot: updatedSlot });
  } catch (error) {
    console.error("Error submitting proof:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
