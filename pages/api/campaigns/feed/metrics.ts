import type { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../../db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "../../../../lib/auth-middleware";
import { fetchDomainMetrics, fetchTrafficEstimation } from "../../../../lib/dataforseo";
import { extractRootDomain } from "../../../../lib/domain-metrics";

initializeDatabase();

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const slotId = parseInt(req.query.slotId as string);

    if (isNaN(slotId)) {
      return res.status(400).json({ error: "Invalid slot ID" });
    }

    const slot = await db.query.slots.findFirst({
      where: eq(schema.slots.id, slotId),
    });

    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }

    const campaign = await db.query.campaigns.findFirst({
      where: eq(schema.campaigns.id, slot.campaignId),
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const targetUrl = slot.targetUrl || campaign.targetUrl;
    if (!targetUrl) {
      return res.status(404).json({ error: "No target URL found" });
    }

    const domain = extractRootDomain(targetUrl);
    
    const asset = await db.query.assets.findFirst({
      where: eq(schema.assets.domain, domain),
    });

    const [backlinkData, trafficData] = await Promise.all([
      fetchDomainMetrics(domain),
      fetchTrafficEstimation(domain),
    ]);

    if (!backlinkData) {
      return res.status(404).json({ error: "Could not fetch domain metrics" });
    }

    return res.status(200).json({
      domain: backlinkData.domain,
      rank: backlinkData.rank,
      backlinks: backlinkData.backlinks,
      referring_domains: backlinkData.referring_domains,
      referring_main_domains: backlinkData.referring_main_domains,
      referring_ips: backlinkData.referring_ips,
      referring_subnets: backlinkData.referring_subnets,
      referring_pages: backlinkData.referring_pages,
      referring_links_tld: backlinkData.referring_links_tld,
      referring_links_types: backlinkData.referring_links_types,
      referring_links_attributes: backlinkData.referring_links_attributes,
      referring_links_platform_types: backlinkData.referring_links_platform_types,
      referring_links_semantic_categories: backlinkData.referring_links_semantic_categories,
      referring_links_countries: backlinkData.referring_links_countries,
      country: backlinkData.country,
      organic_traffic: trafficData?.organic_etv || 0,
      paid_traffic: trafficData?.paid_etv || 0,
      language_code: trafficData?.language_code || "en",
      summary: asset?.summary || null,
    });
  } catch (error) {
    console.error("Error fetching domain metrics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default requireAuth(handler);
