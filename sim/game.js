// Heads-up-Match mit den neuen Regeln (Rabenwurf, verdeckte Aufstellung), KI aus ai.js
const E=require('../engine.js');const makeAI=require('./ai.js');
let seed=1;const rnd=()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const AI=makeAI({FULL:E.FULL,mkTeam:E.mkTeam,battle:E.battle,pickTeam:E.pickTeam,eval5:E.eval5,combos:E.combos,power:E.power,rnd});
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=rnd()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const OPT={stack:1500,bb:10,run3:true,every:8,mult:1.5};
function play(la,lb,opt={}){const O={...OPT,...opt};const P=[{L:AI.LV[la],chips:O.stack,m:AI.newModel()},{L:AI.LV[lb],chips:O.stack,m:AI.newModel()}];let bb=O.bb,dealer=0,hand=0;
 while(P[0].chips>0&&P[1].chips>0&&hand<500){hand++;if(hand>1&&(hand-1)%O.every===0)bb=Math.round(bb*O.mult/10)*10;dealer=1-dealer;
  const deck=shuffle(E.FULL.slice());P.forEach(p=>Object.assign(p,{hole:[],bet:0,tot:0,fold:false,disc:null,allin:false,acted:false}));
  const pay=(p,a)=>{a=Math.min(a,p.chips);p.chips-=a;p.bet+=a;p.tot+=a;if(!p.chips)p.allin=true};
  const an=Math.round(bb/4);P.forEach(p=>{const a=Math.min(an,p.chips);p.chips-=a;p.tot+=a;if(!p.chips)p.allin=true});
  pay(P[dealer],bb/2);pay(P[1-dealer],bb);for(let k=0;k<3;k++)P.forEach(p=>p.hole.push(deck.pop()));
  let board=[],cur=bb,minR=bb,street='pre',last=[0,0];const pot=()=>P[0].tot+P[1].tot;
  const apply=(i,x)=>{const p=P[i],q=P[1-i],toCall=cur-p.bet;if(toCall>0){q.m.faced++;if(x.a==='fold')q.m.folds++}q.m.acts++;
    if(x.a==='fold'){p.fold=true;return}if(x.a==='call'||x.a==='check'){pay(p,toCall);p.acted=true;return}
    const to=Math.min(x.to,p.bet+p.chips);if(to<=cur){pay(p,toCall);p.acted=true;return}q.m.bets++;const by=to-cur;last[i]=pot()?(to-cur)/Math.max(1,pot()):1;pay(p,to-p.bet);if(by>=minR)minR=by;cur=to;q.acted=false;p.acted=true};
  const view=i=>{const p=P[i],q=P[1-i],toCall=Math.max(0,cur-p.bet);const big=toCall>0?(toCall/Math.max(1,pot()-toCall)):0;
    return{hole:p.hole,board,discs:[p.disc,q.disc].filter(Boolean),oppN:q.hole.length+(q.disc?0:0),pot:pot(),toCall,myChips:p.chips,myBet:p.bet,curBet:cur,minRaise:minR,bb,street,ip:street==='pre'?i!==dealer:i===dealer,oppAggr:toCall>0?(big>=1?.4:big>=.5?.55:.75):1}};
  const round=first=>{P.forEach(p=>p.acted=false);let t=first,g=0;while(g++<40){if(P.some(p=>p.fold))return;const act=P.filter(p=>!p.allin);
    if(act.length===0)return;if(act.length===1&&act[0].bet>=cur&&(P[0].allin||P[1].allin))return;if(act.every(p=>p.acted&&p.bet===cur))return;
    if(P[t].allin){t=1-t;continue}const x=AI.decide(view(t),P[t].L,P[t].m);apply(t,x);t=1-t}};
  round(dealer);
  for(const [st,n] of [['flop',3],['turn',1],['river',1]]){if(P.some(p=>p.fold))break;if(P.every(p=>p.allin||P.some(q=>q.allin&&p.bet>=cur))&&P.some(p=>p.allin)&&!(O.run3&&false)){}
    // Ende der Setzrunde erreicht → nächste Straße
    if(P.some(p=>p.allin)&&P.filter(p=>!p.allin).every(p=>p.bet>=cur))break;
    street=st;deck.pop();for(let k=0;k<n;k++)board.push(deck.pop());P.forEach(p=>p.bet=0);cur=0;minR=bb;
    if(st==='flop')P.forEach((p,i)=>{const bi=AI.discard(view(i),p.L);p.disc=p.hole.splice(bi,1)[0]});
    round(1-dealer)}
  const m=Math.min(P[0].tot,P[1].tot);P.forEach(p=>{p.chips+=p.tot-m});const prize=2*m;
  if(P[0].fold){P[1].chips+=prize;continue}if(P[1].fold){P[0].chips+=prize;continue}
  // Showdown (ggf. dreimal bei All-in vor dem River)
  const allIn=P.some(p=>p.allin)&&board.length<5,runs=allIn&&O.run3?3:1,share=[Math.floor(prize/runs),0,0];share[0]=prize-Math.floor(prize/runs)*(runs-1);
  let res=0;for(let r=0;r<runs;r++){const rem=shuffle(deck.slice()),b=board.concat(rem.splice(0,5-board.length));
    const T=P.map((p,i)=>{const cs=p.hole.concat(b);return{five:AI.strongestFive(cs,p.L)}});
    const ord=T.map((t,i)=>AI.chooseOrder(t.five,T[1-i].five,P[i].L,P[i].m));
    P.forEach((p,i)=>{const o=ord[1-i];p.m.lines++;const s=E.mkTeam(T[1-i].five).team;if(o.every((f,k)=>f===s[k]))p.m.sorted++});
    let w=E.battle(ord[0],ord[1]).w;if(w<0){const a=E.eval5(T[0].five).score,c=E.eval5(T[1].five).score;w=a>c?0:c>a?1:-1}
    const part=r<runs-1?Math.floor(prize/runs):prize-Math.floor(prize/runs)*(runs-1);
    if(w<0){P[0].chips+=part/2;P[1].chips+=part/2}else P[w].chips+=part}}
 return P[0].chips>P[1].chips?0:P[1].chips>P[0].chips?1:-1}
module.exports={play,seed:s=>{seed=s},AI};
if(require.main===module){const [a,b,n,s]=[+process.argv[2],+process.argv[3],+process.argv[4]||20,+process.argv[5]||1];seed=s;let w=0,d=0,t0=Date.now();const opt=process.argv[6]?JSON.parse(process.argv[6]):{};
 for(let i=0;i<n;i++){const r=play(a,b,opt);if(r===0)w++;else if(r<0)d++}console.log(`L${a} vs L${b}: ${w}/${n} Siege (${d} remis) ${((Date.now()-t0)/n|0)}ms/Match`,JSON.stringify(opt))}
