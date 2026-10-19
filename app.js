import {draw, outcomes, frequencies, csv} from './random.js';
const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const swap = Math.random() < .5;
const session = {version:2, id:crypto.randomUUID(), startedAt:new Date().toISOString(), assignment:{A:swap?'quantum':'classical',B:swap?'classical':'quantum'}, draws:[], revealedAt:null, bulk:[]};
let busy=false, revealed=false;
const counts={A:0,B:0};
$('machines').innerHTML=['A','B'].map(m=>`<article class="machine" id="machine${m}" role="tabpanel" aria-labelledby="tab${m}" tabindex="0" ${m==='B'?'hidden':''}><div class="machine-top"><span class="machine-label">MACHINE ${m}</span><span class="method" id="method${m}">Mystery method</span></div><h2>Who’s the lucky one?</h2><div class="reels" aria-hidden="true"><span class="reel">?</span><span class="reel">?</span><span class="reel">?</span></div><p class="outcome" id="outcome${m}" role="status">Your next result is a spin away.</p><p class="count" id="count${m}">0 spins so far</p><button class="spin" id="spin${m}">Let’s spin! <span aria-hidden="true">↻</span></button></article>`).join('');
function selectMachine(m,focus=false){
 for(const key of ['A','B']){
  $('machine'+key).hidden=key!==m;
  $('tab'+key).setAttribute('aria-selected',String(key===m));
  $('tab'+key).tabIndex=key===m?0:-1;
 }
 if(focus)$('tab'+m).focus();
}
for(const m of ['A','B']){
 $('tab'+m).onclick=()=>selectMachine(m);
 $('tab'+m).onkeydown=e=>{
  if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
   e.preventDefault();selectMachine(e.key==='Home'?'A':e.key==='End'?'B':m==='A'?'B':'A',true);
  }
 };
}
function controls(){
 for(const m of ['A','B'])$('spin'+m).disabled=busy;
 $('reset').disabled=busy;
 $('showMethods').disabled=busy||revealed;
}
for(const m of ['A','B'])$('spin'+m).onclick=async()=>{
 if(busy)return;
 busy=true;controls();
 const n=draw(session.assignment[m]);
 const machine=$('machine'+m),reels=[...machine.querySelectorAll('.reel')];
 machine.classList.add('spinning');$('outcome'+m).textContent='Here we go…';
 let frame=0;
 // Cosmetic animation never samples or changes the result.
 const timer=reduced?null:setInterval(()=>{frame++;reels.forEach((r,i)=>r.textContent=String((frame+i)%2));},70);
 await new Promise(resolve=>setTimeout(resolve,reduced?40:1100));
 clearInterval(timer);machine.classList.remove('spinning');
 n.toString(2).padStart(3,'0').split('').forEach((bit,i)=>reels[i].textContent=bit);
 counts[m]++;
 session.draws.push({machine:m,index:n,outcome:outcomes[n],at:new Date().toISOString(),afterReveal:revealed});
 $('outcome'+m).textContent=outcomes[n];
 $('count'+m).textContent=`${counts[m]} ${counts[m]===1?'spin':'spins'} so far · ${n.toString(2).padStart(3,'0')}`;
 $('progress').textContent=`A: ${counts.A} ${counts.A===1?'spin':'spins'} · B: ${counts.B} ${counts.B===1?'spin':'spins'}`;
 busy=false;controls();
};
$('showMethods').onclick=()=>{
 if(busy||revealed)return;
 revealed=true;session.revealedAt=new Date().toISOString();
 const label=m=>session.assignment[m]==='quantum'?'Simulated quantum measurement':'Classical PRNG';
 $('mapping').textContent=`Machine A: ${label('A')}. Machine B: ${label('B')}.`;
 for(const m of ['A','B'])$('method'+m).textContent=label(m);
 $('reveal').hidden=false;$('lab').hidden=false;$('exportSession').disabled=false;
 $('showMethods').textContent='Methods revealed';controls();
 $('reveal').scrollIntoView({behavior:reduced?'instant':'smooth'});
};
function download(name, content, type) {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('exportSession').onclick=()=>download(`raffle-${session.id}.json`,JSON.stringify(session,null,2),'application/json');
$('run').onclick=()=>{
  const input=$('trials'); if(!input.reportValidity())return;
  const n=Number(input.value); if(!Number.isInteger(n)||n<8||n>100000)return;
  const batch={id:session.bulk.length+1,at:new Date().toISOString(),n,values:{A:[],B:[]}};
  for(const m of ['A','B']) for(let i=0;i<n;i++) batch.values[m].push(draw(session.assignment[m]));
  session.bulk.push(batch);
  const a=frequencies(batch.values.A),b=frequencies(batch.values.B);
  $('results').innerHTML=outcomes.map((o,i)=>`<tr><td>${i.toString(2).padStart(3,'0')} · ${o}</td><td>${a[i]}</td><td>${(100*a[i]/n).toFixed(2)}%</td><td>${b[i]}</td><td>${(100*b[i]/n).toFixed(2)}%</td></tr>`).join('');
  $('labStatus').textContent=`Run ${batch.id}: ${n.toLocaleString()} draws per machine. Expected count per outcome: ${n/8}.`;
  $('exportTrials').disabled=false;
};
$('exportTrials').onclick=()=>{
  const rows=[['session_id','batch','timestamp','machine','method','trial','bits','outcome']];
  for(const batch of session.bulk) for(const m of ['A','B']) batch.values[m].forEach((n,i)=>rows.push([session.id,batch.id,batch.at,m,session.assignment[m],i+1,n.toString(2).padStart(3,'0'),outcomes[n]]));
  download(`raffle-trials-${session.id}.csv`,csv(rows),'text/csv;charset=utf-8');
};
$('reset').onclick=()=>{if(confirm('Start a fresh session? Export first: this will clear the current session.'))location.reload();};
window.addEventListener('beforeunload',e=>{if(session.draws.length){e.preventDefault();e.returnValue='';}});
