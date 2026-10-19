/**
 * Conservative, deterministic screening of unsolicited commercial outreach.
 * This module has no external network, model, DNS or billing dependencies.
 * It is NOT an authenticity check; sender_kind is intentionally ignored.
 */
export function screenInquiry({ subject = '', message = '' } = {}) {
  const heading = String(subject).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ');
  const body = String(message).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ');
  const reasons = [];
  let score = 0;
  const check = (matched, points, reason) => { if (matched) { score += points; reasons.push(reason); } };

  // Phrases describe solicitations aimed at selling services, not research topics.
  check(/\b(?:increase|boost|grow|drive|improve)\s+(?:your\s+)?(?:website\s+|organic\s+)?(?:traffic|leads|rankings|google\s+ranking)\b|\bseo\s+(?:services|offer|packages?)\b|\bguest\s+post(?:ing)?\s+(?:offer|opportunity)\b/.test(heading), 4, 'promotional subject');
  check(/\b(?:we|i|our\s+team)\s+(?:can\s+)?(?:help|offer|provide|speciali[sz]e\s+in)\s+(?:businesses|companies|brands|your\s+business|you|websites?)\b.{0,125}\b(?:rank|traffic|seo|search\s+engine|visibility|leads|marketing|google)\b/.test(body), 4, 'unsolicited marketing pitch');
  check(/\b(?:please\s+)?(?:provide|share|send|reply\s+with)\s+(?:me\s+)?(?:your\s+)?(?:name|contact|email|phone)\b.{0,90}\b(?:contact|email|phone|details?|information)\b/.test(body), 2, 'requests contact details');
  check(/\b(?:seo|search\s+engine\s+optimi[sz]ation|rank\s+higher\s+on\s+google|ai-powered\s+search)\b/.test(body), 1, 'SEO sales vocabulary');
  check(['squarespace','shopify','wix','wordpress','godaddy'].filter(x => body.includes(x)).length >= 3, 2, 'mass-platform promotional signature');
  check(/\b(?:guaranteed\s+(?:first\s+page|rankings|google\s+rank)|free\s+seo\s+audit|book\s+a\s+(?:discovery\s+)?call\s+to\s+improve\s+your\s+(?:traffic|rankings))\b/.test(body), 3, 'sales call to action');

  // Require more than an incidental keyword or a single suggestive subject line.
  const suspectedSpam = score >= 6 && reasons.some(r => ['promotional subject', 'unsolicited marketing pitch', 'sales call to action'].includes(r));
  return { verdict: suspectedSpam ? 'suspected_spam' : 'clear', score, reason: suspectedSpam ? reasons.join('; ') : null };
}