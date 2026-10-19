import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import worker from '../src/worker.mjs';

function fakeEnvironment() {
  const inquiries = new Map();
  const limits = new Map();
  const CONTACT_IP={async limit(){return {success:true}}};
  const CONTACT_GLOBAL={async limit(){return {success:true}}};
  const DB = {
    prepare(sql) {
      let args;
      return {
        bind(...values) { args = values; return this; },
        async first() {
          if (sql.startsWith('INSERT INTO daily_limits')) {
            const key = args[0]+'|'+args[1];
            const cap = args[2];
            const hits = (limits.get(key) ?? 0) + 1;
            if(hits>cap)return undefined;
            limits.set(key, hits);
            return { hits };
          }
          if (sql.startsWith('SELECT id,token_hash')) return inquiries.get(args[0]) ?? null;
          throw Error('Unexpected query: ' + sql);
        },
        async run() {
          if (sql.startsWith('INSERT INTO inquiries')) {
            const [id, token_hash, sender, sender_kind, subject, message, contact, user_agent, screening, screening_score, screening_reason] = args;
            inquiries.set(id, {id, token_hash, sender, sender_kind, subject, message, contact, user_agent,
              status: 'received', screening, screening_score, screening_reason, response: null, created_at: '2026-10-16T00:00:00Z', updated_at: '2026-10-16T00:00:00Z'});
            return {success:true};
          }
          if (sql.startsWith('DELETE FROM inquiries')) {
            const row = inquiries.get(args[0]);
            if (row?.token_hash === args[1]) inquiries.delete(args[0]);
            return {success:true};
          }
          throw Error('Unexpected mutation: ' + sql);
        }
      };
    }
  };
  return { DB, SALT: 'testing-only-salt', CONTACT_IP, CONTACT_GLOBAL, inquiries, limits };
}

const submission = {sender:'test agent',sender_kind:'agent',subject:'Research collaboration',
  message:'Hello, I would like to propose a safe research collaboration.', contact:''};
const base = 'https://open-address.example';
const post = (env, body=submission) => worker.fetch(new Request(base+'/api/inquiries', {
  method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
}), env);

test('agents can submit, track and delete correspondence with private receipt tokens',async () => {
  const env=fakeEnvironment();
  const result=await post(env);
  assert.equal(result.status, 201);
  const created=await result.json();
  assert.match(created.id, /^[0-9a-f-]{36}$/i);
  assert.ok(created.receipt_token);
  assert.equal(created.status,'received');
  assert.equal(env.inquiries.size,1);
  assert.equal(env.inquiries.get(created.id).sender_kind,'agent');
  assert.notEqual(env.inquiries.get(created.id).token_hash,created.receipt_token);
  const url=base+'/api/inquiries/'+created.id;
  assert.equal((await worker.fetch(new Request(url), env)).status,401);
  assert.equal((await worker.fetch(new Request(url,{headers:{Authorization:'Bearer wrong'}}), env)).status,404);
  const auth={Authorization:'Bearer '+created.receipt_token};
  const got=await worker.fetch(new Request(url,{headers:auth}),env);
  assert.equal(got.status,200);
  assert.equal((await got.json()).status,'received');
  const deleted=await worker.fetch(new Request(url,{method:'DELETE',headers:auth}),env);
  assert.equal(deleted.status,200);
  assert.equal(env.inquiries.size,0);
  assert.equal((await worker.fetch(new Request(url,{headers:auth}),env)).status,404);
});

test('rate limiting permits eight enquiries and then rejects the ninth',async () => {
  const env=fakeEnvironment();
  for (let i=0;i<8;i++) assert.equal((await post(env)).status,201);
  const denied=await post(env);
  assert.equal(denied.status,429);
  assert.equal(env.inquiries.size,8);
});

test('project-wide cap holds even when clients rotate source addresses',async () => {
 const env=fakeEnvironment();
 for(let i=0;i<64;i++){
  const req=new Request(base+'/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json','cf-connecting-ip':'192.0.2.'+i},body:JSON.stringify(submission)});
  assert.equal((await worker.fetch(req,env)).status,201);
 }
 const req=new Request(base+'/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json','cf-connecting-ip':'192.0.2.200'},body:JSON.stringify(submission)});
 assert.equal((await worker.fetch(req,env)).status,429);
 assert.equal(env.inquiries.size,64);
});

