import {ROUTES,DISPLAY_IDS,PAGE_LABELS,PUBLIC_CATALOG,ANONYMOUS_DEMO} from './demo-data.mjs';
import {projectReviewStatusView} from './review-status-view.mjs';
import {getPublicDetailDemo} from './public-detail-demo.mjs';
import {getPublicDemo} from './public-demo-fixtures.mjs';
import {projectAuthEntry,createEntryFormController} from './entry-form-pages.mjs';
import {projectWorkspaceDetailPage,WORKSPACE_DETAIL_IDS} from './workspace-detail-pages.mjs';
import {projectPublicDetail} from './public-detail-pages.mjs';
import {projectMemberDetailPage} from './member-detail-pages.mjs';
import {helpResults,HELP_GROUPS,policyView} from './support-pages.mjs';
import {projectSearchPage} from './search-pages.mjs';
import {projectCreatorPage,CREATOR_PAGE_IDS} from './creator-pages.mjs';
import {projectAccountPage} from './account-pages.mjs';
import {createPublicPagesController} from './public-pages.mjs';
import {compileRoutes,resolveRoute,buildRoute,routeAccess} from './route-contract.mjs';
import {createHomeEntryController} from './home-entry-state.mjs';
import {createPromptLedger} from './prompt-ledger.mjs';
import {createRouteNavigation} from './route-navigation.mjs';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let compiled,nodes=[],catalog=[],identity={status:'unknown'},requestGeneration=0,entry,previousFocus;
let publicController,navigation;
const accountRoutes=new Set(['account','settings','notifications','my_reviews']);
const publicRoutes=new Set(['community','topics','topic','discussion','announcement']);
const state={catalog:'loading',filter:'all',catalogRequest:0};
const promptMemory=new Map();
const memoryOnly={getItem:key=>promptMemory.get(key)??null,setItem:(key,value)=>promptMemory.set(key,value)};
const href=(id,params={})=>'#'+buildRoute(id,params,compiled);
const link=(id,title,params={},className='')=>`<a class="${className}" href="${esc(href(id,params))}">${esc(title)}</a>`;
// Human-facing names are separate from the unchanged blueprint labels.
const displayTitles=Object.freeze({game:'作品介紹',play:'試玩展示'});
const title=id=>displayTitles[id]||nodes.find(n=>n.id===id)?.label||id;
const known=id=>catalog.find(g=>g.game===id);
function cover(g,className='card-art'){return g.game==='bibi-dice'?`<div class="${className}"><img src="./assets/bibi-artist-header.png" width="920" height="430" alt="BIBI DICE 已核定繪師封面：石拱、四顆中文字八面骰與金色字標"></div>`:`<div class="${className}" role="img" aria-label="孢子森林封面更新中">封面更新中</div>`;}
function card(g){return `<article class="game-card"><a class="card-link" href="${href('game',{game_id:g.game})}">${cover(g)}<div class="card-body"><h3>${esc(g.title)}</h3><p class="game-summary">${g.game==='bibi-dice'?'探索骰子構築與戰鬥主題，查看作品與試玩介面展示。':'瀏覽作品目錄示例，封面素材尚未提供。'}</p><div class="tags"><span>靜態展示</span>${g.disabled?'<span>暫停新試玩</span>':''}</div><small class="card-status">靜態目錄示例 · 不執行遊戲或收集評測</small></div></a></article>`;}
function empty(heading,body){return `<div class="empty"><strong>${esc(heading)}</strong>${esc(body)}</div>`;}
function header(id,subtitle='',subject=''){const heading=subject?subject+'｜'+title(id):title(id);return `<div class="breadcrumbs">${link('home','首頁')}<span>／</span><span>${esc(heading)}</span></div><header class="page-header" data-display-id="${esc(compiled.byId.get(id)?.displayId||'')}"><h1 tabindex="-1" id="route-title">${esc(heading)}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:''}</header>`;}
function cards(list){return list.length?`<div class="game-grid">${list.map(card).join('')}</div>`:empty('沒有符合的遊戲','請調整搜尋條件或返回全部遊戲。');}
function homeBase(){
 const g=catalog[0];
 return `<div class="home-composition"><h1 class="sr-only" tabindex="-1" id="route-title">探索 AI 遊戲</h1>${g?`
 <section class="home-feature" aria-labelledby="home-feature-title">
  <div class="home-feature-art">${cover(g,'home-feature-image')}</div>
  <span class="badge home-feature-badge">認識一款作品</span>
  <div class="home-feature-copy">
   <h2 id="home-feature-title">${esc(g.title)}</h2>
   <p>${g.game==='bibi-dice'?'探索骰子構築與戰鬥主題，查看作品與試玩介面展示。':'從真實作品開始探索，查看作品與試玩介面展示。'}</p>
   <div class="home-feature-actions">
    ${link('play','查看試玩頁 →',{game_id:g.game,build:g.build},'button primary')}
    ${link('game','了解作品',{game_id:g.game},'button quiet')}
   </div>
  </div>
 </section>`:empty('目錄目前沒有可用作品','我們不以示意遊戲填滿清單。')}
 <section class="home-catalog" aria-labelledby="home-catalog-title">
  <div class="home-catalog-toolbar">
   <h2 id="home-catalog-title">探索試玩遊戲</h2>
   <div class="home-catalog-filters" role="group" aria-label="遊戲篩選"><button type="button" data-filter="all" aria-pressed="true">全部</button><button type="button" data-filter="playable" aria-pressed="false">展示作品</button></div>
   ${link('explore','查看全部 →',{},'home-catalog-more')}
  </div>
  <div id="home-cards">${cards(catalog)}</div>
 </section>
 <div class="public-panels"><section class="panel"><div class="section-head"><h2>社群討論與回報</h2>${link('community','更多討論 →')}</div><div class="tabs">${link('community','最新討論')}${link('community','回報與討論')}</div>${empty('尚無公開討論','社群服務尚未接通；不展示虛構帳號或留言。')}</section><section class="panel"><div class="section-head"><h2>熱門話題</h2>${link('topics','查看話題 →')}</div>${empty('尚無可顯示話題','有公開內容與排序規則後才顯示熱門清單。')}</section></div><section class="panel"><h2>查看試玩評測介面</h2><p class="muted">先查看作品，再瀏覽停用的評測介面。本展示不收集、不送出或保存評測。</p>${link('play_list','查看展示作品 →',{},'button primary')}</section></div>`;
}
function home(){return homeBase()+`<details class="panel build-details"><summary>靜態展示內容與限制</summary><p>這是 .10 版介面展示，不是正式服務。目錄為公開作品資訊，所有訪客都使用未連線的匿名展示狀態。可瀏覽頁面與非個人設計範例；不提供登入、會員資料、評測保存、投稿、付款、追蹤或遊戲執行。</p><p>頁面互動僅保留於目前頁面記憶體，重新整理即重設；不寫入瀏覽器儲存空間或伺服器。</p></details>`;}
function searchContent(r){
 const key=JSON.stringify([r.id,r.params]);if(state.searchKey!==key){state.searchKey=key;state.searchTab='search_games';}
 const v=projectSearchPage(r.id,r.params,{catalog},{compiled,tab:state.searchTab});
 return header(r.id,v.q?`搜尋「${v.q}」`:'篩選作品')+`<div class="tabs" role="tablist" aria-label="搜尋類型">${v.tabs.map(t=>`<button type="button" role="tab" id="${t.id}" data-search-tab="${t.id}" aria-selected="${t.selected}" aria-controls="search-results" tabindex="${t.selected?'0':'-1'}">${esc(t.label)}</button>`).join('')}</div><section id="search-results" ${v.tabs.length?`role="tabpanel" aria-labelledby="${esc(v.tab)}"`:'role="region" aria-label="篩選結果"'}>${v.status==='ready'?cards(v.items.map(x=>known(x.game))):empty(v.status==='empty'?'沒有搜尋結果':'查詢狀態',v.notice)}</section><div class="actions"><a class="button quiet" href="#${esc(v.returnTo.href)}">返回探索</a></div>`;
}
function explore(r){if(['search','category','tag'].includes(r.id))return searchContent(r);if(['category','tag'].includes(r.id))return header(r.id)+empty('分類資料尚未接通','目前無法核對分類與作品對應，不會以全部作品代替此分類。');const q=(r.params.q||'').toLocaleLowerCase();let list=catalog.filter(g=>(g.title+' '+g.game).toLocaleLowerCase().includes(q));if(r.id==='play_list')list=list.filter(g=>!g.disabled);return header(r.id,r.id==='play_list'?'選擇作品與版本以查看停用的試玩介面；不執行遊戲。':'展示兩款公開作品的目錄與介面；不包含遊戲程式。')+(r.id==='play_list'?`<section class="panel"><h2>繼續上次</h2><p class="muted">目前未提供遊玩紀錄；請從下方選擇遊戲，不會自動啟動。</p></section>`:'')+`<div class="section-head"><h2>${q?'搜尋結果':'遊戲列表'}</h2><small>${list.length} 款</small></div>`+cards(list);}
function gamePage(r){const g=known(r.params.game_id);if(!g)return header('game')+empty('此作品目前無法使用','返回探索選擇可用作品。');if(r.params.build&&r.params.build!==g.build)return header(r.id)+empty('作品版本不可用','指定版本不屬於目前可用作品，不會換成另一版。');const gameParams={game_id:g.game,...(r.params.build?{build:r.params.build}:{})};const tabs=`<nav class="tabs" aria-label="作品分頁">${link('game','作品介紹',gameParams)}${link('game_instructions','玩法說明',gameParams)}${link('game_versions','公開版本',gameParams)}${link('game_reviews','評測',gameParams)}</nav>`;let content='';if(r.id==='game_instructions')content=`<h2>遊玩操作</h2><p>靜態展示版不含遊戲執行功能；正式作品操作以遊戲本身說明為準。</p>`;else if(r.id==='game_versions')content=`<h2>目錄展示版本</h2><p>${esc(g.title)} · ${g.disabled?'已暫停':'僅展示，不可執行'}</p><details class="build-details"><summary>查看版本識別</summary>${esc(g.build)}</details>`;else if(r.id==='game_reviews')content=`<h2>公開評測</h2>${empty('尚無新五維公開評測','靜態展示不含真實玩家評分，也不聲稱任何平台實績。')}${link('review_editor','查看評測介面',{game_id:g.game,build:g.build},'button primary')}`;else content=`<div class="detail-layout"><div>${cover(g,'feature-art')}</div><div><span class="badge">公開作品展示</span><h2>${esc(g.title)}</h2><p>${g.game==='bibi-dice'?'探索骰子構築與戰鬥主題；此頁僅展示作品介紹介面。':'此頁只展示作品目錄，封面與詳細介紹尚待更新；不提供遊戲執行。'}</p><div class="actions">${link('play','查看試玩頁 →',{game_id:g.game,build:g.build},'button primary')}${link('review_editor','查看評測介面',{game_id:g.game,build:g.build},'button quiet')}${g.game==='bibi-dice'?'<a class="button quiet" href="https://store.steampowered.com/app/4792230/" target="_blank" rel="noopener noreferrer external" aria-label="BIBI DICE Steam 商店（另開分頁）">Steam 商店（另開分頁）</a>':''}</div><small>公開星等／推薦樣本尚無資料</small></div></div>`;return header(r.id,r.id==='game'?'':g.title,r.id==='game'?g.title:'')+tabs+`<section class="panel">${content}</section>`;}
function playPage(r){const g=known(r.params.game_id);if(!g||g.build!==r.params.build)return header('play')+empty('展示版本無法定位','指定版本不存在或不屬於此作品，不會替換成其他版本。');return header('play','',g.title)+`<div class="actions">${link('game','返回作品',{game_id:g.game},'button quiet')}<button class="button primary" disabled>靜態展示版不提供遊戲執行</button>${link('review_editor','查看評測介面',{game_id:g.game,build:g.build},'button quiet')}</div><section class="panel game-unavailable"><h2>此處僅展示試玩頁面</h2><p id="play-state" role="status">未載入任何遊戲；本展示不含遊戲程式、嵌入框架或遊戲伺服器連線。</p><p>你仍可返回作品介紹，或查看停用的評測介面。BIBI DICE 的商店連結僅會在你點選後另開分頁。</p></section><details class="build-details"><summary>展示版本識別</summary>${esc(g.build)}</details>`;}
function privatePage(r){const access=routeAccess(r,identity);let message=access==='identity-pending'?'登入狀態尚未確認，未讀取私人資料。':access==='sign-in-required'?'此頁需要登入，這份靜態展示版尚未接入登入操作。':'這份靜態展示版尚未接入此頁的權限與資料服務。';return header(r.id)+`<section class="panel">${empty('私人功能尚未接通',message)}${link('account','查看帳號狀態',{},'button quiet')}${r.id==='creator'?`<div class="tabs">${link('creator_intro','投稿入門')}${link('works','作品管理')}${link('analytics','數據分析')}${link('revenue','收益中心')}</div>`:''}</section>`;}
function publicContent(r){return header(r.id)+`<section class="demo-switch"><strong>${state.publicDemo?'設計示意，非真實玩家／正式公告':'公開內容尚未接通'}</strong><p>${state.publicDemo?'示範只存在這次頁面記憶體，不計入統計。未知內容不會替換成示範。':'可選擇查看獨立的設計示意旅程，不會新增任何資料。'}</p><button id="toggle-public-demo" class="button quiet">${state.publicDemo?'關閉設計示意':'查看設計示意'}</button>${state.publicDemo?`<div class="actions">${link('topics','示意話題',{},'button quiet')}${link('public_review','示意評測',{game_id:'bibi-dice',review_id:'demo-interface-review'},'button quiet')}${link('announcement','示意公告',{message_id:'demo-preview-notice',version:'demo-v1'},'button quiet')}</div>`:''}</section><section class="panel" id="public-content" aria-busy="true"><p role="status">正在讀取公開內容…</p></section>`;}
function publicRows(v){
 const record=v.record?`<article class="public-record"><span class="badge">${esc(v.record.fixtureLabel)}</span><h2>${esc(v.record.title)}</h2><p class="record-body">${esc(v.record.body)}</p>${v.record.version?`<small>示意版本 ${esc(v.record.version)}</small>`:''}</article>`:'';
 const items=v.items.map(item=>{
  let target=null;if(v.routeId==='topics')target=href('topic',{topic_id:item.id});else if(['community','topic'].includes(v.routeId))target=href('discussion',{discussion_id:item.id});
  return `<article class="public-record" id="reply-${esc(item.id)}" tabindex="-1"><span class="badge">${esc(item.fixtureLabel)}</span><h3>${target?`<a href="${esc(target)}">${esc(item.title)}</a>`:esc(item.title)}</h3><p class="record-body">${esc(item.body)}</p></article>`;
 }).join('');
 return `${v.fixtureLabel?`<p class="notice">${esc(v.fixtureLabel)}</p>`:''}${record}${v.routeId==='discussion'?'<h2>回覆</h2>':''}${items}${v.detailsEmpty?'<p class="muted">目前沒有可公開的回覆或項目。</p>':''}`;
}
function mountPublicContent(r){
 const generation=requestGeneration;
 publicController?.cancel();
 publicController=createPublicPagesController({
  load:async({routeId,params})=>state.publicDemo?getPublicDemo(routeId,params):({disabled:true}),
  validateScope:({game,build})=>catalog.some(g=>g.game===game&&(!build||g.build===build)),
  onChange:v=>{
   if(generation!==requestGeneration)return;
   const host=$('public-content');if(!host)return;
   host.setAttribute('aria-busy',String(v.status==='loading'));
   host.replaceChildren();const status=document.createElement('p');status.setAttribute('role','status');
   status.textContent=v.status==='loading'?'正在讀取公開內容…':v.status==='disabled'?'公開內容服務尚未接通；不會以示範玩家或公告冒充正式內容。':v.notice;
   host.append(status);
   if(v.status==='ready'){const content=document.createElement('div');content.innerHTML=publicRows(v);host.append(content);if(v.focusReply){if(navigation)navigation.focusContentTarget('reply-'+v.focusReply);else document.getElementById('reply-'+v.focusReply)?.focus();}}
   if(v.retryAvailable){const b=document.createElement('button');b.className='button quiet';b.textContent='重新讀取';b.onclick=()=>publicController.retry();host.append(b);}
   const back=document.createElement('a');back.href='#'+v.returnTo;back.className='button quiet';back.textContent='返回上層';host.append(back);
  }
 });
 publicController.open(r.id,r.params,{auth:identity.status});
}
function reviewStatusContent(r){
 const v=projectReviewStatusView({params:r.params,identity:{state:identity.error?'error':identity.status==='anonymous'?'anonymous':'unknown'},localTab:state.reviewLocalTab||'all'});
 const label=v.tabs.find(t=>t.selected)?.label||'評測';
 return `<section class="panel"><h2>評測狀態</h2><nav class="tabs" aria-label="本人評測狀態">${v.tabs.map(t=>t.link?`<a id="review-filter-${t.key}" data-review-state="${t.key}" href="${href(t.link.routeId,t.link.params)}" ${t.selected?'aria-current="page"':''}>${esc(t.label)}</a>`:`<button type="button" id="review-filter-${t.key}" data-review-memory="${t.key}" aria-pressed="${t.selected}">${esc(t.label)}</button>`).join('')}</nav><h3>${esc(label)}</h3><p role="status">${esc(v.notice)}</p><p class="muted">本人資料服務尚未接通，尚未讀取任何評測；這不代表 0 筆。</p>${v.selected==='awaiting_review'?'<p>待評作品是尚待撰寫評測的作品，不是評測待審清單。</p>':v.selected==='legacy_ratings'?'<p>舊七維記錄保持原量表與原權限，不轉換成新五維。</p>':''}<p class="muted">${esc(v.lifecycleNotice)}</p><p class="muted">${esc(v.scaleNotice)}</p></section>`;
}
function selectReviewMemoryTab(key){if(!['awaiting_review','legacy_ratings'].includes(key))return;state.reviewLocalTab=key;state.reviewFocusTarget='review-filter-'+key;const target=href('my_reviews');if(location.hash!==target)navigation.navigate(target.slice(1),{focus:state.reviewFocusTarget});else render({focus:false});}


