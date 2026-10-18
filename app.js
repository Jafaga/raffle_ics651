import {draw, outcomes, frequencies, csv} from './random.js';
const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const swap = Math.random() < .5;
const session = {version:1, id:crypto.randomUUID(), startedAt:new Date().toISOString(), assignment:{A:swap?'quantum':'classical',B:swap?'classical':'quantum'}, draws:[], before:null, after:null, bulk:[]};
let phase = 'before', busy = false;
const counts = {A:0,B:0};
function ratings() {
  $('ratings').innerHTML = ['A','B'].map(m => `<fieldset><legend>Machine ${m}</legend>${['fairness','trust'].map(q => `<label>${q === 'fairness' ? 'Perceived fairness' : 'Trust in this machine'}<select name="${m}_${q}" required><option value="">Choose 1–5…</option>${[1,2,3,4,5].map(n=>`<option value="${n}">${n}</option>`).join('')}</select></label>`).join('')}</fieldset>`).join('');
}
$('machines').innerHTML = ['A','B'].map(m => `<article class="machine" id="machine${m}"><div class="machine-top"><h2>Machine ${m}</h2><span class="badge">✦ EQUAL CHANCES</span></div><div class="reels" aria-hidden="true"><span class="reel">–</span><span class="reel">–</span><span class="reel">–</span></div><p class="outcome" id="outcome${m}" role="status">Ready when you are.</p><div class="count" id="count${m}">0 / 3 draws</div><button id="spin${m}">Spin machine ${m} ↗</button></article>`).join('');
ratings();
function controls() {
  for (const m of ['A','B']) $('spin'+m).disabled = busy || phase !== 'before' || counts[m] >= 3;
  $('reset').disabled = busy;
  $('surveySubmit').disabled = busy || (phase === 'before' && (counts.A < 3 || counts.B < 3));
}
for (const m of ['A','B']) $('spin'+m).onclick = async () => {
  if (busy || phase !== 'before' || counts[m] >= 3) return;
  busy = true; controls();
  const n = draw(session.assignment[m]);
  const machine = $('machine'+m), reels = [...machine.querySelectorAll('.reel')];
  machine.classList.add('spinning'); $('outcome'+m).textContent = 'Drawing…';
  // Animation is cosmetic and never uses or changes the result sampler.
  let frame = 0;
  const timer = reduced ? null : setInterval(()=>reels.forEach((r,i)=>r.textContent=String((frame++ + i)%2)),70);
  await new Promise(resolve=>setTimeout(resolve,reduced?40:1100));
  clearInterval(timer); machine.classList.remove('spinning');
  n.toString(2).padStart(3,'0').split('').forEach((bit,i)=>reels[i].textContent=bit);
  counts[m]++;
  session.draws.push({machine:m,index:n,outcome:outcomes[n],at:new Date().toISOString()});
  $('outcome'+m).textContent=outcomes[n]; $('count'+m).textContent=`${counts[m]} / 3 draws · ${n.toString(2).padStart(3,'0')}`;
  busy=false; controls();
};
$('survey').onsubmit = event => {
  event.preventDefault();
  if (busy || (phase==='before' && (counts.A<3 || counts.B<3))) return;
  const answers = Object.fromEntries(new FormData(event.target));
  session[phase] = {at:new Date().toISOString(),...answers};
  if (phase==='before') {
    phase='after'; $('reveal').hidden=false;
    $('mapping').textContent=`Machine A: ${session.assignment.A==='quantum'?'simulated quantum measurement':'classical PRNG'}. Machine B: ${session.assignment.B==='quantum'?'simulated quantum measurement':'classical PRNG'}.`;
    $('surveyPanel').querySelector('.eyebrow').textContent='AFTER THE REVEAL';
    $('surveyPanel').querySelector('h2').textContent='Did knowing the method change your mind?';
    $('surveyHelp').textContent='Read the explanation above, then rate both again. 1 = very low, 5 = very high.';
    $('reveal').after($('surveyPanel')); event.target.reset(); ratings();
    $('surveySubmit').textContent='Save final ratings'; $('steps').textContent='03 · Methods revealed — reflect on your trust';
    $('reveal').scrollIntoView({behavior:reduced?'instant':'smooth'});
  } else {
    phase='complete'; $('surveyPanel').hidden=true; $('lab').hidden=false; $('exportSession').disabled=false;
    $('steps').textContent='Complete · Your responses are ready to export';
    $('status').textContent='Responses saved in this tab. Export your session before closing or starting again.';
  }
  controls();
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
$('reset').onclick=()=>{if(confirm('Start a new participant? Export first: this will clear the current session.'))location.reload();};
window.addEventListener('beforeunload',e=>{if(session.draws.length){e.preventDefault();e.returnValue='';}});
