import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, Search, Plus, X, ArrowUpDown, ArrowUp, CheckCircle2, AlertCircle, Shield, Check, Trash2 } from "lucide-react";

const SEED = [
  { id:"p0",  name:"Lionel Messi",          category:"Sports",     country:"Argentina",    votes:45231 },
  { id:"p1",  name:"Cristiano Ronaldo",      category:"Sports",     country:"Portugal",     votes:44892 },
  { id:"p2",  name:"Michael Jackson",        category:"Music",      country:"USA",          votes:42105 },
  { id:"p3",  name:"Albert Einstein",        category:"Science",    country:"Germany",      votes:40567 },
  { id:"p4",  name:"Nelson Mandela",         category:"Politics",   country:"South Africa", votes:39812 },
  { id:"p5",  name:"Taylor Swift",           category:"Music",      country:"USA",          votes:38921 },
  { id:"p6",  name:"Elon Musk",              category:"Technology", country:"USA",          votes:37456 },
  { id:"p7",  name:"Barack Obama",           category:"Politics",   country:"USA",          votes:33245 },
  { id:"p8",  name:"Michael Jordan",         category:"Sports",     country:"USA",          votes:32678 },
  { id:"p9",  name:"Muhammad Ali",           category:"Sports",     country:"USA",          votes:31554 },
  { id:"p10", name:"Martin Luther King Jr.", category:"Activism",   country:"USA",          votes:27800 },
  { id:"p11", name:"Mahatma Gandhi",         category:"Activism",   country:"India",        votes:27200 },
  { id:"p12", name:"Marie Curie",            category:"Science",    country:"Poland",       votes:26500 },
  { id:"p13", name:"Isaac Newton",           category:"Science",    country:"UK",           votes:25900 },
  { id:"p14", name:"Nikola Tesla",           category:"Science",    country:"Serbia",       votes:25100 },
  { id:"p15", name:"Leonardo da Vinci",      category:"Art",        country:"Italy",        votes:24400 },
  { id:"p16", name:"Steve Jobs",             category:"Technology", country:"USA",          votes:23800 },
  { id:"p17", name:"Bill Gates",             category:"Technology", country:"USA",          votes:22600 },
  { id:"p18", name:"Beyoncé",                category:"Music",      country:"USA",          votes:21200 },
  { id:"p19", name:"William Shakespeare",    category:"Literature", country:"UK",           votes:20500 },
  { id:"p20", name:"Pablo Picasso",          category:"Art",        country:"Spain",        votes:19100 },
  { id:"p21", name:"Marilyn Monroe",         category:"Cinema",     country:"USA",          votes:18400 },
  { id:"p22", name:"Charlie Chaplin",        category:"Cinema",     country:"UK",           votes:17700 },
  { id:"p23", name:"Winston Churchill",      category:"Politics",   country:"UK",           votes:17000 },
  { id:"p24", name:"Napoleon Bonaparte",     category:"Politics",   country:"France",       votes:15700 },
  { id:"p25", name:"Abraham Lincoln",        category:"Politics",   country:"USA",          votes:13900 },
  { id:"p26", name:"Karl Marx",              category:"Philosophy", country:"Germany",      votes:12700 },
  { id:"p27", name:"Socrates",               category:"Philosophy", country:"Greece",       votes:10900 },
  { id:"p28", name:"Charles Darwin",         category:"Science",    country:"UK",           votes:9200  },
  { id:"p29", name:"Stephen Hawking",        category:"Science",    country:"UK",           votes:8700  },
  { id:"p30", name:"Rosa Parks",             category:"Activism",   country:"USA",          votes:7800  },
  { id:"p31", name:"Frida Kahlo",            category:"Art",        country:"Mexico",       votes:7000  },
  { id:"p32", name:"Oscar Wilde",            category:"Literature", country:"Ireland",      votes:6600  },
  { id:"p33", name:"George Orwell",          category:"Literature", country:"UK",           votes:6200  },
  { id:"p34", name:"Leo Tolstoy",            category:"Literature", country:"Russia",       votes:5800  },
  { id:"p35", name:"Mark Twain",             category:"Literature", country:"USA",          votes:5000  },
  { id:"p36", name:"Bruce Lee",              category:"Sports",     country:"USA",          votes:2300  },
  { id:"p37", name:"Serena Williams",        category:"Sports",     country:"USA",          votes:2100  },
  { id:"p38", name:"Alan Turing",            category:"Technology", country:"UK",           votes:800   },
  { id:"p39", name:"Ada Lovelace",           category:"Technology", country:"UK",           votes:700   },
  { id:"p40", name:"Voltaire",               category:"Philosophy", country:"France",       votes:310   },
  { id:"p41", name:"Dante Alighieri",        category:"Literature", country:"Italy",        votes:260   },
];

const CAT_ICON = {
  Sports:"⚽", Music:"🎵", Science:"🔬", Technology:"💻",
  Art:"🎨", Cinema:"🎬", Literature:"📚", Politics:"🏛️",
  Philosophy:"🧠", Activism:"✊", Community:"🌐",
};
// Flag usando React directamente con SVG inline via country codes
// Funciona en todos los sistemas incluyendo Windows
const FLAG_SVG_URL = (code) =>
  `https://cdn.jsdelivr.net/npm/country-flag-icons@1.5.7/3x2/${code.toUpperCase()}.svg`;

