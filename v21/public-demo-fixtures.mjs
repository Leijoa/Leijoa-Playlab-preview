
export const PUBLIC_DEMO_IDS=Object.freeze({topic:'demo-interface-tour',discussion:'demo-navigation-example',reply:'demo-return-path',announcement:'demo-preview-notice'});
const marker={status:'published',visibility:'public',fixture:true};
const topic=()=>({...marker,id:PUBLIC_DEMO_IDS.topic,title:'設計示意：探索頁面導覽',body:'這是一段評審用話題說明，用來檢查標題、內容與返回動線；不是玩家發起的話題。'});
const discussion=()=>({...marker,id:PUBLIC_DEMO_IDS.discussion,topic_id:PUBLIC_DEMO_IDS.topic,title:'設計示意：討論詳情與返回',body:'此內容只用於檢查討論版面。可以開啟詳情並返回上層，不代表真實玩家回報或正式產品公告。'});
const reply=()=>({...marker,id:PUBLIC_DEMO_IDS.reply,discussion_id:PUBLIC_DEMO_IDS.discussion,title:'設計示意：回覆定位',body:'這是非個人的版面範例，用來檢查指定回覆定位與鍵盤焦點；沒有真實留言者。'});
const announcement=()=>({...marker,id:PUBLIC_DEMO_IDS.announcement,title:'設計示意公告：預覽內容說明',body:'此公告是評審用固定範例，不是正式平台公告，也不要求登入或任何帳號操作。',audience:'public',version:'demo-v1',startsAt:'2026-01-01T00:00:00Z',endsAt:'2100-01-01T00:00:00Z'});
const only=(params,keys)=>params&&typeof params==='object'&&!Array.isArray(params)&&Object.keys(params).every(k=>keys.includes(k));
export function getPublicDemo(routeId,params={}){
 if(routeId==='community'&&only(params,[])&&Object.keys(params).length===0)return {items:[discussion()]};
 if(routeId==='topics'&&only(params,[])&&Object.keys(params).length===0)return {items:[topic()]};
 if(routeId==='topic'&&only(params,['topic_id'])&&params.topic_id===PUBLIC_DEMO_IDS.topic)return {record:topic(),items:[discussion()]};
 if(routeId==='discussion'&&only(params,['discussion_id','reply'])&&params.discussion_id===PUBLIC_DEMO_IDS.discussion&&(!Object.hasOwn(params,'reply')||typeof params.reply==='string'))return {record:discussion(),items:[reply()]};
 if(routeId==='announcement'&&only(params,['message_id','version'])&&params.message_id===PUBLIC_DEMO_IDS.announcement&&(!Object.hasOwn(params,'version')||params.version==='demo-v1'))return {record:announcement()};
 if(routeId==='community'||routeId==='topics')return {disabled:true};
 return {record:null,items:[]};
}
