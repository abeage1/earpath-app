import { readTrials, exportHistory, importHistory } from './attempt-history.js';
import {MODULES, MODULE_NAMES, registerNames, registerOf, noteName,
  filterTrials,summary,byModule,byLevel,byDay,byRegister,byRootMidi,confusionMatrix} from './attempt-analysis.js';

const elem=(tag,{className='',text='',attrs={}}={},...children)=>{
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(text!==null)el.textContent=String(text);
  for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);
  for(const child of children.flat()) if(child!==null&&child!==undefined)el.append(child);
  return el;
};
function option(id,name){return elem('option',{text:name,attrs:{value:id}});}
function field(label,choices,onchange){const select=elem('select',{className:'eps-select'});
  select.replaceChildren(...choices.map(([v,t])=>option(v,t)));select.addEventListener('change',onchange);
  return {container:elem('label',{className:'eps-field'},elem('span',{text:label}),select),input:select};
}
const fmt=p=>p===null?'—':`${(100*p).toFixed(1)}%`;
const fmtSummary=s=>`${s.correct}/${s.attempts} · ${fmt(s.accuracy)}`;
const cell=(v,tag='td')=>elem(tag,{text:String(v)});
function table(headers,rows){
 const el=elem('table',{className:'eps-table'});
 el.append(elem('thead',{},elem('tr',{},headers.map(h=>cell(h,'th')))));
 el.append(elem('tbody',{},rows.map(row=>elem('tr',{},row.map(x=>cell(x))))));
 return elem('div',{className:'eps-scroll'},el);
}
const svgEl=(name,attrs={})=>{const e=document.createElementNS('http://www.w3.org/2000/svg',name);
 for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e;};
