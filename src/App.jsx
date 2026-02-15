import { useState, useEffect, useMemo, useRef } from "react";

const TEAMS = {
  1:{name:"Team 1",members:["Dominic Guardian","Adele Nilssen Fossli","Glena Armada","Abdiqadir Ibrahim"],leader:"Dominic Guardian"},
  3:{name:"Team 3",members:["Pia Westbye","Silje Lunde Nesdal","Eva Valerie Lange","Rody Haidar"],leader:"Pia Westbye"},
  5:{name:"Team 5",members:["Tone Høimyr Folmo","Annamaria Kurucz","Esra Bekiri","Madelene Typpö"],leader:"Tone Høimyr Folmo"},
  8:{name:"Team 8",members:["Herman Hovland","Anders Hollekim Rodak","Markus Wold Bjerklund","Shuayb Abdisamad Shire","Sindre Friberg"],leader:"Herman Hovland"},
  10:{name:"Team 10",members:["Synnøve Seeberg Nygaard","Anne Marie Harlem Forbord","Martinius Strømdal"],leader:"Synnøve Seeberg Nygaard"},
  11:{name:"Team 11",members:["Sakaria Sharrawe","Seda Duvarci","Joshua Gong Ro","Herman Myra Olsen"],leader:"Sakaria Sharrawe"},
  12:{name:"Team 12",members:["Sindre Friberg","Elmin Selimanovic","Lisa Stefansdottir","Ludvik Foss","Sakaria Sharrawe"],leader:"Sindre Friberg"},
  14:{name:"Team 14",members:["Erik-André Skauen Nilsen","Mina Nygård","Aryaan Yassin","Muhammad Husnain"],leader:"Erik-André Skauen Nilsen"},
  17:{name:"Team 17",members:["Madeleine Holm","Emilie Nielsen","Tina Saliim"],leader:"Madeleine Holm"},
  18:{name:"Team 18",members:["Filip Jakub Smolen","Andre Høiås","Carl Fernandez Hoff","Carl Ludvig Ova Behrendt","Ole Thomas Lunde"],leader:"Filip Jakub Smolen"},
  20:{name:"Team 20",members:["William Østvik","Lava Issa Hamid","Kenny Feng","Jesper Norstad","Adrian Sylte"],leader:"William Østvik"},
  21:{name:"Team 21",members:["Kris Sharma","Mahnoor Baig","Aron K. Østgård","Herman Holø","Thor Winther","Pascal Wilondja"],leader:"Kris Sharma"},
  22:{name:"Team 22",members:["Inga Sundheim","Aryo Hosseinian","Sofie Martina Evensen"],leader:"Inga Sundheim"},
  23:{name:"Team 23",members:["Sander Petersen Linås","Maren Gullikstad","Ola Troan","Frøya Vereide","Eirik Holter","Herman Hovland"],leader:"Sander Petersen Linås"},
  24:{name:"Team 24",members:["Emma Trøan","William Bjørnstad"],leader:"Emma Trøan"},
};
const ALL_STUDENTS=[...new Set(Object.values(TEAMS).flatMap(t=>t.members))].sort();
const XP={post:50,like:2,comment:5,extComment:15,repost:10};
const LEVELS=[
  {name:"Nybegynner",min:0,icon:"🌱",color:"#A8D5BA"},
  {name:"Aktiv",min:100,icon:"🌿",color:"#7BC67E"},
  {name:"Engasjert",min:300,icon:"🌳",color:"#58CC02"},
  {name:"Influencer",min:600,icon:"🔥",color:"#FF9600"},
  {name:"Thought Leader",min:1200,icon:"⭐",color:"#FFD700"},
  {name:"LinkedIn-legende",min:2500,icon:"👑",color:"#CE82FF"},
];
const BADGES=[
  {id:"first",name:"Første innlegg",icon:"🎯",desc:"Publiserte ditt første #AIP2100-innlegg",ck:s=>s.tp>=1},
  {id:"five",name:"High Five",icon:"✋",desc:"5 innlegg publisert",ck:s=>s.tp>=5},
  {id:"ten",name:"Serieinnlegger",icon:"📝",desc:"10 innlegg publisert",ck:s=>s.tp>=10},
  {id:"viral",name:"Viral!",icon:"🚀",desc:"50+ likes på et innlegg",ck:s=>s.ml>=50},
  {id:"convo",name:"Samtalestarter",icon:"💬",desc:"10+ kommentarer på et innlegg",ck:s=>s.mc>=10},
  {id:"ext",name:"Utenfor boblen",icon:"🌍",desc:"5+ eksterne kommentarer",ck:s=>s.tec>=5},
  {id:"rep",name:"Delingskongen",icon:"🔄",desc:"10+ reposts totalt",ck:s=>s.tr>=10},
  {id:"s3",name:"På rad!",icon:"🔥",desc:"3 uker streak",ck:s=>s.streak>=3},
  {id:"s7",name:"Ustoppelig",icon:"💎",desc:"7 uker streak",ck:s=>s.streak>=7},
  {id:"100",name:"Hundringen",icon:"💯",desc:"100+ likes totalt",ck:s=>s.tl>=100},
  {id:"xp5",name:"XP-jeger",icon:"⚡",desc:"500 XP",ck:s=>s.xp>=500},
  {id:"xp10",name:"XP-mester",icon:"🏆",desc:"1000 XP",ck:s=>s.xp>=1000},
];

