import {buildRoute} from './route-contract.mjs';

const link=(label,routeId,params={})=>({label,routeId,params});
const id=x=>typeof x==='string'&&x.length>0&&!/[\s/\\?#%\u0000-\u001f]/u.test(x);
const identityOf=x=>({state:['unknown','error','anonymous','verified'].includes(x?.state)?x.state:'unknown',scopeKey:typeof x?.scopeKey==='string'?x.scopeKey:null});
const owned=(r,i)=>r?.owned===true&&r.scopeKey===i.scopeKey;
const meta={play_history:['我的試玩紀錄','/me/history'],profile:['本人個人資料','/me/profile']};
function shell(route,i){return {routeId:route,title:meta[route]?.[0]||'會員資料',identityState:i.state,status:'loading',returnTo:'/me',links:[link('返回帳號','account'),link('個人設定','settings')],sections:route==='profile'?[{id:'public',title:'公開檔案欄位',fields:[]},{id:'private',title:'私人帳戶欄位',fields:[]}]:[{id:'history',title:'本人試玩紀錄',notice:'保留當時作品與版本；再次遊玩前重新確認，不自動啟動'}],items:[],notice:'',retryAvailable:false,draft:{},dirty:false,saveState:'disabled',navigation:null,fixtureLabel:''};}
function gate(route,params,i,compiled){
 const v=shell(route,i);try{if(!meta[route])throw Error();buildRoute(route,params,compiled);}catch{return {...v,status:'invalid',notice:'不接受變更資料主體或其他參數'};}
 if(i.state==='unknown'||i.state==='error')return {...v,status:i.state==='unknown'?'identity_unknown':'identity_error',notice:i.state==='unknown'?'正在確認登入狀態':'登入狀態確認失敗',retryAvailable:true};
 if(i.state==='anonymous')return {...v,status:'login_required',notice:'靜態展示不提供登入或本人資料',links:[link('登入','auth',{returnTo:meta[route][1]}),...v.links]};
 if(!i.scopeKey)return {...v,status:'identity_error',notice:'身份驗證尚未完成',retryAvailable:true};return null;
}
function schema(contract){
 if(!contract||!id(contract.version)||!Array.isArray(contract.fields))return [];
 const seen=new Set();return contract.fields.filter(f=>f&&/^[a-zA-Z][a-zA-Z0-9_]*$/.test(f.key)&&!['token','password','secret','credential','__proto__','constructor','prototype'].some(k=>f.key.toLowerCase().includes(k))&&typeof f.label==='string'&&['public','private'].includes(f.visibility)&&!seen.has(f.key)&&(seen.add(f.key),true)).map(f=>({...f,editable:f.editable===true}));
}
function profileValues(record,fields){return Object.fromEntries(fields.filter(f=>typeof record.values?.[f.key]==='string').map(f=>[f.key,record.values[f.key]]));}
export function projectMemberDetailPage(route,params,rawIdentity,data,compiled,fieldContract){
 const i=identityOf(rawIdentity),g=gate(route,params,i,compiled);if(g)return g;const v=shell(route,i);
 if(data?.disabled===true)return {...v,status:'disabled',notice:'本人資料讀取服務尚未接通'};
 if(data?.scopeKey!==i.scopeKey)return {...v,status:'unavailable',notice:'此內容目前無法使用'};
 if(route==='play_history'){
  if(!Array.isArray(data.items))throw TypeError('History list required');
  v.items=data.items.filter(r=>owned(r,i)&&id(r.id)).map(r=>{
   const valid=validHistory(r);return {id:r.id,...(typeof r.title==='string'?{title:r.title}:{}),...(id(r.game_id)?{game_id:r.game_id}:{}),...(id(r.build_id)?{build_id:r.build_id}:{}),...(typeof r.playedAt==='string'&&Number.isFinite(Date.parse(r.playedAt))?{playedAt:r.playedAt}:{}),fixture:r.fixture===true,actions:valid?[{type:'select_history',historyId:r.id,intent:'play',label:'再次遊玩'},{type:'select_history',historyId:r.id,intent:'review',label:'評測此版本'}]:[],notice:valid?'':'原版本資訊不完整或已不可用；不會改用其他版本'};
  });v.status=v.items.length?'ready':'empty';v.notice=v.items.length?'':'尚無本人試玩紀錄';v.fixtureLabel=v.items.some(r=>r.fixture)?'示範資料，非本人正式紀錄':'';
 }else{
  if(!owned(data.record,i)||!id(data.record.revision))return {...v,status:'unavailable',notice:'此內容目前無法使用'};
  const fields=schema(fieldContract),values=profileValues(data.record,fields);v.status='ready';v.revision=data.record.revision;
  for(const section of v.sections)section.fields=fields.filter(f=>f.visibility===section.id).map(f=>({key:f.key,label:f.label,editable:f.editable,value:values[f.key]??''}));
  v.draft=values;v.notice=fields.length?'公開檔案與私人欄位分開；未送出內容僅保留於本次記憶體':'可編輯欄位尚未由服務契約定義，不收集額外個資';v.fixtureLabel=data.record.fixture===true?'示範資料，非本人正式紀錄':'';
 }return v;
}
function validHistory(r){return id(r.game_id)&&id(r.build_id)&&r.relationsVerified===true&&r.visible===true;}
