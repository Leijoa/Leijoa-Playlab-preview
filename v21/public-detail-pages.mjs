import {buildRoute,resolveRoute} from './route-contract.mjs';

const supported=new Set(['creator_public','public_review','review_history']);
const publicRow=r=>r?.status==='published'&&r.visibility==='public';
function dest(id,params,compiled){const href=buildRoute(id,params,compiled);if(!resolveRoute(href,compiled).ok)throw Error('Invalid route');return {routeId:id,params:{...params},href};}
function base(routeId,params,compiled){return {routeId,status:'loading',notice:'',record:null,items:[],links:[],retryAvailable:false,fixtureLabel:'',returnTo:dest('explore',{},compiled)};}
function valid(routeId,params,compiled){try{return supported.has(routeId)&&resolveRoute(buildRoute(routeId,params,compiled),compiled).id===routeId;}catch{return false;}}
export function projectPublicDetail(routeId,params={},data={},options={}){
 const {compiled,reviewContract}=options,v=base(routeId,params,compiled),unavailable=()=>({...v,status:'unavailable',notice:'內容目前無法使用'});
 if(!valid(routeId,params,compiled))return unavailable();
 if(data?.disabled===true)return {...v,status:'disabled',notice:'公開詳情服務尚未接通'};
 if(routeId==='creator_public'){
  const c=data?.creator;if(!publicRow(c)||c.isCreator!==true||c.creator_id!==params.creator_id)return unavailable();
  if(params.tab!==undefined)return {...unavailable(),notice:'公開檔案分區尚未接通'};
  if(!Array.isArray(data.works))throw TypeError('Public works list required');
  v.record={displayName:typeof c.displayName==='string'?c.displayName:'',bio:typeof c.bio==='string'?c.bio:''};
  v.items=data.works.filter(w=>publicRow(w)&&w.creator_id===c.creator_id&&typeof w.title==='string').flatMap(w=>{try{return [{title:w.title,destination:dest('game',{game_id:w.game_id},compiled)}];}catch{return [];}});
  v.status=v.items.length?'ready':'empty';v.notice=v.items.length?'':'尚無公開作品';
 }else{
  const r=data?.review,g=data?.game,b=data?.build;
  if(!reviewContract||typeof reviewContract.publicProjection!=='function')return {...v,status:'disabled',notice:'公開評測投影介面尚未接通'};
  if(!r||!publicRow(g)||!publicRow(b)||r.game_id!==params.game_id||g.game_id!==params.game_id||b.game_id!==params.game_id||r.build_id!==b.build_id||r.rating_schema_version!==reviewContract.NEW_SCHEMA)return unavailable();
  let p;try{p=reviewContract.publicProjection(r,{review_id:params.review_id,game_id:params.game_id,build_id:b.build_id,rating_schema_version:reviewContract.NEW_SCHEMA,canReadParent:data.canReadParent===true,canReadRevision:x=>x.publicReadable===true});}catch{return unavailable();}
  if(!p)return unavailable();
  v.returnTo=dest('game_reviews',{game_id:params.game_id,build:b.build_id},compiled);
  const detail=dest('public_review',{game_id:params.game_id,review_id:params.review_id},compiled);
  v.record={text:p.text,stars:{...p.stars},recommendation:p.recommendation,saved_at:p.saved_at,rating_schema_version:p.rating_schema_version,edited:p.edited};
  if(routeId==='review_history'){
   v.returnTo=detail;v.items=p.history.map(h=>({text:h.text,saved_at:h.saved_at}));v.status=v.items.length?'ready':'empty';v.notice=v.items.length?'':'尚無可查看歷史';
  }else{v.status='ready';if(p.edited)v.links.push({...dest('review_history',{game_id:params.game_id,review_id:params.review_id,tab:'history'},compiled),label:'已編輯'});}
 }
 if(data.fixture===true)v.fixtureLabel='示範資料，非正式內容';
 return v;
}

