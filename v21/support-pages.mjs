export const HELP_ARTICLES=Object.freeze([
 {id:'start',group:'play',title:'如何開始試玩？',body:'先在探索頁選擇作品，再查看試玩頁介面。此靜態展示不包含遊戲程式，不會載入或執行遊戲。',links:[{id:'play_list',label:'瀏覽展示作品'}]},
 {id:'stop',group:'play',title:'如何停止或返回作品？',body:'展示版不會啟動遊戲；可由試玩展示頁返回原作品。版本無法定位時不會自動換成其他版本。',links:[{id:'explore',label:'返回探索'}]},
 {id:'review',group:'reviews',title:'為什麼現在不能輸入評測？',body:'這份靜態展示不提供登入或評測保存。所有評測欄位停用；不含真實玩家評分或私人資料。',links:[{id:'account',label:'查看帳號頁'}]},
 {id:'schema',group:'reviews',title:'新五維與原七維會混在一起嗎？',body:'不會。新五維為好玩度、美術、操作、創意、完成度，推薦另行處理。現階段沒有遷移原資料，也沒有把介面範例計入平台實績。',links:[]},
 {id:'history',group:'reviews',title:'評測修改後如何看原文字？',body:'設計規格要求已公開文字修改即時更新，並提供「已編輯」歷史。只有允許公開的文字版本可顯示，私稿與被隱藏內容不能由歷史入口曝光。此服務仍在隔離製作。',links:[]},
 {id:'creator',group:'create',title:'可以直接上傳或發布遊戲嗎？',body:'目前不可以。可先閱讀創作者流程；資格申請、作品投稿與版本發布是不同步驟。這份原型沒有開放第三方遊戲上傳執行或對外發布。',links:[{id:'creator_intro',label:'了解創作者流程'}]},
 {id:'money',group:'create',title:'收益頁是否已能收款？',body:'尚未開放金流、結算或提款，也沒有顯示假收入。收益頁保留規則與後續流程的位置。',links:[{id:'creator_intro',label:'返回創作者說明'}]},
 {id:'local',group:'preview',title:'這是正式服務嗎？',body:'不是。這是 .10 版介面的獨立公開靜態展示，不提供登入、私人資料、遊戲執行、投稿、付款或追蹤，也不修改任何原服務。',links:[{id:'platform_info',label:'了解目前平台'}]}
]);
export const HELP_GROUPS=Object.freeze([['all','全部'],['play','試玩'],['reviews','評測'],['create','創作'],['preview','靜態展示']]);
export function helpResults({q='',group='all'}={}){if(!HELP_GROUPS.some(([id])=>id===group))return {status:'invalid',items:[]};const term=String(q).trim().toLocaleLowerCase();const items=HELP_ARTICLES.filter(a=>(group==='all'||a.group===group)&&(a.title+' '+a.body).toLocaleLowerCase().includes(term));return {status:items.length?'ready':'empty',items};}
export const POLICY_SECTIONS=Object.freeze([['terms','使用條款'],['privacy','隱私說明'],['community','社群規範'],['submission','投稿政策']]);
export function policyView(section){return {status:'unapproved',selected:POLICY_SECTIONS.some(([id])=>id===section)?section:null,invalid:!!section&&!POLICY_SECTIONS.some(([id])=>id===section),sections:POLICY_SECTIONS.map(([id,title])=>({id,title,status:'尚未核定',body:'正文仍待核定；此處只保留政策分區，不代表已發布或同意條款。'}))};}
