import { fetchDomainMetrics } from "@/lib/dataforseo";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  
  const { domain } = req.query;
  if (!domain || typeof domain !== "string") {
    return res.status(400).json({ error: "Domain is required" });
  }

  try {
    const metrics = await fetchDomainMetrics(domain);
    if (!metrics) {
      return res.status(404).json({ error: "Metrics not found" });
    }
    return res.status(200).json(metrics);
  } catch (error) {
    console.error("API error fetching metrics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
