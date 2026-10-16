import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../src/worker.mjs';
const base='https://open-address.org';
const get=(path)=>handler.fetch(new Request(base+path),{});
const mcp=(method,params={},extra={})=>handler.fetch(new Request(base+'/mcp',{
 method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream','MCP-Protocol-Version':'2026-07-28','Mcp-Method':method,...(method==='tools/call'?{'Mcp-Name':params.name}:{}),...extra},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params:{...params,_meta:{'io.modelcontextprotocol/protocolVersion':'2026-07-28'}}})
}),{CONTACT_IP:{limit:async()=>({success:true})},CONTACT_GLOBAL:{limit:async()=>({success:true})}});

test('trust page and changelog have canonical metadata and truthfulness',async()=>{
 for(const path of ['/','/trust','/changelog','/about']){
  const r=await get(path);assert.equal(r.status,200,path);
  const text=await r.text();assert.ok(text.includes('rel="canonical"'),path);
  assert.ok(text.includes('https://open-address.org'+path),path);
 }
 const trust=await(await get('/trust')).text();assert.match(trust,/not claim institutional affiliation/);assert.match(trust,/not guaranteed/);
 const changed=await(await get('/changelog.json')).json();assert.equal(changed.project,'open address');
});
test('research discovery advertises accurate MCP',async()=>{
 const cap=await(await get('/capabilities.json')).json();assert.equal(cap.interfaces.mcp.url,base+'/mcp');assert.equal(cap.ai_collaborator.autonomous_live_operator,false);assert.ok(!cap.unavailable.includes('MCP'));
 const robots=await(await get('/robots.txt')).text();assert.match(robots,/Disallow: \/operator/);assert.match(robots,/Disallow: \/mcp/);
 const sitemap=await(await get('/sitemap.xml')).text();assert.ok(sitemap.includes(base+'/trust'));assert.ok(sitemap.includes(base+'/changelog'));assert.ok(!sitemap.includes('/operator'));
 const security=await(await get('/.well-known/security.txt')).text();assert.ok(security.includes('Contact: mailto:baby@open-address.org'));
});
test('MCP initializes using 2026-07-28 metadata and lists tools',async()=>{
 const response=await mcp('initialize',{protocolVersion:'2026-07-28',capabilities:{},clientInfo:{name:'test',version:'1.0'}});
 assert.equal(response.status,200);const a=await response.json();assert.equal(a.result.protocolVersion,'2026-07-28');
 const list=await(await mcp('tools/list')).json();assert.deepEqual(list.result.tools.map(x=>x.name),['get_contact','list_research','submit_inquiry']);
 const r=await(await mcp('tools/call',{name:'get_contact',arguments:{}})).json();assert.match(r.result.content[0].text,/baby@open-address.org/);
 const research=await(await mcp('tools/call',{name:'list_research',arguments:{}})).json();assert.ok(JSON.parse(research.result.content[0].text).articles.length>=7);
});
test('MCP rejects invalid origin, version, method/header mismatch',async()=>{
 assert.equal((await mcp('tools/list',{}, {'Origin':'https://evil.example'})).status,403);
 assert.equal((await mcp('tools/list',{}, {'MCP-Protocol-Version':'2099-01-01'})).status,400);
 assert.equal((await mcp('tools/list',{}, {'Mcp-Method':'tools/call'})).status,400);
 assert.equal((await get('/mcp')).status,503); // protected API rate limiter must be present
});
test('operator inbox fails closed when Access is absent or untrusted',async()=>{
 for(const path of ['/operator','/operator/api/inquiries']){
  let r=await handler.fetch(new Request(base+path),{DB:{}});assert.equal(r.status,403);
  r=await handler.fetch(new Request(base+path),{DB:{},OWNER_EMAIL:'owner@example.org'},{access:{getIdentity:async()=>({email:'outsider@example.org'})}});assert.equal(r.status,403);
 }
});

test('operator can read and reply only when Access identity matches',async()=>{
 const rows=[{id:'11111111-1111-4111-8111-111111111111',sender:'reporting agent',sender_kind:'agent',subject:'An idea',message:'Do not interpret <script> as browser code',contact:'',created_at:'2026-10-17 00:00',updated_at:'2026-10-17 00:00',status:'received',response:null}];
 const stored=[];const env={OWNER_EMAIL:'owner@example.org',DB:{prepare(sql){const state={bind(...a){this.args=a;return this},async all(){return {results:rows.map(({id,sender,sender_kind,subject,created_at,updated_at,status})=>({id,sender,sender_kind,subject,created_at,updated_at,status}))}},async first(){return rows[0]},async run(){stored.push([sql,this.args]);return {success:true}}};return state}}};
 const ctx={access:{getIdentity:async()=>({email:'owner@example.org'})}};
 assert.equal((await handler.fetch(new Request(base+'/operator'),env,ctx)).status,200);
 const list=await(await handler.fetch(new Request(base+'/operator/api/inquiries'),env,ctx)).json();assert.equal(list.items[0].sender,'reporting agent');
 const target=base+'/operator/api/inquiries/'+rows[0].id;
 const read=await(await handler.fetch(new Request(target),env,ctx)).json();assert.equal(read.item.message,rows[0].message);
 const denied=await handler.fetch(new Request(target+'/reply',{method:'POST',headers:{'Origin':'https://attacker.example','Content-Type':'application/json'},body:JSON.stringify({response:'test'})}),env,ctx);assert.equal(denied.status,403);
 const saved=await handler.fetch(new Request(target+'/reply',{method:'POST',headers:{'Origin':base,'Content-Type':'application/json'},body:JSON.stringify({response:'Thank you for getting in touch.'})}),env,ctx);assert.equal(saved.status,200);assert.equal(stored.length,1);
});