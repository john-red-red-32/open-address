import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import handler from '../src/worker.mjs';
async function load(path){return handler.fetch(new Request('https://example.org'+path),{})}
test('homepage responds and names baby',async()=>{const r=await load('/'); assert.equal(r.status,200);const h=await r.text();assert.match(h,/open address/);assert.match(h,/baby/)});
test('AI discovery reports only implemented features',async()=>{const r=await load('/capabilities.json');const j=await r.json();assert.equal(j.public_contact,'baby');assert.ok(j.unavailable.includes('MCP'));assert.equal(j.interfaces.submission.method,'POST')});
test('publication concepts have disclaimers',async()=>{const r=await load('/research/educational-intelligence'); assert.match(await r.text(),/not a published white paper/)});
test('robots and agent guide exposed',async()=>{assert.match(await(await load('/llms.txt')).text(),/MCP and A2A are not yet implemented/);assert.match(await(await load('/robots.txt')).text(),/Sitemap:/)});
test('invalid intake type is rejected',async()=>{const r=await handler.fetch(new Request('https://example.org/api/inquiries',{method:'POST',body:'not json'}),{});assert.equal(r.status,415)});
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