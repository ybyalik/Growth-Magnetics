import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    const assetId = parseInt(id as string);

    if (isNaN(assetId)) {
      return res.status(400).json({ error: "Invalid website ID" });
    }

    // Ensure the website belongs to the user
    const asset = await db.query.assets.findFirst({
      where: and(
        eq(schema.assets.id, assetId),
        eq(schema.assets.ownerId, user.dbUser.id)
      ),
    });

    if (!asset) {
      return res.status(404).json({ error: "Website not found or unauthorized" });
    }

    // Check if the website is linked to any slots (reserved or submitted)
    const linkedSlots = await db.query.slots.findFirst({
      where: eq(schema.slots.publisherAssetId, assetId),
    });

    if (linkedSlots) {
      return res.status(400).json({ 
        error: "Cannot delete website because it has associated link activity (given links or reserved slots)." 
      });
    }

    await db.delete(schema.assets).where(eq(schema.assets.id, assetId));

    return res.status(200).json({ message: "Website deleted successfully" });
  } catch (error) {
    console.error("Error deleting website:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
