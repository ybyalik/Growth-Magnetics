interface VerificationResult {
  verified: boolean;
  linkFound: boolean;
  anchorTextMatch: boolean;
  linkTypeMatch: boolean;
  details: string[];
  foundLink?: {
    href: string;
    anchorText: string;
    rel: string | null;
    isDofollow: boolean;
  };
}

interface VerifyLinkParams {
  proofUrl: string;
  targetUrl: string | null;
  targetKeyword: string;
  linkType: string;
}

export async function verifyLink(params: VerifyLinkParams): Promise<VerificationResult> {
  const { proofUrl, targetUrl, targetKeyword, linkType } = params;
  const details: string[] = [];
  
  const isBrandMention = linkType === "brand_mention";
  
  try {
    const response = await fetch(proofUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkVerifier/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    
    if (!response.ok) {
      return {
        verified: false,
        linkFound: false,
        anchorTextMatch: false,
        linkTypeMatch: false,
        details: [`Failed to fetch page: HTTP ${response.status}`],
      };
    }
    
    const html = await response.text();
    
    if (isBrandMention) {
      const brandFound = html.toLowerCase().includes(targetKeyword.toLowerCase());
      
      if (brandFound) {
        details.push(`Brand mention "${targetKeyword}" found on page`);
        return {
          verified: true,
          linkFound: true,
          anchorTextMatch: true,
          linkTypeMatch: true,
          details,
        };
      } else {
        details.push(`Brand mention "${targetKeyword}" not found on page`);
        return {
          verified: false,
          linkFound: false,
          anchorTextMatch: false,
          linkTypeMatch: false,
          details,
        };
      }
    }
    
    if (!targetUrl) {
      return {
        verified: false,
        linkFound: false,
        anchorTextMatch: false,
        linkTypeMatch: false,
        details: ['No target URL specified for link verification'],
      };
    }
    
    const linkRegex = /<a\s+([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>([\s\S]*?)<\/a>/gi;
    const links: Array<{ href: string; anchorText: string; rel: string | null; fullTag: string }> = [];
    
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const beforeHref = match[1] || '';
      const href = match[2];
      const afterHref = match[3] || '';
      const anchorText = match[4].replace(/<[^>]+>/g, '').trim();
      const fullTag = beforeHref + afterHref;
      
      const relMatch = fullTag.match(/rel\s*=\s*["']([^"']+)["']/i);
      const rel = relMatch ? relMatch[1] : null;
      
      links.push({ href, anchorText, rel, fullTag });
    }
    
    const normalizeUrl = (url: string) => {
      try {
        const parsed = new URL(url);
        return parsed.href.replace(/\/$/, '').toLowerCase();
      } catch {
        return url.toLowerCase().replace(/\/$/, '');
      }
    };
    
    const getUrlDomain = (url: string) => {
      try {
        const parsed = new URL(url);
        return parsed.hostname.toLowerCase();
      } catch {
        return '';
      }
    };
    
    const normalizedTarget = normalizeUrl(targetUrl);
    const targetDomain = getUrlDomain(targetUrl);
    
    const matchingLinks = links.filter(link => {
      try {
        const normalizedHref = normalizeUrl(link.href);
        const linkDomain = getUrlDomain(link.href);
        
        if (normalizedHref === normalizedTarget) {
          return true;
        }
        
        if (linkDomain === targetDomain && normalizedHref.startsWith(normalizedTarget)) {
          return true;
        }
        
        if (linkDomain === targetDomain && normalizedTarget.startsWith(normalizedHref)) {
          return true;
        }
        
        return false;
      } catch {
        return false;
      }
    });
    
    if (matchingLinks.length === 0) {
      details.push(`No link found pointing to ${targetUrl}`);
      return {
        verified: false,
        linkFound: false,
        anchorTextMatch: false,
        linkTypeMatch: false,
        details,
      };
    }
    
    details.push(`Found ${matchingLinks.length} link(s) to target URL`);
    
    let bestMatch = matchingLinks[0];
    let anchorTextMatch = false;
    let linkTypeMatch = false;
    
    for (const link of matchingLinks) {
      const textMatches = link.anchorText.toLowerCase().includes(targetKeyword.toLowerCase()) ||
                          targetKeyword.toLowerCase().includes(link.anchorText.toLowerCase());
      
      const isNofollow = link.rel?.toLowerCase().includes('nofollow') || false;
      const isDofollow = !isNofollow;
      
      const expectedDofollow = linkType === 'hyperlink_dofollow';
      const typeMatches = expectedDofollow ? isDofollow : isNofollow;
      
      if (textMatches && typeMatches) {
        bestMatch = link;
        anchorTextMatch = true;
        linkTypeMatch = true;
        break;
      }
      
      if (textMatches && !anchorTextMatch) {
        bestMatch = link;
        anchorTextMatch = true;
      }
      
      if (typeMatches && !linkTypeMatch) {
        bestMatch = link;
        linkTypeMatch = true;
      }
    }
    
    const isNofollow = bestMatch.rel?.toLowerCase().includes('nofollow') || false;
    const isDofollow = !isNofollow;
    const expectedDofollow = linkType === 'hyperlink_dofollow';
    
    anchorTextMatch = bestMatch.anchorText.toLowerCase().includes(targetKeyword.toLowerCase()) ||
                      targetKeyword.toLowerCase().includes(bestMatch.anchorText.toLowerCase());
    linkTypeMatch = expectedDofollow ? isDofollow : isNofollow;
    
    if (anchorTextMatch) {
      details.push(`Anchor text matches: "${bestMatch.anchorText}"`);
    } else {
      details.push(`Anchor text mismatch: found "${bestMatch.anchorText}", expected "${targetKeyword}"`);
    }
    
    if (linkTypeMatch) {
      details.push(`Link type matches: ${isDofollow ? 'dofollow' : 'nofollow'}`);
    } else {
      details.push(`Link type mismatch: found ${isDofollow ? 'dofollow' : 'nofollow'}, expected ${expectedDofollow ? 'dofollow' : 'nofollow'}`);
    }
    
    const verified = anchorTextMatch && linkTypeMatch;
    
    return {
      verified,
      linkFound: true,
      anchorTextMatch,
      linkTypeMatch,
      details,
      foundLink: {
        href: bestMatch.href,
        anchorText: bestMatch.anchorText,
        rel: bestMatch.rel,
        isDofollow,
      },
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      verified: false,
      linkFound: false,
      anchorTextMatch: false,
      linkTypeMatch: false,
      details: [`Error verifying link: ${errorMessage}`],
    };
  }
}
