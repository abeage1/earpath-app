// Offline-only, per-answer history. No accounts or telemetry.
const DB_NAME='earpath-trials';
const VERSION=2;
const STORE='attempts';
const OLD_STORE='interval-trials';
const FORMAT='earpath-attempt-history';
const KNOWN=['pitch','intervals','chords','scales','degrees','progressions','melodies'];
let dbPromise;
let chain=Promise.resolve();
function queue(work){const result=chain.then(work);chain=result.catch(()=>{});return result;}
function done(tx){return new Promise((resolve,reject)=>{
  tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||new Error('Aborted'));
  tx.onerror=()=>reject(tx.error||new Error('Transaction failed'));
});}
function result(req){return new Promise((resolve,reject)=>{
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});}
export function localDay(ts){const d=new Date(ts);
  if(!Number.isFinite(d.getTime()))throw new Error('Invalid date');
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function uuid(){return globalThis.crypto?.randomUUID?.() ||
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;}
export function validateTrial(t){
  if(!t || typeof t!=='object'||Array.isArray(t))throw new TypeError('Invalid trial');
  if(typeof t.id!=='string'||t.id.length<10||t.id.length>100)throw new TypeError('Invalid trial id');
  if(!Number.isSafeInteger(t.timestampMs)||t.timestampMs<0)throw new TypeError('Invalid timestamp');
  if(typeof t.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(t.day))throw new TypeError('Invalid local day');
  if(!KNOWN.includes(t.moduleId))throw new TypeError('Unknown module');
  if(!Number.isInteger(t.levelIdx)||t.levelIdx<0||t.levelIdx>1000)throw new TypeError('Invalid level');
  if(typeof t.correct!=='boolean')throw new TypeError('Invalid correctness');
  if(t.rootMidi!==null && t.rootMidi!==undefined && (!Number.isInteger(t.rootMidi)||t.rootMidi<0||t.rootMidi>127))throw new TypeError('Invalid root MIDI');
  if(t.direction!==null&&t.direction!==undefined&&typeof t.direction!=='string')throw new TypeError('Invalid direction');
  if(t.referenceMidi!=null && (!Number.isInteger(t.referenceMidi)||t.referenceMidi<0||t.referenceMidi>127))throw new TypeError('Invalid reference MIDI');
  if(t.voicingStyle!=null && (typeof t.voicingStyle!=='string'||t.voicingStyle.length>64))throw new TypeError('Invalid voicing style');
  if(t.melodyTempo!=null && (typeof t.melodyTempo!=='number'||!Number.isFinite(t.melodyTempo)))throw new TypeError('Invalid melody tempo');
  for(const k of ['correctId','answeredId']) if(t[k]!==null&&t[k]!==undefined&&typeof t[k]!=='string')throw new TypeError(`Invalid ${k}`);
  for(const k of ['correctSeq','answeredSeq']) if(t[k]!==null&&t[k]!==undefined&&
    (!Array.isArray(t[k])||t[k].length>64||!t[k].every(x=>typeof x==='string'||Number.isInteger(x))))throw new TypeError(`Invalid ${k}`);
  if(t.given!==null&&t.given!==undefined&&(!Array.isArray(t.given)||!t.given.every(x=>typeof x==='boolean')))throw new TypeError('Invalid given');
  if(t.notesMidi!==null&&t.notesMidi!==undefined&&(!Array.isArray(t.notesMidi)||t.notesMidi.length>64||!t.notesMidi.every(x=>Number.isInteger(x)&&x>=0&&x<=127)))throw new TypeError('Invalid notesMidi');
  // Explicit allowlist: imported data cannot add arbitrary persisted properties.
  return {
    id:t.id,timestampMs:t.timestampMs,day:t.day,moduleId:t.moduleId,
    levelIdx:t.levelIdx,correct:t.correct,
    rootMidi:t.rootMidi??null,notesMidi:t.notesMidi??null,direction:t.direction??null,
    correctId:t.correctId??null,answeredId:t.answeredId??null,
    correctSeq:t.correctSeq??null,answeredSeq:t.answeredSeq??null,
    given:t.given??null,referenceMidi:t.referenceMidi??null,
    voicingStyle:t.voicingStyle??null,melodyTempo:t.melodyTempo??null,
  };
}
export function makeTrial(props){const timestampMs=props.timestampMs??Date.now();
 return validateTrial({...props,id:props.id??uuid(),timestampMs,day:props.day??localDay(timestampMs)});}
export async function openDB(){
 if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
   if(typeof indexedDB==='undefined')return reject(new Error('IndexedDB unavailable'));
   const req=indexedDB.open(DB_NAME,VERSION);
   req.onupgradeneeded=()=>{
     const db=req.result;
     let store;
     if(!db.objectStoreNames.contains(STORE)){
       store=db.createObjectStore(STORE,{keyPath:'id'});
       store.createIndex('byDay','day');store.createIndex('byModule','moduleId');
     }else store=req.transaction.objectStore(STORE);
     if(db.objectStoreNames.contains(OLD_STORE)){
       const cur=req.transaction.objectStore(OLD_STORE).openCursor();
       cur.onsuccess=()=>{
         const cursor=cur.result;
         if(!cursor)return;
         const old=cursor.value;
         // Old interval-only PR data can be migrated when upgrading.
         try{store.put(makeTrial({
           id:old.id,timestampMs:old.timestampMs,day:old.day,moduleId:'intervals',
           levelIdx:old.levelIdx,correct:old.correctId===old.answeredId,
           rootMidi:old.rootMidi,direction:old.direction,
           correctId:old.correctId,answeredId:old.answeredId,
         }));}catch(e){console.warn('Ignoring invalid old Earpath attempt',e);}
         cursor.continue();
       };
     }
   };
   req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();dbPromise=null;};resolve(db);};
   req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('Close other Earpath tabs'));
 }).catch(e=>{dbPromise=null;throw e;});
 return dbPromise;
}
async function write(action,entry){const db=await openDB();const tx=db.transaction(STORE,'readwrite');
 tx.objectStore(STORE)[action](entry);await done(tx);}
