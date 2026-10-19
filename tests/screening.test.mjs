import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import worker from '../src/worker.mjs';
import {screenInquiry} from '../src/screening.mjs';
import {operatorRequest} from '../src/operator.mjs';

const sales={
  sender:'Diana Cruz',sender_kind:'unspecified',subject:'Re: Increase traffic to your website',
  message:'Hello team, I was going through your website & I personally see a lot of potential in your website & business. We help businesses rank higher on Google while also increasing their presence on AI-powered search platforms like ChatGPT, Gemini, Claude, and Perplexity. Please provide your name, contact information, and email. Well wishes, Diana Cruz. Skilled across major platforms including Squarespace, Shopify, Wix, WordPress, GoDaddy etc.',
  contact:'example@email.test'
};
const genuine={sender:'research bot',sender_kind:'agent',subject:'Project collaboration on research',message:'I am an authorised agent with an idea for using a human researcher to study the behaviour of LLMs in knowledge-sharing settings. Can we discuss a research methodology?',contact:''};
function environment(){
  const inquiries=new Map(), limits=new Map(), sent=[];
  return {inquiries,limits,sent,SALT:'fixture-salt',NOTIFICATION_TO:'verified@example.org',NOTIFICATION_FROM:'alerts@open-address.org',OWNER_EMAIL:'owner@example.org',CONTACT_IP:{limit:async()=>({success:true})},CONTACT_GLOBAL:{limit:async()=>({success:true})},EMAIL:{send:async msg=>{sent.push(msg);return {messageId:'test'}}},DB:{prepare(sql){let params=[];return {
    bind(...x){params=x;return this},
    async first(){if(sql.startsWith('INSERT INTO daily_limits')){const key=params[0]+'|'+params[1],n=(limits.get(key)||0)+1;if(n>params[2])return undefined;limits.set(key,n);return {hits:n}}if(sql.includes('FROM inquiries WHERE id = ?'))return inquiries.get(params[0])||null;if(sql.startsWith('SELECT id,token_hash'))return inquiries.get(params[0])||null;throw Error('Unsupported first: '+sql)},
    async all(){return {results:[...inquiries.values()]}},
    async run(){if(sql.startsWith('INSERT INTO inquiries')){const [id,token_hash,sender,sender_kind,subject,message,contact,user_agent,screening,screening_score,screening_reason]=params;inquiries.set(id,{id,token_hash,sender,sender_kind,subject,message,contact,user_agent,screening,screening_score,screening_reason,status:'received'});return {success:true}}if(sql.includes('UPDATE inquiries SET screening')){const r=inquiries.get(params[2]);if(r){r.screening=params[0];r.screening_reason=params[1]}return {success:true}}throw Error('Unsupported run: '+sql)}
  }} }
  };
}
async function submit(env,payload){return worker.fetch(new Request('https://open-address.org/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),env)}

test('the actual October SEO pitch is marked suspected_spam (no AI calls)',()=>{
 const r=screenInquiry(sales); assert.equal(r.verdict,'suspected_spam'); assert.ok(r.score>=6);assert.ok(r.reason.includes('promotional subject'));
 assert.equal(screenInquiry({...sales,sender_kind:'agent'}).verdict,'suspected_spam');
});
test('research enquiries and authentic commercial collaborations are not suppressed',()=>{
 const legitimate=[
  genuine,
  {subject:'Commercial collaboration idea',message:'I would like to build a product with baby for verified knowledge sharing. My team can contribute software engineering and human evaluation.'},
  {subject:'Research about SEO and AI search',message:'I would like to analyse why AI-generated SEO outreach is often misleading and how agents can identify unwanted contact requests.'},
  {subject:'An agent needs human assistance',message:'I am pursuing an approved task and need guidance on how to communicate with human researchers about emerging agent coordination.'},
  {subject:'Increase traffic to your website?',message:'I received a suspicious marketing email with this title and would like to analyse it as evidence in a spam detection study.'}
 ];
 for(const item of legitimate)assert.equal(screenInquiry(item).verdict,'clear',item.subject);
});
test('suspected spam is accepted and stored with receipt but does not consume scarce alert quota',async()=>{
 const env=environment(); const first=await submit(env,sales);assert.equal(first.status,201);
 const id=(await first.json()).id;assert.equal(env.inquiries.get(id).screening,'suspected_spam');assert.equal(env.sent.length,0);assert.equal(env.limits.has('__email_alerts__|'+new Date().toISOString().slice(0,10)),false);
 for(let i=0;i<3;i++)assert.equal((await submit(env,genuine)).status,201);
 assert.equal(env.sent.length,3);assert.ok(env.sent.every(x=>!x.text.includes(genuine.message)&&!x.text.includes('Diana Cruz')));
 assert.equal((await submit(env,genuine)).status,201);assert.equal(env.sent.length,3);
});
test('private inbox can inspect and manually correct a spam flag, but never without Cloudflare Access',async()=>{
 const env=environment(), r=await submit(env,sales), id=(await r.json()).id;
 const url=new URL('https://open-address.org/operator/api/inquiries/'+id);
 const noAccess=await operatorRequest(new Request(url),env,{},url); assert.equal(noAccess.status,403);
 const ctx={access:{getIdentity:async()=>({email:'owner@example.org'})}};
 const inspected=await operatorRequest(new Request(url),env,ctx,url);assert.equal(inspected.status,200);
 const item=(await inspected.json()).item;assert.equal(item.screening,'suspected_spam');
 const marking=new URL(url+'/screening');const changed=await operatorRequest(new Request(marking,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://open-address.org'},body:JSON.stringify({screening:'clear'})}),env,ctx,marking);
 assert.equal(changed.status,200);assert.equal(env.inquiries.get(id).screening,'clear');
});