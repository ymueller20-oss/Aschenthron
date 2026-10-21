// node matrix.js N tag '{"opt":1}' [levels] → alle Stufenpaare, 4 Prozesse parallel
const {spawn}=require('child_process');const N=process.argv[2]||30,opt=process.argv[4]||'{}',lv=(process.argv[5]||'1,2,3,4,5,6').split(',');
const jobs=[];for(const a of lv)for(const b of lv)if(+a>+b)jobs.push([a,b]);const out=[];let run=0,i=0;
function next(){if(i>=jobs.length){if(!run){out.sort();console.log(out.join('\n'))}return}const [a,b]=jobs[i++];run++;let s='';const c=spawn('node',['game.js',a,b,N,'11',opt]);c.stdout.on('data',d=>s+=d);c.on('close',()=>{out.push(s.trim());run--;console.error(s.trim());next()})}
for(let k=0;k<4;k++)next();
