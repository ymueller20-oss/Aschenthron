/* KI-Stufen: dieselbe Datei läuft im Spiel (index.html) und in der Simulation (sim/). */
function makeAI(G){
const {FULL,mkTeam,battle,pickTeam,eval5,combos,power}=G,rnd=G.rnd||Math.random;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=rnd()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
/* Stufen. it=Rechentiefe, noise=Schätzfehler, call=Mitgehschwelle (<1 = zu großzügig), vs=Wertwette ab Stärke, aggr/bluff/sticky=Spielweise,
   poker=1: schätzt nur nach Pokerkombo statt nach echtem Kampf, sac/five/ord=Opfer-, Teamwahl- und Aufstellungsniveau, adapt=liest den Gegner */
const LV={
  1:{it:10,noise:.17,call:.62,vs:1.6,aggr:.2,bluff:.02,sticky:.7,poker:1,sac:0,five:0,ord:0,adapt:0,narrow:0,trap:0},
  2:{it:12,noise:.13,call:.9,vs:1.25,aggr:.8,bluff:.34,sticky:.35,poker:1,sac:0,five:0,ord:0,adapt:0,narrow:0,trap:0},
  3:{it:16,noise:.08,call:1.3,vs:1.55,aggr:.3,bluff:0,sticky:0,poker:0,sac:1,five:1,ord:0,adapt:0,narrow:1,trap:0},
  4:{it:24,noise:.05,call:1.0,vs:1.3,aggr:.5,bluff:.1,sticky:.04,poker:0,sac:1,five:1,ord:1,adapt:0,narrow:1,trap:0},
  5:{it:24,noise:.055,call:1.0,vs:1.2,aggr:.55,bluff:.14,sticky:0,poker:0,sac:1,five:1,ord:2,adapt:1,narrow:1,trap:.1},
  6:{it:90,noise:.01,call:1.0,vs:1.15,aggr:.62,bluff:.2,sticky:0,poker:0,sac:1,five:1,ord:3,adapt:1,narrow:1,trap:.25}};
const bestPoker=cs=>{let b=null,bs=-1;for(const ix of combos(cs.length)){const f=ix.map(i=>cs[i]),e=eval5(f);if(e.score>bs){bs=e.score;b=f}}return b};
const pokerSc=cs=>cs.length>=5?eval5(bestPoker(cs)).score:0;
function preSc(h){const r=h.map(c=>c.r).sort((a,b)=>b-a);let s=r[0]*3+r[1]*2+r[2];if(r[0]===r[1]||r[1]===r[2])s+=40;if(r[0]===r[1]&&r[1]===r[2])s+=100;if(h.every(c=>c.s===h[0].s))s+=12;return s}
function strength(cs,board){return board.length>=3?pokerSc(cs.concat(board)):preSc(cs)}
const sortedTeam=t=>t;                                           // mkTeam liefert die Teams schon nach Stärke geordnet
function perms(a){if(a.length<=1)return[a];const o=[];a.forEach((x,i)=>perms(a.filter((_,j)=>j!==i)).forEach(p=>o.push([x,...p])));return o}
const P5=perms([0,1,2,3,4]);
function evalHand(cs,L){return L.poker?{score:pokerSc(cs)}:(()=>{const t=pickTeam(cs);return{score:t.b.score,team:t.team}})()}
function duel(a,b,L){if(L.poker)return a.score>b.score?1:a.score<b.score?0:.5;const w=battle(a.team,b.team).w;return w===0?1:w<0?(a.score>b.score?1:a.score<b.score?0:.5):0}
/* Gewinnchance: unbekannte Gegnerkarten und Board-Rest ziehen. narrow = Anteil der stärksten Gegnerhände, den wir noch für möglich halten */
function equity(v,L,iters,narrow=1){
  const known=new Set([...v.hole,...v.board,...v.discs].map(c=>c.id)),u=FULL.filter(c=>!known.has(c.id)),need=5-v.board.length,k=narrow<1?Math.min(4,Math.ceil(1/narrow)+1):1;let win=0;
  for(let i=0;i<iters;i++){const d=shuf(u.slice());const b=v.board.concat(d.splice(0,need));
    let oh=d.splice(0,v.oppN),cand=[oh];for(let j=1;j<k;j++)cand.push(d.splice(0,v.oppN));
    if(k>1){cand.sort((x,y)=>strength(y,b)-strength(x,b));oh=cand[Math.min(cand.length-1,Math.floor(rnd()*cand.length*narrow))]}
    win+=duel(evalHand(v.hole.concat(b),L),evalHand(oh.concat(b),L),L)}
  return win/iters}
/* Gegnerbild: wie oft gibt er gegen Einsätze auf, wie oft erhöht er */
function newModel(){return{hands:0,faced:0,folds:0,bets:0,acts:0,sorted:0,lines:0,sd:0}}
function foldRate(m){return m.faced>=4?m.folds/m.faced:.4}
function decide(v,L,m){
  const eq=clamp(equity(v,L,v.street==='pre'?Math.max(4,L.it>>1):L.it,L.narrow&&v.oppAggr?v.oppAggr:1)+(rnd()-.5)*2*L.noise);
  const toCall=v.toCall,pt=v.pot,odds=toCall/(pt+toCall||1),rel=eq/.5,r=rnd(),fr=L.adapt?foldRate(m):.4,call=L.adapt&&m.acts>=8&&m.bets/m.acts>.55?L.call*.9:L.call;
  const bl=L.bluff*(L.adapt?clamp(1+(fr-.4)*3,.3,2.6):1),vs=L.vs-(L.adapt&&fr<.3?.12:0),maxTo=v.myBet+v.myChips;
  const rt=f=>Math.min(maxTo,Math.max(v.curBet+v.minRaise,v.curBet+Math.round(pt*f/5)*5));
  const size=rel>1.7?(rnd()<.5?1:.75):rel>1.35?.65:.45;
  if(toCall===0){
    if(rel>vs){if(L.trap&&v.street!=='river'&&rel>1.8&&r<L.trap)return{a:'check'};if(r<.3+L.aggr*.7)return{a:'raise',to:rt(size)}}
    if(r<bl*(v.ip?1.15:.85))return{a:'raise',to:rt(.5+rnd()*.3)};return{a:'check'}}
  if(rel>vs+.35&&r<L.aggr)return{a:'raise',to:rt(rel>1.9?1:.8)};
  if(eq>=odds*call||(toCall<=v.bb&&r<L.sticky))return{a:'call'};
  if(r<bl*.5&&toCall<v.myChips*.15)return{a:'raise',to:rt(.75)};
  return{a:'fold'}}
/* Opfer: Stufe 0 gibt die schwächste Karte her, höhere Stufen testen, welche Hand das stärkste Team ergibt */
function discard(v,L){const h=v.hole;
  if(!L.sac){let bi=0;h.forEach((c,i)=>{if(c.r<h[bi].r)bi=i});return bi}
  const known=new Set([...h,...v.board,...v.discs].map(c=>c.id)),u=FULL.filter(c=>!known.has(c.id)),need=5-v.board.length,n=L.it>20?10:5;let bi=0,bv=-1;
  h.forEach((c,i)=>{const keep=h.filter((_,j)=>j!==i);let s=0;for(let k=0;k<n;k++){const ext=shuf(u.slice()).slice(0,need);s+=power(pickTeam(keep.concat(v.board,ext)))}if(s>bv){bv=s;bi=i}});return bi}
function strongestFive(cards,L){if(!L.five){const f=bestPoker(cards);return f}let b=null,bp=-1;for(const ix of combos(cards.length)){const t=mkTeam(ix.map(i=>cards[i])),p=power(t);if(p>bp){bp=p;b=t}}return b.five}
/* Aufstellung: Beide haben ihre fünf Karten offengelegt, die Reihenfolge der Bahnen ist noch geheim. Stufe 0 stellt nach Stärke auf.
   Stufe 1 sucht die beste Antwort auf eine Stärke-Reihe, ab 2 mit Modell, wie oft der Gegner nach Stärke aufstellt, Stufe 3 würfelt zwischen gleich guten Reihen. */
function chooseOrder(five,oppFive,L,m){const mine=mkTeam(five).team;if(!L.ord)return mine;const opp=mkTeam(oppFive).team;
  const pS=L.ord===1?1:clamp(m&&m.lines>=3?m.sorted/m.lines:.85,.2,.98),vars=[[opp,pS]],nr=pS<.999?6:0;for(let i=0;i<nr;i++)vars.push([shuf(opp.slice()),(1-pS)/nr]);
  const sc=P5.map(p=>{const o=p.map(i=>mine[i]);let s=0;for(const [T,w] of vars){const r=battle(o,T).w;s+=w*(r===0?1:r<0?.5:0)}return[s,o]});
  let bs=-1;for(const x of sc)if(x[0]>bs)bs=x[0];
  if(L.ord>=3){const top=sc.filter(x=>x[0]>=bs-.03);return top[rnd()*top.length|0][1]}
  return sc.find(x=>x[0]>=bs-1e-9)[1]}
return{LV,decide,discard,strongestFive,chooseOrder,newModel,equity,bestPoker,pokerSc}}
if(typeof module!=='undefined')module.exports=makeAI;
