// Pure calculations for Earpath's individual-attempt history.
export const MODULES = ['pitch','intervals','chords','scales','degrees','progressions','melodies'];
export const MODULE_NAMES = {
  pitch:'Pitch',intervals:'Intervals',chords:'Chords',scales:'Scales',
  degrees:'Scale degrees',progressions:'Progressions',melodies:'Melodies',
};

export const isMidi = x => Number.isInteger(x) && x >= 0 && x <= 127;
export function registerOf(midi, context = null) {
  if (!isMidi(midi)) return null;
  // Fixed MIDI bands for comparability; do not imply that every module has all three.
  if (midi < 60) return 'low';
  if (midi < 72) return 'mid';
  return 'high';
}
export const registerNames = {low:'Low · below C4',mid:'Middle · C4–B4',high:'High · C5 and above'};

export function trialDay(t) {
  // day is captured at answer time in the browser's local timezone.
  return t.day;
}
export function filterTrials(trials, {moduleId='all',levelIdx='all',period='30',direction='all',register='all',today=Date.now()}={}) {
  const days = period === 'all' ? Infinity : Number(period);
  const cutoff = days === Infinity ? -Infinity : today - days * 86400000;
  return trials.filter(t =>
    (moduleId==='all'||t.moduleId===moduleId) &&
    (levelIdx==='all'||t.levelIdx===Number(levelIdx)) &&
    (direction==='all'||t.direction===direction) &&
    (register==='all'||registerOf(t.rootMidi)===register) &&
    t.timestampMs >= cutoff);
}
export function summary(trials) {
  const n = trials.length;
  const correct = trials.reduce((n,t)=>n+Number(t.correct),0);
  return {attempts:n,correct,errors:n-correct,accuracy:n?correct/n:null};
}
export function byModule(trials) {
  return MODULES.map(moduleId => ({moduleId,...summary(trials.filter(t=>t.moduleId===moduleId))}));
}
export function byLevel(trials, moduleId) {
  const levels = [...new Set(trials.filter(t=>t.moduleId===moduleId).map(t=>t.levelIdx))].sort((a,b)=>a-b);
  return levels.map(levelIdx=>({levelIdx,...summary(trials.filter(t=>t.moduleId===moduleId && t.levelIdx===levelIdx))}));
}
export function byDay(trials) {
  const groups=new Map();
  for(const t of trials) {
    if(!groups.has(t.day))groups.set(t.day,[]);
    groups.get(t.day).push(t);
  }
  return [...groups.entries()].sort(([a],[b])=>a.localeCompare(b))
    .map(([day,ts])=>({day,...summary(ts)}));
}
export function byRegister(trials) {
  return ['low','mid','high'].map(register=>({register,...summary(trials.filter(t=>registerOf(t.rootMidi)===register))}));
}
export function byRootMidi(trials) {
  const keys=[...new Set(trials.map(t=>t.rootMidi).filter(isMidi))].sort((a,b)=>a-b);
  return keys.map(rootMidi=>({rootMidi,...summary(trials.filter(t=>t.rootMidi===rootMidi))}));
}
function movement(a,b){return a<b?'up':a>b?'down':'same';}
export function confusionPairs(t) {
  if (t.moduleId==='melodies') {
    if(!Array.isArray(t.correctSeq)||!Array.isArray(t.answeredSeq))return [];
    const n=Math.min(t.correctSeq.length,t.answeredSeq.length);
    const out=[];
    for(let i=1;i<n;i++) {
      if(!isMidi(t.correctSeq[i-1])||!isMidi(t.correctSeq[i])||
         !isMidi(t.answeredSeq[i-1])||!isMidi(t.answeredSeq[i]))continue;
      out.push([movement(t.correctSeq[i-1],t.correctSeq[i]),
                movement(t.answeredSeq[i-1],t.answeredSeq[i])]);
    }
    return out;
  }
  if(t.moduleId==='progressions') {
    if(!Array.isArray(t.correctSeq)||!Array.isArray(t.answeredSeq))return [];
    // Only user-answered chord slots; the first one may have been given.
    return t.correctSeq.flatMap((correct,i)=>
      t.given?.[i] || typeof t.answeredSeq[i]!=='string' ? [] : [[correct,t.answeredSeq[i]]]);
  }
  if (typeof t.correctId==='string'&&typeof t.answeredId==='string')
    return [[t.correctId,t.answeredId]];
  return [];
}
export function confusionMatrix(trials) {
  const pairs = trials.flatMap(confusionPairs);
  const ids = [...new Set(pairs.flat())].sort();
  const index = new Map(ids.map((id,i)=>[id,i]));
  const matrix=ids.map(()=>ids.map(()=>0));
  for(const [actual,answer] of pairs)matrix[index.get(actual)][index.get(answer)]++;
  return {ids,matrix,pairs:pairs.length};
}
export function noteName(midi) {
  const names=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  return isMidi(midi)?`${names[midi%12]}${Math.floor(midi/12)-1}`:'—';
}
