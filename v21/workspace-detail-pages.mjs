import {buildRoute} from './route-contract.mjs';

const labels={analytics_game:'作品分析總覽',analytics_version:'版本分析',analytics_players:'試玩次數',analytics_playtime:'平均遊玩時長',analytics_retention:'次日留存',analytics_intent:'Steam 意願',analytics_feedback:'版本回饋',work_publication:'作品發布記錄',work_preview:'本人版本預覽',admin_review_queue:'管理審核清單',admin_review_item:'審核案件',level:'等級與累積規則'};
export const WORKSPACE_DETAIL_IDS=Object.freeze(Object.keys(labels));
const metricNames=['players','playtime','retention','intent','feedback'];
const explanations={players:'試玩事件次數不是去重玩家人數；有效事件與重送去重契約待補。',playtime:'私人遊玩時長；背景掛機排除與計算契約待補，不公開個人時長。',retention:'私人次日留存；觀察期、時區與會員分母契約待補，匿名不跨日追蹤、不納入匿名 D1。',intent:'私人選填有／無／未定／不適用；分母僅有／無。這不是 Steam 真實願望清單數。',feedback:'同版本回饋；情感分類契約未定，不由星等擅推正負面比例。'};
const id=x=>typeof x==='string'&&x.length>0&&!/[\s/\\?#%\u0000-\u001f]/u.test(x);
const link=(label,routeId,params={})=>({label,routeId,params});
const disabled=label=>({label,disabled:true,notice:'安全服務與操作契約尚未開放'});
const identityOf=x=>({state:['unknown','error','anonymous','verified'].includes(x?.state)?x.state:'unknown',scopeKey:typeof x?.scopeKey==='string'?x.scopeKey:null,roles:Array.isArray(x?.roles)?x.roles:[],ownerGameIds:Array.isArray(x?.ownerGameIds)?x.ownerGameIds:null});
const ownerRoute=r=>r.startsWith('analytics_')||r.startsWith('work_');
const adminRoute=r=>r.startsWith('admin_');
function shell(route,p,i){
 let sections=[];
 if(route.startsWith('analytics_')){
  const metric=route.slice(10),names=metricNames.includes(metric)?[metric]:metricNames;
  sections=[{id:'scope',title:'私人作品／版本範圍',notice:'只查看目前作品；缺省版本不代表其他作品',context:{...p}},{id:'metrics',title:'指標說明',metrics:names.map(name=>({id:name,title:labels['analytics_'+name],notice:explanations[name],status:'contract_pending',value:null})),notice:'樣本門檻、保存期限與計算細節未定；未接服務不填 0 或假數字'}];
 }else if(route==='work_publication')sections=[{id:'publication',title:'審核與發布狀態',notice:'核准、實際發布與發布失敗分開；不以核准冒充上線',actions:[disabled('發布'),disabled('重新發布')]}];
 else if(route==='work_preview')sections=[{id:'preview',title:'本人受限預覽',notice:'管理可見性不授予公開資產執行權限',actions:[disabled('啟動版本預覽')]}];
 else if(route==='admin_review_queue')sections=[{id:'queue',title:'必要審核案件',notice:'只讀取審核所需範圍；不授予私人作品分析權限'}];
 else if(route==='admin_review_item')sections=[{id:'case',title:'選定案件',notice:'管理者可自審，仍需相同檢查與紀錄，不能自動免審'},{id:'decision',title:'檢查與決定',notice:'必要檢查、稽核欄位與寫入安全尚未定案',actions:[disabled('核准'),disabled('退回'),disabled('檢視發布結果：分頁契約待接入')]}];
 else sections=[{id:'level',title:'本人等級',notice:'等級規則尚未設計，不展示假等級或經驗值'},{id:'rules',title:'累積規則',notice:'門檻與計算方式尚未開放'}];
 return {routeId:route,title:labels[route]||'工作區',status:'loading',identityState:i.state,visibility:'private',returnTo:adminRoute(route)?'/me':ownerRoute(route)?'/creator':'/me',links:[link('返回帳號','account')],sections,items:[],record:null,notice:'',retryAvailable:false,fixtureLabel:''};
}
function gate(route,p,i,compiled,mode){
 const v=shell(route,p,i);let url;try{if(!labels[route])throw Error();url=buildRoute(route,p,compiled,{contextMode:mode});}catch{return {...v,status:'invalid',notice:'指定範圍無效，不更換作品、版本或稿件'};}
 if(i.state==='unknown'||i.state==='error')return {...v,status:'identity_'+i.state,notice:'身份尚未確認，不讀取私人內容',retryAvailable:true};
 if(i.state==='anonymous'){const auth={returnTo:url};try{buildRoute('auth',auth,compiled);}catch{delete auth.returnTo;}return {...v,status:'login_required',notice:'靜態展示不提供登入或此頁的私人服務',links:[link('登入','auth',auth),...v.links]};}
 if(!i.scopeKey)return {...v,status:'identity_error',notice:'身份尚未完成驗證',retryAvailable:true};
 if(adminRoute(route)&&!i.roles.includes('ADMIN'))return {...v,status:'no_admin',notice:'此內容目前無法使用'};
 if(ownerRoute(route)){
  if(!i.ownerGameIds)return {...v,status:'permission_unknown',notice:'作品歸屬尚未確認',retryAvailable:true};
  if(!i.ownerGameIds.includes(p.game_id))return {...v,status:'no_owner',notice:'此內容目前無法使用'};
 }return null;
}
const recordText=r=>Object.fromEntries(['id','title','status','updatedAt'].filter(k=>typeof r[k]==='string').map(k=>[k,r[k]]).concat([['fixture',r.fixture===true]]));
function sameContext(data,p,i){const c=data?.context;return data?.scopeKey===i.scopeKey&&c?.owned===true&&c.relationsVerified===true&&c.game_id===p.game_id&&(p.build===undefined?c.build_id===undefined:c.build_id===p.build)&&(p.submission===undefined?c.submission_id===undefined:c.submission_id===p.submission);}
function scopedRow(r,p,i){return r?.scopeKey===i.scopeKey&&r.owned===true&&r.game_id===p.game_id&&r.relationsVerified===true&&(p.build===undefined||r.build_id===p.build)&&(p.submission===undefined||r.submission_id===p.submission);}
export function projectWorkspaceDetailPage(route,p,rawIdentity,data,compiled,{contextMode='base_tab'}={}){
 const i=identityOf(rawIdentity),g=gate(route,p,i,compiled,contextMode);if(g)return g;const v=shell(route,p,i),unavailable=()=>({...v,status:'unavailable',notice:'此內容目前無法使用'});
 if(route==='level')return {...v,status:'disabled',notice:'等級與累積規則尚未開放'};
 if(data?.disabled===true)return {...v,status:'disabled',notice:'私人資料服務尚未接通'};
 if(data?.scopeKey!==i.scopeKey)return unavailable();
 if(ownerRoute(route)&&!sameContext(data,p,i))return unavailable();
 if(route.startsWith('analytics_')){
  const scope={game_id:p.game_id,...(p.build?{build:p.build}:{})};
  v.links.push(link('分析總覽',p.build?'analytics_version':'analytics_game',scope));
  for(const name of metricNames)if(name!=='feedback'||p.build)v.links.push(link(labels['analytics_'+name],'analytics_'+name,{...scope,tab:name}));
  if(route==='analytics_feedback')v.links.push(link('對照同版本','work_version',{game_id:p.game_id,build_id:p.build}));
  const allowed=['empty','insufficient_sample','immature','error','contract_pending'];
  const status=allowed.includes(data.availability)?data.availability:'contract_pending';
  for(const m of v.sections[1].metrics)m.status=status;
  v.status=status==='error'?'error':status==='empty'?'empty':'contract_pending';v.retryAvailable=status==='error';v.notice=status==='insufficient_sample'?'樣本不足':status==='immature'?'觀察期尚未成熟':status==='empty'?'尚無統計資料':'統計服務與計算契約尚待接通';
  if(route==='analytics_feedback'&&Array.isArray(data.discussions))v.items=data.discussions.filter(r=>scopedRow(r,p,i)&&r.visibility==='public'&&r.status==='published'&&id(r.id)).map(r=>({...recordText(r),links:[link('原始公開回饋','discussion',{discussion_id:r.id})]}));
 }else if(route==='work_preview'){
  const r=data.record;if(!scopedRow(r,p,i))return unavailable();v.record=recordText(r);v.status='disabled';v.notice='版本資料可讀；執行預覽尚未開放';v.links.push(link('返回原版本','work_version',{game_id:p.game_id,build_id:p.build}));
 }else if(route==='work_publication'){
  if(!Array.isArray(data.items))throw TypeError('Publication list required');
  v.items=data.items.filter(r=>scopedRow(r,p,i)&&id(r.submission_id)).map(r=>({...recordText(r),game_id:r.game_id,build_id:r.build_id,submission_id:r.submission_id,links:r.status==='published'&&r.publicVisible===true?[link('查看公開作品','game',{game_id:r.game_id})]:[]}));
  if((p.submission||contextMode==='notification_target')&&v.items.length!==1)return unavailable();
  v.status=v.items.length?'ready':'empty';v.links.push(link('返回作品管理','work',{game_id:p.game_id}));
 }else if(route==='admin_review_queue'){
  if(!Array.isArray(data.items))throw TypeError('Review queue required');
  v.items=data.items.filter(r=>r.scopeKey===i.scopeKey&&r.reviewReadable===true&&id(r.id)).map(r=>({...recordText(r),links:[link('查看案件','admin_review_item',{item:r.id})]}));v.status=v.items.length?'ready':'empty';
 }else{
  const r=data.record;if(!r||r.scopeKey!==i.scopeKey||r.reviewReadable!==true||r.id!==p.item)return unavailable();v.record=recordText(r);v.status='ready';v.links.push(link('返回審核清單','admin_review_queue'));
 }
 v.fixtureLabel=v.record?.fixture||v.items.some(r=>r.fixture)||data.fixture===true?'示範資料，非正式私人紀錄':'';
 return v;
}
export function createWorkspaceDetailPagesController({compiled,load,onChange=()=>{}}){
 let identity=identityOf(),current={routeId:'level',params:{},options:{}},view=shell('level',{},identity),generation=0,abort;
 const snapshot=()=>structuredClone(view),emit=v=>{view=v;onChange(snapshot());return snapshot();};
 async function open(routeId,params={},options={}){
  ++generation;abort?.abort();abort=new AbortController();const n=generation;current={routeId,params:structuredClone(params),options:{contextMode:options.contextMode==='notification_target'?'notification_target':'base_tab'}};
  const g=gate(routeId,current.params,identity,compiled,current.options.contextMode);if(g)return emit(g);
  if(routeId==='level'||typeof load!=='function')return emit(projectWorkspaceDetailPage(routeId,current.params,identity,{disabled:true},compiled,current.options));
  emit(shell(routeId,current.params,identity));
  try{const data=await load({routeId,params:structuredClone(current.params),contextMode:current.options.contextMode,scopeKey:identity.scopeKey,signal:abort.signal});if(n!==generation)return snapshot();return emit(projectWorkspaceDetailPage(routeId,current.params,identity,data,compiled,current.options));}
  catch{if(n!==generation)return snapshot();return emit({...shell(routeId,current.params,identity),status:'error',notice:'資料讀取失敗，請重試',retryAvailable:true});}
 }
 return {open,snapshot,setIdentity(next){identity=identityOf(next);return open(current.routeId,current.params,current.options);},retry(){return open(current.routeId,current.params,current.options);},refresh(){return open(current.routeId,current.params,current.options);},cancel(){++generation;abort?.abort();return emit({...shell(current.routeId,current.params,identity),status:'cancelled',notice:'已取消讀取'});}};
}
