const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const problem=(code,key)=>({code,key});
const validText=v=>typeof v==='string'&&v.trim().length>0&&!/[\u0000-\u001f\u007f\\]/u.test(v);
const validSegment=v=>validText(v)&&!/[/?#%]/u.test(v)&&v!=='.'&&v!=='..';

export function compileRoutes(manifest,displayMap){
 if(!Array.isArray(manifest?.routes)||!displayMap)throw TypeError('Manifest and display map required');
 const byId=new Map();
 const routes=manifest.routes.map((contract,index)=>{
  if(byId.has(contract.id)||!displayMap[contract.id])throw TypeError('Duplicate or unmapped route');
  const [path,query='']=contract.route.split('?');
  const segments=path==='/'?[]:path.slice(1).split('/');
  const templates=Object.fromEntries(new URLSearchParams(query));
  const fixed=Object.fromEntries(Object.entries(templates).filter(([,v])=>!v.startsWith(':')));
  const r={id:contract.id,displayId:displayMap[contract.id],contract:structuredClone(contract),segments,templates,fixed,index};
  byId.set(r.id,r);return r;
 });
 return {version:manifest.version,routes,byId,returnIds:new Set((manifest.return_to_allowlist||[]).map(r=>r.id))};
}

function parseLocal(input){
 if(typeof input!=='string'||!input.startsWith('/')||input.startsWith('//')||/[\u0000-\u0020\u007f\\#]/u.test(input))return null;
 let decoded;try{decoded=decodeURIComponent(input);}catch{return null;}
 if(/[\u0000-\u001f\u007f\\]/u.test(decoded))return null;
 const rawPath=input.split('?')[0];
 let segments;try{segments=rawPath==='/'?[]:rawPath.slice(1).split('/').map(decodeURIComponent);}catch{return null;}
 if(segments.some(s=>!validSegment(s)))return null;
 const url=new URL(input,'https://route.invalid');
 if(url.origin!=='https://route.invalid'||url.pathname!==rawPath)return null;
 return {segments,url};
}

function validate(r,params,compiled,options={}){
 const errors=[],pending=[];const allowed=new Set(r.contract.parameters.map(p=>p.name));
 for(const k of Object.keys(params))if(!allowed.has(k))errors.push(problem('unknown_parameter',k));
 for(const p of r.contract.parameters){
  const has=own(params,p.name),v=params[p.name];
  if(!has){if(p.required)errors.push(problem('missing',p.name));continue;}
  if(!validText(v)){errors.push(problem('invalid',p.name));continue;}
  if(p.location==='path'&&!validSegment(v))errors.push(problem('invalid_segment',p.name));
  if(p.name==='page'&&(!/^[1-9]\d*$/.test(v)||!Number.isSafeInteger(Number(v))))errors.push(problem('invalid_page',p.name));
  if(['category','tag','sort'].includes(p.name)){
   const values=options.dictionaries?.[p.name];
   if(!values)pending.push(p.name);else if(!values.includes(v))errors.push(problem('unknown_value',p.name));
  }
 }
 for(const [k,v]of Object.entries(r.fixed))if(params[k]!==v)errors.push(problem('invalid_fixed',k));
 const enums={state:['draft','private_saved','pending','published','rejected'],section:['terms','privacy','community','submission'],type:['discussion','bug']};
 for(const [key,values]of Object.entries(enums))if(own(params,key)&&!values.includes(params[key]))errors.push(problem('unknown_value',key));
 if(r.id==='submission_status'&&own(params,'tab')&&params.tab!=='status')errors.push(problem('unknown_value','tab'));
 if(r.id==='creator_public'&&own(params,'tab'))pending.push('tab');
 if(r.id==='community'&&params.build&&!params.game)errors.push(problem('missing','game'));
 if(r.id==='work_publication'&&options.contextMode==='notification_target')for(const k of ['build','submission'])if(!params[k])errors.push(problem('missing',k));
 if(own(params,'returnTo')){
  const target=resolveRoute(params.returnTo,compiled,{...options,returnValidation:true});
  if(options.returnValidation||!target.ok||!compiled.returnIds.has(target.id))errors.push(problem('unsafe_return','returnTo'));
 }
 if(own(params,'intent'))pending.push('intent');
 const resourceKeys=r.contract.parameters.filter(p=>own(params,p.name)&&(/_id$/.test(p.name)||['game','build','draft','application','submission','item','reply','version'].includes(p.name))).map(p=>p.name);
 return {errors,pending,resourceKeys};
}

export function resolveRoute(input,compiled,options={}){
 const parsed=parseLocal(input);if(!parsed)return {ok:false,id:null,displayId:null,params:{},errors:[problem('invalid_url','url')]};
 const {segments,url}=parsed;const query=Object.fromEntries(url.searchParams);
 const duplicate=[...new Set([...url.searchParams.keys()].filter(k=>url.searchParams.getAll(k).length>1))];
 const paths=compiled.routes.filter(r=>r.segments.length===segments.length&&r.segments.every((s,i)=>s.startsWith(':')||s===segments[i]));
 const candidates=paths.filter(r=>Object.entries(r.fixed).every(([k,v])=>query[k]===v)).map(r=>({r,score:r.segments.filter(s=>!s.startsWith(':')).length*100+Object.keys(r.fixed).length*20+Object.keys(r.templates).filter(k=>!own(r.fixed,k)&&own(query,k)).length})).sort((a,b)=>b.score-a.score||a.r.index-b.r.index);
 if(!candidates.length)return {ok:false,id:null,displayId:null,params:query,errors:[problem('not_found','route')]};
 const r=candidates[0].r;const params={...query};r.segments.forEach((s,i)=>{if(s.startsWith(':'))params[s.slice(1)]=segments[i];});
 const v=validate(r,params,compiled,options);v.errors.push(...duplicate.map(k=>problem('duplicate_parameter',k)));
 for(const p of r.contract.parameters)if(p.location==='path'&&own(query,p.name))v.errors.push(problem('wrong_location',p.name));
 return {ok:v.errors.length===0,id:r.id,displayId:r.displayId,params,errors:v.errors,contract:r.contract,needsDictionaryValidation:v.pending,requiresResourceValidation:v.resourceKeys.length>0,resourceKeys:v.resourceKeys};
}

export function buildRoute(id,params={},compiled,options={}){
 const r=compiled.byId.get(id);if(!r)throw TypeError('Unknown route');
 const values={...params};for(const [k,v]of Object.entries(r.fixed)){if(own(values,k)&&values[k]!==v)throw TypeError('Conflicting fixed parameter');values[k]=v;}
 const v=validate(r,values,compiled,options);if(v.errors.length)throw Object.assign(TypeError('Invalid route parameters'),{errors:v.errors});
 for(const [key,val]of Object.entries(r.templates))if(val.startsWith(':')&&!own(values,key)&&r.id!=='work_publication')throw TypeError('Missing route selector');
 const path='/'+r.segments.map(s=>s.startsWith(':')?encodeURIComponent(values[s.slice(1)]):s).join('/');
 const query=new URLSearchParams();for(const p of r.contract.parameters)if(p.location==='query'&&own(values,p.name))query.set(p.name,values[p.name]);
 return path+(query.size?'?'+query:'');
}
export function routeAccess(result,identity={status:'unknown'}){
 if(!result.ok)return 'invalid';
 const role=result.contract.role;if(role==='ALL')return 'public';
 if(!['authenticated','anonymous'].includes(identity.status))return 'identity-pending';
 if(role==='GUEST')return identity.status==='anonymous'?'guest':'already-signed-in';
 if(identity.status==='anonymous')return 'sign-in-required';
 if(role==='MEMBER')return 'member';
 return 'permission-pending';
}
