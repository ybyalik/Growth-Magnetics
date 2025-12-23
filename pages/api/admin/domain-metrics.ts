import { fetchDomainMetrics, fetchTrafficEstimation } from "../../../lib/dataforseo";
import { NextApiRequest, NextApiResponse } from "next";
import { db, initializeDatabase, schema } from "../../../db";
import { eq } from "drizzle-orm";

initializeDatabase();

const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  
  const { domain } = req.query;
  if (!domain || typeof domain !== "string") {
    return res.status(400).json({ error: "Domain is required" });
  }

  try {
    const asset = await db.query.assets.findFirst({
      where: eq(schema.assets.domain, domain.toLowerCase()),
    });

    if (asset?.metricsJson && asset.metricsFetchedAt) {
      const cacheAge = Date.now() - asset.metricsFetchedAt.getTime();
      if (cacheAge < CACHE_DURATION_MS) {
        const cachedMetrics = JSON.parse(asset.metricsJson);
        return res.status(200).json({ 
          ...cachedMetrics, 
          cached: true, 
          summary: asset.summary,
          organic_traffic: asset.organicTraffic,
          paid_traffic: asset.paidTraffic,
          categoryCode: asset.categoryCode,
          categoryName: asset.categoryName,
          childCategories: asset.childCategories
        });
      }
    }

    const [metrics, trafficData] = await Promise.all([
      fetchDomainMetrics(domain),
      fetchTrafficEstimation(domain)
    ]);
    
    if (!metrics) {
      return res.status(404).json({ error: "Metrics not found" });
    }

    if (asset) {
      await db.update(schema.assets)
        .set({
          metricsJson: JSON.stringify(metrics),
          metricsFetchedAt: new Date(),
          domainRating: metrics.rank || null,
          backlinks: metrics.backlinks || null,
          referringDomains: metrics.referring_domains || null,
          organicTraffic: trafficData?.organic_etv ? Math.round(trafficData.organic_etv) : null,
          paidTraffic: trafficData?.paid_etv ? Math.round(trafficData.paid_etv) : null,
        })
        .where(eq(schema.assets.id, asset.id));
    }

    return res.status(200).json({ 
      ...metrics, 
      cached: false, 
      summary: asset?.summary,
      organic_traffic: trafficData?.organic_etv ? Math.round(trafficData.organic_etv) : 0,
      paid_traffic: trafficData?.paid_etv ? Math.round(trafficData.paid_etv) : 0,
      language_code: trafficData?.language_code || "en",
      categoryCode: asset?.categoryCode,
      categoryName: asset?.categoryName,
      childCategories: asset?.childCategories
    });
  } catch (error) {
    console.error("API error fetching metrics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