function getLv(xp){let l=LEVELS[0];for(const v of LEVELS)if(xp>=v.min)l=v;return l;}
function getNext(xp){for(const l of LEVELS)if(xp<l.min)return l;return null;}
function postXP(p){return XP.post+(p.likes||0)*XP.like+(p.comments||0)*XP.comment+(p.externalComments||0)*XP.extComment+(p.reposts||0)*XP.repost;}
function wk(d){const dt=new Date(d),s=new Date(dt.getFullYear(),0,1);return`${dt.getFullYear()}-${Math.ceil(((dt-s)/864e5+s.getDay()+1)/7)}`;}
function pw(w){const[y,n]=w.split("-").map(Number);return n<=1?`${y-1}-52`:`${y}-${n-1}`;}
function streak(posts){
  if(!posts.length)return 0;
  const ws=[...new Set(posts.map(p=>wk(p.date)))].sort().reverse();
  const c=wk(new Date().toISOString());let s=0,e=c;
  for(const w of ws){if(w===e||(s===0&&w===pw(e))){s++;e=pw(w);}else if(s===0)continue;else break;}
  return s;
}

// API helpers
const API="/api/posts";
async function fetchPosts(){const r=await fetch(API);if(!r.ok)throw new Error("Fetch failed");return r.json();}
async function apiCall(method,body,adminKey){
  const r=await fetch(API,{method,headers:{"Content-Type":"application/json","x-admin-key":adminKey},body:JSON.stringify(body)});
  const data=await r.json();if(!r.ok)throw new Error(data.error||"API error");return data;
}

const COL=["#58CC02","#CE82FF","#FF9600","#1CB0F6","#FF4B4B","#2B70C9","#FFC800","#43C000","#FF86D0","#00CD9C"];
function hc(n){let h=0;for(let i=0;i<n.length;i++)h=n.charCodeAt(i)+((h<<5)-h);return COL[Math.abs(h)%COL.length];}
function Av({name,size=40}){const i=name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(),bg=hc(name);return<div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:size*.38,fontFamily:"'Nunito',sans-serif",flexShrink:0,boxShadow:`0 2px 8px ${bg}44`}}>{i}</div>;}
function AN({value}){const[d,setD]=useState(0),r=useRef(0);useEffect(()=>{const s=r.current,df=value-s;if(!df){setD(value);return;}const t0=performance.now();const go=n=>{const p=Math.min((n-t0)/600,1);setD(Math.round(s+df*(1-Math.pow(1-p,3))));if(p<1)requestAnimationFrame(go);else r.current=value;};requestAnimationFrame(go);},[value]);return<span>{d.toLocaleString("nb-NO")}</span>;}

function calcStats(posts){
  const stats={};
  for(const name of[...new Set([...ALL_STUDENTS,...posts.map(p=>p.author)])]){
    const mp=posts.filter(p=>p.author===name);
    const xp=mp.reduce((s,p)=>s+postXP(p),0),tl=mp.reduce((s,p)=>s+(p.likes||0),0),tc=mp.reduce((s,p)=>s+(p.comments||0),0);
    const tec=mp.reduce((s,p)=>s+(p.externalComments||0),0),tr=mp.reduce((s,p)=>s+(p.reposts||0),0);
    const ml=Math.max(0,...mp.map(p=>p.likes||0)),mc=Math.max(0,...mp.map(p=>(p.comments||0)+(p.externalComments||0)));
    const st=streak(mp);
    stats[name]={tp:mp.length,xp,tl,tc,tec,tr,ml,mc,streak:st,
      badges:BADGES.filter(b=>b.ck({tp:mp.length,xp,tl,tc,tec,tr,ml,mc,streak:st})),
      level:getLv(xp),posts:mp};
  }
  return stats;
}
function calcTeams(ss){
  const s={};
  for(const[id,t]of Object.entries(TEAMS)){
    const ms=t.members.map(m=>ss[m]||{xp:0,tp:0,tl:0,streak:0,badges:[]});
    s[id]={...t,xp:ms.reduce((a,m)=>a+m.xp,0),tp:ms.reduce((a,m)=>a+m.tp,0),tl:ms.reduce((a,m)=>a+m.tl,0),
      active:ms.filter(m=>m.tp>0).length};
  }
  return s;
}

