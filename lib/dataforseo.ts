export async function fetchDomainMetrics(domain: string) {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    console.error("DataForSEO credentials missing");
    return null;
  }

  const auth = Buffer.from(`${login}:${password}`).toString('base64');

  try {
    // Switching to the more comprehensive 'summary' endpoint which is better for top-level domain stats
    const response = await fetch('https://api.dataforseo.com/v3/backlinks/summary/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        target: domain,
        include_subdomains: true,
        rank_scale: "one_hundred"
      }])
    });

    const data = await response.json();
    
    if (data.tasks?.[0]?.result?.[0]) {
      const result = data.tasks[0].result[0];
      return {
        domain: result.target,
        rank: result.rank,
        backlinks: result.backlinks,
        referring_domains: result.referring_domains,
        referring_main_domains: result.referring_main_domains,
        referring_ips: result.referring_ips,
        referring_subnets: result.referring_subnets,
        referring_pages: result.referring_pages,
        referring_links_tld: result.referring_links_tld,
        referring_links_types: result.referring_links_types,
        referring_links_attributes: result.referring_links_attributes,
        referring_links_platform_types: result.referring_links_platform_types,
        referring_links_semantic_categories: result.referring_links_semantic_categories,
        referring_links_countries: result.referring_links_countries,
        referring_main_domains_nodes: result.referring_main_domains_nodes,
        country: result.info?.country || "WW",
        source: "DataForSEO Backlinks Summary API (Live)",
        last_updated: new Date().toISOString()
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching DataForSEO metrics:", error);
    return null;
  }
}

export async function fetchTrafficEstimation(domain: string) {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    console.error("DataForSEO credentials missing");
    return null;
  }

  const auth = Buffer.from(`${login}:${password}`).toString('base64');

  try {
    const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/bulk_traffic_estimation/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        targets: [domain],
        location_code: 2840, // United States
        language_code: "en",
        item_types: ["organic", "paid"]
      }])
    });

    const data = await response.json();
    
    if (data.tasks?.[0]?.result?.[0]?.items?.[0]) {
      const item = data.tasks[0].result[0].items[0];
      return {
        organic_etv: item.metrics?.organic?.etv || 0,
        organic_count: item.metrics?.organic?.count || 0,
        paid_etv: item.metrics?.paid?.etv || 0,
        paid_count: item.metrics?.paid?.count || 0,
        language_code: "en",
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching traffic estimation:", error);
    return null;
  }
}

export interface DataForSEOCategory {
  category_code: number;
  category_name: string;
  category_code_parent: number | null;
}

export interface CategoryNode {
  code: number;
  name: string;
  children: CategoryNode[];
}

let cachedCategories: DataForSEOCategory[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchCategories(): Promise<DataForSEOCategory[]> {
  // Return cached if fresh
  if (cachedCategories && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedCategories;
  }

  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    console.error("DataForSEO credentials missing");
    return [];
  }

  const auth = Buffer.from(`${login}:${password}`).toString('base64');

  try {
    const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/categories', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.tasks?.[0]?.result) {
      cachedCategories = data.tasks[0].result;
      cacheTimestamp = Date.now();
      return cachedCategories;
    }
    return [];
  } catch (error) {
    console.error("Error fetching DataForSEO categories:", error);
    return [];
  }
}

export function buildCategoryTree(categories: DataForSEOCategory[]): CategoryNode[] {
  const categoryMap = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];

  // Create nodes
  categories.forEach(cat => {
    categoryMap.set(cat.category_code, {
      code: cat.category_code,
      name: cat.category_name,
      children: []
    });
  });

  // Build tree
  categories.forEach(cat => {
    const node = categoryMap.get(cat.category_code)!;
    if (cat.category_code_parent === null) {
      roots.push(node);
    } else {
      const parent = categoryMap.get(cat.category_code_parent);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  // Sort alphabetically
  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(n => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

export function getCategoryPath(categories: DataForSEOCategory[], code: number): string[] {
  const path: string[] = [];
  let current = categories.find(c => c.category_code === code);
  
  while (current) {
    path.unshift(current.category_name);
    if (current.category_code_parent) {
      current = categories.find(c => c.category_code === current!.category_code_parent);
    } else {
      break;
    }
  }
  
  return path;
}

export interface DomainCategory {
  categoryCode: number;
  categoryName: string;
  organicCount: number;
  organicEtv: number;
}

export interface DomainCategoryResult {
  primary: DomainCategory | null;
  children: DomainCategory[];
}

export async function fetchCategoriesForDomain(domain: string): Promise<DomainCategoryResult> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    console.error("DataForSEO credentials missing");
    return { primary: null, children: [] };
  }

  const auth = Buffer.from(`${login}:${password}`).toString('base64');

  try {
    const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/categories_for_domain/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        target: domain,
        language_name: "English",
        location_code: 2840,
        limit: 10,
        include_subcategories: true
      }])
    });

    const data = await response.json();
    
    if (data.tasks?.[0]?.result?.[0]?.items) {
      const items = data.tasks[0].result[0].items;
      const allCategories = await fetchCategories();
      
      const seenCodes = new Set<number>();
      const uniqueCategories: DomainCategory[] = [];
      
      for (const item of items) {
        if (item.categories && item.categories.length > 0) {
          const categoryCode = item.categories[0];
          if (!seenCodes.has(categoryCode)) {
            seenCodes.add(categoryCode);
            const categoryInfo = allCategories.find(c => c.category_code === categoryCode);
            uniqueCategories.push({
              categoryCode,
              categoryName: categoryInfo?.category_name || `Category ${categoryCode}`,
              organicCount: item.metrics?.organic?.count || 0,
              organicEtv: item.metrics?.organic?.etv || 0
            });
          }
        }
      }
      
      // Sort by organic traffic value (most relevant first)
      uniqueCategories.sort((a, b) => b.organicEtv - a.organicEtv);
      
      // Take the highest-traffic category as primary
      const primary = uniqueCategories.length > 0 ? uniqueCategories[0] : null;
      
      // Take the next 3 categories as children/related categories
      const children = uniqueCategories.slice(1, 4);
      
      return { primary, children };
    }
    return { primary: null, children: [] };
  } catch (error) {
    console.error("Error fetching categories for domain:", error);
    return { primary: null, children: [] };
  }
}

export async function fetchBacklinkSummary(target: string) {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    console.error("DataForSEO credentials missing");
    return null;
  }

  const auth = Buffer.from(`${login}:${password}`).toString('base64');

  try {
    const response = await fetch("https://api.dataforseo.com/v3/backlinks/summary/live", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        {
          target,
          include_subdomains: true,
          rank_scale: "one_hundred"
        }
      ])
    });

    const data = await response.json();
    
    if (data.status_code === 20000 && data.tasks && data.tasks[0].result && data.tasks[0].result[0]) {
      const result = data.tasks[0].result[0];
      return {
        backlinks: result.backlinks || 0,
        referringDomains: result.referring_domains || 0,
        brokenBacklinks: result.broken_backlinks || 0,
        brokenPages: result.broken_pages || 0,
        spamScore: result.backlinks_spam_score || 0,
        rank: result.rank || 0
      };
    }
    
    console.error("DataForSEO API error:", data);
    return null;
  } catch (error) {
    console.error("Error fetching DataForSEO backlink summary:", error);
    return null;
  }
}
