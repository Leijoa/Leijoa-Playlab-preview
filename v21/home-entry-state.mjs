'use strict';
const AI_COPY = Object.freeze({
  title: '前方 AI 遊戲大量出沒',
  description: '靜態展示版／非正式服務：歡迎瀏覽 AI 遊戲平台的介面。本展示不提供登入或遊戲執行。',
  enter: '瀏覽靜態展示', leave: '離開方式',
  footnote: '不收集評測或私人資料；只有點選商店連結才會前往外部網站。'
});

function createHomeEntryController({waitForIdentityReady, verifyIdentity, loadFixtureMessages,
  isPlayableDestination, promptLedger, onChange=()=>{}, now=Date.now, timeoutMs=10000,
  schedule=setTimeout, cancel=clearTimeout}) {
  for (const fn of [waitForIdentityReady,verifyIdentity,loadFixtureMessages,isPlayableDestination]) {
    if (typeof fn !== 'function') throw new TypeError('Explicit identity and fixture adapters required');
  }
  if (!Number.isFinite(timeoutMs)||timeoutMs<=0) throw new TypeError('Positive timeout required');
  if(typeof promptLedger?.claim!=='function')throw new TypeError('Explicit per-tab prompt ledger required');
  let generation=0, stopped=false, abort, expiration;
  let state=Object.freeze({homeVisible:true,identity:'unknown',phase:'idle',popup:null,error:null,retryAvailable:false});
  const publish=patch=>{state=Object.freeze({...state,...patch,homeVisible:true});onChange(state);return state;};
  const active=g=>!stopped&&g===generation;
  function clearExpiry(){if(expiration!==undefined){cancel(expiration);expiration=undefined;}}
  function beginIdentityChange(){
    if(stopped)return null;
    generation++;abort?.abort();clearExpiry();abort=new AbortController();
    publish({identity:'unknown',phase:'identity-loading',popup:null,error:null,retryAvailable:false});
    return generation;
  }
  async function bounded(work, signal){
    let timer, listener;
    try{return await Promise.race([
      Promise.resolve().then(work),
      new Promise((_,reject)=>{timer=schedule(()=>reject(Error('timeout')),timeoutMs);}),
      new Promise((_,reject)=>{listener=()=>reject(Error('obsolete'));if(signal.aborted)listener();else signal.addEventListener('abort',listener,{once:true});})
    ]);}finally{if(timer!==undefined)cancel(timer);if(listener)signal.removeEventListener('abort',listener);}
  }
  function validMessage(m){
    if(!m||m.fixture!==true||m.audience!=='authenticated'||!['announcement','recommendation'].includes(m.type))return false;
    if(typeof m.message_id!=='string'||!m.message_id||typeof m.content_version!=='string'||!m.content_version||typeof m.title!=='string'||!m.title||typeof m.body!=='string')return false;
    if(!Number.isFinite(m.startsAt)||!Number.isFinite(m.endsAt)||m.startsAt>now()||m.endsAt<=now())return false;
    const d=m.destination;
    if(!d||typeof d!=='object')return false;
    return m.type==='announcement' ? d.kind==='announcement'&&typeof d.id==='string'&&d.id.length>0
      : d.kind==='game'&&typeof d.game_id==='string'&&typeof d.build_id==='string'&&isPlayableDestination(d)===true;
  }
  function messageView(m){
    return Object.freeze({kind:'H04',fixtureLabel:'測試 fixture，非正式公告',message_id:m.message_id,
      content_version:m.content_version,type:m.type,title:m.title,body:m.body,
      destination:Object.freeze(m.type==='announcement'?{kind:'announcement',id:m.destination.id}:
        {kind:'game',game_id:m.destination.game_id,build_id:m.destination.build_id})});
  }
  async function run(g){
    if(!active(g))return state;
    const signal=abort.signal;
    try{
      const me=await bounded(async()=>{await waitForIdentityReady({signal});if(!active(g))throw Error('obsolete');return verifyIdentity({signal});},signal);
      if(!active(g))return state;
      if(!me||typeof me.actor?.authenticated!=='boolean')throw Error('identity contract unknown');
      if(!me.actor.authenticated){publish({identity:'anonymous'});let show;try{show=promptLedger.claim(null);}catch{return publish({phase:'prompt-error',popup:null,error:'提示狀態暫時無法確認',retryAvailable:true});}return publish({phase:'ready',popup:show?Object.freeze({kind:'H01',copy:AI_COPY}):null,error:null,retryAvailable:false});}
      publish({identity:'authenticated',phase:'message-loading',popup:null,error:null,retryAvailable:false});
    }catch{
      if(active(g))publish({identity:'unknown',phase:'identity-error',popup:null,error:'登入狀態暫時無法確認',retryAvailable:true});
      return state;
    }
    try{
      const messages=await bounded(()=>loadFixtureMessages({signal}),signal);
      if(!active(g))return state;
      if(!Array.isArray(messages))throw Error('message contract unknown');
      const chosen=messages.find(m=>validMessage(m)&&promptLedger.claim(m));
      publish({phase:'ready',popup:chosen?messageView(chosen):null,error:null,retryAvailable:false});
      if(chosen){const expire=()=>{if(!active(g))return;const remaining=chosen.endsAt-now();if(remaining>0){expiration=schedule(expire,Math.min(remaining,2147483647));return;}expiration=undefined;publish({popup:null});};expiration=schedule(expire,Math.min(chosen.endsAt-now(),2147483647));}
    }catch{if(active(g))publish({phase:'message-error',popup:null,error:'測試訊息載入失敗',retryAvailable:true});}
    return state;
  }
  let runningGeneration, runningPromise;
  function settle(g){if(!active(g))return Promise.resolve(state);if(runningGeneration===g)return runningPromise;runningGeneration=g;runningPromise=run(g);return runningPromise;}
  function refresh(){const g=beginIdentityChange();return g===null?Promise.resolve(state):settle(g);}
  function dismiss(){if(stopped)return state;generation++;abort?.abort();clearExpiry();return publish({phase:'ready',popup:null,error:null,retryAvailable:false});}
  function dispose(){stopped=true;generation++;abort?.abort();clearExpiry();}
  return Object.freeze({snapshot:()=>state,beginIdentityChange,settle,refresh,retry:refresh,dismiss,dispose});
}
export {AI_COPY,createHomeEntryController};
