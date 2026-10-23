import {buildRoute} from './route-contract.mjs';

const titles={creator:'創作者工作台',creator_intro:'成為創作者',creator_apply:'創作者資格申請',works:'我的作品',work:'作品管理',work_version:'版本管理',submission:'作品投稿',submission_status:'投稿進度',analytics:'作品分析',revenue:'收益說明'};
export const CREATOR_PAGE_IDS=Object.freeze(Object.keys(titles));
const link=(label,routeId,params={})=>({label,routeId,params});
const validId=x=>typeof x==='string'&&x.length>0&&!/[\s/\\?#%\u0000-\u001f]/u.test(x);
const cleanIdentity=i=>({state:['unknown','error','anonymous','verified'].includes(i?.state)?i.state:'unknown',scopeKey:typeof i?.scopeKey==='string'?i.scopeKey:null,roles:Array.isArray(i?.roles)?i.roles:[]});
const privateRow=(r,i)=>r?.owned===true&&r.scopeKey===i.scopeKey;
const pick=(r,keys)=>Object.fromEntries(keys.filter(k=>typeof r[k]==='string').map(k=>[k,r[k]]));
const disabled=label=>({label,disabled:true,reason:'尚未接通安全服務，不會提交或執行'});
function sections(route){
 const map={
  creator:[{id:'workspace',title:'工作入口',links:[link('管理作品','works'),link('作品分析','analytics'),link('收益說明','revenue')]},{id:'submissions',title:'投稿與審核',links:[link('查看投稿入口','submission')],notice:'私人資料只在工作台查閱，不在公開首頁顯示'}],
  creator_intro:[{id:'intro',title:'資格與流程',notice:'資格申請與作品投稿分開處理；正式申請服務尚未開放',links:[link('查看申請入口','creator_apply'),link('投稿相關政策','policies',{tab:'policies',section:'submission'})]}],
  creator_apply:[{id:'application',title:'資格申請資料',notice:'只展示入口與既有狀態，不收取或提交申請',actions:[disabled('提交資格申請')]}],
  works:[{id:'library',title:'本人作品',links:[link('查看新作品投稿','submission')],notice:'私有管理入口不授予公開試玩權限'}],
  work:[{id:'metadata',title:'作品基本資料',actions:[disabled('儲存作品資料')]},{id:'versions',title:'版本與發布',notice:'核准與實際發布是不同狀態'}],
  work_version:[{id:'version',title:'版本資訊',actions:[disabled('更新版本'),disabled('執行預覽')]},{id:'availability',title:'停止與恢復',notice:'停止新試玩須安全服務支援；恢復公開須重新審核',actions:[disabled('停止新試玩'),disabled('申請恢復公開')]}],
  submission:[{id:'materials',title:'作品與版本材料',notice:'格式、隔離與資產檢查契約尚待完成',actions:[disabled('上傳遊戲'),disabled('提交投稿')]}],
  submission_status:[{id:'progress',title:'本人投稿進度',notice:'僅依已查驗的投稿記錄顯示狀態'},{id:'correction',title:'補件來源',notice:'保留原申請、草稿或版本，不另建副本',actions:[disabled('送出補件')]}],
  analytics:[{id:'selection',title:'選擇本人作品',notice:'依作品進入私人分析，不跨作品合算'},{id:'definitions',title:'統計界線',notice:'有效事件、觀察期、樣本門檻與時區契約尚待補齊；沒有資料不顯示 0。新五維與舊七維分開。Steam 意願為私人選填，分母只包含有／無，並非真實願望清單數。'}],
  revenue:[{id:'rules',title:'收益規則',notice:'商業、結算與資格契約尚未定案，不展示假收入'},{id:'settlement',title:'結算與提領',notice:'金流服務未開放，不收帳戶資料',actions:[disabled('設定收款帳戶'),disabled('申請提領')]}]
 };return structuredClone(map[route]||[]);
}
function shell(route,identity){return {routeId:route,title:titles[route]||'創作者中心',status:'loading',identityState:identity.state,returnTo:route==='creator_intro'?'/me':'/creator',links:[link('返回帳號','account'),link('創作者說明','creator_intro')],sections:sections(route),items:[],record:null,notice:'',retryAvailable:false,fixtureLabel:''};}
function gate(route,params,identity,compiled){
 const v=shell(route,identity);let url;
 try{if(!titles[route])throw Error();url=buildRoute(route,params,compiled);}catch{return {...v,status:'invalid',notice:'路由或來源識別無效'};}
 if(route==='creator_intro')return {...v,status:'ready'};
 if(['unknown','error'].includes(identity.state))return {...v,status:identity.state==='unknown'?'identity_unknown':'identity_error',notice:identity.state==='unknown'?'正在確認登入狀態':'登入狀態確認失敗',retryAvailable:true};
 if(identity.state==='anonymous'){
  const auth={returnTo:url};try{buildRoute('auth',auth,compiled);}catch{delete auth.returnTo;}
  return {...v,status:'login_required',notice:'登入後才能讀取本人資料',links:[link('登入','auth',auth),...v.links]};
 }
 if(!identity.scopeKey)return {...v,status:'identity_error',notice:'身份尚未完成驗證',retryAvailable:true};
 if(!['creator_apply','submission_status'].includes(route)&&!identity.roles.includes('CREATOR'))return {...v,status:'no_role',notice:'尚未確認創作者資格；可查看資格說明及本人申請',links:[link('資格與申請說明','creator_intro'),link('資格申請入口','creator_apply'),link('返回帳號','account')]};
 return null;
}

export function correctionLink(r){
 if(r?.canCorrect!==true||!validId(r.id)||r.relationsVerified!==true)return null;
 const carry=pick(r,['application_id','draft_id','game_id','build_id','revision_id']);carry.submission_id=r.id;
 let dest=null;
 if(r.kind==='qualification'&&validId(r.application_id))dest=link('查看原資格申請','creator_apply',{application:r.application_id});
 if(r.kind==='new_game'&&validId(r.draft_id))dest=link('查看原作品草稿','submission',{draft:r.draft_id});
 if(r.kind==='new_build'&&validId(r.game_id)&&validId(r.build_id)&&(r.draft_id===undefined||validId(r.draft_id)))dest=link('查看原版本','work_version',{game_id:r.game_id,build_id:r.build_id});
 return dest?{...dest,carry}:null;
}
export function projectCreatorPage(route,params,rawIdentity,data,compiled){
 const identity=cleanIdentity(rawIdentity),g=gate(route,params,identity,compiled);if(g)return g;
 const v=shell(route,identity);
 if(route==='revenue')return {...v,status:'disabled',notice:'收益與金流尚未開放'};
 if((route==='submission'&&!params.draft)||(route==='creator_apply'&&!params.application))return {...v,status:'disabled',notice:'申請與投稿服務尚未開放；未建立任何新資料'};
 if(data?.disabled===true)return {...v,status:'disabled',notice:'本人資料服務尚未接通'};
 if(data?.scopeKey!==identity.scopeKey)return {...v,status:'unavailable',notice:'此內容目前無法使用'};
 if(['work','work_version','submission_status','creator_apply','submission'].includes(route)){
  const r=data.record;const expected=route==='work'?params.game_id:route==='work_version'?params.build_id:route==='submission_status'?params.submission_id:route==='creator_apply'?params.application:params.draft;
  if(!privateRow(r,identity)||r.id!==expected||(route==='work_version'&&(r.game_id!==params.game_id||r.relationsVerified!==true)))return {...v,status:'unavailable',notice:'此內容目前無法使用'};
  v.record={...pick(r,['id','title','status','updatedAt']),fixture:r.fixture===true};v.status='ready';
  if(route==='submission_status'){const correction=correctionLink(r);if(correction)v.sections[1].links=[correction];}
  if(route==='work'){
   v.sections[1].links=[link('發布記錄','work_publication',{game_id:r.id,tab:'publication'})];
   if(r.publicVisible===true&&r.status==='published')v.links.push(link('查看公開作品','game',{game_id:r.id}));
  }
  if(route==='work_version')v.links.push(link('返回作品','work',{game_id:params.game_id}));
 }else{
  if(!Array.isArray(data.items))throw TypeError('Expected owned list');
  v.items=data.items.filter(r=>privateRow(r,identity)&&validId(r.id)).map(r=>{
   const result={...pick(r,['id','title','status']),fixture:r.fixture===true,links:[]};
   if(route==='analytics')result.links=[link('查看作品分析','analytics_game',{game_id:r.id})];
   else if(route==='works')result.links=[link('管理作品','work',{game_id:r.id})];
   else if(route==='creator'&&r.kind==='submission')result.links=[link('查看投稿進度','submission_status',{submission_id:r.id,tab:'status'})];
   else if(route==='creator'&&r.kind==='game')result.links=[link('管理作品','work',{game_id:r.id})];
   return result;
  });
  v.status=v.items.length?'ready':'empty';if(!v.items.length)v.notice='目前沒有可讀取的本人記錄';
 }
 v.fixtureLabel=v.record?.fixture||v.items.some(r=>r.fixture)?'示範資料，非本人正式紀錄':'';
 return v;
}
export function createCreatorPagesController({compiled,load,onChange=()=>{}}){
 let identity=cleanIdentity(),current={routeId:'creator',params:{}},view=shell('creator',identity),generation=0,abort;
 const snapshot=()=>structuredClone(view),emit=v=>{view=v;onChange(snapshot());return snapshot();};
 async function open(routeId,params={}){
  ++generation;abort?.abort();abort=new AbortController();const n=generation;current={routeId,params:structuredClone(params)};
  const g=gate(routeId,current.params,identity,compiled);if(g)return emit(g);
  const local=routeId==='revenue'||(routeId==='submission'&&!params.draft)||(routeId==='creator_apply'&&!params.application);
  if(local||typeof load!=='function')return emit(projectCreatorPage(routeId,current.params,identity,{disabled:true},compiled));
  emit(shell(routeId,identity));
  try{const data=await load({routeId,params:structuredClone(current.params),scopeKey:identity.scopeKey,signal:abort.signal});if(n!==generation)return snapshot();return emit(projectCreatorPage(routeId,current.params,identity,data,compiled));}
  catch{if(n!==generation)return snapshot();return emit({...shell(routeId,identity),status:'error',notice:'讀取失敗，請重試',retryAvailable:true});}
 }
 return {open,snapshot,setIdentity(value){identity=cleanIdentity(value);return open(current.routeId,current.params);},retry(){return open(current.routeId,current.params);},refresh(){return open(current.routeId,current.params);},cancel(){++generation;abort?.abort();return emit({...shell(current.routeId,identity),status:'cancelled',notice:'已取消讀取'});}};
}
