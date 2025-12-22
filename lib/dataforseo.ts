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
