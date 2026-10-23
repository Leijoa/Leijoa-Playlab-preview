
const meta={account:['我的帳號','/me'],settings:['設定','/settings'],notifications:['通知','/notifications'],my_reviews:['我的評測','/me/reviews']};
const states=['draft','private_saved','pending','published','rejected'];
const id=x=>typeof x==='string'&&x.length>0&&!/[\s/\\?#%\u0000-\u001f]/u.test(x);
const link=(label,routeId,params={})=>({label,routeId,params});
const support=()=>[link('使用說明','help'),link('關於平台','platform_info'),link('條款與隱私','policies',{tab:'policies'})];
const cleanIdentity=value=>({state:['unknown','error','anonymous','verified'].includes(value?.state)?value.state:'unknown',scopeKey:typeof value?.scopeKey==='string'?value.scopeKey:null,roles:Array.isArray(value?.roles)?value.roles.filter(r=>r==='ADMIN'||r==='CREATOR'):[]});
function shell(routeId,identity){
 return {routeId,title:meta[routeId]?.[0]||'帳號',status:'loading',identityState:identity.state,returnTo:routeId==='account'?'/':'/me',notice:'',retryAvailable:false,links:support(),sections:[],items:[],fixtureLabel:'',navigation:null};
}
function gate(routeId,identity,params){
 const v=shell(routeId,identity);
 if(!meta[routeId]||Object.keys(params).some(k=>routeId!=='my_reviews'||k!=='state')||(params.state!==undefined&&!states.includes(params.state)))return {...v,status:'invalid',notice:'頁面或篩選不可用',links:[link('返回我的評測','my_reviews'),...support()]};
 if(identity.state==='unknown'||identity.state==='error')return {...v,status:identity.state==='unknown'?'identity_unknown':'identity_error',notice:identity.state==='unknown'?'正在確認登入狀態':'登入狀態確認失敗，請重試',retryAvailable:true};
 if(identity.state==='anonymous')return {...v,status:routeId==='account'?'public':'login_required',notice:routeId==='account'?'靜態展示不提供登入、本人評測或通知資料':'靜態展示不提供登入或本人資料',links:[link('登入','auth',{returnTo:meta[routeId][1]+(routeId==='my_reviews'&&params.state?'?state='+encodeURIComponent(params.state):'')}),...support()]};
 if(!identity.scopeKey)return {...v,status:'identity_error',notice:'登入狀態尚未完成驗證',retryAvailable:true};
 return null;
}
const fields=(r,keys)=>Object.fromEntries(keys.filter(k=>typeof r[k]==='string').map(k=>[k,r[k]]));

export function projectAccountPage(routeId,params={},rawIdentity={},data={},preferences={}){
 const identity=cleanIdentity(rawIdentity),g=gate(routeId,identity,params);if(g)return g;
 const v=shell(routeId,identity);
 if(routeId==='account'){
  v.status='ready';v.notice='已確認登入';
  v.sections=[{id:'activity',title:'我的活動',links:[link('我的評測','my_reviews'),link('試玩紀錄','play_history'),link('通知','notifications')]},{id:'workspace',title:'工作區',links:[link('創作者中心','creator'),...(identity.roles.includes('ADMIN')?[link('管理審核','admin_review_queue')]:[])]},{id:'preferences',title:'偏好與支援',links:[link('設定','settings'),...support()]}];
  return v;
 }
 if(routeId==='settings'){
  v.status='ready';v.notice='介面偏好僅用於本次記憶體預覽，不會保存至帳號';
  v.sections=[{id:'appearance',title:'介面預覽',controls:[{key:'reduceMotion',label:'減少動態效果（預覽）',type:'boolean',value:preferences.reduceMotion===true}]},{id:'account_settings',title:'帳號設定',disabled:true,notice:'帳號設定服務尚未接通；登入保存與安全設定不在此修改'}];
  return v;
 }
 if(data?.disabled===true)return {...v,status:'disabled',notice:'本人資料服務尚未接通'};
 if(!data||data.scopeKey!==identity.scopeKey)return {...v,status:'unavailable',notice:'此內容目前無法使用'};
 if(!Array.isArray(data.items))throw TypeError('Expected owned item list');
 const rows=data.items.filter(r=>r?.owned===true&&id(r.id));
 if(routeId==='notifications'){
  v.sections=[{id:'inbox',title:'本人通知',notice:'點選時重新確認目標是否仍可用；不會自動標為已讀'}];
  v.items=rows.map(r=>({...fields(r,['id','title','summary','createdAt']),fixture:r.fixture===true,action:{type:'open_notification',notificationId:r.id}}));
 }else{
  v.sections=[{id:'filters',title:'評測狀態',options:['all',...states],selected:params.state||'all'},{id:'reviews',title:'本人評測',notice:'公開評測與草稿分開顯示；此頁不新增或修改評分'}];
  v.items=rows.filter(r=>states.includes(r.state)&&(!params.state||r.state===params.state)).map(r=>{
   const links=[];
   if(r.state==='published'&&r.publicVisible===true&&id(r.game_id))links.push(link('閱讀公開評測','public_review',{game_id:r.game_id,review_id:r.id}));
   if(r.editable===true&&r.buildBelongsToGame===true&&id(r.game_id)&&id(r.build_id))links.push(link('編輯評測','review_editor',{game_id:r.game_id,build:r.build_id}));
   return {...fields(r,['id','title','state','updatedAt']),fixture:r.fixture===true,links,notice:links.length?'':'此記錄目前沒有可用操作'};
  });
 }
 v.status=v.items.length?'ready':'empty';v.notice=v.items.length?'':'目前沒有符合條件的本人資料';
 v.fixtureLabel=v.items.some(r=>r.fixture)?'示範資料，非本人正式紀錄':'';return v;
}

