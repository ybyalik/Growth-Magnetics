import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";
import { extractRootDomain, findExistingAsset, ensureDomainMetrics } from "../../../lib/domain-metrics";

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
      const { domains } = req.body;

      if (!domains || !Array.isArray(domains) || domains.length === 0) {
        return res.status(400).json({ error: "At least one domain is required" });
      }

      if (domains.length > 100) {
        return res.status(400).json({ error: "Maximum 100 domains can be submitted at once" });
      }

      const results = { added: 0, skipped: [] as string[] };

      for (const domain of domains) {
        const cleanDomain = extractRootDomain(domain);
        
        if (!cleanDomain || cleanDomain.length < 3) {
          results.skipped.push(domain);
          continue;
        }

        const existingAsset = await findExistingAsset(cleanDomain);

        if (existingAsset) {
          results.skipped.push(cleanDomain);
          continue;
        }

        const result = await ensureDomainMetrics(cleanDomain, user.dbUser.id);
        
        if (result.assetId) {
          results.added++;
        } else {
          results.skipped.push(cleanDomain);
        }
      }

      if (results.added === 0 && results.skipped.length > 0) {
        return res.status(400).json({ 
          error: `All domains were skipped (already registered or invalid): ${results.skipped.join(", ")}` 
        });
      }

      return res.status(201).json({ 
        count: results.added,
        skipped: results.skipped.length > 0 ? results.skipped : undefined
      });
    } catch (error) {
      console.error("Error creating assets:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default requireAuth(handler);
