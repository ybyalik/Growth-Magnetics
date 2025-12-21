import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method === "GET") {
    try {
      const assets = await db.query.assets.findMany({
        where: eq(schema.assets.ownerId, user.dbUser.id),
        orderBy: (assets, { desc }) => [desc(assets.createdAt)],
      });

      return res.status(200).json({ assets });
    } catch (error) {
      console.error("Error fetching assets:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { domain, industry } = req.body;

      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");

      const existingAsset = await db.query.assets.findFirst({
        where: eq(schema.assets.domain, cleanDomain),
      });

      if (existingAsset) {
        return res.status(400).json({ error: "This domain is already registered" });
      }

      const now = new Date();
      const newAsset = db.insert(schema.assets).values({
        ownerId: user.dbUser.id,
        domain: cleanDomain,
        industry: industry || null,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      }).returning().get();

      return res.status(201).json({ asset: newAsset });
    } catch (error) {
      console.error("Error creating asset:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default requireAuth(handler);