function accountContent(r){
 const accountIdentity={state:identity.error?'error':identity.status==='anonymous'?'anonymous':'unknown'};
 const v=projectAccountPage(r.id,r.params,accountIdentity);
 const sections={account:['你的遊玩與創作空間','評測、通知與創作者工作台集中於此。'],settings:['介面與帳號設定','帳號設定服務尚未接通；此原型不修改登入保存或權限。'],notifications:['通知收件匣','登入且確認本人權限後，才能查閱通知與重新確認目的地。'],my_reviews:['管理你的評測','公開、草稿與私人保存分開處理；舊七維資料不會遷移或混算。']}[r.id];
 return header(r.id)+`<section class="panel"><h2>${esc(sections[0])}</h2><p>${esc(sections[1])}</p><p role="status">${esc(v.notice)}</p><details class="preview-details"><summary>此預覽的資料範圍</summary><p class="muted">這份畫面原型尚未接通登入與私人資料，不會顯示假登入或替你新增評分。</p></details><nav class="tabs" aria-label="帳號區導覽">${['account','profile','play_history','level','my_reviews','notifications','settings'].map(id=>link(id,title(id))).join('')}</nav><div class="actions">${v.links.filter(l=>l.routeId!=='auth').map(l=>link(l.routeId,l.label,l.params,'button quiet')).join('')}</div>${link('home','返回首頁',{},'button quiet')}</section>${r.id==='my_reviews'?reviewStatusContent(r):''}`;
}
function reviewPage(r){
 const g=known(r.params.game_id);
 if(!g||g.build!==r.params.build)return header(r.id)+empty('作品版本不可用','未確認作品版本，不會載入其他作品的評測。');
 const dimensions=[['playfulness','好玩度'],['art','美術'],['controls','操作'],['creativity','創意'],['completeness','完成度']];
 return header(r.id,g.title)+`<section class="panel review-surface"><div class="section-head"><h2>分享這次遊玩感受</h2>${link('game','返回作品',{game_id:g.game,build:g.build})}</div><p role="status">${identity.status==='unknown'?'正在確認登入狀態。':'這份原型未開放登入與評測寫入。'}下方為新五維介面，尚未接入保存服務。</p><div class="review-dimensions">${dimensions.map(([id,label])=>`<fieldset disabled><legend>${label}</legend><div class="star-row">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="v21-${id}" value="${n}" aria-label="${label} ${n} 分"><img src="./assets/rating/rating-faceted-star-unselected.svg" width="32" height="32" alt=""><span class="sr-only">${n} 分</span></label>`).join('')}</div></fieldset>`).join('')}</div><fieldset disabled><legend>你會推薦這款遊戲嗎？</legend><div class="actions"><label><input type="radio" name="recommendation" value="yes">會</label><label><input type="radio" name="recommendation" value="no">不會</label></div></fieldset><label class="review-text-label" for="review-text">補充你的體驗</label><textarea id="review-text" disabled rows="5" placeholder="新評測保存服務尚未接通"></textarea><details class="build-details"><summary>評測版本與保存方式</summary><p>新五維與推薦分別計算，不與舊七維混合。修改須經伺服器確認，文字修訂保留受權限控制的歷史。目前沒有送出任何評測。</p><code>${esc(g.build)}</code></details>${link('play','返回試玩',{game_id:g.game,build:g.build},'button quiet')}</section>`;
}


function creatorContent(r){
 const v=projectCreatorPage(r.id,r.params,{state:identity.error?'error':identity.status==='anonymous'?'anonymous':'unknown'},{disabled:true},compiled);
 return header(r.id)+`<section class="panel"><p role="status">${esc(v.notice)}</p><p class="muted">靜態展示介面；私人資料、上傳、投稿與金流服務尚未開放。</p><nav class="tabs" aria-label="創作者區導覽">${v.links.filter(l=>l.routeId!=='auth').map(l=>link(l.routeId,l.label,l.params)).join('')}</nav></section><div class="creator-sections">${v.sections.map(section=>`<section class="panel"><h2>${esc(section.title)}</h2>${section.notice?`<p class="muted">${esc(section.notice)}</p>`:''}${section.links?`<div class="actions">${section.links.map(l=>link(l.routeId,l.label,l.params,'button quiet')).join('')}</div>`:''}${section.actions?`<div class="actions">${section.actions.map(a=>`<button class="button quiet" disabled title="${esc(a.reason)}">${esc(a.label)}</button>`).join('')}</div><small>尚未接通安全服務，不會提交或執行。</small>`:''}</section>`).join('')}</div>`;
}
function helpCards(){const result=helpResults({q:state.helpQuery||'',group:state.helpGroup||'all'});return result.status==='ready'?result.items.map(a=>`<details class="help-article"><summary>${esc(a.title)}</summary><p>${esc(a.body)}</p><div class="actions">${a.links.map(l=>link(l.id,l.label,{},'button quiet')).join('')}</div></details>`).join(''):empty('沒有符合的說明','試試其他關鍵字，或切回全部分類。');}
function supportContent(r){
 if(r.id==='platform_info')return header(r.id)+`<section class="panel support-intro"><span class="badge">AI 遊戲試玩平台</span><h2>讓創作被玩到，也讓回饋找得到方向。</h2><p>從一款遊戲開始，親自試玩，再分享你的體驗。這裡以 AI 輔助創作為主；平台仍在依 v2.1 藍圖製作。</p><div class="actions">${link('explore','探索作品',{},'button primary')}${link('creator_intro','了解創作者流程',{},'button quiet')}</div></section><div class="support-grid"><section class="panel"><h2>給玩家</h2><p>作品介紹、指定版本試玩與評測分開呈現。沒有資料時保留誠實空態，不用虛構排行榜代替。</p>${link('help','查看試玩說明')}</section><section class="panel"><h2>給創作者</h2><p>投稿、作品管理、版本發布與私人分析有各自的流程。資格與服務尚未接通的操作會明確停用。</p>${link('creator_intro','查看流程')}</section><section class="panel"><h2>目前是靜態展示版</h2><p>這是獨立公開的靜態展示，不提供真實登入、私人資料、評測保存、投稿或金流；不影響任何原服務。</p>${link('help','了解候選使用方式')}</section><section class="panel"><h2>條款與公開支援</h2><p>政策分區已保留，正文仍待核定。未核定草稿不會被當成已生效條款。</p>${link('policies','查看政策狀態',{tab:'policies'})}</section></div>`;
 if(r.id==='help')return header(r.id,'靜態展示版操作說明；不是已上線服務承諾。')+`<section class="panel support-search"><h2>想先了解哪一步？</h2><form id="help-search" role="search"><label for="help-query">搜尋說明</label><div class="actions"><input id="help-query" type="search" value="${esc(state.helpQuery||'')}" placeholder="例如：試玩、版本、評測"><button class="button primary" type="submit">搜尋</button><button class="button quiet" id="help-clear" type="button">清除</button></div></form><div class="tabs" aria-label="說明分類">${HELP_GROUPS.map(([id,label])=>`<button type="button" id="help-group-${id}" data-help-group="${id}" aria-pressed="${(state.helpGroup||'all')===id}">${esc(label)}</button>`).join('')}</div></section><section id="help-results" class="help-list" aria-live="polite">${helpCards()}</section><div class="actions">${link('platform_info','平台資訊',{},'button quiet')}${link('home','返回首頁',{},'button quiet')}</div>`;
 const v=policyView(r.params.section);return header('policies','政策正文尚未核定，不代表已發布或接受條款。')+(r.policyNotice?`<p class="notice" role="status">${esc(r.policyNotice)}</p>`:'')+`<nav class="tabs" aria-label="政策分區">${v.sections.map(x=>link('policies',x.title,{tab:'policies',section:x.id})).join('')}</nav><div class="support-grid">${v.sections.filter(x=>!v.selected||x.id===v.selected).map(x=>`<section class="panel"><span class="badge">${esc(x.status)}</span><h2>${esc(x.title)}</h2><p>${esc(x.body)}</p></section>`).join('')}</div><div class="actions">${link('policies','政策總覽',{tab:'policies'},'button quiet')}${link('platform_info','返回平台資訊',{},'button quiet')}${link('help','操作說明',{},'button quiet')}</div>`;
}
function routeForView(raw){const result=resolveRoute(raw,compiled);if(result.ok)return result;try{const u=new URL(raw,'https://route.invalid');if(u.origin==='https://route.invalid'&&u.pathname==='/about'&&u.searchParams.get('tab')==='policies'&&u.searchParams.getAll('tab').length===1&&u.searchParams.getAll('section').length===1&&[...u.searchParams.keys()].every(k=>['tab','section'].includes(k))){return {...resolveRoute('/about?tab=policies',compiled),policyNotice:'該政策分區無法定位，以下保留政策總覽。'};}}catch{}return result;}
function publicDetailReady(v,r){
 const back=`<a class="button quiet" href="#${esc(v.returnTo.href)}">${r.id==='review_history'?'返回原評測':'返回上層'}</a>`;
 if(r.id==='creator_public')return `<section class="panel public-profile"><span class="badge">${esc(v.fixtureLabel)}</span><h2>${esc(v.record.displayName)}</h2><p>${esc(v.record.bio)}</p></section><section class="panel"><h2>公開作品</h2><p>${esc(v.notice)}</p>${v.items.map(x=>`<p><a href="#${esc(x.destination.href)}">${esc(x.title)}</a></p>`).join('')}${back}</section>`;
 const labels={playfulness:'好玩度',art:'美術',controls:'操作',creativity:'創意',completeness:'完成度'};
 const time=x=>{const d=new Date(x);return Number.isFinite(d.getTime())?d.toISOString().slice(0,16).replace('T',' ')+' UTC':'示意時間未提供';};
 const content=r.id==='review_history'?`<h2>可公開的文字紀錄</h2>${v.items.map(x=>`<article class="public-record"><small>示意時間 ${esc(time(x.saved_at))}</small><p class="record-body">${esc(x.text)}</p></article>`).join('')}${v.status==='empty'?`<p>${esc(v.notice)}</p>`:''}`:`<h2>設計示意評測</h2><div class="public-rating-grid">${Object.entries(labels).map(([key,label])=>`<div><h3>${label}</h3><div class="read-only-stars" aria-label="設計示意 ${label} ${esc(v.record.stars[key])} 分">${[1,2,3,4,5].map(n=>`<img src="./assets/rating/rating-faceted-star-${n<=v.record.stars[key]?'selected':'unselected'}.svg" width="24" height="24" alt="">`).join('')}</div><small>設計示意 · ${esc(v.record.stars[key])} / 5</small></div>`).join('')}</div><p class="notice">設計示意推薦：${v.record.recommendation===true?'推薦':v.record.recommendation===false?'不推薦':'未提供'}</p><p class="record-body">${esc(v.record.text)}</p><small>示意時間 ${esc(time(v.record.saved_at))}</small><div class="actions">${v.links.map(l=>`<a class="button quiet" href="#${esc(l.href)}">${esc(l.label)}</a>`).join('')}</div>`;
 return `<div class="review-detail-layout"><section class="panel"><span class="badge">${esc(v.fixtureLabel)}</span>${content}<div class="actions">${back}</div></section><aside class="panel"><h2>評測與修訂</h2><p>這篇內容僅用來檢查閱讀動線，不代表真實玩家評分。修改同一篇評測不增加票數。</p><p>只顯示允許公開的文字紀錄，不顯示隱藏紀錄或其數量。</p>${link('help','了解評測與版本')}</aside></div>`;
}
function publicDetailContent(r){
 const v=state.publicDemo?getPublicDetailDemo(r.id,r.params):projectPublicDetail(r.id,r.params,{disabled:true},{compiled});
 const demo=`<section class="demo-switch"><strong>${state.publicDemo?'設計示意，非真實玩家資料':'此頁尚未接通正式內容'}</strong><p>示意分數不參與任何統計；此處只有預先編寫的非個人示意文字。</p><button class="button quiet" id="toggle-public-demo">${state.publicDemo?'關閉設計示意':'查看設計示意'}</button><div class="actions">${link('public_review','示意評測',{game_id:'bibi-dice',review_id:'demo-interface-review'},'button quiet')}${link('creator_public','示意創作者',{creator_id:'demo-interface-creator'},'button quiet')}</div></section>`;
 if(state.publicDemo&&(v.status==='ready'||v.status==='empty'))return header(r.id)+demo+publicDetailReady(v,r);
 if(r.id==='creator_public')return header(r.id)+demo+`<section class="panel public-profile"><span class="badge">公開創作者檔案</span><h2>認識創作者，探索公開作品</h2><p>此處僅顯示創作者允許公開的簡介與已發布作品。登入與否都不會增加私人內容的可見範圍。</p><p class="notice" role="status">${esc(v.notice)}</p></section><section class="panel"><h2>已發布作品</h2><p class="muted">尚未取得可信公開作品資料；不會把讀取未接通顯示為零作品，也不列入私人草稿。</p>${link('explore','返回作品探索',{},'button quiet')}</section>`;
 const g=known(r.params.game_id),history=r.id==='review_history';
 return header(r.id,g?.title||'公開評測')+demo+`<div class="review-detail-layout"><section class="panel"><span class="badge">${history?'允許公開的文字紀錄':'玩家公開評測'}</span><h2>${history?'文字修改歷史':'這次試玩的感受'}</h2><p class="notice" role="status">${esc(v.notice)}</p><p class="muted">${history?'沒有取得可公開版本前，不顯示舊文字或歷史筆數。':'沒有取得評測前，不顯示作者、分數或推薦結果。'}</p><div class="actions">${g?link('game_reviews','返回作品評測',{game_id:g.game},'button quiet'):link('explore','返回探索',{},'button quiet')}</div></section><aside class="panel"><h2>${history?'哪些紀錄可以看？':'評測如何更新？'}</h2><p>${history?'每一版文字都需重新確認可見性。私稿、被隱藏或不允許公開的版本不會出現在這裡。':'新五維、推薦與文字修改需經伺服器確認。文字修改才會出現「已編輯」入口；修改同一篇評測不會增加票數。'}</p><p class="muted">舊七維與新五維分開；此頁沒有寫入或重算評分。</p>${link('help','了解評測與版本')}</aside></div>`;
}
function memberDetailContent(r){
 const v=projectMemberDetailPage(r.id,r.params,{state:identity.error?'error':identity.status==='anonymous'?'anonymous':'unknown'},{disabled:true},compiled);
 const profile=r.id==='profile';
 return header(r.id)+`<section class="panel"><span class="badge">僅限本人資料</span><h2>${profile?'公開檔案與私人資料分開管理':'回到你曾經玩過的版本'}</h2><p role="status">${esc(v.notice)}</p><details class="preview-details"><summary>此預覽的資料範圍</summary><p class="muted">靜態展示版未接通本人資料服務；不會以其他帳號或示範紀錄填入。</p></details><nav class="tabs" aria-label="本人資料導覽">${link('account','帳號總覽')}${link('profile','個人資料')}${link('play_history','試玩紀錄')}${link('my_reviews','我的評測')}</nav></section>${profile?`<div class="support-grid"><section class="panel"><h2>公開檔案欄位</h2><p>個人資料編輯尚未開放，這裡不會預先收集資料。</p><button class="button quiet" disabled>編輯尚未開放</button></section><section class="panel"><h2>私人帳戶欄位</h2><p>私人帳戶資訊不會公開顯示；目前尚未載入本人資料。</p>${link('settings','返回個人設定',{},'button quiet')}</section></div>`:`<section class="panel"><h2>本人試玩紀錄</h2><p>每筆紀錄保留當時的作品與版本。再次遊玩前會重新確認是否可用，不會自動替換版本或啟動遊戲。</p><div class="history-columns" aria-hidden="true"><span>作品與版本</span><span>試玩時間</span><span>可用操作</span></div><p class="notice">尚未讀取紀錄；這不是零筆紀錄。</p>${link('play_list','瀏覽展示作品',{},'button primary')}</section>`}`;
}
function entryContent(r){
 const who={state:identity.error?'error':identity.status==='anonymous'?'anonymous':'unknown',scopeKey:null};
 if(r.id==='auth'){
  const v=projectAuthEntry(r.params,who,{compiled,providerEnabled:false});
  return header(r.id,'確認身份後再返回原來的頁面。')+`<section class="panel"><h2>登入狀態</h2><p role="status">${esc(v.notice)}</p><p class="muted">這份靜態展示未接入登入提供者；不會新增授權或顯示假登入。</p><div class="actions"><a class="button quiet" href="#${esc(v.returnIntent.href)}">返回原頁面</a>${link('account','帳號入口',{},'button quiet')}</div></section>`;
 }
 const c=createEntryFormController({compiled,validateScope:({game,build})=>catalog.some(g=>g.game===game&&g.build===build)});c.setIdentity(who);const v=c.open(r.id,r.params),bug=r.id==='bug_report';
 return header(r.id,bug?'回報會綁定指定作品與版本，不會換成其他版本。':'分享作品體驗與討論；投稿服務尚未開放。')+`<div class="support-layout"><section class="panel"><h2>${bug?'回報範圍':'新增討論'}</h2><p role="status">${esc(v.notice)}</p>${bug?`<dl><dt>作品</dt><dd>${esc(known(r.params.game)?.title||'目前無法確認')}</dd><dt>版本</dt><dd>${esc(r.params.build||'未指定')}</dd></dl>`:''}<p class="muted">表單欄位與寫入契約尚未接通，這裡不收集或送出內容。</p><button class="button primary" disabled>${bug?'送出回報':'發表討論'}（尚未開放）</button></section><aside class="panel"><h2>繼續瀏覽</h2><div class="actions">${link('community','返回社群',{},'button quiet')}${link('play_list','選擇試玩作品',{},'button quiet')}</div><p>登入及資料確認失敗不會阻止你瀏覽公開頁面。</p></aside></div>`;
}
function navSection(r,mobile){
 if(['home'].includes(r.id))return 'home';
 if(['play','play_list'].includes(r.id))return mobile?'play_list':'explore';
 if(['my_reviews','review_editor'].includes(r.id))return 'my_reviews';
 if(['explore','search','category','tag','creator_public','game','game_instructions','game_versions','game_reviews','public_review','review_history'].includes(r.id))return 'explore';
 if(CREATOR_PAGE_IDS.includes(r.id)||WORKSPACE_DETAIL_IDS.includes(r.id)&&r.id!=='level')return mobile?'account':'creator';
 if(['account','auth','profile','play_history','level','settings','notifications'].includes(r.id))return mobile?'account':r.id==='settings'?'settings':null;
 return null;
}
function workspaceBack(r){
 if(r.id==='admin_review_item')return link('admin_review_queue','返回審核清單',{},'button quiet');
 if(r.params.game_id&&r.id==='work_preview'&&r.params.build)return link('work_version','返回原版本',{game_id:r.params.game_id,build_id:r.params.build},'button quiet');
 if(r.params.game_id&&r.id==='analytics_feedback'&&r.params.build)return link('work_version','對照同版本',{game_id:r.params.game_id,build_id:r.params.build},'button quiet');
 if(r.params.game_id)return link('work','返回作品管理',{game_id:r.params.game_id},'button quiet');
 return link('account','返回帳號',{},'button quiet');
}
function workspaceDetailContent(r){
 const v=projectWorkspaceDetailPage(r.id,r.params,{state:identity.error?'error':identity.status==='anonymous'?'anonymous':'unknown',scopeKey:null,roles:[]},{disabled:true},compiled);
 return header(r.id)+`<p class="scope-notice" role="status">${esc(v.notice)}</p><div class="support-layout">${v.sections.map(section=>`<section class="panel"><h2>${esc(section.title)}</h2><p>${esc(section.notice||'')}</p>${(section.metrics||[]).map(m=>`<article class="metric-explanation"><h3>${esc(m.title)}</h3><p>${esc(m.notice)}</p><span class="muted">尚無可顯示的統計</span></article>`).join('')}${(section.actions||[]).map(a=>`<button class="button quiet" disabled>${esc(a.label)}</button>`).join('')}</section>`).join('')}</div><div class="actions">${workspaceBack(r)}${link('help','說明與支援',{},'button quiet')}</div>`;
}
function generic(r){if(['auth','discussion_new','bug_report'].includes(r.id))return entryContent(r);if(WORKSPACE_DETAIL_IDS.includes(r.id))return workspaceDetailContent(r);if(['creator_public','public_review','review_history'].includes(r.id))return publicDetailContent(r);if(['profile','play_history'].includes(r.id))return memberDetailContent(r);if(['platform_info','help','policies'].includes(r.id))return supportContent(r);if(CREATOR_PAGE_IDS.includes(r.id))return creatorContent(r);if(r.id==='review_editor')return reviewPage(r);if(accountRoutes.has(r.id))return accountContent(r);if(publicRoutes.has(r.id))return publicContent(r);if(r.contract.role!=='ALL'&&r.contract.role!=='GUEST')return privatePage(r);let text={creator_intro:'先了解投稿資格、作品與版本管理流程。投稿服務目前未開放；不會上傳或發布任何內容。',platform_info:'這裡讓玩家探索 AI 輔助創作遊戲，讓創作者收集體驗回饋。平台名稱仍為暫名。',help:'從探索挑選作品，確認版本後按查看試玩展示。返回作品頁可查看評測入口。此展示不提供遊戲執行、正式投稿或金流。',policies:'條款、隱私及社群／投稿政策正文尚未核定。這不是可勾選接受的正式條款。',account:'目前為隔離畫面與路由候選；未接入本人帳號或真實評分。本展示不含真實驗收資料。',auth:'此候選未接入 Google 登入操作。沒有建立新授權，也不顯示假登入成功。',community:'尚無公開討論。社群投稿與回報仍未開放，舊匿名表單維持停用。',topics:'尚無可驗證的熱門話題與排序資料。',announcement:'此公告目前無法使用。',public_review:'此評測目前無法使用。',review_history:'此評測目前無法使用。'}[r.id]||'此目的地已保留，完整互動與資料服務尚未接通。';return header(r.id)+`<section class="panel"><p>${esc(text)}</p>${r.id==='account'?`<div class="tabs">${link('my_reviews','我的評測')}${link('notifications','通知')}${link('creator','創作者中心')}${link('help','說明與支援')}</div>`:''}${r.id==='creator_intro'?link('creator_apply','申請資格說明',{},'button primary'):''}${r.id==='policies'?`<div class="tabs">${['terms','privacy','community','submission'].map((x,i)=>link('policies',['使用條款','隱私','社群規範','投稿政策'][i],{section:x})).join('')}</div>`:''}${link('explore','探索遊戲 →',{},'button quiet')}</section>`;}
function syncNavigation(r){for(const a of document.querySelectorAll('[data-nav]')){a.href=href(a.dataset.nav);const selected=r.ok?navSection(r,!!a.closest?.('.mobile-nav')):null;if(a.dataset.nav===selected)a.setAttribute('aria-current',a.dataset.nav===r.id?'page':'location');else a.removeAttribute('aria-current');}}
function render({focus=true}={}){if(!compiled)return;requestGeneration++;const r=routeForView(location.hash.slice(1)||'/');syncNavigation(r);if(r.id!=='my_reviews'){state.reviewLocalTab='all';state.reviewFocusTarget=null;}if(!r.ok){$('view').innerHTML='<header class="page-header"><h1 tabindex="-1" id="route-title">連結無法開啟</h1><p>此網址不符合目的地契約；不是首頁內容載入失敗。</p></header>'+empty('請選擇可用目的地','沒有替你更換作品、版本或帳號。')+link('home','返回首頁',{},'button primary');if(focus)$('route-title')?.focus({preventScroll:true});return;}if(state.catalog==='error'&&['home','explore','search','category','tag','play_list','game','game_instructions','game_versions','game_reviews','play'].includes(r.id)){ $('view').innerHTML=header(r.id)+empty('遊戲目錄載入失敗','其他公開說明仍可瀏覽。')+'<button class="button quiet" id="retry-catalog">重新讀取目錄</button>'; $('retry-catalog').onclick=loadCatalog;if(focus)$('route-title')?.focus({preventScroll:true});return; }
 $('view').innerHTML=r.id==='home'?home():['explore','search','category','tag','play_list'].includes(r.id)?explore(r):['game','game_instructions','game_versions','game_reviews'].includes(r.id)?gamePage(r):r.id==='play'?playPage(r):generic(r);

 for(const a of $('view').querySelectorAll('.tabs a'))if(a.dataset?.reviewState===undefined&&a.hash===location.hash)a.setAttribute('aria-current','page');
 for(const img of $('view').querySelectorAll('img'))img.addEventListener('error',()=>{const p=document.createElement('span');p.textContent='封面暫時無法載入';img.replaceWith(p);},{once:true});
 for(const b of $('view').querySelectorAll('[data-filter]'))b.onclick=()=>{for(const other of $('view').querySelectorAll('[data-filter]'))other.setAttribute('aria-pressed',String(other===b));$('home-cards').innerHTML=cards(b.dataset.filter==='playable'?catalog.filter(g=>!g.disabled):catalog);};
 for(const b of $('view').querySelectorAll('[data-search-tab]')){b.onclick=()=>{state.searchTab=b.dataset.searchTab;render({focus:false});$(state.searchTab)?.focus();};b.onkeydown=e=>{const ids=['search_games','search_tags','search_creators'];let at=ids.indexOf(b.dataset.searchTab);if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();at=e.key==='Home'?0:e.key==='End'?2:(at+(e.key==='ArrowRight'?1:2))%3;state.searchTab=ids[at];render({focus:false});$(state.searchTab)?.focus();}};}
 if((publicRoutes.has(r.id)||['creator_public','public_review','review_history'].includes(r.id))&&$('toggle-public-demo'))$('toggle-public-demo').onclick=()=>{state.publicDemo=!state.publicDemo;render({focus:false});$('toggle-public-demo')?.focus();};
 for(const b of $('view').querySelectorAll('[data-review-memory]'))b.onclick=()=>selectReviewMemoryTab(b.dataset.reviewMemory);
 for(const a of $('view').querySelectorAll('[data-review-state]'))a.onclick=()=>{state.reviewLocalTab='all';if(a.hash===location.hash){render({focus:false});$('review-filter-'+a.dataset.reviewState)?.focus();}};
 if($('help-search')&&r.id==='help'){$('help-search').onsubmit=e=>{e.preventDefault();state.helpQuery=$('help-query').value; $('help-results').innerHTML=helpCards();};$('help-clear').onclick=()=>{state.helpQuery='';$('help-query').value='';$('help-results').innerHTML=helpCards();$('help-query').focus();};for(const b of $('view').querySelectorAll('[data-help-group]'))b.onclick=()=>{state.helpGroup=b.dataset.helpGroup;render({focus:false});$('help-group-'+state.helpGroup)?.focus();};}
 if(publicRoutes.has(r.id))mountPublicContent(r);
 if(r.id==='my_reviews'&&state.reviewFocusTarget){$(state.reviewFocusTarget)?.focus({preventScroll:true});state.reviewFocusTarget=null;}else if(focus)$('route-title')?.focus({preventScroll:true});
}
async function loadCatalog(){catalog=structuredClone(PUBLIC_CATALOG);state.catalog='ready';render({focus:false});}
function entryState(s){const priorIdentity=identity.status,priorError=!!identity.error;identity={error:false,status:'anonymous'};$('account-link').textContent='匿名展示';$('identity-note').replaceChildren();if(s.error){$('identity-note').append(document.createTextNode('登入狀態暫時無法確認。'));const b=document.createElement('button');b.textContent='重試';b.onclick=()=>entry.retry();$('identity-note').append(b);}const dialog=$('entry-dialog');if(s.popup?.kind==='H01'){const c=s.popup.copy;$('entry-title').textContent=c.title;$('entry-copy').textContent=c.description;$('entry-enter').textContent=c.enter;$('entry-leave').textContent=c.leave;$('entry-footnote').textContent=c.footnote;if(!dialog.open){previousFocus=document.activeElement;dialog.showModal();$('entry-enter').focus();}}else if(dialog.open)dialog.close();if(compiled&&(priorIdentity!==identity.status||priorError!==!!identity.error)){const r=resolveRoute(location.hash.slice(1)||'/',compiled);if(r.ok&&(['auth','discussion_new','bug_report'].includes(r.id)||WORKSPACE_DETAIL_IDS.includes(r.id)||CREATOR_PAGE_IDS.includes(r.id)||accountRoutes.has(r.id)||publicRoutes.has(r.id)||(r.contract.role!=='ALL'&&r.contract.role!=='GUEST')))render({focus:false});}}
function closeEntry(){entry.dismiss();$('entry-dialog').close();if(previousFocus?.isConnected&&previousFocus!==document.body)previousFocus.focus();else $('route-title')?.focus();}
function skipContent(event){event.preventDefault();$('content').focus({preventScroll:true});$('content').scrollIntoView({block:'start'});}
$('entry-close').onclick=closeEntry;$('entry-enter').onclick=closeEntry;$('entry-dialog').addEventListener('cancel',e=>{e.preventDefault();closeEntry();});$('entry-leave').onclick=()=>{entry.dismiss();$('entry-dialog').close();$('view').innerHTML=header('home')+'<section class="panel"><h2>想離開，隨時可以</h2><p>你可以關閉瀏覽器分頁；網站不會替你關閉或跳往其他網站。</p><button class="button primary" id="return-home">返回首頁</button></section>';$('return-home').onclick=()=>{if(location.hash==='#/'||!location.hash)render();else navigation.navigate('/');};$('return-home').focus();};
$('search').onsubmit=e=>{e.preventDefault();const q=$('query').value.trim();navigation.navigate(q?buildRoute('search',{q},compiled):buildRoute('explore',{},compiled));};
document.querySelector('.skip').addEventListener('click',skipContent);
try{compiled=compileRoutes(ROUTES,DISPLAY_IDS);nodes=PAGE_LABELS;for(const a of document.querySelectorAll('[data-nav]'))a.href=href(a.dataset.nav);$('account-link').href=href('account');document.querySelector('.creator-callout a').href=href('creator_intro');await loadCatalog();navigation=createRouteNavigation({win:window,doc:document,resolve:routeForView,render});entry=createHomeEntryController({waitForIdentityReady:async()=>{},verifyIdentity:async()=>{if(ANONYMOUS_DEMO.actor!==null||ANONYMOUS_DEMO.capabilities.rate!==false)throw Error('Invalid static demo state');return {actor:{authenticated:false}};},loadFixtureMessages:async()=>[],isPlayableDestination:()=>false,promptLedger:createPromptLedger(memoryOnly),onChange:entryState});await entry.refresh();}catch{$('view').textContent='展示頁初始化失敗，請重新整理；沒有登入、送出或保存任何資料。';}
