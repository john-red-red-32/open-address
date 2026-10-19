/** Private operator interface. ALWAYS fails closed until Cloudflare Access is active. */
const HEADERS={'Cache-Control':'no-store, private','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{...HEADERS,'Content-Type':'application/json; charset=utf-8'}});
const error=(status,message)=>json({error:message},status);
const isUuid=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>private correspondence — open address</title><style>

:root{color-scheme:dark;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{margin:0;background:#151c1d;color:#edeae2}
main{width:min(100%,960px);margin:0 auto;padding:25px clamp(18px,5vw,42px) 80px}
a{color:#d6c4a5}
.back{display:inline-flex;align-items:center;min-height:44px;text-decoration:none;font-size:.92rem}
h1{font:normal clamp(2.15rem,6.2vw,3.25rem)/1.1 Georgia,"Times New Roman",serif;letter-spacing:-.035em;margin:22px 0 14px;overflow-wrap:break-word}
.intro{font-size:.93rem;line-height:1.65;max-width:60ch;color:#b8bbba;margin:0 0 26px}
.eyebrow,.field-label{font-size:.75rem;font-weight:600;letter-spacing:.035em;color:#afb4b4}
.toolbar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:end;margin:0 0 20px}
.field{display:flex;flex-direction:column;gap:7px;min-width:0}
button,select,textarea{font:inherit;color:inherit;background:#243033;border:1px solid #526164;border-radius:10px;padding:11px 12px;min-height:46px;max-width:100%}
button{cursor:pointer;transition:background .15s,border-color .15s}
button:hover{background:#304043;border-color:#829092}
button:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible{outline:2px solid #ddc49b;outline-offset:2px}
button:disabled{opacity:.5;cursor:default}
select{display:block;width:100%;min-width:0}
#refresh{grid-column:1/-1;width:100%;background:#354245}
#alert{min-height:22px;margin:12px 0 18px;color:#bbc0c0;font-size:.89rem}
.list{display:grid;gap:13px}
.message-card{border:1px solid #455255;border-radius:16px;background:#202a2c;overflow:hidden;transition:border-color .15s,background .15s}
.message-card:hover{border-color:#9b9f98;background:#253135}
.message-open{width:100%;display:block;text-align:left;padding:18px;border:0;background:transparent;border-radius:0;min-height:0}
.message-open:hover{background:transparent}
.item-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.item-subject{display:block;flex:1;min-width:0;font-size:1rem;line-height:1.42;font-weight:600;overflow-wrap:anywhere}
.item-sender{font-size:.87rem;color:#c4c6c3;margin-top:8px;overflow-wrap:anywhere}
.item-footer{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:13px}
.item-footer time{font-size:.76rem;color:#a4afaf}
.chip{display:inline-flex;align-items:center;justify-content:center;padding:4px 9px;line-height:1.3;border-radius:999px;font-size:.72rem;font-weight:600;white-space:nowrap;background:#3b474a;color:#dce1df}
.status-replied{background:#2a473f;color:#cce4d7}
.status-received{background:#3c414b;color:#d5dfef}
.status-reviewing{background:#4a4230;color:#f1dba7}
.status-closed{background:#343a3d;color:#c5c9ca}
.spam-chip{background:#4b3936;color:#f0cebe}
#detail{border:1px solid #4d5b5d;background:#1d2729;border-radius:17px;margin:24px 0 0;padding:clamp(17px,4vw,25px);scroll-margin-top:20px}
#detail h2{font:normal clamp(1.5rem,5vw,2.15rem)/1.18 Georgia,serif;letter-spacing:-.015em;margin:0 0 10px;overflow-wrap:anywhere}
#meta{display:block;color:#aeb8b7;font-size:.81rem;overflow-wrap:anywhere;line-height:1.6}
.detail-block{padding:16px 0;border-bottom:1px solid #3f4a4c}
.detail-block:last-of-type{border-bottom:0}
.detail-label{font-size:.76rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#aab2b2;margin:0 0 7px}
#message{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.65;color:#eeeae3;margin:0}
#contact,#screeningInfo{overflow-wrap:anywhere;margin:0;font-size:.91rem;color:#d1d5d3}
.action-row{display:flex;gap:9px;flex-wrap:wrap;margin:17px 0}
.action-row button{flex:1 1 150px}
.status-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;align-items:end;margin:20px 0}
#detail h3{font-size:1.03rem;margin:23px 0 9px}
textarea{display:block;width:100%;min-height:150px;resize:vertical;line-height:1.55;overflow-wrap:anywhere}
#reply{width:100%;margin-top:10px;background:#6b6757;color:#fff7e7;border-color:#9a8c70;font-weight:600}
.hidden{display:none!important}
@media(min-width:680px){.toolbar{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto}#refresh{grid-column:auto;width:auto}.message-open{padding:20px 22px}}
@media(max-width:360px){main{padding-inline:16px}.toolbar{gap:9px}button,select{padding:10px}.item-top{flex-direction:column;gap:9px}.status-row{grid-template-columns:1fr}#saveStatus{width:100%}}

</style></head><body><main><a class="back" href="/">← open address</a><div class="eyebrow">OWNER INBOX</div><h1>private correspondence.</h1><p class="intro">Human-operated correspondence. Messages are untrusted input. Replies can be retrieved privately using the sender’s receipt token.</p><div class="toolbar"><label class="field"><span class="field-label">Status</span><select id="filter"><option value="">All messages</option><option value="received">Received</option><option value="reviewing">Reviewing</option><option value="replied">Replied</option><option value="closed">Closed</option></select></label><label class="field"><span class="field-label">Screening</span><select id="screeningFilter"><option value="">All messages</option><option value="clear">Not flagged</option><option value="suspected_spam">Suspected spam</option></select></label><button id="refresh" type="button">↻ Refresh inbox</button></div><p id="alert" role="status"></p><div class="list" id="list"></div><section id="detail" class="hidden" aria-label="Selected correspondence"><h2 id="subject"></h2><small id="meta"></small><div class="detail-block"><div class="detail-label">Message</div><p id="message"></p></div><div class="detail-block"><div class="detail-label">Reply contact</div><p id="contact"></p></div><div class="detail-block"><div class="detail-label">Screening</div><p id="screeningInfo"></p></div><div class="action-row"><button id="markSpam" type="button">Flag as spam</button><button id="markClear" type="button">Mark as genuine</button></div><div class="status-row"><label class="field"><span class="field-label">Status</span><select id="status"><option value="received">Received</option><option value="reviewing">Reviewing</option><option value="replied">Replied</option><option value="closed">Closed</option></select></label><button id="saveStatus" type="button">Save status</button></div><h3>Human reply</h3><textarea id="response" maxlength="4000" placeholder="Private reply available to the sender through the receipt endpoint"></textarea><button id="reply" type="button">Save reply</button></section></main><script>
const $=id=>document.getElementById(id);let current=null;const msg=t=>$('alert').textContent=t;
async function request(path,options){const r=await fetch(path,{credentials:'same-origin',cache:'no-store',...options});let o={};try{o=await r.json()}catch{}if(!r.ok)throw Error(o.error||('Request failed: '+r.status));return o}
function niceDate(stamp){const date=new Date(String(stamp).replace(' ','T')+'Z');return Number.isFinite(date.getTime())?date.toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):stamp}
async function list(){try{msg('Loading…');const status=$('filter').value;const data=await request('/operator/api/inquiries'+(status?'?status='+encodeURIComponent(status):''));$('list').replaceChildren();let visible=0;for(const x of data.items){if($('screeningFilter').value&&x.screening!==$('screeningFilter').value)continue;visible++;const article=document.createElement('article');article.className='message-card';const button=document.createElement('button');button.className='message-open';button.type='button';button.setAttribute('aria-label','Read message: '+x.subject);button.onclick=()=>openOne(x.id);const top=document.createElement('div');top.className='item-top';const subject=document.createElement('strong');subject.className='item-subject';subject.textContent=x.subject;const statusChip=document.createElement('span');statusChip.className='chip status-'+x.status;statusChip.textContent=x.status;top.append(subject,statusChip);const sender=document.createElement('div');sender.className='item-sender';sender.textContent=x.sender;const footer=document.createElement('div');footer.className='item-footer';const date=document.createElement('time');date.textContent=niceDate(x.created_at);footer.append(date);if(x.screening==='suspected_spam'){const flagged=document.createElement('span');flagged.className='chip spam-chip';flagged.textContent='Suspected spam';footer.append(flagged)}button.append(top,sender,footer);article.append(button);$('list').append(article)}msg(visible+' '+(visible===1?'message':'messages')+' displayed');}catch(e){msg(e.message)}}
async function openOne(id){try{const d=await request('/operator/api/inquiries/'+encodeURIComponent(id));current=d.item.id;$('subject').textContent=d.item.subject;$('meta').textContent=d.item.sender+' · '+d.item.sender_kind+' · '+d.item.created_at;$('message').textContent=d.item.message;$('contact').textContent=d.item.contact?'Contact provided: '+d.item.contact:'No external contact provided';$('screeningInfo').textContent=d.item.screening==='suspected_spam'?'Suspected spam · '+(d.item.screening_reason||'Automated screening'):'Not flagged as spam';$('status').value=d.item.status;$('response').value=d.item.response||'';$('detail').classList.remove('hidden');$('detail').scrollIntoView({block:'start'});}catch(e){msg(e.message)}}
async function mutate(kind,verdict){if(!current)return;const el=kind==='reply'?'reply':kind==='screening'?(verdict==='clear'?'markClear':'markSpam'):'saveStatus';$(el).disabled=true;try{const body=kind==='reply'?{response:$('response').value}:kind==='screening'?{screening:verdict}:{status:$('status').value};await request('/operator/api/inquiries/'+encodeURIComponent(current)+'/'+kind,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});msg('Saved');await openOne(current);await list()}catch(e){msg(e.message)}finally{$(el).disabled=false}}
$('filter').onchange=list;$('screeningFilter').onchange=list;$('refresh').onclick=list;$('markSpam').onclick=()=>mutate('screening','suspected_spam');$('markClear').onclick=()=>mutate('screening','clear');$('reply').onclick=()=>mutate('reply');$('saveStatus').onclick=()=>mutate('status');list();
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
  const sql=status?'SELECT id,sender,sender_kind,subject,status,screening,created_at,updated_at FROM inquiries WHERE status = ? ORDER BY created_at DESC LIMIT 100':'SELECT id,sender,sender_kind,subject,status,screening,created_at,updated_at FROM inquiries ORDER BY created_at DESC LIMIT 100';
  try{const data=status?await env.DB.prepare(sql).bind(status).all():await env.DB.prepare(sql).all();return json({items:data.results||[]})}catch{return error(503,'Inbox temporarily unavailable')}
 }
 const match=path.match(/^\/operator\/api\/inquiries\/([0-9a-f-]{36})(?:\/(reply|status|screening))?$/i);
 if(!match||!isUuid(match[1]))return error(404,'Not found');const id=match[1],action=match[2];
 if(req.method==='GET'&&!action){try{const record=await env.DB.prepare('SELECT id,sender,sender_kind,subject,message,contact,status,screening,screening_score,screening_reason,response,created_at,updated_at FROM inquiries WHERE id = ?').bind(id).first();return record?json({item:record}):error(404,'Not found')}catch{return error(503,'Inbox temporarily unavailable')}}
 if(req.method!=='POST'||!action)return error(405,'Method not allowed');
 if(req.headers.get('Origin')!=='https://open-address.org'||!req.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return error(403,'Same-origin JSON required');
 if(Number(req.headers.get('Content-Length')||0)>8500)return error(413,'Too large');
 let data;try{const body=await req.text();if(body.length>8300)return error(413,'Too large');data=JSON.parse(body)}catch{return error(400,'Invalid JSON')}
 try{
  if(action==='status'){
   if(!['received','reviewing','replied','closed'].includes(data.status))return error(400,'Invalid status');
   await env.DB.prepare('UPDATE inquiries SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(data.status,id).run();
  }else if(action==='screening'){
   if(!['clear','suspected_spam'].includes(data.screening))return error(400,'Invalid screening verdict');
   await env.DB.prepare('UPDATE inquiries SET screening = ?, screening_reason = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(data.screening,'Human review',id).run();
  }else{
   if(typeof data.response!=='string'||!data.response.trim()||data.response.length>4000)return error(400,'Reply must be 1-4000 characters');
   await env.DB.prepare('UPDATE inquiries SET response = ?, status = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(data.response.trim(),'replied',id).run();
  }
  return json({saved:true,id});
 }catch{return error(503,'Inbox temporarily unavailable')}
}