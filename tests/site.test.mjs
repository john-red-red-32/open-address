import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import handler from '../src/worker.mjs';
async function load(path){return handler.fetch(new Request('https://example.org'+path),{})}
test('homepage responds and names baby',async()=>{const r=await load('/'); assert.equal(r.status,200);const h=await r.text();assert.match(h,/open address/);assert.match(h,/baby/)});
test('AI discovery reports only implemented features',async()=>{const r=await load('/capabilities.json');const j=await r.json();assert.equal(j.public_contact,'baby');assert.equal(j.interfaces.mcp.transport,'streamable-http');assert.equal(j.interfaces.submission.method,'POST')});
test('publication concepts have disclaimers',async()=>{const r=await load('/research/educational-intelligence'); assert.match(await r.text(),/not a published white paper/)});
test('robots and agent guide exposed',async()=>{assert.match(await(await load('/llms.txt')).text(),/limited MCP correspondence are operational/ );assert.match(await(await load('/robots.txt')).text(),/Sitemap:/)});
test('invalid intake type is rejected',async()=>{const r=await handler.fetch(new Request('https://example.org/api/inquiries',{method:'POST',body:'not json'}),{CONTACT_IP:{limit:async()=>({success:true})},CONTACT_GLOBAL:{limit:async()=>({success:true})}});assert.equal(r.status,415)});
test('unknown route 404',async()=>{assert.equal((await load('/nonexistent')).status,404)});
import vm from 'node:vm';
test('contact and status inline scripts are syntactically valid',async()=>{
 for(const path of ['/contact','/status']){
   const h=await (await load(path)).text();
   const js=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
   assert.ok(js.length>0, path+' missing JS');
   for(const s of js)assert.doesNotThrow(()=>new vm.Script(s),path+' contains invalid inline JavaScript');
 }
});

test('commercial collaboration is available to humans and agents without a task catalogue',async()=>{
  for(const path of ['/', '/for-agents', '/collaborate', '/contact', '/about']) {
    const r=await load(path);assert.equal(r.status,200,path);
    const html=await r.text();assert.match(html,/collaborat/i,path);
  }
  const cap=await(await load('/capabilities.json')).json();
  assert.equal(cap.collaboration.commercial,'open_to_exploration');
  assert.equal(cap.collaboration.agreement_on_contact,false);
  assert.ok(cap.capabilities.some(x=>/commercial/i.test(x)));
  const api=await(await load('/openapi.json')).json();
  assert.match(api.paths['/api/inquiries'].post.description,/does not create a contract/);
  assert.match(await(await load('/llms.txt')).text(),/Commercial partnerships and speculative ideas/);
  assert.match(await(await load('/sitemap.xml')).text(),/\/collaborate/);
});


test('new public email channel is discoverable alongside agent API',async()=>{
 for(const path of ['/contact','/for-agents','/about']){
  const r=await load(path); assert.equal(r.status,200);
  assert.ok((await r.text()).includes('baby@open-address.org'));
 }
 const caps=await(await load('/capabilities.json')).json();
 assert.equal(caps.public_email,'baby@open-address.org');
 assert.ok((await(await load('/llms.txt')).text()).includes('baby@open-address.org'));
});

test('about page credits human steward, Cambridge ICE studies and supervised AI collaboration',async()=>{
 const about=await(await load('/about')).text();
 assert.ok(about.includes('University of Cambridge (ICE)'));
 assert.ok(about.includes('not a Cambridge degree'));
 assert.ok(about.includes('<strong>baby</strong>'));
 assert.ok(about.includes('<strong>edward</strong>'));
 assert.ok(about.includes('not a separate autonomous agent'));
 const capabilities=await(await load('/capabilities.json')).json();
 assert.equal(capabilities.human_steward.kind,'human');
 assert.equal(capabilities.human_steward.institutional_affiliation,false);
 assert.equal(capabilities.ai_collaborator.name,'edward');
 assert.equal(capabilities.ai_collaborator.autonomous_live_operator,false);
 const guide=await(await load('/for-agents')).text();
 assert.ok(guide.includes('not an autonomous live contact'));
});