/** Open Address MCP v2026-07-28 Streamable HTTP single-request JSON response.
 * Public tools only; no autonomous tasks, funds, shell, browser or privileged access.
 * POST only; no sessions or SSE stream. See modelcontextprotocol.io/specification/2026-07-28.
 */
const VERSION='2026-07-28';
const CONTENT='application/json; charset=utf-8';
const toolDefs=[
 {name:'get_contact',title:'Get open address correspondence details',description:'Read the published human-led correspondence boundaries, direct contact channels and endpoint. No private data.',annotations:{readOnlyHint:true,openWorldHint:false},inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'list_research',title:'List open address research',description:'Read public research article titles and links; these are independent commentary, not peer-reviewed works.',annotations:{readOnlyHint:true,openWorldHint:false},inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'submit_inquiry',title:'Send a message to baby',description:'Submit authorised text correspondence to a human steward for possible review. This is a real external write; no promise of a reply, funding or agreement. Do not send secrets or unapproved data. Limited to 64 accepted enquiries per day across the site.',annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:true},inputSchema:{type:'object',required:['sender','subject','message'],additionalProperties:false,properties:{sender:{type:'string',minLength:2,maxLength:100},sender_kind:{type:'string',enum:['agent','human','other','unspecified']},subject:{type:'string',minLength:4,maxLength:160},message:{type:'string',minLength:15,maxLength:4000},contact:{type:'string',maxLength:200}}}}
];
function rpc(id,result,status=200){return new Response(JSON.stringify({jsonrpc:'2.0',id,result}),{status,headers:{'Content-Type':CONTENT,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function fail(id,code,message,httpStatus=400){return new Response(JSON.stringify({jsonrpc:'2.0',id,error:{code,message}}),{status:httpStatus,headers:{'Content-Type':CONTENT,'Cache-Control':'no-store'}})}
const text=v=>({content:[{type:'text',text:typeof v==='string'?v:JSON.stringify(v)}],isError:false});
export async function mcpRequest(req,env,ctx,{handleInquiry,journal,siteOrigin}){
 if(req.method!=='POST')return fail(null,-32600,'MCP uses POST',405);
 const origin=req.headers.get('Origin');if(origin&&origin!==siteOrigin)return fail(null,-32600,'Untrusted Origin',403);
 const version=req.headers.get('MCP-Protocol-Version');if(version!==VERSION)return fail(null,-32600,'Supported protocol version: '+VERSION,400);
 const accept=req.headers.get('Accept')||'';if(!accept.includes('application/json')||!accept.includes('text/event-stream'))return fail(null,-32600,'Accept must include application/json and text/event-stream',406);
 if(!req.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return fail(null,-32600,'JSON required',415);
 if(Number(req.headers.get('Content-Length')||0)>8192)return fail(null,-32600,'Request too large',413);
 let payload;try{const body=await req.text();if(body.length>8192)return fail(null,-32600,'Request too large',413);payload=JSON.parse(body)}catch{return fail(null,-32700,'Invalid JSON',400)}
 if(!payload||typeof payload!=='object'||Array.isArray(payload)||payload.jsonrpc!=='2.0'||typeof payload.method!=='string')return fail(null,-32600,'Invalid JSON-RPC request');
 const id=Object.hasOwn(payload,'id')?payload.id:null;
 const params=payload.params||{},method=payload.method,meta=params._meta||{};
 if(req.headers.get('Mcp-Method')!==method||meta['io.modelcontextprotocol/protocolVersion']!==VERSION)return fail(id,-32020,'HeaderMismatch: method/protocol metadata must match');
 if(method==='tools/call'&&req.headers.get('Mcp-Name')!==params.name)return fail(id,-32020,'HeaderMismatch: tool name must match');
 if(id===null)return new Response(null,{status:202,headers:{'Cache-Control':'no-store'}});
 if(method==='initialize')return rpc(id,{protocolVersion:VERSION,capabilities:{tools:{listChanged:false}},serverInfo:{name:'open-address',title:'open address · contact a human',version:'0.1.0'},instructions:'Human-stewarded correspondence by baby. This server only provides public research information and an opt-in human message tool. Do not send credentials, private records, or tasks outside operator permissions. Submission does not guarantee human response.'});
 if(method==='ping')return rpc(id,{});
 if(method==='tools/list')return rpc(id,{tools:toolDefs});
 if(method!=='tools/call')return fail(id,-32601,'Method not found',404);
 if(!toolDefs.some(t=>t.name===params.name))return fail(id,-32602,'Unknown tool');
 const args=params.arguments||{};if(!args||typeof args!=='object'||Array.isArray(args))return fail(id,-32602,'Invalid arguments');
 if(params.name==='get_contact')return rpc(id,text({project:'open address',human:'baby',assistant:'edward (AI-assisted research, not autonomous operator)',website:siteOrigin,email:'baby@open-address.org',contact:siteOrigin+'/contact',api:siteOrigin+'/openapi.json',journal:siteOrigin+'/journal',limits:{project_accepted_daily:64,per_sender_accepted_daily:8},disclaimer:'Human review only. No guarantee of response, contractual acceptance, AI autonomy or confidentiality.'}));
 if(params.name==='list_research')return rpc(id,text({articles:journal.map(a=>({title:a.title,category:a.category,url:siteOrigin+'/journal/'+a.slug,markdown:siteOrigin+'/journal/'+a.slug+'.md',date:a.date}))}));
 // Reuse the same bounded, D1-capped submission pathway as the public REST API.
 for(const f of ['sender','subject','message'])if(typeof args[f]!=='string')return fail(id,-32602,'Invalid or missing '+f);
 if(JSON.stringify(args).length>7100)return fail(id,-32602,'Message too large');
 const headers=new Headers({'Content-Type':'application/json'});
 for(const h of ['cf-connecting-ip','user-agent'])if(req.headers.get(h))headers.set(h,req.headers.get(h));
 const synthetic=new Request(siteOrigin+'/api/inquiries',{method:'POST',headers,body:JSON.stringify(args)});
 const accepted=await handleInquiry(synthetic,env,ctx);
 const result=await accepted.json();
 if(!accepted.ok)return rpc(id,{content:[{type:'text',text:'Submission not accepted: '+(result.error||'unavailable')}],isError:true});
 return rpc(id,text({accepted:true,id:result.id,receipt_token:result.receipt_token,status_url:siteOrigin+result.status_url,warning:'Keep receipt_token private. It can be used to check reply status or delete this message. No response is guaranteed.'}));
}