export default function App(){
  const[posts,setPosts]=useState([]);
  const[tab,setTab]=useState("feed");
  const[loading,setLoading]=useState(true);
  const[err,setErr]=useState(null);
  const[showAdmin,setShowAdmin]=useState(false);

  const load=async()=>{try{setPosts(await fetchPosts());setErr(null);}catch(e){setErr(e.message);}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);

  const ss=useMemo(()=>calcStats(posts),[posts]);
  const ts=useMemo(()=>calcTeams(ss),[ss]);
  const g=useMemo(()=>({tp:posts.length,as:Object.values(ss).filter(s=>s.tp>0).length,ts:ALL_STUDENTS.length}),[posts,ss]);

  if(loading)return<div style={{minHeight:"100vh",background:"#131F24",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><div style={{fontSize:64,animation:"pulse 1s infinite"}}>🦉</div><p style={{color:"#58CC02",fontWeight:800,fontSize:18,fontFamily:"'Nunito',sans-serif"}}>Laster #AIP2100...</p></div>;

  return(
    <div style={{minHeight:"100vh",background:"#131F24",fontFamily:"'Nunito',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#131F24}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#3C4F56;border-radius:3px}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes glow{0%,100%{box-shadow:0 0 5px #58CC0244}50%{box-shadow:0 0 20px #58CC0266}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fire{0%,100%{transform:scale(1) rotate(-2deg)}50%{transform:scale(1.15) rotate(2deg)}}.ch{transition:transform .2s,box-shadow .2s}.ch:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,.3)}`}</style>

      <header style={{background:"linear-gradient(135deg,#58CC02,#43A000)",padding:"20px 24px 16px",position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 20px rgba(88,204,2,.3)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:28}}>🦉</span>
              <div><h1 style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:-.5}}>#AIP2100</h1><p style={{fontSize:11,color:"#ffffffbb",fontWeight:600}}>LinkedIn Leaderboard</p></div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{background:"#ffffff22",borderRadius:20,padding:"4px 10px",display:"flex",alignItems:"center",gap:4,color:"#fff",fontSize:12,fontWeight:700}}>📝 <AN value={g.tp}/> innlegg</div>
              <div style={{background:"#ffffff22",borderRadius:20,padding:"4px 10px",display:"flex",alignItems:"center",gap:4,color:"#fff",fontSize:12,fontWeight:700}}>👥 <AN value={g.as}/>/{g.ts}</div>
              <button onClick={()=>setShowAdmin(!showAdmin)} style={{background:"#ffffff22",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",color:"#fff",fontSize:16}}>⚙️</button>
            </div>
          </div>
          <nav style={{display:"flex",gap:4}}>
            {[{id:"feed",l:"Feed",i:"📰"},{id:"individual",l:"Individuell",i:"🏅"},{id:"team",l:"Team",i:"🏆"},{id:"badges",l:"Badges",i:"🎖️"}].map(t=>
              <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:"none",cursor:"pointer",background:tab===t.id?"#fff":"#ffffff22",color:tab===t.id?"#43A000":"#fff",fontWeight:tab===t.id?800:600,fontSize:13,fontFamily:"'Nunito',sans-serif",transition:"all .2s"}}><span style={{fontSize:16}}>{t.i}</span><br/>{t.l}</button>
            )}
          </nav>
        </div>
      </header>

      {err&&<div style={{background:"#FF4B4B22",padding:"10px 16px",textAlign:"center",color:"#FF4B4B",fontWeight:700,fontSize:13}}>⚠️ {err} <button onClick={load} style={{background:"#FF4B4B",color:"#fff",border:"none",borderRadius:6,padding:"2px 10px",marginLeft:8,cursor:"pointer",fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>Prøv igjen</button></div>}
      {showAdmin&&<AdminPanel onDone={()=>{load();}} onClose={()=>setShowAdmin(false)} posts={posts}/>}

      <main style={{maxWidth:800,margin:"0 auto",padding:"16px 16px 100px"}}>
        {tab==="feed"&&<Feed posts={posts} ss={ss}/>}
        {tab==="individual"&&<IndLB ss={ss}/>}
        {tab==="team"&&<TeamLB ts={ts} ss={ss}/>}
        {tab==="badges"&&<BadgeView ss={ss}/>}
      </main>
    </div>
  );
}

function Empty({icon,title,sub}){return<div style={{textAlign:"center",padding:"60px 20px",animation:"fadeIn .4s ease"}}><div style={{fontSize:56,marginBottom:12,animation:"pulse 2s infinite"}}>{icon}</div><h3 style={{color:"#E8F5E9",fontWeight:800,fontSize:18,marginBottom:6}}>{title}</h3><p style={{color:"#8BA4AD",fontSize:14,fontWeight:600}}>{sub}</p></div>;}
function Met({icon,v,l,c}){return<div style={{display:"flex",alignItems:"center",gap:4,background:c+"11",borderRadius:8,padding:"4px 8px"}}><span style={{fontSize:13}}>{icon}</span><span style={{color:c,fontWeight:800,fontSize:13}}>{v}</span><span style={{color:"#8BA4AD",fontSize:11,fontWeight:600}}>{l}</span></div>;}

function Feed({posts,ss}){
  const sorted=[...posts].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!sorted.length)return<Empty icon="📰" title="Ingen innlegg ennå" sub="Bruk admin-panelet (⚙️) for å legge inn LinkedIn-innlegg"/>;
  return<div style={{display:"flex",flexDirection:"column",gap:12}}>{sorted.map((p,i)=><PC key={p.id} p={p} s={ss[p.author]} dl={Math.min(i*50,500)}/>)}</div>;
}

function PC({p,s,dl=0}){
  const xp=postXP(p),lv=(s||{}).level||LEVELS[0];
  return<div className="ch" style={{background:"#1A2C32",borderRadius:16,padding:16,border:"1px solid #2A3F47",animation:`slideUp .4s ease ${dl}ms both`}}>
    <div style={{display:"flex",gap:12,marginBottom:12}}>
      <Av name={p.author} size={44}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          <span style={{color:"#E8F5E9",fontWeight:800,fontSize:15}}>{p.author}</span>
          <span style={{background:lv.color+"22",color:lv.color,padding:"1px 8px",borderRadius:10,fontSize:11,fontWeight:700}}>{lv.icon} {lv.name}</span>
        </div>
        <p style={{color:"#8BA4AD",fontSize:12,fontWeight:600}}>{new Date(p.date).toLocaleDateString("nb-NO",{day:"numeric",month:"short",year:"numeric"})}{p.linkedinUrl&&<>{" · "}<a href={p.linkedinUrl} target="_blank" rel="noopener" style={{color:"#1CB0F6",textDecoration:"none"}}>LinkedIn ↗</a></>}</p>
      </div>
      <div style={{background:"#58CC0222",borderRadius:10,padding:"4px 10px",color:"#58CC02",fontWeight:800,fontSize:14,height:"fit-content"}}>+{xp} XP</div>
    </div>
    {p.description&&<p style={{color:"#B8CDD4",fontSize:13,lineHeight:1.5,fontWeight:600,marginBottom:12,fontStyle:"italic",borderLeft:"3px solid #2A3F47",paddingLeft:12}}>{p.description}</p>}
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}><Met icon="👍" v={p.likes||0} l="likes" c="#1CB0F6"/><Met icon="💬" v={p.comments||0} l="kommentarer" c="#CE82FF"/><Met icon="🌍" v={p.externalComments||0} l="eksterne" c="#FF9600"/><Met icon="🔄" v={p.reposts||0} l="reposts" c="#43C000"/></div>
  </div>;
}

function IndLB({ss}){
  const[sortBy,setSortBy]=useState("xp");
  const[showAll,setShowAll]=useState(false);
  const ranked=useMemo(()=>{
    const a=Object.entries(ss).filter(([_,s])=>s.tp>0).map(([n,s])=>({name:n,...s}));
    a.sort((a,b)=>sortBy==="xp"?b.xp-a.xp:sortBy==="posts"?b.tp-a.tp:sortBy==="likes"?b.tl-a.tl:b.streak-a.streak);
    return a;
  },[ss,sortBy]);
  const disp=showAll?ranked:ranked.slice(0,20);
  return<div>
    <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
      {[{id:"xp",l:"⚡ XP"},{id:"posts",l:"📝 Innlegg"},{id:"likes",l:"👍 Likes"},{id:"streak",l:"🔥 Streak"}].map(s=>
        <button key={s.id} onClick={()=>setSortBy(s.id)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",background:sortBy===s.id?"#58CC02":"#1A2C32",color:sortBy===s.id?"#fff":"#8BA4AD",fontWeight:700,fontSize:13,fontFamily:"'Nunito',sans-serif"}}>{s.l}</button>)}
    </div>
    {!ranked.length?<Empty icon="🏅" title="Ingen aktive ennå" sub="Innlegg med #AIP2100 dukker opp her"/>:
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {ranked.length>=3&&<div style={{display:"flex",gap:8,marginBottom:8,justifyContent:"center",alignItems:"flex-end"}}>
        <Pod r={2} d={ranked[1]}/><Pod r={1} d={ranked[0]}/><Pod r={3} d={ranked[2]}/>
      </div>}
      {disp.slice(ranked.length>=3?3:0).map((s,i)=><LBR key={s.name} r={(ranked.length>=3?3:0)+i+1} d={s} sb={sortBy}/>)}
      {!showAll&&ranked.length>20&&<button onClick={()=>setShowAll(true)} style={{padding:12,borderRadius:12,border:"2px solid #2A3F47",background:"transparent",color:"#58CC02",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"'Nunito',sans-serif"}}>Vis alle {ranked.length}</button>}
    </div>}
  </div>;
}

function Pod({r,d}){
  const m={1:"🥇",2:"🥈",3:"🥉"},h={1:140,2:115,3:100},lv=d.level;
  return<div className="ch" style={{background:r===1?"linear-gradient(180deg,#FFD70022,#1A2C32)":"#1A2C32",borderRadius:16,padding:"16px 12px",textAlign:"center",border:r===1?"2px solid #FFD70044":"1px solid #2A3F47",width:r===1?150:120,minHeight:h[r],animation:r===1?"glow 2s infinite":"none",display:"flex",flexDirection:"column",alignItems:"center"}}>
    <div style={{fontSize:28,marginBottom:4}}>{m[r]}</div><Av name={d.name} size={r===1?52:40}/>
    <p style={{color:"#E8F5E9",fontWeight:800,fontSize:r===1?13:11,marginTop:6,lineHeight:1.2}}>{d.name.split(" ").slice(0,2).join(" ")}</p>
    <span style={{color:lv.color,fontSize:10,fontWeight:700}}>{lv.icon} {lv.name}</span>
    <div style={{marginTop:6,background:"#58CC0222",borderRadius:8,padding:"3px 8px",color:"#58CC02",fontWeight:800,fontSize:14}}>{d.xp} XP</div>
  </div>;
}

function LBR({r,d,sb}){
  const lv=d.level,nl=getNext(d.xp),prog=nl?((d.xp-lv.min)/(nl.min-lv.min))*100:100;
  const val=sb==="xp"?d.xp:sb==="posts"?d.tp:sb==="likes"?d.tl:d.streak;
  const unit=sb==="xp"?"XP":sb==="posts"?"innlegg":sb==="likes"?"likes":"uker";
  return<div className="ch" style={{background:"#1A2C32",borderRadius:14,padding:"12px 14px",border:"1px solid #2A3F47",display:"flex",alignItems:"center",gap:12,animation:`slideUp .3s ease ${Math.min(r*30,300)}ms both`}}>
    <div style={{width:28,textAlign:"center",color:r<=10?"#FFD700":"#8BA4AD",fontWeight:900,fontSize:15}}>{r}</div>
    <Av name={d.name} size={38}/>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:"#E8F5E9",fontWeight:700,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{d.name}</span>{d.streak>=3&&<span style={{fontSize:14,animation:"fire .6s infinite"}}>🔥</span>}</div>
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
        <span style={{color:lv.color,fontSize:11,fontWeight:700}}>{lv.icon} {lv.name}</span>
        <div style={{flex:1,maxWidth:80,height:4,background:"#2A3F47",borderRadius:2,overflow:"hidden"}}><div style={{width:`${prog}%`,height:"100%",background:lv.color,borderRadius:2,transition:"width .5s ease"}}/></div>
      </div>
    </div>
    <div style={{textAlign:"right"}}><div style={{color:"#58CC02",fontWeight:800,fontSize:16}}><AN value={val}/></div><div style={{color:"#8BA4AD",fontSize:10,fontWeight:600}}>{unit}</div></div>
  </div>;
}

function TeamLB({ts,ss}){
  const[exp,setExp]=useState(null);
  const ranked=useMemo(()=>Object.entries(ts).map(([id,s])=>({id:Number(id),...s})).sort((a,b)=>b.xp-a.xp),[ts]);
  return<div style={{display:"flex",flexDirection:"column",gap:10}}>
    {ranked.map((t,i)=>{
      const isE=exp===t.id,part=t.members.length?Math.round((t.active/t.members.length)*100):0,has=t.tp>0;
      return<div key={t.id} style={{animation:`slideUp .3s ease ${Math.min(i*50,300)}ms both`}}>
        <div className="ch" onClick={()=>setExp(isE?null:t.id)} style={{background:i===0&&has?"linear-gradient(135deg,#1A2C32,#1A3520)":"#1A2C32",borderRadius:16,padding:"14px 16px",border:i===0&&has?"2px solid #58CC0244":"1px solid #2A3F47",cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:i===0&&has?"#58CC0222":"#2A3F47",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:i<3&&has?"#FFD700":"#8BA4AD"}}>{i===0&&has?"🏆":i+1}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{color:"#E8F5E9",fontWeight:800,fontSize:16}}>Team {t.id}</span><span style={{background:part===100?"#58CC0222":part>0?"#FF960022":"#FF4B4B22",color:part===100?"#58CC02":part>0?"#FF9600":"#FF4B4B",padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:700}}>{part}% aktive</span></div>
              <div style={{display:"flex",gap:12,marginTop:4}}><span style={{color:"#8BA4AD",fontSize:12,fontWeight:600}}>📝 {t.tp}</span><span style={{color:"#8BA4AD",fontSize:12,fontWeight:600}}>👥 {t.members.length}</span></div>
            </div>
            <div style={{textAlign:"right"}}><div style={{color:"#58CC02",fontWeight:800,fontSize:18}}><AN value={t.xp}/></div><div style={{color:"#8BA4AD",fontSize:10,fontWeight:600}}>XP</div></div>
            <div style={{color:"#8BA4AD",fontSize:18,transform:isE?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>▾</div>
          </div>
        </div>
        {isE&&<div style={{background:"#152228",borderRadius:"0 0 16px 16px",padding:"8px 12px",marginTop:-4,border:"1px solid #2A3F47",borderTop:"none",animation:"fadeIn .2s ease"}}>
          {t.members.map(m=>{const ms=ss[m]||{xp:0,tp:0,level:LEVELS[0],streak:0};return<div key={m} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 4px",borderBottom:"1px solid #1A2C32"}}>
            <Av name={m} size={30}/><div style={{flex:1}}><span style={{color:"#B8CDD4",fontSize:13,fontWeight:700}}>{m}</span>{m===t.leader&&<span style={{marginLeft:6,fontSize:10,color:"#FFD700",fontWeight:700}}>👑</span>}</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>{ms.streak>=2&&<span style={{fontSize:12}}>🔥{ms.streak}</span>}<span style={{color:ms.tp>0?"#58CC02":"#8BA4AD",fontWeight:800,fontSize:13}}>{ms.xp} XP</span></div>
          </div>;})}
        </div>}
      </div>;
    })}
  </div>;
}

function BadgeView({ss}){
  const bc=useMemo(()=>BADGES.map(b=>({...b,eb:Object.entries(ss).filter(([_,s])=>s.badges.some(bb=>bb.id===b.id)).map(([n])=>n)})),[ss]);
  const leaders=useMemo(()=>Object.entries(ss).filter(([_,s])=>s.badges.length>0).map(([n,s])=>({name:n,c:s.badges.length,badges:s.badges})).sort((a,b)=>b.c-a.c).slice(0,10),[ss]);
  return<div>
    {leaders.length>0&&<div style={{marginBottom:20}}>
      <h3 style={{color:"#E8F5E9",fontWeight:800,fontSize:16,marginBottom:10}}>🎖️ Badgesamlere</h3>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {leaders.map((s,i)=><div key={s.name} className="ch" style={{background:"#1A2C32",borderRadius:12,padding:"10px 14px",border:"1px solid #2A3F47",display:"flex",alignItems:"center",gap:10}}>
          <span style={{color:i<3?"#FFD700":"#8BA4AD",fontWeight:900,fontSize:14,width:24,textAlign:"center"}}>{i+1}</span>
          <Av name={s.name} size={32}/><span style={{color:"#E8F5E9",fontWeight:700,fontSize:13,flex:1}}>{s.name}</span>
          <div style={{display:"flex",gap:2}}>{s.badges.slice(0,6).map(b=><span key={b.id} title={b.name} style={{fontSize:16}}>{b.icon}</span>)}</div>
        </div>)}
      </div>
    </div>}
    <h3 style={{color:"#E8F5E9",fontWeight:800,fontSize:16,marginBottom:10}}>Alle badges</h3>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
      {bc.map((b,i)=>{const e=b.eb.length;return<div key={b.id} className="ch" style={{background:e>0?"#1A2C32":"#151F24",borderRadius:14,padding:14,border:e>0?"1px solid #2A3F47":"1px solid #1A2528",textAlign:"center",opacity:e>0?1:.5,animation:`slideUp .3s ease ${Math.min(i*40,300)}ms both`}}>
        <div style={{fontSize:36,marginBottom:6,filter:e===0?"grayscale(1)":"none"}}>{b.icon}</div>
        <p style={{color:"#E8F5E9",fontWeight:800,fontSize:13,marginBottom:2}}>{b.name}</p>
        <p style={{color:"#8BA4AD",fontSize:11,fontWeight:600,marginBottom:6,lineHeight:1.3}}>{b.desc}</p>
        <div style={{background:e>0?"#58CC0222":"#2A3F47",borderRadius:8,padding:"2px 8px",display:"inline-block",color:e>0?"#58CC02":"#8BA4AD",fontSize:11,fontWeight:700}}>{e} studenter</div>
      </div>;})}
    </div>
  </div>;
}

function AdminPanel({onDone,onClose,posts}){
  const[mode,setMode]=useState("add");
  const[form,setForm]=useState({author:"",date:new Date().toISOString().slice(0,10),likes:0,comments:0,externalComments:0,reposts:0,description:"",linkedinUrl:""});
  const[bulk,setBulk]=useState("");
  const[key,setKey]=useState(()=>localStorage.getItem("aip2100-admin-key")||"");
  const[fb,setFb]=useState("");
  const[search,setSearch]=useState("");
  const[busy,setBusy]=useState(false);
  const flash=m=>{setFb(m);setTimeout(()=>setFb(""),3000);};

  useEffect(()=>{if(key)localStorage.setItem("aip2100-admin-key",key);},[key]);

  const submit=async()=>{
    if(!form.author){flash("⚠️ Velg forfatter");return;}
    if(!key){flash("⚠️ Skriv inn admin-nøkkel");return;}
    setBusy(true);
    try{await apiCall("POST",{...form,likes:+form.likes,comments:+form.comments,externalComments:+form.externalComments,reposts:+form.reposts},key);
      flash("✅ Lagt til!");setForm({author:"",date:new Date().toISOString().slice(0,10),likes:0,comments:0,externalComments:0,reposts:0,description:"",linkedinUrl:""});onDone();
    }catch(e){flash("❌ "+e.message);}finally{setBusy(false);}
  };
  const bulkImport=async()=>{
    if(!key){flash("⚠️ Admin-nøkkel påkrevd");return;}
    setBusy(true);
    try{const d=JSON.parse(bulk);await apiCall("POST",Array.isArray(d)?d:[d],key);setBulk("");flash("✅ Importert!");onDone();}catch(e){flash("❌ "+e.message);}finally{setBusy(false);}
  };
  const del=async(id)=>{
    if(!key){flash("⚠️ Admin-nøkkel påkrevd");return;}
    setBusy(true);
    try{await apiCall("DELETE",{id},key);flash("✅ Slettet!");onDone();}catch(e){flash("❌ "+e.message);}finally{setBusy(false);}
  };

  const iS={width:"100%",padding:"10px 12px",borderRadius:10,border:"2px solid #2A3F47",background:"#131F24",color:"#E8F5E9",fontSize:14,fontWeight:600,fontFamily:"'Nunito',sans-serif",outline:"none"};
  const lS={color:"#8BA4AD",fontSize:12,fontWeight:700,display:"block",marginBottom:4};
  const btnS={width:"100%",padding:12,borderRadius:12,border:"none",background:busy?"#2A3F47":"#58CC02",color:"#fff",fontWeight:800,fontSize:15,cursor:busy?"wait":"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:busy?"none":"0 4px 0 #43A000"};

  return<div style={{background:"#1A2C32",borderBottom:"3px solid #58CC02",padding:16,animation:"fadeIn .2s ease"}}>
    <div style={{maxWidth:800,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{color:"#E8F5E9",fontWeight:900,fontSize:18}}>⚙️ Admin</h2>
        <button onClick={onClose} style={{background:"#FF4B4B22",border:"none",borderRadius:8,padding:"6px 12px",color:"#FF4B4B",cursor:"pointer",fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>✕</button>
      </div>

      <div style={{marginBottom:12}}><label style={lS}>🔑 Admin-nøkkel</label><input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="Skriv inn admin-nøkkel..." style={iS}/></div>

      {fb&&<div style={{background:fb.startsWith("❌")||fb.startsWith("⚠️")?"#FF4B4B22":"#58CC0222",borderRadius:10,padding:"8px 14px",marginBottom:12,color:fb.startsWith("❌")||fb.startsWith("⚠️")?"#FF4B4B":"#58CC02",fontWeight:700,fontSize:13}}>{fb}</div>}

      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {[{id:"add",l:"➕ Legg til"},{id:"manage",l:"📋 Administrer"},{id:"bulk",l:"📦 Bulk-import"},{id:"export",l:"💾 Eksporter"}].map(m=>
          <button key={m.id} onClick={()=>setMode(m.id)} style={{padding:"6px 12px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",background:mode===m.id?"#58CC02":"#2A3F47",color:mode===m.id?"#fff":"#8BA4AD",fontWeight:700,fontSize:12}}>{m.l}</button>)}
      </div>

      {mode==="add"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={{gridColumn:"1/-1"}}><label style={lS}>Forfatter *</label><select value={form.author} onChange={e=>setForm({...form,author:e.target.value})} style={{...iS,cursor:"pointer"}}><option value="">Velg student...</option>{ALL_STUDENTS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
        <div><label style={lS}>Dato</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={iS}/></div>
        <div><label style={lS}>LinkedIn URL</label><input placeholder="https://linkedin.com/..." value={form.linkedinUrl} onChange={e=>setForm({...form,linkedinUrl:e.target.value})} style={iS}/></div>
        <div><label style={lS}>👍 Likes</label><input type="number" min="0" value={form.likes} onChange={e=>setForm({...form,likes:e.target.value})} style={iS}/></div>
        <div><label style={lS}>💬 Kommentarer</label><input type="number" min="0" value={form.comments} onChange={e=>setForm({...form,comments:e.target.value})} style={iS}/></div>
        <div><label style={lS}>🌍 Eksterne</label><input type="number" min="0" value={form.externalComments} onChange={e=>setForm({...form,externalComments:e.target.value})} style={iS}/></div>
        <div><label style={lS}>🔄 Reposts</label><input type="number" min="0" value={form.reposts} onChange={e=>setForm({...form,reposts:e.target.value})} style={iS}/></div>
        <div style={{gridColumn:"1/-1"}}><label style={lS}>Beskrivelse</label><textarea rows={2} placeholder="Kort beskrivelse..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{...iS,resize:"vertical"}}/></div>
        <div style={{gridColumn:"1/-1"}}><button onClick={submit} disabled={busy} style={btnS}>{busy?"⏳ Lagrer...":"➕ Legg til innlegg"}</button></div>
      </div>}

      {mode==="manage"&&<div>
        <input placeholder="🔍 Søk forfatter..." value={search} onChange={e=>setSearch(e.target.value)} style={{...iS,marginBottom:10}}/>
        <div style={{maxHeight:400,overflowY:"auto"}}>
          {(search?posts.filter(p=>p.author.toLowerCase().includes(search.toLowerCase())):posts).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(p=>
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:8,borderBottom:"1px solid #2A3F47"}}>
              <div style={{flex:1}}><span style={{color:"#E8F5E9",fontWeight:700,fontSize:13}}>{p.author}</span><span style={{color:"#8BA4AD",fontSize:11,marginLeft:8}}>{new Date(p.date).toLocaleDateString("nb-NO")} · 👍{p.likes} 💬{p.comments} 🌍{p.externalComments} 🔄{p.reposts}</span></div>
              <button onClick={()=>{if(confirm("Slett?"))del(p.id)}} disabled={busy} style={{background:"#FF4B4B22",border:"none",borderRadius:6,padding:"4px 8px",color:"#FF4B4B",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"'Nunito',sans-serif"}}>🗑️</button>
            </div>)}
        </div>
      </div>}

      {mode==="bulk"&&<div>
        <label style={lS}>Lim inn JSON-array</label>
        <textarea rows={10} value={bulk} onChange={e=>setBulk(e.target.value)} placeholder={'[\n  {\n    "author": "Navn Navnesen",\n    "date": "2026-02-15",\n    "likes": 24,\n    "comments": 5,\n    "externalComments": 2,\n    "reposts": 3,\n    "description": "Om AI i helsesektoren",\n    "linkedinUrl": "https://linkedin.com/posts/..."\n  }\n]'} style={{...iS,resize:"vertical",fontFamily:"monospace",fontSize:12}}/>
        <button onClick={bulkImport} disabled={busy} style={{...btnS,marginTop:10}}>{busy?"⏳ Importerer...":"📦 Importer"}</button>
        <div style={{marginTop:12,background:"#131F24",borderRadius:10,padding:12,border:"1px solid #2A3F47"}}>
          <p style={{color:"#8BA4AD",fontSize:12,fontWeight:700,marginBottom:6}}>💡 Tips for Claude Chrome Extension:</p>
          <p style={{color:"#8BA4AD",fontSize:11,lineHeight:1.5}}>Be Claude om å søke etter #AIP2100 på LinkedIn og formatere innleggene som JSON i formatet over.</p>
        </div>
      </div>}

      {mode==="export"&&<div>
        <p style={{color:"#8BA4AD",fontSize:13,marginBottom:10}}>Alle {posts.length} innlegg som JSON.</p>
        <textarea readOnly value={JSON.stringify(posts,null,2)} rows={12} style={{...iS,fontFamily:"monospace",fontSize:11}} onClick={e=>e.target.select()}/>
        <button onClick={()=>{navigator.clipboard?.writeText(JSON.stringify(posts,null,2));flash("✅ Kopiert!");}} style={{width:"100%",padding:12,borderRadius:12,marginTop:10,border:"2px solid #2A3F47",background:"transparent",color:"#E8F5E9",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>📋 Kopier</button>
      </div>}
    </div>
  </div>;
}
