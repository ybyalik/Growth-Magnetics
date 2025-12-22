import { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq } from "drizzle-orm";
import { fetchDomainMetrics, fetchTrafficEstimation } from "../../../lib/dataforseo";

initializeDatabase();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const assets = await db.select().from(schema.assets).all();
    
    let updated = 0;
    let failed = 0;

    for (const asset of assets) {
      try {
        const [metrics, trafficData] = await Promise.all([
          fetchDomainMetrics(asset.domain),
          fetchTrafficEstimation(asset.domain)
        ]);

        if (metrics) {
          db.update(schema.assets)
            .set({
              metricsJson: JSON.stringify(metrics),
              metricsFetchedAt: new Date(),
              domainRating: metrics.rank || null,
              backlinks: metrics.backlinks || null,
              referringDomains: metrics.referring_domains || null,
              organicTraffic: trafficData?.organic_etv ? Math.round(trafficData.organic_etv) : null,
              paidTraffic: trafficData?.paid_etv ? Math.round(trafficData.paid_etv) : null,
            })
            .where(eq(schema.assets.id, asset.id))
            .run();
          updated++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to fetch metrics for ${asset.domain}:`, error);
        failed++;
      }
    }

    return res.status(200).json({ 
      message: `Refreshed ${updated} domains, ${failed} failed`,
      updated,
      failed,
      total: assets.length
    });
  } catch (error) {
    console.error("Error refetching metrics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
