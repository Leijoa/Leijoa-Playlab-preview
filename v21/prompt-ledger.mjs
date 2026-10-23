'use strict';
function createPromptLedger(storage,key='platform.entry.prompt.v21'){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw TypeError('Tab storage adapter required');
 function read(){const raw=storage.getItem(key);if(raw===null)return {shown:false,important:[]};const value=JSON.parse(raw);if(typeof value.shown!=='boolean'||!Array.isArray(value.important)||value.important.some(x=>typeof x!=='string'))throw Error('Prompt metadata unavailable');return value;}
 return Object.freeze({claim(message){const value=read(),important=message?.type==='announcement'&&message.important===true,version=important?JSON.stringify([message.message_id,message.content_version]):null;
  if(version?value.important.includes(version):value.shown)return false;
  value.shown=true;if(version)value.important.push(version);storage.setItem(key,JSON.stringify(value));return true;
 }});
}
export {createPromptLedger};
