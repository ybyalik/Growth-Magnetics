import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../lib/auth-middleware";
import { fetchBacklinkSummary } from "../../../lib/dataforseo";

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

      const now = new Date();
      const results = { added: 0, skipped: [] as string[] };

      for (const domain of domains) {
        const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
        
        if (!cleanDomain || cleanDomain.length < 3) {
          results.skipped.push(domain);
          continue;
        }

        const existingAsset = await db.query.assets.findFirst({
          where: eq(schema.assets.domain, cleanDomain),
        });

        if (existingAsset) {
          results.skipped.push(cleanDomain);
          continue;
        }

        // Fetch backlink metrics in the background (or await for now to simplify)
        const metrics = await fetchBacklinkSummary(cleanDomain);

        db.insert(schema.assets).values({
          ownerId: user.dbUser.id,
          domain: cleanDomain,
          industry: null,
          status: "pending",
          backlinks: metrics?.backlinks || 0,
          referringDomains: metrics?.referringDomains || 0,
          brokenBacklinks: metrics?.brokenBacklinks || 0,
          brokenPages: metrics?.brokenPages || 0,
          spamScore: metrics?.spamScore || 0,
          domainRating: metrics?.rank ? Math.round(metrics.rank / 10) : null, // Convert rank to 0-100 DR-like scale
          createdAt: now,
          updatedAt: now,
        }).run();

        results.added++;
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