const COUNTRY_ISO = {
  "Argentina":"AR","Australia":"AU","Austria":"AT","Belgium":"BE",
  "Brazil":"BR","Canada":"CA","Chile":"CL","China":"CN",
  "Colombia":"CO","Cuba":"CU","Czech Republic":"CZ","Denmark":"DK",
  "Egypt":"EG","Finland":"FI","France":"FR","Germany":"DE",
  "Greece":"GR","Hungary":"HU","India":"IN","Ireland":"IE",
  "Israel":"IL","Italy":"IT","Japan":"JP","Mexico":"MX",
  "Netherlands":"NL","Norway":"NO","Pakistan":"PK","Peru":"PE",
  "Poland":"PL","Portugal":"PT","Russia":"RU","Serbia":"RS",
  "South Africa":"ZA","Spain":"ES","Sweden":"SE","Switzerland":"CH",
  "Turkey":"TR","UK":"GB","Ukraine":"UA","USA":"US","Venezuela":"VE",
  "Jamaica":"JM","Barbados":"BB","Puerto Rico":"PR","Trinidad and Tobago":"TT",
  "New Zealand":"NZ","South Korea":"KR","Nigeria":"NG","Senegal":"SN",
  "Kenya":"KE","Ghana":"GH","Ethiopia":"ET","Cameroon":"CM",
  "Congo":"CD","Burkina Faso":"BF","Tanzania":"TZ","Zimbabwe":"ZW",
  "Algeria":"DZ","Tunisia":"TN","Morocco":"MA","Egypt":"EG",
  "Palestine":"PS","Saudi Arabia":"SA","Iran":"IR","Iraq":"IQ",
  "Turkey":"TR","Myanmar":"MM","Vietnam":"VN","Cambodia":"KH",
  "Indonesia":"ID","Philippines":"PH","Singapore":"SG","Taiwan":"TW",
  "Nepal":"NP","Tibet":"CN","Mongolia":"MN","Kazakhstan":"KZ",
  "Slovenia":"SI","Croatia":"HR","Slovakia":"SK","Bolivia":"BO",
  "Guatemala":"GT","Albania":"AL","Finland":"FI",
};

function Flag({ country, size=15 }) {
  const iso = COUNTRY_ISO[country];
  const [err, setErr] = useState(false);
  if (!iso || err) return <span style={{fontSize:size}}>🌐</span>;
  return (
    <img
      src={FLAG_SVG_URL(iso)}
      alt={country}
      onError={()=>setErr(true)}
      style={{width:size*1.5,height:size,objectFit:"cover",borderRadius:2,display:"inline-block",verticalAlign:"middle",flexShrink:0}}
    />
  );
}

const flag = c => COUNTRY_ISO[c] ? c : "?";
const catIcon = c => CAT_ICON[c] || "•";

const padRank   = n => n < 10 ? `0${n}` : `${n}`;
const fmtFull   = n => n.toLocaleString();
const titleCase = s => s.trim().replace(/\b\w/g, c => c.toUpperCase());
function lev(a,b){const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=a[i-1]===b[j-1]?d[i-1][j-1]:1+Math.min(d[i-1][j],d[i][j-1],d[i-1][j-1]);return d[m][n];}
const sim=(a,b)=>{const mx=Math.max(a.length,b.length);return mx===0?1:1-lev(a.toLowerCase().trim(),b.toLowerCase().trim())/mx;};

// rank medal config
const RANK_STYLE = {
  1: { color:"#b45309", bg:"#fef3c7", border:"#fcd34d", size:28, medal:"🥇" },
  2: { color:"#475569", bg:"#f1f5f9", border:"#cbd5e1", size:22, medal:"🥈" },
  3: { color:"#92400e", bg:"#fff7ed", border:"#fed7aa", size:20, medal:"🥉" },
};

