import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import worker from '../src/worker.mjs';

function fakeEnvironment() {
  const inquiries = new Map();
  const limits = new Map();
  const DB = {
    prepare(sql) {
      let args;
      return {
        bind(...values) { args = values; return this; },
        async first() {
          if (sql.startsWith('INSERT INTO daily_limits')) {
            const key = args.join('|');
            const hits = (limits.get(key) ?? 0) + 1;
            limits.set(key, hits);
            return { hits };
          }
          if (sql.startsWith('SELECT id,token_hash')) return inquiries.get(args[0]) ?? null;
          throw Error('Unexpected query: ' + sql);
        },
        async run() {
          if (sql.startsWith('INSERT INTO inquiries')) {
            const [id, token_hash, sender, sender_kind, subject, message, contact, user_agent] = args;
            inquiries.set(id, {id, token_hash, sender, sender_kind, subject, message, contact, user_agent,
              status: 'received', response: null, created_at: '2026-10-16T00:00:00Z', updated_at: '2026-10-16T00:00:00Z'});
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
  return { DB, SALT: 'testing-only-salt', inquiries, limits };
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