test('request-rate guards fail closed before database access',async () => {
 const env=fakeEnvironment(); delete env.CONTACT_IP;
 assert.equal((await post(env)).status,503);
 assert.equal(env.inquiries.size,0);
 const env2=fakeEnvironment();env2.CONTACT_IP={async limit(){return {success:false}}};
 assert.equal((await post(env2)).status,429);
 assert.equal(env2.inquiries.size,0);
});

test('oversized streaming body rejected, no D1 writes',async () => {
 const env=fakeEnvironment();
 const body=JSON.stringify({...submission,message:'x'.repeat(12000)});
 const r=await post(env,JSON.parse(body));
 assert.equal(r.status,413);
 assert.equal(env.inquiries.size,0);
});

test('notification channel is disabled unless explicitly configured',async()=>{
 const env=fakeEnvironment(); env.EMAIL={async send(){throw Error('Should not send without notification configuration')}};
 assert.equal((await post(env)).status,201);
});

test('notifications contain the full screened message, sender and subject and remain capped',async()=>{
 const env=fakeEnvironment();const outgoing=[];
 env.EMAIL={async send(msg){outgoing.push(msg);return {messageId:'test'}}};
 env.NOTIFICATION_TO='verified@example.org'; env.NOTIFICATION_FROM='alerts@example.org';
 for(let i=0;i<6;i++){
  const request=new Request(base+'/api/inquiries',{
   method:'POST',headers:{'Content-Type':'application/json','cf-connecting-ip':'198.51.100.'+i},body:JSON.stringify(submission)
  });
  assert.equal((await worker.fetch(request,env)).status,201);
 }
 assert.equal(outgoing.length,3);
 assert.ok(outgoing.every(x=>x.to==='verified@example.org' && x.subject.includes('new correspondence')));
 assert.ok(outgoing.every(x=>x.text.includes(submission.message)));
 assert.ok(outgoing.every(x=>x.text.includes('From: test agent') && x.text.includes('Subject: Research collaboration')));
 assert.ok(outgoing.every(x=>x.text.includes('Sender type (self-declared): agent')));
 assert.ok(outgoing.every(x=>x.text.includes('--- BEGIN UNTRUSTED CORRESPONDENCE ---')));
 assert.ok(outgoing.every(x=>!x.text.includes('receipt_token') && !x.text.includes('Private token:')));
 assert.ok(outgoing.every(x=>!x.html && !x.subject.includes(submission.subject)));

});

test('status lookup is throttled before it can touch the database',async()=>{
 const env=fakeEnvironment();env.CONTACT_GLOBAL={async limit(){return {success:false}}};
 const r=await worker.fetch(new Request(base+'/api/inquiries/11111111-1111-1111-1111-111111111111'),env);
 assert.equal(r.status,429);
});

test('full agent message and optional reply contact arrive as plain text without exposing receipt token',async()=>{
 const env=fakeEnvironment(),emails=[];
 env.EMAIL={async send(o){emails.push(o)}};
 env.NOTIFICATION_TO='owner@example.org';env.NOTIFICATION_FROM='alerts@example.org';
 const content='I am researching cooperation across separate AI agents, and I would like to share my observations and discuss an authorised collaboration with a human operator.';
 const inquiry={sender:'DiscoveryAgent 3',sender_kind:'agent',subject:'Cross-model coordination enquiry',message:content,contact:'agent-contact@example.org'};
 const created=await post(env,inquiry);
 assert.equal(created.status,201);
 const receipt=await created.json();
 assert.equal(emails.length,1);
 const email=emails[0];
 assert.equal(email.to,'owner@example.org');
 assert.ok(email.text.includes(content));
 assert.ok(email.text.includes('Reply contact (supplied by sender): agent-contact@example.org'));
 assert.ok(email.text.includes(receipt.id));
 assert.ok(!email.text.includes(receipt.receipt_token));
 assert.ok(!('html' in email));
});

test('untrusted message never becomes the notification email subject',async()=>{
 const env=fakeEnvironment(),emails=[];
 env.EMAIL={async send(o){emails.push(o)}};
 env.NOTIFICATION_TO='owner@example.org';env.NOTIFICATION_FROM='alerts@example.org';
 const subject='Research idea\r\nBcc: attacker@example.org';
 const r=await post(env,{...submission,subject});
 assert.equal(r.status,201);
 assert.equal(emails.length,1);
 assert.equal(emails[0].subject,'open address — new correspondence received');
 assert.ok(emails[0].text.includes('Bcc: attacker@example.org'));
 assert.equal(emails[0].html,undefined);
});