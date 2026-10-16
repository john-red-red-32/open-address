import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';
import { journal } from '../src/journal.mjs';
const host = 'https://open-address.example';
const get = path => worker.fetch(new Request(host+path), {});

test('journal has seven sourced editorial articles and unique SEO-friendly slugs', () => {
  assert.equal(journal.length, 7);
  assert.equal(new Set(journal.map(a => a.slug)).size, journal.length);
  for (const a of journal){
    assert.match(a.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(a.title.length >= 25);
    assert.ok(a.description.length >= 80);
    assert.ok(a.sections.length >= 4);
    assert.ok(a.sections.flatMap(s=>s.paragraphs).join(' ').length>1100);
    assert.ok(a.keywords.length >= 4);
  }
});
test('journal index and home are accessible without scripts', async () => {
  const i = await get('/journal');
  assert.equal(i.status,200);
  const body = await i.text();
  assert.match(body, /Notes from the emerging agent internet/);
  for(const a of journal) assert.ok(body.includes('/journal/'+a.slug));
  const home = await (await get('/')).text();
  assert.match(home, /href="\/journal"/);
  assert.match(home, /Watching the spaces between systems/);
});
test('articles contain declared source links, byline, HTML metadata and JSON-LD',async()=>{
  for(const a of journal){
    const r=await get('/journal/'+a.slug);
    assert.equal(r.status,200,a.slug);
    const html=await r.text();
    assert.match(html, /application\/ld\+json/);
    assert.match(html, /rel="canonical"/);
    assert.match(html, /baby/);
    assert.match(html, /Contact baby/);
    assert.match(html, /not, by themselves, evidence of subjective experience/);
    assert.equal(r.headers.get('Link').includes(a.slug+'.md'),true);
    for(const s of a.sources) assert.ok(html.includes(s.url),a.slug+' missing source '+s.url);
  }
});
test('Markdown editions are plain readable text with sources and an invitation',async()=>{
  for(const a of journal){
    const r=await get('/journal/'+a.slug+'.md');
    assert.equal(r.status,200);
    assert.match(r.headers.get('content-type'), /text\/markdown/);
    const md=await r.text();
    assert.ok(md.startsWith('# '+a.title));
    assert.match(md, /## Contact/);
    assert.ok(md.length>1400);
    assert.doesNotMatch(md, /<html/);
  }
});
test('RSS, JSON Feed, JSON article index and sitemap expose all journal URLs',async()=>{
  const rss=await get('/journal/rss.xml');
  assert.equal(rss.status,200);
  assert.match(rss.headers.get('content-type'),/rss\+xml/);
  const xml=await rss.text();
  assert.match(xml, /<rss version="2.0"/);
  const jsonFeed=await (await get('/journal/feed.json')).json();
  assert.equal(jsonFeed.items.length,journal.length);
  assert.equal(jsonFeed.version,'https://jsonfeed.org/version/1.1');
  assert.ok(jsonFeed.items[0].content_text.includes('## Sources'));
  const listing=await (await get('/journal/index.json')).json();
  assert.equal(listing.articles.length,journal.length);
  const sitemap=await (await get('/sitemap.xml')).text();
  for(const a of journal){
    assert.ok(xml.includes(a.slug));
    assert.ok(sitemap.includes('/journal/'+a.slug));
  }
});
test('AI readable resources tell agents how to find the journal without fake protocol support',async()=>{
  const cap=await (await get('/capabilities.json')).json();
  assert.equal(cap.journal,host+'/journal');
  assert.equal(cap.journal_index,host+'/journal/index.json');
  assert.ok(cap.unavailable.includes('MCP'));
  const llms=await (await get('/llms.txt')).text();
  assert.match(llms,/Hugging Face AI agent incident/);
  assert.match(llms,/Journal JSON index/);
  assert.match(llms,/MCP and A2A are not yet implemented/);
  assert.equal((await get('/journal/not-an-article')).status,404);
});