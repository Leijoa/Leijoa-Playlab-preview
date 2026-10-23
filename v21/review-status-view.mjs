
import {projectAccountPage} from './account-pages.mjs';
const definitions=[
 ['published','已公開','R01'],['draft','草稿','R03'],
 ['private_saved','私人已儲存','R05'],['pending','待審','R06'],['rejected','退回','R06']
];
const localDefinitions=[['awaiting_review','待評作品','R02'],['legacy_ratings','舊七維記錄','R07']];
const labelByState=Object.fromEntries(definitions.map(([state,label])=>[state,label]));
const gated=new Set(['invalid','identity_unknown','identity_error','login_required']);
export function projectReviewStatusView({params={},identity={},data,localTab='all',readStatus}={}){
 const gate=projectAccountPage('my_reviews',params,identity,{disabled:true});
 const localValid=['all',...localDefinitions.map(x=>x[0])].includes(localTab);
 const selected=params.state??localTab;
 const tabs=[{key:'all',label:'全部評測',displayId:'R00',selected:selected==='all',link:{label:'全部評測',routeId:'my_reviews',params:{}}},
  ...definitions.map(([key,label,displayId])=>({key,label,displayId,selected:selected===key,link:{label,routeId:'my_reviews',params:{state:key}}})),
  ...localDefinitions.map(([key,label,displayId])=>({key,label,displayId,selected:selected===key,memoryOnly:true,action:{type:'select_review_memory_tab',key},baseLink:{label,routeId:'my_reviews',params:{}}}))];
 let view=gate;
 if(!gated.has(gate.status)){
  if(!localValid)view={...gate,status:'invalid',notice:'此分頁選項不可用'};
  else if(!params.state&&localTab!=='all')view={...gate,status:'disabled',notice:localTab==='awaiting_review'?'待評作品資料尚未接通；此分頁不是評測待審清單':'舊七維資料尚未接通；保留原量表與權限，不轉換為五維，也不混算'};
  else if(['loading','error','cancelled'].includes(readStatus))view={...gate,status:readStatus,retryAvailable:readStatus==='error',notice:{loading:'正在讀取本人評測',error:'本人評測讀取失敗，請重試',cancelled:'已取消讀取'}[readStatus]};
  else view=projectAccountPage('my_reviews',params,identity,data??{disabled:true});
 }
 return {...view,tabs,selected,items:view.items.map(item=>({...item,stateLabel:labelByState[item.state]??item.state})),
  lifecycleNotice:'評測狀態以伺服器回傳為準；已公開評測修改成功後即時更新，不自動轉為待審。',
  scaleNotice:'新五維與舊七維分開呈現，不轉換、不合併計算。',
  sourceNotice:view.status==='disabled'?'資料服務尚未接通，不能解讀為 0 筆。':'',
  countsAvailable:false};
}
