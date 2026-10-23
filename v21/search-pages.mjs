import {buildRoute,resolveRoute} from './route-contract.mjs';

const tabs=[['search_games','遊戲'],['search_tags','類型／標籤'],['search_creators','創作者']];
const supported=['search','category','tag'];
function destination(id,params,compiled){const url=buildRoute(id,params,compiled);if(!resolveRoute(url,compiled).ok)throw Error('Invalid destination');return {routeId:id,params:{...params},href:url};}
function base(routeId,params,tab,compiled){
 const q=typeof params.q==='string'?params.q.trim():'';
 const view={routeId,params:{...params},q,tab,status:'loading',notice:'',items:[],tabs:[],retryAvailable:false,returnTo:destination('explore',{},compiled),clearFilters:null};
 if(routeId==='search'&&q){const parent=destination('search',{q},compiled);view.clearFilters=parent;view.tabs=tabs.map(([id,label])=>({id,label,selected:id===tab,action:'selectTab',destination:parent}));}
 else view.clearFilters=view.returnTo;
 return view;
}
function guard(routeId,params,tab,compiled){
 const v=base(routeId,params,tab,compiled);
 if(!supported.includes(routeId)||!tabs.some(([id])=>id===tab))return {...v,status:'invalid',notice:'搜尋目的地不可用'};
 if(routeId==='search'&&!v.q)return {...v,status:'input_required',notice:'請輸入搜尋內容'};
 try{destination(routeId,params,compiled);}catch{return {...v,status:'invalid',notice:'查詢參數無效，請修正或清除篩選'};}
 if(routeId==='category'||routeId==='tag'||params.category!==undefined||params.tag!==undefined)return {...v,status:'disabled',notice:'分類與標籤字典尚未接通；未套用篩選，也不以全部作品替代'};
 if(params.sort!==undefined||(params.page!==undefined&&String(params.page)!=='1'))return {...v,status:'disabled',notice:'排序或分頁尚未接通；未以第一頁替代指定查詢'};
 if(tab!=='search_games')return {...v,status:'disabled',notice:tab==='search_tags'?'類型／標籤搜尋尚未接通':'創作者搜尋尚未接通'};
 return null;
}
export function projectSearchPage(routeId,params={},data={},options={}){
 const {compiled,tab='search_games'}=options,g=guard(routeId,params,tab,compiled);if(g)return g;
 const v=base(routeId,params,tab,compiled);
 if(!Array.isArray(data.catalog))throw TypeError('Public catalog required');
 const q=v.q.toLocaleLowerCase();
 v.items=data.catalog.filter(r=>r&&typeof r.game==='string'&&typeof r.title==='string'&&(!r.status||r.status==='published')&&(!r.visibility||r.visibility==='public')).filter(r=>(r.title+' '+r.game).toLocaleLowerCase().includes(q)).flatMap(r=>{
  try{return [{game:r.game,title:r.title,disabled:r.disabled===true,fixture:r.fixture===true,destination:destination('game',{game_id:r.game},compiled)}];}catch{return [];}
 });
 v.status=v.items.length?'ready':'empty';v.notice=v.items.length?'':'目前沒有符合條件的公開作品';return v;
}

export function createSearchPagesController({compiled,loadCatalog,onChange=()=>{}}){
 if(typeof loadCatalog!=='function')throw TypeError('loadCatalog adapter required');
 let current={routeId:'search',params:{},tab:'search_games'},view=base('search',{},'search_games',compiled),generation=0,abort;
 const snapshot=()=>structuredClone(view),emit=v=>{view=v;onChange(snapshot());return snapshot();};
 async function open(routeId,params={},tab='search_games'){
  const n=++generation;abort?.abort();abort=new AbortController();current={routeId,params:structuredClone(params),tab};
  const g=guard(routeId,params,tab,compiled);if(g)return emit(g);
  emit(base(routeId,params,tab,compiled));
  try{const data=await loadCatalog({signal:abort.signal});if(n!==generation)return snapshot();return emit(projectSearchPage(routeId,params,data,{compiled,tab}));}
  catch{if(n!==generation)return snapshot();return emit({...base(routeId,params,tab,compiled),status:'error',notice:'搜尋讀取失敗，請重試',retryAvailable:true});}
 }
 return {open,snapshot,selectTab:tab=>open(current.routeId,current.params,tab),retry:()=>open(current.routeId,current.params,current.tab),refresh:()=>open(current.routeId,current.params,current.tab),cancel(){++generation;abort?.abort();return emit({...base(current.routeId,current.params,current.tab,compiled),status:'cancelled',notice:'已取消搜尋'});}};
}
