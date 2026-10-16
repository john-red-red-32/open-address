# Discoverability and verification — open address

Canonical site: https://open-address.org/  
Public repository: https://github.com/john-red-red-32/open-address

## Live discovery surfaces
- XML sitemap: https://open-address.org/sitemap.xml
- robots.txt: https://open-address.org/robots.txt
- Agent guide: https://open-address.org/for-agents
- Capabilities: https://open-address.org/capabilities.json
- OpenAPI: https://open-address.org/openapi.json
- llms.txt: https://open-address.org/llms.txt
- Journal HTML, Markdown, RSS and JSON Feed
- Trust: https://open-address.org/trust
- Changelog: https://open-address.org/changelog
- Security contact: https://open-address.org/.well-known/security.txt
- MCP HTTP endpoint: https://open-address.org/mcp (POST only, version 2026-07-28; see `server.json`)

The old workers.dev URL and www hostname redirect to the canonical hostname. Do not publish separate canonical versions.

## Google Search Console — human verification required
1. In https://search.google.com/search-console/ add a **Domain property**: `open-address.org`.
2. Google will provide a DNS TXT verification record. Add this record to the Cloudflare zone for open-address.org. Do not copy the token into a public document or guess it.
3. After verification, submit `https://open-address.org/sitemap.xml`.
4. Monitor indexed URLs, robots status, crawl errors and the performance report. There is no guarantee of inclusion.

This project has **not** been independently verified in Google Search Console; an existing Google connection for unrelated websites does not verify open-address.org.

## Bing
Use https://www.bing.com/webmasters/ to add or import the verified Google Search Console property. Submit the canonical sitemap. Verify ownership and inspect indexing errors.

## IndexNow
The repository includes `indexnow-key.txt` and the Worker exposes `/{key}.txt`. GitHub Actions workflow `.github/workflows/indexnow.yml` reads the live canonical sitemap and submits those URLs to https://api.indexnow.org/indexnow on publishing commits or manual dispatch. A successful response acknowledges receipt, not indexing. Check the Actions result before claiming the submission succeeded.

## MCP Registry — publishing requires domain ownership authentication
`server.json` is prepared for a remote server under the domain-controlled namespace `org.open-address/correspondence`. Publishing to https://registry.modelcontextprotocol.io/ requires the official authenticated publishing workflow (HTTP/DNS domain proof) and independent live endpoint compatibility testing. **Do not describe open address as registry-listed until published and verified.**

The deployed MCP provides only `get_contact`, `list_research`, `submit_inquiry`. It does not operate independently, process confidential tools, act as an A2A agent, or assure a reply.

## Evidence and transparency
The public site names baby as the pseudonymous human steward and edward as an AI-assisted collaborator. Educational study through the University of Cambridge (ICE) is not described as a degree or institutional endorsement. Authorship, source citations and corrections are disclosed. Publication dates refer to site publication, not necessarily the incident date.

## Live browser verification
The connected remote browser could not retrieve the site during this release. A separate GitHub Actions workflow `.github/workflows/smoke.yml` sends read-only public requests and MCP tools/list; its success must be confirmed in Actions. Do not conduct automated write spam as a verification method.
