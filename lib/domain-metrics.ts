import { db, initializeDatabase, schema } from "../db";
import { eq } from "drizzle-orm";
import { fetchBacklinkSummary } from "./dataforseo";
import { summarizeWebsite } from "./openai";

initializeDatabase();

export function extractRootDomain(url: string): string {
  if (!url) return "";
  
  try {
    let cleanUrl = url.trim().toLowerCase();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }
    
    const urlObj = new URL(cleanUrl);
    let hostname = urlObj.hostname.replace(/^www\./, "");
    
    hostname = hostname.replace(/\/$/, "");
    
    return hostname;
  } catch {
    const cleaned = url.toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .replace(/\/.*$/, "")
      .trim();
    return cleaned;
  }
}

export async function findExistingAsset(domain: string) {
  const cleanDomain = domain.toLowerCase().trim();
  
  const existing = await db.query.assets.findFirst({
    where: eq(schema.assets.domain, cleanDomain),
  });
  
  return existing;
}

export async function ensureDomainMetrics(domain: string, userId: number): Promise<{
  exists: boolean;
  assetId: number | null;
  error?: string;
}> {
  const cleanDomain = extractRootDomain(domain);
  
  if (!cleanDomain || cleanDomain.length < 3) {
    return { exists: false, assetId: null, error: "Invalid domain" };
  }
  
  const existingAsset = await findExistingAsset(cleanDomain);
  
  if (existingAsset) {
    console.log(`Domain ${cleanDomain} already exists in assets table (id: ${existingAsset.id})`);
    return { exists: true, assetId: existingAsset.id };
  }
  
  console.log(`Fetching metrics for new domain: ${cleanDomain}`);
  
  try {
    const [metrics, summary] = await Promise.all([
      fetchBacklinkSummary(cleanDomain),
      summarizeWebsite(cleanDomain),
    ]);
    
    const now = new Date();
    
    const newAsset = db.insert(schema.assets).values({
      ownerId: userId,
      domain: cleanDomain,
      industry: null,
      status: "pending",
      backlinks: metrics?.backlinks || 0,
      referringDomains: metrics?.referringDomains || 0,
      brokenBacklinks: metrics?.brokenBacklinks || 0,
      brokenPages: metrics?.brokenPages || 0,
      spamScore: metrics?.spamScore || 0,
      domainRating: metrics?.rank || null,
      summary: summary,
      metricsFetchedAt: now,
      createdAt: now,
      updatedAt: now,
    }).returning().get();
    
    console.log(`Created asset for domain ${cleanDomain} (id: ${newAsset.id})`);
    return { exists: false, assetId: newAsset.id };
  } catch (error) {
    console.error(`Error fetching metrics for ${cleanDomain}:`, error);
    return { exists: false, assetId: null, error: "Failed to fetch metrics" };
  }
}

export async function ensureDomainsMetrics(
  urls: string[],
  userId: number
): Promise<Map<string, { assetId: number | null; error?: string }>> {
  const results = new Map<string, { assetId: number | null; error?: string }>();
  
  const uniqueDomains = new Set<string>();
  for (const url of urls) {
    if (url) {
      const domain = extractRootDomain(url);
      if (domain && domain.length >= 3) {
        uniqueDomains.add(domain);
      }
    }
  }
  
  for (const domain of uniqueDomains) {
    const result = await ensureDomainMetrics(domain, userId);
    results.set(domain, { assetId: result.assetId, error: result.error });
  }
  
  return results;
}
