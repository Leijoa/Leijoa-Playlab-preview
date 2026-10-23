import {buildRoute,resolveRoute} from './route-contract.mjs';
// Static display projections only. No identity provider, input collection or write adapter.
function link(routeId,params,compiled,label=''){const href=buildRoute(routeId,params,compiled);const r=resolveRoute(href,compiled);if(!r.ok)throw Error('Invalid route');return {routeId:r.id,params:r.params,href,label};}
export function projectAuthEntry(params={},_identity={},options={}){
 const {compiled}=options;let valid=true,returnIntent=link('account',{},compiled);
 try{if(Object.keys(params).some(k=>!['returnTo','intent'].includes(k))||params.intent!==undefined)throw Error();link('auth',params,compiled);if(params.returnTo){const r=resolveRoute(params.returnTo,compiled);returnIntent=link(r.id,r.params,compiled);}}catch{valid=false;}
 return {routeId:'auth',status:'disabled',notice:valid?'靜態展示不提供登入或身份驗證':'返回意圖無效，已清除；可返回帳號入口',returnIntent,navigation:null,retryAvailable:false,links:[link('account',{},compiled,'返回帳號'),link('policies',{tab:'policies'},compiled,'條款與隱私')]};
}
export function createEntryFormController({compiled,validateScope=()=>false}){
 const empty=()=>({status:'disabled',notice:'靜態展示不收集或送出討論與回報',fields:[],draft:{},dirty:false,saveState:'disabled',navigation:null});
 return Object.freeze({setIdentity:()=>empty(),open(routeId,params={}){try{const r=link(routeId,params,compiled);if(!['discussion_new','bug_report'].includes(r.routeId)||r.routeId!==routeId)throw Error();if(routeId==='bug_report'&&validateScope({game:params.game,build:params.build})!==true)throw Error();}catch{return {...empty(),status:'invalid',notice:'上下文不可用，未替換作品或版本'};}return {...empty(),routeId,params:structuredClone(params)};}});
}