function trendChart(daily){
 const host=elem('div',{className:'eps-chart'});
 if(!daily.length){host.append(elem('p',{className:'eps-muted',text:'No detailed history in this period yet.'}));return host;}
 const data=daily.length>100?groupWeeks(daily):daily;
 const w=740,h=210,L=44,R=14,T=10,B=30;
 const svg=svgEl('svg',{viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':'Accuracy over time'});
 const y=p=>T+(1-p)*(h-B-T),x=i=>L+(w-L-R)*(data.length===1?.5:i/(data.length-1));
 for(let p=0;p<=1.001;p+=.25){const yy=y(p);
   svg.append(svgEl('line',{x1:L,y1:yy,x2:w-R,y2:yy,class:'eps-gridline'}));
   const tx=svgEl('text',{x:L-8,y:yy+4,'text-anchor':'end',class:'eps-axis'});
   tx.textContent=`${Math.round(p*100)}%`;svg.append(tx);
 }
 let current=[];
 for(let i=0;i<data.length;i++){
   if(data[i].accuracy!==null)current.push(`${x(i)},${y(data[i].accuracy)}`);
 }
 if(current.length>1)svg.append(svgEl('polyline',{points:current.join(' '),class:'eps-line'}));
 data.forEach((pt,i)=>{
   if(pt.accuracy===null)return;
   const dot=svgEl('circle',{cx:x(i),cy:y(pt.accuracy),r:3.5,class:'eps-dot'});
   const title=svgEl('title');title.textContent=`${pt.day}: ${fmtSummary(pt)}`;
   dot.append(title);svg.append(dot);
 });
 for(const i of [...new Set([0,Math.floor((data.length-1)/2),data.length-1])]){
   const tx=svgEl('text',{x:x(i),y:h-6,'text-anchor':'middle',class:'eps-axis'});
   tx.textContent=data[i].day;svg.append(tx);
 }
 host.append(svg);return host;
}
function groupWeeks(daily){const groups=new Map();
 for(const d of daily){const dt=new Date(`${d.day}T12:00:00`);
  const dow=(dt.getDay()+6)%7;dt.setDate(dt.getDate()-dow);
  const week=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  if(!groups.has(week))groups.set(week,{day:week,attempts:0,correct:0});
  const g=groups.get(week);g.attempts+=d.attempts;g.correct+=d.correct;
 }
 return [...groups.values()].map(d=>({...d,accuracy:d.attempts?d.correct/d.attempts:null}));
}
function registerChart(stats){const host=elem('div',{className:'eps-register-bars'});
 for(const s of stats){const bar=elem('div',{className:'eps-bar-track'});
  const fill=elem('div',{className:'eps-bar-fill',attrs:{style:`width:${100*(s.accuracy??0)}%`}});
  bar.append(fill);
  host.append(elem('div',{className:'eps-reg-name',text:registerNames[s.register]}),bar,
   elem('div',{className:'eps-reg-value',text:`${fmt(s.accuracy)} · n=${s.attempts}`}));
 }
 return host;}
function matrixView(trials,percentage){const {ids,matrix,pairs}=confusionMatrix(trials);
 if(!pairs)return elem('p',{className:'eps-muted',text:'No comparable answers for these filters.'});
 const cap=elem('p',{className:'eps-muted',text:`${pairs} scored responses · rows: actual · columns: answered. Normalized by actual category.`});
 const tab=elem('table',{className:'eps-table eps-matrix'});
 tab.append(elem('thead',{},elem('tr',{},[cell('Real / answer','th'),...ids.map(id=>cell(id,'th'))])));
 const body=elem('tbody');
 for(let i=0;i<ids.length;i++){
   const total=matrix[i].reduce((a,b)=>a+b,0),row=elem('tr',{},cell(ids[i],'th'));
   for(let j=0;j<ids.length;j++){
     const n=matrix[i][j], val=percentage?`${Math.round(n/Math.max(1,total)*100)}%`:String(n);
     const td=cell(val);td.className=i===j?'eps-correct':'eps-incorrect';
     td.title=`${ids[i]} → ${ids[j]}: ${n}/${total}`;row.append(td);
   }
   body.append(row);
 }
 tab.append(body);
 return elem('div',{},cap,elem('div',{className:'eps-scroll'},tab));
}
function downloadJSON(payload,filename){const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=elem('a',{attrs:{href:url,download:filename}});
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function mountAttemptDashboard(host){
 if(!host || host.dataset.earpathDashboardMounted)return;
 host.dataset.earpathDashboardMounted='1';
 if(!document.querySelector('link[data-earpath-stats-css]')){
  const css=elem('link',{attrs:{rel:'stylesheet',href:'./css/attempt-dashboard.css','data-earpath-stats-css':'1'}});
  document.head.append(css);
 }
 const title=elem('h2',{text:'Your progress'});
 const disclosure=elem('p',{className:'eps-muted',text:'Detailed history starts when this feature is installed. Earlier aggregate progress is preserved above, but cannot be broken down by exercise or pitch.'});
 const filterRow=elem('div',{className:'eps-filters'});
 const moduleField=field('Module',[['all','All modules'],...MODULES.map(id=>[id,MODULE_NAMES[id]])],refresh);
 const periodField=field('Period',[['7','Last 7 days'],['30','Last 30 days'],['90','Last 90 days'],['all','All recorded days']],refresh);
 const levelField=field('Level',[['all','All levels']],refresh);
 filterRow.append(moduleField.container,periodField.container,levelField.container);
 const headMetrics=elem('div',{className:'eps-metrics'});
 const timeline=elem('div');
 const moduleStats=elem('div');
 const levelStats=elem('div');
 const details=elem('details',{className:'eps-details'},elem('summary',{text:'Advanced analysis · confusion matrix & pitch register'}));
 const moreFilters=elem('div',{className:'eps-filters'});
 const regField=field('Pitch register',[['all','All registers'],['low','Low · below C4'],['mid','Middle · C4–B4'],['high','High · C5+']],refresh);
 const dirField=field('Direction',[['all','All directions'],['a','Ascending'],['d','Descending'],['h','Harmonic']],refresh);
 const normalizeField=field('Matrix values',[['percent','Row percentages'],['count','Raw counts']],refresh);
 moreFilters.append(regField.container,dirField.container,normalizeField.container);
 const matrix=elem('div'),regs=elem('div'),rootMidis=elem('div');
 const advancedModuleMessage=elem('p',{className:'eps-muted'});
 details.append(moreFilters,advancedModuleMessage,elem('h3',{text:'Confusion matrix'}),matrix,
  elem('h3',{text:'Accuracy by pitch register'}),regs,
  elem('details',{},elem('summary',{text:'Individual starting notes (MIDI)'}),rootMidis));
 const exportButton=elem('button',{className:'eps-button',text:'Export detailed history'});
 const importInput=elem('input',{attrs:{type:'file',accept:'application/json,.json','aria-label':'Import detailed history'}});
 const message=elem('p',{className:'eps-muted',text:'This backup contains detailed attempts. Keep your existing Earpath progress backup as well.'});
 const backups=elem('div',{className:'eps-backups'},exportButton,importInput);
 host.append(elem('section',{className:'eps-dashboard'},title,disclosure,filterRow,headMetrics,
  elem('h3',{text:'Accuracy over time'}),timeline,
  elem('h3',{text:'Performance by module'}),moduleStats,
  elem('h3',{text:'Performance by level'}),levelStats,details,
  elem('h3',{text:'Detailed history backup'}),backups,message));
 let records=[],generation=0;
 moduleField.input.value='all';periodField.input.value='30';
 const onRefresh=async()=>{const g=++generation;
  try{const result=await readTrials();if(g!==generation)return;records=result;refresh();}
  catch(e){message.textContent=`Unable to read history: ${e.message}`;}
 };
 exportButton.addEventListener('click',async()=>{
  try{const payload=await exportHistory();downloadJSON(payload,`earpath-attempts-${new Date().toISOString().slice(0,10)}.json`);
    message.textContent=`Exported ${payload.trials.length} attempts. Existing progress backup remains separate.`;
  }catch(e){message.textContent=`Export failed: ${e.message}`;}
 });
 importInput.addEventListener('change',async()=>{
  const file=importInput.files?.[0];if(!file)return;
  try{const count=await importHistory(JSON.parse(await file.text()));
    message.textContent=`Imported or updated ${count} attempts (existing IDs are not duplicated).`;
    await onRefresh();
  }catch(e){message.textContent=`Import failed: ${e.message}`;}
  finally{importInput.value='';}
 });
 function refresh(){
  const moduleId=moduleField.input.value,period=periodField.input.value,
   levelIdx=levelField.input.value,register=regField.input.value,direction=dirField.input.value;
  const previousLevel=levelField.input.value;
  const options=[['all','All levels'],...[...new Set(records.filter(t=>moduleId==='all'||t.moduleId===moduleId).map(t=>t.levelIdx))].sort((a,b)=>a-b).map(n=>[String(n),`Level ${n+1}`])];
  levelField.input.replaceChildren(...options.map(([v,n])=>option(v,n)));
  if(options.some(([v])=>v===previousLevel))levelField.input.value=previousLevel;
  const chosen=filterTrials(records,{moduleId,period,levelIdx:levelField.input.value});
  const s=summary(chosen);
  headMetrics.replaceChildren(...[['Accuracy',fmt(s.accuracy)],['Attempts',s.attempts],['Errors',s.errors]].map(([name,value])=>
    elem('div',{className:'eps-metric'},elem('span',{text:name}),elem('strong',{text:String(value)}))));
  timeline.replaceChildren(trendChart(byDay(chosen)));
  moduleStats.replaceChildren(table(['Module','Accuracy','Correct','Attempts'],byModule(chosen).map(m=>[
    MODULE_NAMES[m.moduleId],fmt(m.accuracy),m.correct,m.attempts])));
  levelStats.replaceChildren(moduleId==='all'
    ?elem('p',{className:'eps-muted',text:'Select a module to see level-by-level accuracy.'})
    :table(['Level','Accuracy','Correct','Attempts'],byLevel(chosen,moduleId).map(l=>[
      String(l.levelIdx+1),fmt(l.accuracy),l.correct,l.attempts])));
  dirField.container.hidden=moduleId!=='intervals';
  advancedModuleMessage.textContent=moduleId==='all'
    ? 'Choose one module to compare like-for-like answers. Mixed-module confusion matrices would be misleading.'
    : moduleId==='melodies' ? 'The matrix compares individual melodic movements (up/down/same); accuracy above measures complete melodies.'
    : moduleId==='progressions' ? 'The matrix compares individually answered Roman-numeral slots; accuracy above measures complete progressions.'
    : 'The matrix compares the expected and chosen answers. Some exercises have different sets of possible answers by level.';
  const advanced=filterTrials(chosen,{direction:moduleId==='intervals'?direction:'all',register});
  matrix.replaceChildren(moduleId==='all'
    ?elem('p',{className:'eps-muted',text:'Select a module above to see its confusion matrix.'})
    :matrixView(advanced,normalizeField.input.value==='percent'));
  const byPitch=filterTrials(chosen,{direction:moduleId==='intervals'?direction:'all'});
  regs.replaceChildren(registerChart(byRegister(byPitch)));
  const noteStats=byRootMidi(byPitch);
  rootMidis.replaceChildren(noteStats.length?table(['Note','MIDI','Correct','Attempts','Accuracy'],
    noteStats.map(t=>[noteName(t.rootMidi),t.rootMidi,t.correct,t.attempts,fmt(t.accuracy)]))
    :elem('p',{className:'eps-muted',text:'No MIDI notes recorded for this selection.'}));
 }
 void onRefresh();
 return {reload:onRefresh};
}
