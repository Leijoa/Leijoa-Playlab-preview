// Viewport state lives only in this module's memory. History stores an opaque
// entry token, never scroll coordinates, search criteria, account data or drafts.
const ENTRY_KEY='playlabViewportEntry';
const GAME_TABS=new Set(['game','game_instructions','game_versions','game_reviews']);
const EXPLORE_FILTERS=new Set(['explore','category','tag']);
const family=r=>GAME_TABS.has(r.id)?'game':EXPLORE_FILTERS.has(r.id)?'explore':r.id;

export function routeScrollPolicy(from,to){
 if(!from?.ok||!to?.ok||family(from)!==family(to))return 'top';
 const group=family(to),keys=group==='game'?['game_id','build']:
  ['play','review_editor'].includes(group)?['game_id','build']:
  group==='search'?['q']:group==='announcement'?['version']:[];
 // A different path resource is a new page, not a query/filter update.
 const pathKeys=new Set([...(from.contract?.parameters||[]),...(to.contract?.parameters||[])]
  .filter(p=>p.location==='path').map(p=>p.name));
 return [...keys,...pathKeys].some(k=>from.params[k]!==to.params[k])?'top':'preserve';
}

export function createRouteNavigation({win,doc,resolve,render}){
 const history=win.history,entries=new Map();
 const supportsHistory=!!(history?.replaceState&&history?.pushState);
 const priorRestoration=history?.scrollRestoration;
 const session=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 let serial=0,active,frame=null,generation=0,pending=null,currentMode='initial';
 const raw=()=>win.location.hash.slice(1)||'/';
 const token=()=>session+'-'+(++serial);
 const position=()=>({x:win.scrollX||0,y:win.scrollY||0});
 const focusId=()=>doc.activeElement?.id||
  (doc.activeElement?.getAttribute?.('href')?.startsWith('#/')?{href:doc.activeElement.getAttribute('href')}:null);
 const stamp=key=>({...history.state,[ENTRY_KEY]:key});
 const record=(key,url,point=position(),focus=null)=>({key,url,point,focus});
 const remember=()=>{
  if(active)entries.set(active.key,record(active.key,active.url,pending?.point||position(),pending?.focus??focusId()));
 };
 const cancel=()=>{generation++;if(frame!==null)win.cancelAnimationFrame?.(frame);frame=null;pending=null;};
 function place(point,focus){
  // The heading/control is focused without letting focus fight scroll policy.
  const target=typeof focus==='string'?doc.getElementById(focus):focus?.href?
   [...(doc.getElementById('view')?.querySelectorAll('a[href]')||[]),...(doc.querySelectorAll?.('a[href]')||[])]
    .find(a=>a.getAttribute('href')===focus.href):null;
  (target||(focus?doc.getElementById('route-title'):null))?.focus({preventScroll:true});
  win.scrollTo?.({left:point.x,top:point.y,behavior:'instant'});
 }
 function show(next,{mode='top',focus=null}={}){
  cancel();active=next;currentMode=mode;
  const point=mode==='restore'?next.point:mode==='preserve'?position():{x:0,y:0};
  render({focus:mode==='top'});
  const targetFocus=mode==='restore'?next.focus:focus;
  place(point,targetFocus);
  entries.set(next.key,record(next.key,next.url,point,targetFocus||focusId()));
  // Public read-only content may finish in a microtask after the synchronous
  // render. One guarded frame reapplies restoration, never a delayed timer loop.
  if(win.requestAnimationFrame){
   const current=generation;pending={point,focus:targetFocus||focusId()};
   frame=win.requestAnimationFrame(()=>{
    if(current!==generation||raw()!==next.url)return;
    frame=null;pending=null;place(point,mode==='restore'?targetFocus:null);
   });
  }
 }
 function navigate(url,{focus=null}={}){
  if(typeof url!=='string'||!url.startsWith('/')||url.startsWith('//'))return false;
  if(url===active.url)return true;
  remember();
  const mode=routeScrollPolicy(resolve(active.url),resolve(url));
  if(!supportsHistory){win.location.hash=url;return true;}
  const next=record(token(),url);
  history.pushState(stamp(next.key),'','#'+url);
  show(next,{mode,focus:mode==='preserve'?focus:null});
  return true;
 }
 function onLocationChange(event){
  const url=raw(),key=(event?.state??history?.state)?.[ENTRY_KEY];
  if(url===active.url&&(!key||key===active.key))return;
  remember();
  const saved=entries.get(key);
  if(saved?.url===url){show(saved,{mode:'restore'});return;}
  // Directly edited hashes and entries from before this document have no saved
  // in-memory viewport. Adopt them without changing the URL or route parameters.
  const next=record(token(),url),mode=routeScrollPolicy(resolve(active.url),resolve(url));
  if(supportsHistory)history.replaceState(stamp(next.key),'');
  show(next,{mode});
 }
 function onClick(event){
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const a=event.target.closest?.('a[href]');
  if(!a||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return;
  const href=a.getAttribute('href');
  if(!href?.startsWith('#/'))return;
  if(navigate(href.slice(1),{focus:a.id||{href}}))event.preventDefault();
 }
 const onScroll=()=>{if(!pending)remember();};
 // A real user gesture takes priority over the single pending restore frame.
 const onUserInput=()=>{cancel();remember();};
 active=record(token(),raw());entries.set(active.key,active);
 if(supportsHistory){history.replaceState(stamp(active.key),'');if('scrollRestoration' in history)history.scrollRestoration='manual';}
 doc.addEventListener?.('click',onClick);
 win.addEventListener('popstate',onLocationChange);
 win.addEventListener('hashchange',onLocationChange);
 win.addEventListener('scroll',onScroll,{passive:true});
 win.addEventListener('wheel',onUserInput,{passive:true});
 win.addEventListener('touchstart',onUserInput,{passive:true});
 win.addEventListener('keydown',onUserInput);
 return {navigate,focusContentTarget(id){
  // A requested reply is an intentional in-page target on a new navigation.
  // During Back/Forward, saved viewport/focus wins over re-running that target.
  const target=doc.getElementById(id);if(!target)return;
  if(currentMode==='restore'){
   if(active.focus===id)target.focus({preventScroll:true});
   return;
  }
  cancel();target.focus();remember();
 },dispose(){
  cancel();doc.removeEventListener?.('click',onClick);
  for(const [type,handler] of [['popstate',onLocationChange],['hashchange',onLocationChange],['scroll',onScroll],['wheel',onUserInput],['touchstart',onUserInput],['keydown',onUserInput]])win.removeEventListener?.(type,handler);
  if(supportsHistory&&priorRestoration!==undefined)history.scrollRestoration=priorRestoration;
  entries.clear();
 }};
}
