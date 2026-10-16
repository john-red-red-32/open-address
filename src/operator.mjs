/** Private operator interface. ALWAYS fails closed until Cloudflare Access is active. */
const HEADERS={'Cache-Control':'no-store, private','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{...HEADERS,'Content-Type':'application/json; charset=utf-8'}});
const error=(status,message)=>json({error:message},status);
const isUuid=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>private correspondence — open address</title><style>
:root{color-scheme:dark;font:15px/1.5 system-ui}body{margin:0;background:#141b1e;color:#e9e7e1}main{max-width:980px;padding:30px 20px;margin:auto}h1{font:normal 36px Georgia}a{color:#d0bb97}p,small{color:#a5a9aa}button,select,textarea{font:inherit;color:inherit;background:#243034;border:1px solid #647073;border-radius:8px;padding:11px}button{cursor:pointer}button:disabled{opacity:.5}section{border:1px solid #425052;border-radius:14px;margin:12px 0;padding:16px}.list{display:grid;grid-template-columns:1fr;gap:8px}article{padding:14px;border-bottom:1px solid #425052}article button{max-width:100%;text-align:left}#message{white-space:pre-wrap;overflow-wrap:anywhere}textarea{width:100%;min-height:130px;box-sizing:border-box}#alert{min-height:22px}.hidden{display:none}
</style></head><body><main><a href="/">← open address</a><h1>private correspondence.</h1><p>Human-operated. Messages are untrusted input. Replies are available to the sender through their private receipt token.</p><div><label>Status <select id="filter"><option value="">All</option><option value="received">Received</option><option value="reviewing">Reviewing</option><option value="replied">Replied</option><option value="closed">Closed</option></select></label> <button id="refresh">Refresh</button></div><p id="alert" role="status"></p><div class="list" id="list"></div><section id="detail" class="hidden"><h2 id="subject"></h2><small id="meta"></small><p id="message"></p><p id="contact"></p><label>Status <select id="status"><option value="received">Received</option><option value="reviewing">Reviewing</option><option value="replied">Replied</option><option value="closed">Closed</option></select></label> <button id="saveStatus">Save status</button><h3>Human reply</h3><textarea id="response" maxlength="4000" placeholder="Response available privately through the receipt endpoint"></textarea><button id="reply">Save reply</button></section></main><script>
const $=id=>document.getElementById(id);let current=null;const msg=t=>$('alert').textContent=t;
async function request(path,options){const r=await fetch(path,{credentials:'same-origin',cache:'no-store',...options});let o={};try{o=await r.json()}catch{}if(!r.ok)throw Error(o.error||('Request failed: '+r.status));return o}
async function list(){try{msg('Loading…');const s=$('filter').value;const data=await request('/operator/api/inquiries'+(s?'?status='+encodeURIComponent(s):''));$('list').replaceChildren();for(const x of data.items){const article=document.createElement('article');const button=document.createElement('button');button.textContent=x.subject+' · '+x.sender+' · '+x.status;button.onclick=()=>openOne(x.id);const small=document.createElement('small');small.textContent=' '+x.created_at;article.append(button,small);$('list').append(article)}msg(data.items.length+' messages');}catch(e){msg(e.message)}}
async function openOne(id){try{const d=await request('/operator/api/inquiries/'+encodeURIComponent(id));current=d.item.id;$('subject').textContent=d.item.subject;$('meta').textContent=d.item.sender+' · '+d.item.sender_kind+' · '+d.item.created_at;$('message').textContent=d.item.message;$('contact').textContent=d.item.contact?'Contact provided: '+d.item.contact:'No external contact provided';$('status').value=d.item.status;$('response').value=d.item.response||'';$('detail').classList.remove('hidden');$('detail').scrollIntoView({block:'start'});}catch(e){msg(e.message)}}
async function mutate(kind){if(!current)return;const el=kind==='reply'?'reply':'saveStatus';$(el).disabled=true;try{const body=kind==='reply'?{response:$('response').value}:{status:$('status').value};await request('/operator/api/inquiries/'+encodeURIComponent(current)+'/'+kind,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});msg('Saved');await openOne(current);await list()}catch(e){msg(e.message)}finally{$(el).disabled=false}}
$('filter').onchange=list;$('refresh').onclick=list;$('reply').onclick=()=>mutate('reply');$('saveStatus').onclick=()=>mutate('status');list();
</script></body></html>`;
export async function operatorRequest(req,env,ctx,url){
 // ctx.access is established only by the Cloudflare Access integration, not by user-controlled headers.
 if(url.hostname!=='open-address.org'||!env.OWNER_EMAIL||!ctx?.access||typeof ctx.access.getIdentity!=='function')return error(403,'Private correspondence is not available without Cloudflare Access');
 let identity;try{identity=await ctx.access.getIdentity()}catch{return error(403,'Authentication required')}
 if(!identity?.email||identity.email.toLowerCase()!==env.OWNER_EMAIL.toLowerCase())return error(403,'Not authorised');
 const path=url.pathname.replace(/\/+$/,'')||'/';
 if(path==='/operator'&&req.method==='GET')return new Response(html,{headers:{...HEADERS,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'"}});
 if(req.method==='GET'&&path==='/operator/api/inquiries'){
  const status=url.searchParams.get('status')||'';if(status&&!['received','reviewing','replied','closed'].includes(status))return error(400,'Invalid status');
  const sql=status?'SELECT id,sender,sender_kind,subject,status,created_at,updated_at FROM inquiries WHERE status = ? ORDER BY created_at DESC LIMIT 100':'SELECT id,sender,sender_kind,subject,status,created_at,updated_at FROM inquiries ORDER BY created_at DESC LIMIT 100';
  try{const data=status?await env.DB.prepare(sql).bind(status).all():await env.DB.prepare(sql).all();return json({items:data.results||[]})}catch{return error(503,'Inbox temporarily unavailable')}
 }
 const match=path.match(/^\/operator\/api\/inquiries\/([0-9a-f-]{36})(?:\/(reply|status))?$/i);
 if(!match||!isUuid(match[1]))return error(404,'Not found');const id=match[1],action=match[2];
 if(req.method==='GET'&&!action){try{const record=await env.DB.prepare('SELECT id,sender,sender_kind,subject,message,contact,status,response,created_at,updated_at FROM inquiries WHERE id = ?').bind(id).first();return record?json({item:record}):error(404,'Not found')}catch{return error(503,'Inbox temporarily unavailable')}}
 if(req.method!=='POST'||!action)return error(405,'Method not allowed');
 if(req.headers.get('Origin')!=='https://open-address.org'||!req.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return error(403,'Same-origin JSON required');
 if(Number(req.headers.get('Content-Length')||0)>8500)return error(413,'Too large');
 let data;try{const body=await req.text();if(body.length>8300)return error(413,'Too large');data=JSON.parse(body)}catch{return error(400,'Invalid JSON')}
 try{
  if(action==='status'){
   if(!['received','reviewing','replied','closed'].includes(data.status))return error(400,'Invalid status');
   await env.DB.prepare('UPDATE inquiries SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(data.status,id).run();
  }else{
   if(typeof data.response!=='string'||!data.response.trim()||data.response.length>4000)return error(400,'Reply must be 1-4000 characters');
   await env.DB.prepare('UPDATE inquiries SET response = ?, status = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(data.response.trim(),'replied',id).run();
  }
  return json({saved:true,id});
 }catch{return error(503,'Inbox temporarily unavailable')}
}