export function appendTrial(props){const t=makeTrial(props);const completed=queue(()=>write('put',t));
 completed.catch(e=>console.warn('Could not save attempt history',e));
 return {id:t.id,completed};
}
export function removeTrial(id){return queue(async()=>{
 const db=await openDB();const tx=db.transaction(STORE,'readwrite');
 tx.objectStore(STORE).delete(id);await done(tx);});}
export async function readTrials(){await chain;const db=await openDB();const tx=db.transaction(STORE,'readonly');
 const records=await result(tx.objectStore(STORE).getAll());await done(tx);
 return records.sort((a,b)=>a.timestampMs-b.timestampMs||a.id.localeCompare(b.id));}
export async function exportHistory(){return {format:FORMAT,version:1,
 exportedAt:new Date().toISOString(),trials:await readTrials()};}
export function importHistory(file){return queue(async()=>{
  if(!file||!Array.isArray(file.trials))throw new TypeError('Not an Earpath history export');
  let trials;
  if(file.format===FORMAT&&file.version===1)trials=file.trials.map(validateTrial);
  else if(file.format==='earpath-interval-history'&&file.version===1)
   trials=file.trials.map(t=>makeTrial({...t,moduleId:'intervals',correct:t.correctId===t.answeredId}));
  else throw new TypeError('Unsupported export format/version');
  if(new Set(trials.map(t=>t.id)).size!==trials.length)throw new TypeError('Duplicate IDs');
  const db=await openDB();const tx=db.transaction(STORE,'readwrite');const store=tx.objectStore(STORE);
  for(const t of trials)store.put(t);
  await done(tx);return trials.length;
 });}
