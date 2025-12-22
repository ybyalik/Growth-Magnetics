import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq } from "drizzle-orm";
import { requireAdmin, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method === "GET") {
    try {
      const status = req.query.status as string;
      const assets = status && status !== "all"
        ? await db.query.assets.findMany({
            where: eq(schema.assets.status, status as any),
            orderBy: (assets, { desc }) => [desc(assets.createdAt)],
          })
        : await db.query.assets.findMany({
            orderBy: (assets, { desc }) => [desc(assets.createdAt)],
          });

      const assetsWithOwners = await Promise.all(assets.map(async (asset) => {
        const owner = await db.query.users.findFirst({
          where: eq(schema.users.id, asset.ownerId),
        });
        return { ...asset, owner: { email: owner?.email, displayName: owner?.displayName } };
      }));

      return res.status(200).json({ assets: assetsWithOwners });
    } catch (error) {
      console.error("Error fetching assets:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { assetId, action, industry, domainRating, traffic, qualityTier, creditValue, adminNotes } = req.body;

      if (!assetId || !action) {
        return res.status(400).json({ error: "Asset ID and action are required" });
      }

      const asset = await db.query.assets.findFirst({
        where: eq(schema.assets.id, assetId),
      });

      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }

      const now = new Date();

      if (action === "approve") {
        db.update(schema.assets)
          .set({
            status: "approved",
            industry: industry || asset.industry,
            domainRating: domainRating || asset.domainRating,
            traffic: traffic || asset.traffic,
            qualityTier: qualityTier || asset.qualityTier,
            creditValue: creditValue || 50,
            adminNotes: adminNotes || null,
            updatedAt: now,
          })
          .where(eq(schema.assets.id, assetId))
          .run();
      } else if (action === "reject") {
        db.update(schema.assets)
          .set({
            status: "rejected",
            adminNotes: adminNotes || null,
            updatedAt: now,
          })
          .where(eq(schema.assets.id, assetId))
          .run();
      } else if (action === "update") {
        const { status: newStatus } = req.body;
        db.update(schema.assets)
          .set({
            status: newStatus || asset.status,
            industry: industry || asset.industry,
            domainRating: domainRating !== undefined ? domainRating : asset.domainRating,
            traffic: traffic !== undefined ? traffic : asset.traffic,
            qualityTier: qualityTier || asset.qualityTier,
            creditValue: creditValue !== undefined ? creditValue : asset.creditValue,
            adminNotes: adminNotes !== undefined ? adminNotes : asset.adminNotes,
            updatedAt: now,
          })
          .where(eq(schema.assets.id, assetId))
          .run();
      } else if (action === "disable") {
        db.update(schema.assets)
          .set({
            status: "disabled",
            adminNotes: adminNotes || asset.adminNotes,
            updatedAt: now,
          })
          .where(eq(schema.assets.id, assetId))
          .run();
      }

      const updatedAsset = await db.query.assets.findFirst({
        where: eq(schema.assets.id, assetId),
      });

      return res.status(200).json({ asset: updatedAsset });
    } catch (error) {
      console.error("Error updating asset:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { assetId } = req.body;

      if (!assetId) {
        return res.status(400).json({ error: "Asset ID is required" });
      }

      db.delete(schema.assets).where(eq(schema.assets.id, assetId)).run();

      return res.status(200).json({ message: "Asset deleted" });
    } catch (error) {
      console.error("Error deleting asset:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default requireAdmin(handler);
