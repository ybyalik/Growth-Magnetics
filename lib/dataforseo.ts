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
          include_subdomains: true
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
