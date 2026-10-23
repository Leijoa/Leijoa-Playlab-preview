
const routes={community:['社群','/'],topics:['話題','/community'],topic:['話題','/community/topics'],discussion:['討論','/community'],announcement:['公告','/'],help:['使用說明','/'],platform_info:['關於平台','/'],policies:['平台政策','/about']};
const sections=['terms','privacy','community','submission'];
const idKey={topic:'topic_id',discussion:'discussion_id',announcement:'message_id'};
const validId=x=>typeof x==='string'&&x.length>0&&!/[\s/\\?#\u0000-\u001f]/u.test(x);
const isPublic=r=>r?.status==='published'&&r.visibility==='public';
const base=(routeId,status='loading')=>({routeId,status,title:routes[routeId]?.[0]||'內容',returnTo:routes[routeId]?.[1]||'/',items:[],record:null,notice:'',retryAvailable:false,fixture:false,fixtureLabel:''});
const textRecord=r=>Object.fromEntries(['id','title','body','publicAuthor','publishedAt','game','build','version'].filter(k=>typeof r[k]==='string').map(k=>[k,r[k]]).concat([['fixture',r.fixture===true],['fixtureLabel',r.fixture===true?'示範資料，非正式內容':'']]));
function invalid(routeId,params,scope){
 if(!routes[routeId])return true;
 if(idKey[routeId]&&!validId(params[idKey[routeId]]))return true;
 if(routeId==='community'&&(params.game!==undefined||params.build!==undefined)){
  if(!validId(params.game)||(params.build!==undefined&&!validId(params.build)))return true;
  if(scope({game:params.game,build:params.build})!==true)return true;
 }
 return routeId==='policies'&&params.tab!=='policies';
}

export function projectPublicPage(routeId,params={},data={},context={}){
 const v=base(routeId), unavailable=()=>({...v,status:'unavailable',notice:'內容不可用'});
 if(invalid(routeId,params,()=>context.scopeValid===true))return {...unavailable(),notice:routeId==='community'?'篩選不可用，請清除或修正篩選':'內容不可用'};
 if(data?.disabled===true)return {...v,status:'disabled',notice:'此功能尚未開放'};
 if(routeId==='policies')return {...v,status:'placeholder',section:sections.includes(params.section)?params.section:null,notice:params.section&&!sections.includes(params.section)?'指定分區無法定位；政策內容尚未核定':'政策內容尚未核定'};
 if(!data||typeof data!=='object')throw TypeError('Invalid content response');
 if(idKey[routeId]){
  const r=data.record;
  if(!r||r.id!==params[idKey[routeId]])return unavailable();
  if(routeId==='announcement'){
   const start=Date.parse(r.startsAt),end=Date.parse(r.endsAt),now=context.now??Date.now();
   if(r.status!=='published'||!Number.isFinite(start)||!Number.isFinite(end)||start>end||now<start||now>=end||(params.version!==undefined&&params.version!==r.version))return unavailable();
   if(r.audience==='members'&&r.visibility==='members'){
    if(context.auth!=='authenticated')return {...unavailable(),status:context.auth==='anonymous'?'login_required':'auth_unknown',notice:context.auth==='anonymous'?'此公告需要登入':'正在確認登入狀態',retryAvailable:context.auth!=='anonymous'};
   }else if(r.audience!=='public'||!isPublic(r))return unavailable();
  }else if(!isPublic(r))return unavailable();
  v.record=textRecord(r);v.status='ready';
  if(routeId!=='announcement'){
   if(data.items!==undefined&&!Array.isArray(data.items))throw TypeError('Invalid child list');
   const key=routeId==='topic'?'topic_id':'discussion_id';
   v.items=(data.items||[]).filter(x=>isPublic(x)&&x[key]===r.id).map(textRecord);
   v.detailsEmpty=v.items.length===0;
   if(routeId==='discussion'&&params.reply!==undefined){
    v.focusReply=v.items.some(x=>x.id===params.reply)?params.reply:null;
    if(!v.focusReply)v.notice='指定回覆不可用';
   }
  }
 }else{
  if(!Array.isArray(data.items))throw TypeError('Content list required');
  v.items=data.items.filter(r=>isPublic(r)&&(!params.game||r.game===params.game)&&(!params.build||r.build===params.build)).map(textRecord);
  v.status=v.items.length?'ready':'empty';if(!v.items.length)v.notice='目前沒有可公開的內容';
 }
 v.fixture=v.record?.fixture===true||v.items.some(r=>r.fixture);v.fixtureLabel=v.fixture?'示範資料，非正式內容':'';
 return v;
}

export function createPublicPagesController({load,validateScope=()=>false,now=Date.now,onChange=()=>{}}){
 if(typeof load!=='function')throw TypeError('load adapter required');
 let state=base('community','idle'),generation=0,abort,last=null;
 const snapshot=()=>structuredClone(state);
 const emit=s=>{state=s;onChange(snapshot());return snapshot();};
 async function open(routeId,params={},context={}){
  const n=++generation;abort?.abort();abort=new AbortController();
  params=structuredClone(params);context={auth:context.auth||'unknown'};last={routeId,params,context};
  let scopeValid=false;
  try{scopeValid=routeId!=='community'||(!params.game&&!params.build)||validateScope({game:params.game,build:params.build})===true;}catch{}
  if(invalid(routeId,params,()=>scopeValid))return emit({...base(routeId,'unavailable'),notice:'內容或篩選不可用'});
  emit(base(routeId));
  try{
   const data=routeId==='policies'?{}:await load({routeId,params:structuredClone(params),signal:abort.signal,auth:context.auth});
   if(n!==generation)return snapshot();
   return emit(projectPublicPage(routeId,params,data,{...context,scopeValid,now:now()}));
  }catch{
   if(n!==generation)return snapshot();
   return emit({...base(routeId,'error'),notice:'內容讀取失敗，請重試',retryAvailable:true});
  }
 }
 return {open,snapshot,retry:()=>last?open(last.routeId,last.params,last.context):Promise.resolve(snapshot()),refresh:()=>last?open(last.routeId,last.params,last.context):Promise.resolve(snapshot()),cancel(){++generation;abort?.abort();last=null;return emit({...base(state.routeId,'cancelled'),notice:'已取消讀取'});}};
}