// ── Wikipedia photo ───────────────────────────────────────────────────────────
const photoCache = {};
function usePhoto(name) {
  const [url, setUrl] = useState(()=> photoCache[name] !== undefined ? photoCache[name] : undefined);
  useEffect(()=>{
    if (!name || photoCache[name] !== undefined) { if (photoCache[name]!==undefined) setUrl(photoCache[name]); return; }
    let dead = false;
    fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(name.split(" (")[0])}&gsrlimit=1&prop=pageimages&pithumbsize=300&format=json&origin=*`)
      .then(r=>r.json()).then(data=>{
        if (dead) return;
        const page = data.query && Object.values(data.query.pages||{})[0];
        const found = page?.thumbnail?.source ?? null;
        photoCache[name]=found; setUrl(found);
      }).catch(()=>{ if(!dead){photoCache[name]=null;setUrl(null);} });
    return ()=>{dead=true;};
  },[name]);
  return url;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const AV_COLORS = ["#dbeafe|#1d4ed8","#f3e8ff|#7c3aed","#dcfce7|#15803d","#fef9c3|#a16207","#fee2e2|#b91c1c","#e0f2fe|#0369a1","#fce7f3|#be185d","#f1f5f9|#475569"];
function Avatar({ name, size=52 }) {
  const url = usePhoto(name);
  const [err, setErr] = useState(false);
  const initials = name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  let hash=0; for(let i=0;i<name.length;i++) hash=name.charCodeAt(i)+((hash<<5)-hash);
  const [bg,fg] = AV_COLORS[Math.abs(hash)%AV_COLORS.length].split("|");
  if (url && !err)
    return <img src={url} alt={name} onError={()=>setErr(true)} loading="lazy"
      style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,background:"#f1f5f9"}}/>;
  return <div style={{width:size,height:size,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*0.25,flexShrink:0,background:bg,color:fg}}>{initials}</div>;
}

// ── Filter Picker ─────────────────────────────────────────────────────────────
function FilterPicker({ label, icon, value, options, getLabel, onSelect, onClear, accentColor, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isActive = value !== "All";

  const toggle = v => { setOpen(v); onOpenChange?.(v); };

  useEffect(()=>{
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) toggle(false); };
    document.addEventListener("mousedown", h);
    return ()=>document.removeEventListener("mousedown", h);
  },[open]);

  return (
    <div ref={ref} style={{position:"relative"}}>
      <button
        onClick={()=>toggle(!open)}
        style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:999,
          border:`1.5px solid ${isActive ? accentColor : "#e2e8f0"}`,
          background:isActive ? accentColor : "transparent",
          color:isActive ? "#fff" : "#94a3b8",
          fontWeight:600,fontSize:12,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap",
          boxShadow:isActive?`0 2px 8px ${accentColor}40`:"none"}}>
        {isActive ? (
          <span style={{display:"flex",alignItems:"center",gap:5}}>
            {icon}
            <span>{getLabel(value,false)}</span>
          </span>
        ) : (
          <span>{label}</span>
        )}
        {isActive && <span onClick={e=>{e.stopPropagation();onClear();toggle(false);}} style={{marginLeft:2,opacity:.8,fontSize:10}}>✕</span>}
      </button>
      {open && (
        <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",minWidth:180,zIndex:500,overflow:"hidden",maxHeight:280,overflowY:"auto",animation:"fu .14s ease"}}>
          {options.filter(o=>o!=="All").map(o=>(
            <button key={o} onClick={()=>{onSelect(o);toggle(false);}}
              style={{width:"100%",textAlign:"left",padding:"10px 16px",border:"none",background:value===o?"#f8fafc":"transparent",cursor:"pointer",fontSize:13,fontWeight:value===o?600:400,color:value===o?"#09090b":"#374151",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #f1f5f9",transition:"background .1s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
              onMouseLeave={e=>e.currentTarget.style.background=value===o?"#f8fafc":"transparent"}>
              <span style={{fontSize:16,lineHeight:1}}>{getLabel(o,true)}</span>
              <span>{o}</span>
              {value===o && <span style={{marginLeft:"auto",color:accentColor,fontSize:12}}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Person Detail Panel ───────────────────────────────────────────────────────
function DetailPanel({ person, rank, voteState, onVote, onClose }) {
  const rs = RANK_STYLE[rank];
  return (
    <div style={{position:"fixed",inset:0,zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.4)",backdropFilter:"blur(6px)",padding:"0 16px"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",width:"100%",maxWidth:420,borderRadius:24,padding:"28px 24px 28px",boxShadow:"0 8px 48px rgba(0,0,0,0.18)",animation:"fu .2s cubic-bezier(.4,0,.2,1)"}}>
        {/* close */}
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button onClick={onClose} style={{padding:8,borderRadius:"50%",border:"none",background:"#f8fafc",cursor:"pointer",display:"flex"}}><X size={16} style={{color:"#94a3b8"}}/></button>
        </div>

        {/* rank badge + avatar */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
          <div style={{position:"relative",flexShrink:0}}>
            <Avatar name={person.name} size={72}/>
            {rs && <div style={{position:"absolute",bottom:-4,right:-4,fontSize:20,lineHeight:1}}>{rs.medal}</div>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              {rs
                ? <span style={{fontSize:13,fontWeight:800,color:rs.color,background:rs.bg,border:`1px solid ${rs.border}`,borderRadius:6,padding:"2px 8px"}}>#{rank}</span>
                : <span style={{fontSize:13,fontWeight:700,color:"#94a3b8"}}>#{rank}</span>
              }
              <span style={{fontSize:11,color:"#94a3b8"}}>{catIcon(person.category)} {person.category}</span>
            </div>
            <h2 style={{fontSize:22,fontWeight:800,margin:0,letterSpacing:-.5,lineHeight:1.1}}>{person.name}</h2>
            <p style={{fontSize:13,color:"#64748b",margin:"4px 0 0",display:"flex",alignItems:"center",gap:5}}><Flag country={person.country}/> {person.country}</p>
          </div>
        </div>

        {/* vote score */}
        <div style={{background:"#f8fafc",borderRadius:16,padding:"16px 20px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
            <span style={{fontSize:13,color:"#64748b",fontWeight:500}}>Votos totales</span>
            <span style={{fontSize:28,fontWeight:800,letterSpacing:-1,color:"#09090b"}}>{fmtFull(person.votes)}</span>
          </div>
        </div>

        {/* big vote buttons — Up first, Down second */}
        <div style={{display:"flex",gap:12}}>
          <button onClick={()=>onVote(person.id,"up")}
            style={{flex:1,padding:"14px 0",borderRadius:16,border:`2px solid ${voteState==="up"?"#2563eb":"#e2e8f0"}`,background:voteState==="up"?"#eff6ff":"#fff",color:voteState==="up"?"#2563eb":"#94a3b8",fontWeight:700,fontSize:15,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <ChevronUp size={20}/> Subir
          </button>
          <button onClick={()=>onVote(person.id,"down")}
            style={{flex:1,padding:"14px 0",borderRadius:16,border:`2px solid ${voteState==="down"?"#dc2626":"#e2e8f0"}`,background:voteState==="down"?"#fef2f2":"#fff",color:voteState==="down"?"#dc2626":"#94a3b8",fontWeight:700,fontSize:15,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <ChevronDown size={20}/> Bajar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
const ROW_H   = 116;
const OVERSCAN = 8;

function Row({ person, rank, voteState, pulse, onVote, highlighted, onTap }) {
  const rs = RANK_STYLE[rank];

  return (
    <li
      onClick={onTap}
      style={{height:ROW_H,display:"flex",alignItems:"center",padding:"0 16px 0 16px",
        borderBottom:"1px solid #f1f5f9",
        borderTop: rank > 1 && rank % 10 === 1 ? "2px solid #f1f5f9" : "none",
        background: highlighted ? (rs===RANK_STYLE[1]?"#fffbeb":"#eff6ff") : rs===RANK_STYLE[1] ? "#fffdf0" : "#fff",
        transition:"background .2s",cursor:"pointer",boxSizing:"border-box",listStyle:"none"}}>

      {/* rank — always readable */}
      <div style={{width:44,flexShrink:0,textAlign:"center"}}>
        {rs ? (
          <div style={{fontSize:20,lineHeight:1}}>{rs.medal}</div>
        ) : (
          <span style={{fontSize:15,fontWeight:700,color:"#94a3b8",fontVariantNumeric:"tabular-nums"}}>{padRank(rank)}</span>
        )}
      </div>

      {/* avatar */}
      <div style={{marginRight:14,flexShrink:0}}>
        <Avatar name={person.name} size={56}/>
      </div>

      {/* info */}
      <div style={{flex:1,minWidth:0,paddingRight:8}}>
        <p style={{fontSize:13,fontWeight:700,color:"#09090b",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1.25}}>{person.name}</p>
        <p style={{fontSize:11,fontWeight:500,color:"#6b7280",margin:"5px 0 0",display:"flex",alignItems:"center",gap:5,lineHeight:1}}>
          <span>{catIcon(person.category)} {person.category}</span>
          <span style={{opacity:.35}}>·</span>
          <span style={{display:"flex",alignItems:"center",gap:3}}><Flag country={person.country}/> {person.country}</span>
        </p>
      </div>

      {/* vote */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,minWidth:52,gap:6}}>
        <button
          onClick={e=>{e.stopPropagation();onVote(person.id,"up");}}
          style={{width:30,height:30,borderRadius:10,border:`1.5px solid ${voteState==="up"?"#2563eb":"#e2e8f0"}`,background:voteState==="up"?"#eff6ff":"transparent",color:voteState==="up"?"#2563eb":"#cbd5e1",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",transform:pulse?"scale(1.2)":"scale(1)"}}>
          <ChevronUp size={14}/>
        </button>
        <span style={{fontSize:13,fontWeight:800,fontVariantNumeric:"tabular-nums",letterSpacing:-.3,color:voteState==="up"?"#2563eb":voteState==="down"?"#dc2626":"#111827",lineHeight:1}}>
          {fmtFull(person.votes)}
        </span>
        <button
          onClick={e=>{e.stopPropagation();onVote(person.id,"down");}}
          style={{width:30,height:30,borderRadius:10,border:`1.5px solid ${voteState==="down"?"#dc2626":"#e2e8f0"}`,background:voteState==="down"?"#fef2f2":"transparent",color:voteState==="down"?"#dc2626":"#cbd5e1",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
          <ChevronDown size={14}/>
        </button>
      </div>
    </li>
  );
}



const CATS = ["Sports","Music","Science","Technology","Art","Cinema","Literature","Politics","Philosophy","Activism"];
const COUNTRIES = ["Argentina","Australia","Austria","Belgium","Brazil","Canada","Chile","China","Colombia","Cuba","Czech Republic","Denmark","Egypt","Finland","France","Germany","Greece","Hungary","India","Ireland","Israel","Italy","Japan","Mexico","Netherlands","Norway","Pakistan","Peru","Poland","Portugal","Russia","Serbia","South Africa","Spain","Sweden","Switzerland","Turkey","UK","Ukraine","USA","Venezuela"];

function AdminPanel({ people, onClose, onAdd, onDelete }) {
  const [tab, setTab]       = useState("people"); // "people" | "add" | "pending"
  const [name, setName]     = useState("");
  const [cat, setCat]       = useState("Sports");
  const [country, setCountry] = useState("USA");
  const [msg, setMsg]       = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState([
    {id:"q1",name:"Shakira",category:"Music",country:"Colombia"},
    {id:"q2",name:"Ronaldinho",category:"Sports",country:"Brazil"},
  ]);

  const add = () => {
    if (!name.trim()) return;
    const c = titleCase(name);
    onAdd(c, cat, country);
    setName(""); setMsg(`"${c}" añadido ✓`);
    setTimeout(()=>setMsg(""), 2500);
  };

  const approve = p => { onAdd(p.name, p.category, p.country||"—"); setPending(prev=>prev.filter(x=>x.id!==p.id)); };

  const filteredPeople = people
    .filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => b.votes - a.votes);

  const tabStyle = active => ({
    padding:"7px 16px", borderRadius:999, fontSize:12, fontWeight:600,
    border:"none", cursor:"pointer", transition:"all .15s",
    background: active ? "#09090b" : "transparent",
    color: active ? "#fff" : "#94a3b8",
  });

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"#fff",display:"flex",flexDirection:"column"}}>
      {/* header */}
      <div style={{padding:"20px 20px 0",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Shield size={16} style={{color:"#2563eb"}}/>
              <h1 style={{fontSize:18,fontWeight:700,margin:0}}>Admin</h1>
            </div>
            <button onClick={onClose} style={{padding:8,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer"}}>
              <X size={18} style={{color:"#94a3b8"}}/>
            </button>
          </div>
          {/* tabs */}
          <div style={{display:"flex",gap:4,paddingBottom:16}}>
            <button style={tabStyle(tab==="people")} onClick={()=>setTab("people")}>
              Ranking ({people.length})
            </button>
            <button style={tabStyle(tab==="add")} onClick={()=>setTab("add")}>
              + Añadir
            </button>
            <button style={tabStyle(tab==="pending")} onClick={()=>setTab("pending")}>
              Pendientes {pending.length>0&&<span style={{background:"#2563eb",color:"#fff",borderRadius:999,padding:"1px 5px",fontSize:10,marginLeft:4}}>{pending.length}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* content */}
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{maxWidth:560,margin:"0 auto",padding:"20px"}}>

          {/* ── TAB: PEOPLE ── */}
          {tab==="people" && (
            <>
              <input
                placeholder="Buscar persona..."
                value={search} onChange={e=>setSearch(e.target.value)}
                style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:12,padding:"9px 14px",fontSize:13,outline:"none",marginBottom:16,boxSizing:"border-box",background:"#f8fafc"}}
              />
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {filteredPeople.map((p,i)=>(
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,background:"#f8fafc",borderRadius:14,padding:"10px 14px"}}>
                    <span style={{fontSize:12,fontWeight:700,color:"#94a3b8",width:24,flexShrink:0}}>#{i+1}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontWeight:600,fontSize:13,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</p>
                      <p style={{fontSize:11,color:"#94a3b8",margin:"2px 0 0"}}>{catIcon(p.category)} {p.category} · <Flag country={p.country} size={11}/> {p.country}</p>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:"#64748b",flexShrink:0}}>{fmtFull(p.votes)}</span>
                    <button
                      onClick={()=>{ if(window.confirm(`¿Eliminar a "${p.name}"?`)) onDelete(p.id); }}
                      style={{padding:"5px 10px",borderRadius:8,border:"1px solid #fecaca",background:"#fef2f2",color:"#dc2626",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",gap:3}}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── TAB: ADD ── */}
          {tab==="add" && (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:6}}>Nombre</label>
                <input
                  autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}
                  placeholder="Nombre completo"
                  style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:12,padding:"10px 14px",fontSize:14,outline:"none",background:"#f8fafc",boxSizing:"border-box"}}
                />
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:6}}>Categoría</label>
                <select value={cat} onChange={e=>setCat(e.target.value)}
                  style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:12,padding:"10px 14px",fontSize:13,outline:"none",background:"#f8fafc",boxSizing:"border-box"}}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:6}}>País</label>
                <select value={country} onChange={e=>setCountry(e.target.value)}
                  style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:12,padding:"10px 14px",fontSize:13,outline:"none",background:"#f8fafc",boxSizing:"border-box"}}>
                  {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={add} disabled={!name.trim()}
                style={{padding:"13px 0",borderRadius:12,border:"none",background:name.trim()?"#2563eb":"#e2e8f0",color:name.trim()?"#fff":"#94a3b8",fontSize:14,fontWeight:700,cursor:name.trim()?"pointer":"not-allowed",transition:"all .15s"}}>
                Añadir al ranking
              </button>
              {msg && <p style={{textAlign:"center",fontSize:13,color:"#16a34a",fontWeight:600,margin:0}}>{msg}</p>}
            </div>
          )}

          {/* ── TAB: PENDING ── */}
          {tab==="pending" && (
            pending.length===0
              ? <div style={{textAlign:"center",padding:"48px 0",color:"#cbd5e1"}}>
                  <CheckCircle2 size={36} style={{margin:"0 auto 10px"}}/>
                  <p style={{fontSize:13}}>Sin sugerencias pendientes</p>
                </div>
              : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {pending.map(p=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,background:"#f8fafc",borderRadius:14,padding:"12px 16px"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontWeight:700,fontSize:13,margin:0}}>{p.name}</p>
                        <p style={{fontSize:11,color:"#94a3b8",margin:"2px 0 0"}}>{catIcon(p.category)} {p.category} · <Flag country={p.country} size={11}/> {p.country}</p>
                      </div>
                      <button onClick={()=>approve(p)} style={{display:"flex",alignItems:"center",gap:4,background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                        <Check size={12}/>Aprobar
                      </button>
                      <button onClick={()=>setPending(prev=>prev.filter(x=>x.id!==p.id))} style={{display:"flex",alignItems:"center",gap:4,background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                        <Trash2 size={12}/>Rechazar
                      </button>
                    </div>
                  ))}
                </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [people,        setPeople]        = useState(SEED);
  const [votes,         setVotes]         = useState({});
  const [pulse,         setPulse]         = useState({});
  const [filterCat,     setFilterCat]     = useState("All");
  const [filterCountry, setFilterCountry] = useState("All");
  const [sortOrder,     setSortOrder]     = useState("most_voted");
  const [isSearch,      setIsSearch]      = useState(false);
  const [searchQ,       setSearchQ]       = useState("");
  const [hlId,          setHlId]          = useState(null);
  const [suggest,       setSuggest]       = useState(false);
  const [sugName,       setSugName]       = useState("");
  const [sugCat,        setSugCat]        = useState("Community");
  const [dupWarn,       setDupWarn]       = useState(null);
  const [sugDone,       setSugDone]       = useState(false);
  const [detailPerson,  setDetailPerson]  = useState(null);
  const [adminOpen,     setAdminOpen]     = useState(false);
  const [adminLogin,    setAdminLogin]    = useState(false);
  const [adminPw,       setAdminPw]       = useState("");
  const [adminOk,       setAdminOk]       = useState(false);
  const [scrollTop,     setScrollTop]     = useState(0);
  const [showUp,        setShowUp]        = useState(false);
  const [navHidden,     setNavHidden]     = useState(false);
  const anyPickerOpen = useRef(false);
  const listRef       = useRef(null);
  const searchRef     = useRef(null);
  const lastScrollY   = useRef(0);
  const hideTimer     = useRef(null);

  const HEADER_H   = 124;
  const containerH = typeof window !== "undefined" ? window.innerHeight - HEADER_H : 500;

  const allCats      = useMemo(()=>["All",...[...new Set(people.map(p=>p.category))].sort()],[people]);
  const allCountries = useMemo(()=>["All",...[...new Set(people.map(p=>p.country).filter(Boolean))].sort()],[people]);

  const ranked = useMemo(()=>{
    let list = people;
    if (filterCat     !== "All") list = list.filter(p=>p.category===filterCat);
    if (filterCountry !== "All") list = list.filter(p=>p.country===filterCountry);
    list = [...list].sort((a,b)=>sortOrder==="most_voted"?b.votes-a.votes:a.votes-b.votes);
    let rank=1;
    return list.map((p,i)=>{ if(i>0&&p.votes!==list[i-1].votes) rank=i+1; return{...p,rank}; });
  },[people,filterCat,filterCountry,sortOrder]);

  const searchRes = useMemo(()=>{
    if(!searchQ.trim()) return [];
    const q = searchQ.toLowerCase();
    // search globally across ALL people, not just current filter
    return [...people]
      .sort((a,b)=>b.votes-a.votes)
      .filter(p=>p.name.toLowerCase().includes(q))
      .slice(0,6);
  },[searchQ,people]);

  const scrollToItem = useCallback(id=>{
    const idx=ranked.findIndex(p=>p.id===id);
    if(idx<0||!listRef.current) return;
    listRef.current.scrollTo({top:Math.max(0,HEADER_H+idx*ROW_H-containerH/2+ROW_H/2),behavior:"smooth"});
    setHlId(id); setTimeout(()=>setHlId(null),2000);
  },[ranked,containerH]);

  const handleVote = useCallback((id,dir)=>{
    setVotes(prev=>{
      const cur=prev[id];
      let delta=0, next={...prev};
      if(cur===dir){
        // same direction → remove vote
        delta = dir==="up" ? -1 : 1;
        delete next[id];
      } else if(cur){
        // switch direction
        delta = dir==="up" ? 2 : -2;
        next[id]=dir;
      } else {
        // new vote
        delta = dir==="up" ? 1 : -1;
        next[id]=dir;
      }
      setPeople(ps=>ps.map(p=>p.id===id?{...p,votes:p.votes+delta}:p));
      return next;
    });
    setPulse(prev=>({...prev,[id]:true}));
    setTimeout(()=>setPulse(prev=>({...prev,[id]:false})),350);
  },[]);

  const handleSuggest = useCallback(()=>{
    if(!sugName.trim()) return;
    const clean=titleCase(sugName);
    const dupe=people.find(p=>sim(p.name,clean)>0.75);
    if(dupe){setDupWarn(dupe.name);return;}
    setSugDone(true);
    setTimeout(()=>{setSuggest(false);setSugDone(false);setSugName("");setDupWarn(null);},2000);
  },[sugName,people]);

  const handleAdd = useCallback((name,cat,country)=>{
    setPeople(prev=>[...prev,{id:`pn${Date.now()}`,name,category:cat,country:country||"—",votes:0}]);
  },[]);

  const handleDelete = useCallback((id)=>{
    setPeople(prev=>prev.filter(p=>p.id!==id));
    setVotes(prev=>{ const n={...prev}; delete n[id]; return n; });
  },[]);

  const tryAdmin = ()=>{ if(adminPw==="peoplepick2025"){setAdminOk(true);setAdminOpen(true);setAdminLogin(false);setAdminPw("");}else setAdminPw(""); };

  const handleScroll = useCallback(e=>{
    const y=e.currentTarget.scrollTop;
    const prev=lastScrollY.current;
    lastScrollY.current=y;
    setScrollTop(y);
    setShowUp(y>200);
    clearTimeout(hideTimer.current);
    if(anyPickerOpen.current) return;
    if(y<60){setNavHidden(false);return;}
    if(y>prev){
      hideTimer.current=setTimeout(()=>setNavHidden(true),1200);
    } else {
      setNavHidden(false);
      hideTimer.current=setTimeout(()=>setNavHidden(true),2500);
    }
  },[]);

  const totalH     = ranked.length * ROW_H;
  const visibleTop = Math.max(0, scrollTop - HEADER_H);
  const startIdx   = Math.max(0, Math.floor(visibleTop / ROW_H) - OVERSCAN);
  const endIdx     = Math.min(ranked.length - 1, Math.ceil((visibleTop + containerH) / ROW_H) + OVERSCAN);

  const glass = {background:"rgba(255,255,255,0.88)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"};

  return (
    <div style={{height:"100vh",overflow:"hidden",fontFamily:"Inter,system-ui,sans-serif",background:"#fff",color:"#09090b"}}>
      <style>{`
        @keyframes fu{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fu .15s ease}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        button:focus{outline:none}
        li:hover{background:#fafafa}
      `}</style>

      {/* ── FIXED HEADER ── */}
      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:100,...glass,borderBottom:"1px solid rgba(226,232,240,0.8)",transition:"transform .35s cubic-bezier(.4,0,.2,1)",transform:navHidden?"translateY(-100%)":"translateY(0)"}}>

        {/* NAV PILL */}
        <div style={{maxWidth:672,margin:"0 auto",padding:"14px 16px 8px"}}>
          <div style={{border:"1px solid rgba(226,232,240,0.9)",borderRadius:999,padding:"0 22px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,0.7)",boxShadow:"0 2px 16px rgba(0,0,0,0.06)"}}>
            {!isSearch ? (
              <>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:"#2563eb",flexShrink:0}}/>
                  <span style={{fontSize:16,fontWeight:700,letterSpacing:-.4}}>PeoplePick</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:2}}>
                  <button onClick={()=>{setIsSearch(true);setTimeout(()=>searchRef.current?.focus(),80);}} style={{padding:9,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer",color:"#64748b",display:"flex"}}><Search size={16}/></button>
                  <button onClick={()=>setSuggest(true)} style={{padding:9,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer",color:"#09090b",display:"flex"}}><Plus size={18}/></button>
                </div>
              </>
            ):(
              <div style={{display:"flex",alignItems:"center",width:"100%",gap:10}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:"#2563eb",flexShrink:0}}/>
                <input ref={searchRef} type="text" placeholder="Search..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                  style={{flex:1,fontSize:15,fontWeight:500,border:"none",outline:"none",background:"transparent",color:"#09090b"}}/>
                <button onClick={()=>{setIsSearch(false);setSearchQ("");}} style={{padding:9,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer",color:"#94a3b8",display:"flex"}}><X size={16}/></button>
              </div>
            )}
          </div>

          {/* search dropdown */}
          {isSearch && searchQ.trim() && (
            <div className="fu" style={{marginTop:6,background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.1)"}}>
              {searchRes.length>0 ? searchRes.map(p=>(
                <button key={p.id} onClick={()=>{setIsSearch(false);setSearchQ("");scrollToItem(p.id);}}
                  style={{width:"100%",textAlign:"left",padding:"12px 18px",border:"none",borderBottom:"1px solid #f8fafc",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontWeight:600,fontSize:14}}>{p.name}</span>
                  <span style={{fontSize:12,fontWeight:700,color:"#2563eb"}}>Go →</span>
                </button>
              )):(
                <div style={{padding:"16px 20px",textAlign:"center"}}>
                  <p style={{color:"#94a3b8",fontSize:13,marginBottom:8}}>No encontrado</p>
                  <button onClick={()=>{setSugName(searchQ);setIsSearch(false);setSearchQ("");setSuggest(true);}} style={{color:"#2563eb",fontWeight:700,fontSize:13,border:"none",background:"transparent",cursor:"pointer"}}>+ Sugerir "{searchQ}"</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FILTERS */}
        <div style={{maxWidth:672,margin:"0 auto",padding:"4px 16px 8px",display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setSortOrder(o=>o==="most_voted"?"least_voted":"most_voted")}
            style={{padding:"4px 6px",borderRadius:"50%",border:"1px solid #e2e8f0",background:"transparent",cursor:"pointer",color:"#94a3b8",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
            <ArrowUpDown size={12}/>
          </button>
          <FilterPicker label="Category" icon={filterCat==="All"?"🏷":catIcon(filterCat)} value={filterCat} options={allCats}
            getLabel={(v,wi)=>wi?catIcon(v):v} onSelect={setFilterCat} onClear={()=>setFilterCat("All")} accentColor="#2563eb"
            onOpenChange={v=>{anyPickerOpen.current=v;if(v){setNavHidden(false);clearTimeout(hideTimer.current);}}}/>
          <FilterPicker
            label="Country"
            icon={filterCountry==="All" ? "🌐" : <Flag country={filterCountry} size={14}/>}
            value={filterCountry}
            options={allCountries}
            getLabel={(v,wi) => wi ? <Flag country={v} size={14}/> : v}
            onSelect={setFilterCountry}
            onClear={()=>setFilterCountry("All")}
            accentColor="#2563eb"
            onOpenChange={v=>{anyPickerOpen.current=v;if(v){setNavHidden(false);clearTimeout(hideTimer.current);}}}
          />
          {(filterCat!=="All"||filterCountry!=="All") && (
            <button onClick={()=>{setFilterCat("All");setFilterCountry("All");}}
              style={{marginLeft:"auto",fontSize:11,fontWeight:600,color:"#94a3b8",border:"none",background:"transparent",cursor:"pointer",whiteSpace:"nowrap"}}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── LIST ── */}
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,overflow:"hidden"}}>
        <div ref={listRef} onScroll={handleScroll} style={{height:"100%",overflowY:"auto",maxWidth:672,margin:"0 auto"}}>
          {ranked.length===0 ? (
            /* ── EMPTY STATE ── */
            <div style={{paddingTop:HEADER_H+60,textAlign:"center",padding:`${HEADER_H+60}px 32px 40px`}}>
              <div style={{fontSize:48,marginBottom:16}}>🔍</div>
              <h3 style={{fontSize:18,fontWeight:700,margin:"0 0 8px",color:"#09090b"}}>Sin resultados</h3>
              <p style={{fontSize:14,color:"#94a3b8",marginBottom:24,lineHeight:1.6}}>
                No hay nadie con{filterCat!=="All"?` categoría "${filterCat}"`:""}
                {filterCountry!=="All"?` de ${filterCountry}`:""}.<br/>
                ¿Conoces a alguien que debería estar aquí?
              </p>
              <button onClick={()=>setSuggest(true)}
                style={{padding:"12px 24px",borderRadius:999,background:"#2563eb",color:"#fff",border:"none",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 4px 16px #2563eb40"}}>
                + Sugerir persona
              </button>
              <button onClick={()=>{setFilterCat("All");setFilterCountry("All");}}
                style={{marginLeft:12,padding:"12px 24px",borderRadius:999,background:"transparent",color:"#94a3b8",border:"1px solid #e2e8f0",fontWeight:600,fontSize:14,cursor:"pointer"}}>
                Quitar filtros
              </button>
            </div>
          ) : (
            <ul style={{position:"relative",height:totalH+HEADER_H,margin:0,padding:0}}>
              {ranked.slice(startIdx,endIdx+1).map((p,i)=>(
                <div key={p.id} style={{position:"absolute",top:HEADER_H+(startIdx+i)*ROW_H,left:0,right:0}}>
                  <Row
                    person={p} rank={p.rank}
                    voteState={votes[p.id]||null}
                    pulse={!!pulse[p.id]}
                    onVote={handleVote}
                    highlighted={hlId===p.id}
                    onTap={()=>setDetailPerson({...p,rank:p.rank})}
                  />
                </div>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── FAB scroll to top ── */}
      <div style={{position:"fixed",bottom:56,right:20,zIndex:500,opacity:showUp?1:0,pointerEvents:showUp?"auto":"none",transition:"opacity .25s"}}>
        <button onClick={()=>listRef.current?.scrollTo({top:0,behavior:"smooth"})}
          style={{width:44,height:44,borderRadius:"50%",background:"#09090b",color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(0,0,0,0.22)"}}>
          <ArrowUp size={17}/>
        </button>
      </div>

      {/* ── FOOTER ── */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:90,height:36,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",borderTop:"1px solid #f1f5f9",background:"rgba(255,255,255,0.9)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>
        <span style={{fontSize:11,color:"#c4c9d4",fontWeight:400}}>© 2025 Andrés Mateos</span>
        <button
          onClick={()=>adminOk?setAdminOpen(true):setAdminLogin(true)}
          style={{fontSize:11,color:"#c4c9d4",fontWeight:500,border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:"4px 0",transition:"color .15s"}}
          onMouseEnter={e=>e.currentTarget.style.color="#94a3b8"}
          onMouseLeave={e=>e.currentTarget.style.color="#c4c9d4"}
        >
          <Shield size={11}/> Admin
        </button>
      </div>

      {/* ── DETAIL PANEL ── */}
      {detailPerson && (()=>{
        // always read live data from people array
        const live = people.find(p=>p.id===detailPerson.id) || detailPerson;
        return (
          <DetailPanel
            person={live}
            rank={detailPerson.rank}
            voteState={votes[detailPerson.id]||null}
            onVote={handleVote}
            onClose={()=>setDetailPerson(null)}
          />
        );
      })()}

      {/* ── SUGGEST MODAL ── */}
      {suggest && (
        <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.3)",backdropFilter:"blur(4px)",padding:"0 16px"}} onClick={e=>e.target===e.currentTarget&&setSuggest(false)}>
          <div className="fu" style={{background:"#fff",width:"100%",maxWidth:420,borderRadius:24,padding:28,boxShadow:"0 8px 40px rgba(0,0,0,0.14)"}}>
            {sugDone ? (
              <div style={{padding:"28px 0",textAlign:"center"}}>
                <CheckCircle2 size={40} style={{color:"#22c55e",margin:"0 auto 12px"}}/>
                <h2 style={{fontSize:20,fontWeight:700,marginBottom:6}}>¡Sugerencia enviada!</h2>
                <p style={{color:"#94a3b8",fontSize:13}}>Será revisada antes de aparecer.</p>
              </div>
            ):(
              <>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
                  <div><h2 style={{fontSize:20,fontWeight:700,margin:0}}>Sugerir persona</h2><p style={{color:"#94a3b8",fontSize:13,marginTop:4}}>Bajo revisión antes de publicarse</p></div>
                  <button onClick={()=>{setSuggest(false);setSugName("");setDupWarn(null);}} style={{padding:8,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer"}}><X size={18} style={{color:"#94a3b8"}}/></button>
                </div>
                <input autoFocus type="text" value={sugName} onChange={e=>{setSugName(e.target.value);setDupWarn(null);}} onKeyDown={e=>e.key==="Enter"&&handleSuggest()} placeholder="Nombre completo..."
                  style={{width:"100%",fontSize:20,fontWeight:600,border:"none",borderBottom:"2px solid #e2e8f0",padding:"10px 0",outline:"none",marginBottom:16,background:"transparent",boxSizing:"border-box"}}/>
                {dupWarn && <div style={{display:"flex",gap:8,background:"#fef2f2",color:"#dc2626",padding:"10px 14px",borderRadius:12,fontSize:13,marginBottom:14}}><AlertCircle size={15} style={{flexShrink:0,marginTop:2}}/><div><b>Ya existe</b> — "{dupWarn}" ya está en el ranking.</div></div>}
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>
                  {["Community",...CATS].map(c=>(
                    <button key={c} onClick={()=>setSugCat(c)} style={{padding:"5px 12px",borderRadius:999,fontSize:12,fontWeight:600,border:"none",cursor:"pointer",background:sugCat===c?"#2563eb":"#f1f5f9",color:sugCat===c?"#fff":"#64748b",transition:"all .12s"}}>
                      {catIcon(c)} {c}
                    </button>
                  ))}
                </div>
                <button onClick={handleSuggest} disabled={!sugName.trim()} style={{width:"100%",padding:"13px 0",borderRadius:999,fontWeight:700,fontSize:15,border:"none",cursor:sugName.trim()?"pointer":"not-allowed",background:sugName.trim()?"#2563eb":"#f1f5f9",color:sugName.trim()?"#fff":"#94a3b8",transition:"all .15s"}}>
                  Enviar sugerencia
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ADMIN LOGIN ── */}
      {adminLogin && (
        <div style={{position:"fixed",inset:0,zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.3)",backdropFilter:"blur(4px)"}} onClick={e=>e.target===e.currentTarget&&setAdminLogin(false)}>
          <div className="fu" style={{background:"#fff",borderRadius:24,padding:28,width:"100%",maxWidth:340,margin:"0 16px",boxShadow:"0 8px 40px rgba(0,0,0,0.1)"}}>
            <h2 style={{fontSize:17,fontWeight:700,margin:"0 0 4px"}}>Acceso admin</h2>
            <p style={{color:"#94a3b8",fontSize:12,marginBottom:14}}>Demo: <code style={{background:"#f1f5f9",padding:"2px 6px",borderRadius:6}}>peoplepick2025</code></p>
            <input type="password" autoFocus value={adminPw} onChange={e=>setAdminPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryAdmin()} placeholder="Contraseña"
              style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:12,padding:"9px 12px",fontSize:14,outline:"none",marginBottom:14,boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setAdminLogin(false)} style={{flex:1,padding:"10px 0",borderRadius:12,border:"1px solid #e2e8f0",background:"transparent",fontSize:13,fontWeight:600,color:"#64748b",cursor:"pointer"}}>Cancelar</button>
              <button onClick={tryAdmin} style={{flex:1,padding:"10px 0",borderRadius:12,border:"none",background:"#2563eb",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Entrar</button>
            </div>
          </div>
        </div>
      )}

      {adminOpen && <AdminPanel people={people} onClose={()=>setAdminOpen(false)} onAdd={handleAdd} onDelete={handleDelete}/>}
    </div>
  );
}
