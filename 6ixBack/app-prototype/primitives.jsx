// Shared visual primitives → mobile-first, committed brand system

function Logo({size=20, color, mark=true}){
  const c = color || 'currentColor';
  const id = React.useId().replace(/:/g,'');
  const m = size * 1.7; // mark size
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:10,color:c,fontFamily:'var(--display)',fontWeight:900,letterSpacing:'-.01em',fontSize:size,lineHeight:1}}>
      {mark && (
        <svg width={m} height={m} viewBox="0 0 60 60" aria-hidden style={{flexShrink:0}}>
          <defs>
            <clipPath id={`logo-ball-${id}`}>
              <circle cx="30" cy="30" r="27"/>
            </clipPath>
          </defs>
          {/* Ball body */}
          <circle cx="30" cy="30" r="27" fill={c}/>
          {/* Volleyball seam panels → three curves through the center */}
          <g clipPath={`url(#logo-ball-${id})`} fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round">
            <path d="M 4 30 Q 30 14 56 30"/>
            <path d="M 4 30 Q 30 46 56 30"/>
            <path d="M 30 4 Q 14 30 30 56"/>
            <path d="M 30 4 Q 46 30 30 56"/>
          </g>
          {/* Big "6" glyph dropped into the ball */}
          <text x="30" y="42" textAnchor="middle"
                fontFamily="var(--display)" fontWeight="900" fontSize="36"
                fill="var(--accent)"
                style={{letterSpacing:'-.05em', paintOrder:'stroke'}}
                stroke={c} strokeWidth="2.5" strokeLinejoin="round">6</text>
          {/* Outer rim */}
          <circle cx="30" cy="30" r="27" fill="none" stroke={c} strokeWidth="2"/>
        </svg>
      )}
      <span>6IX BACK</span>
    </span>
  );
}

function SkillDots({level, size=9}){
  const n = window.SKILL_DOTS[level] || 1;
  return (
    <span className="dots" title={level} aria-label={level} style={{'--d':size+'px'}}>
      {[1,2,3,4].map(i => <i key={i} className={i<=n?'on':''}/>)}
    </span>
  );
}

function CourtSVG({className, stroke="currentColor", strokeOpacity=.18, style}){
  // Volleyball court → 18m × 9m. Center net line, 3m attack lines on each side, service zones.
  return (
    <svg className={className} viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet" aria-hidden style={style}>
      {/* Free zone (outer playing area) */}
      <rect x="10" y="10" width="580" height="300" fill="none" stroke={stroke} strokeOpacity={strokeOpacity*.4} strokeWidth="1" strokeDasharray="3 5"/>
      {/* Court boundary */}
      <rect x="60" y="40" width="480" height="240" fill="none" stroke={stroke} strokeOpacity={strokeOpacity} strokeWidth="3"/>
      {/* Center line / net */}
      <line x1="300" y1="40" x2="300" y2="280" stroke={stroke} strokeOpacity={strokeOpacity} strokeWidth="3"/>
      {/* Net posts */}
      <circle cx="300" cy="40" r="3" fill={stroke} fillOpacity={strokeOpacity}/>
      <circle cx="300" cy="280" r="3" fill={stroke} fillOpacity={strokeOpacity}/>
      {/* Net hatching */}
      <g stroke={stroke} strokeOpacity={strokeOpacity*.5} strokeWidth="0.6">
        {Array.from({length:14}).map((_,i)=>(
          <line key={i} x1={295} y1={48 + i*17} x2={305} y2={48 + i*17}/>
        ))}
      </g>
      {/* 3m attack lines (left + right of net) */}
      <line x1="220" y1="40" x2="220" y2="280" stroke={stroke} strokeOpacity={strokeOpacity} strokeWidth="2"/>
      <line x1="380" y1="40" x2="380" y2="280" stroke={stroke} strokeOpacity={strokeOpacity} strokeWidth="2"/>
      {/* Service zones (back lines extended) */}
      <line x1="60" y1="40" x2="40" y2="40" stroke={stroke} strokeOpacity={strokeOpacity*.7} strokeWidth="1.5"/>
      <line x1="60" y1="280" x2="40" y2="280" stroke={stroke} strokeOpacity={strokeOpacity*.7} strokeWidth="1.5"/>
      <line x1="540" y1="40" x2="560" y2="40" stroke={stroke} strokeOpacity={strokeOpacity*.7} strokeWidth="1.5"/>
      <line x1="540" y1="280" x2="560" y2="280" stroke={stroke} strokeOpacity={strokeOpacity*.7} strokeWidth="1.5"/>
    </svg>
  );
}

function VolleyballMark({size=120, color="var(--ink)", bg="var(--accent)"}){
  // Stylized volleyball → concentric arcs, never realistic
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <circle cx="60" cy="60" r="56" fill={bg} stroke={color} strokeWidth="3"/>
      <path d="M 12 60 Q 60 30 108 60" fill="none" stroke={color} strokeWidth="2.5"/>
      <path d="M 12 60 Q 60 90 108 60" fill="none" stroke={color} strokeWidth="2.5"/>
      <path d="M 60 4 Q 30 60 60 116" fill="none" stroke={color} strokeWidth="2.5"/>
      <path d="M 60 4 Q 90 60 60 116" fill="none" stroke={color} strokeWidth="2.5"/>
      <circle cx="60" cy="60" r="5" fill={color}/>
    </svg>
  );
}

function MikasaBall({size=300, ink='var(--ink)'}){
  // Realistic Mikasa MVA200-style competition ball: yellow + blue + white panels.
  // Six teardrop panels meeting at a top pole, with rim shading.
  const blue = '#0c4a8a';
  const yellow = '#f5c518';
  const white = '#fafaf6';
  const id = React.useId().replace(/:/g,'');
  return (
    <svg width={size} height={size} viewBox="0 0 300 300" aria-hidden>
      <defs>
        <radialGradient id={`shade-${id}`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".55"/>
          <stop offset="55%" stopColor="#fff" stopOpacity="0"/>
          <stop offset="100%" stopColor="#000" stopOpacity=".28"/>
        </radialGradient>
        <clipPath id={`ball-${id}`}>
          <circle cx="150" cy="150" r="140"/>
        </clipPath>
      </defs>
      {/* Ball body */}
      <circle cx="150" cy="150" r="140" fill={white} stroke={ink} strokeWidth="3"/>
      <g clipPath={`url(#ball-${id})`}>
        {/* Six panels radiating from upper-left pole at (150,150). Each panel is a curved teardrop. */}
        {/* Group A: blue panels */}
        <path d="M 150 150 C 120 95, 100 50, 80 18 C 50 50, 25 95, 14 150 C 60 138, 110 142, 150 150 Z"
              fill={blue}/>
        <path d="M 150 150 C 200 130, 250 110, 290 92 C 280 60, 258 30, 226 14 C 200 60, 175 105, 150 150 Z"
              fill={blue}/>
        {/* Group B: yellow panels */}
        <path d="M 150 150 C 145 100, 150 50, 158 6 C 192 8, 220 18, 248 36 C 215 78, 182 115, 150 150 Z"
              fill={yellow}/>
        <path d="M 150 150 C 175 195, 200 240, 225 282 C 195 295, 160 298, 128 292 C 138 245, 145 198, 150 150 Z"
              fill={yellow}/>
        {/* Group C: white panels (already body color, draw subtle separations) */}
        {/* Panel seams */}
        <g fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round">
          <path d="M 150 150 C 120 95, 100 50, 80 18"/>
          <path d="M 150 150 C 200 130, 250 110, 290 92"/>
          <path d="M 150 150 C 145 100, 150 50, 158 6"/>
          <path d="M 150 150 C 175 195, 200 240, 225 282"/>
          <path d="M 150 150 C 105 175, 60 195, 18 210"/>
          <path d="M 150 150 C 110 175, 80 215, 60 260"/>
        </g>
        {/* Soft sheen + rim shadow */}
        <circle cx="150" cy="150" r="140" fill={`url(#shade-${id})`}/>
      </g>
      <circle cx="150" cy="150" r="140" fill="none" stroke={ink} strokeWidth="3"/>
    </svg>
  );
}

function StatusDot({status}){
  const map = {
    received:{bg:'var(--ok)',label:'PAID',ink:'#fff', icon:'check-circle-2'},
    sent:{bg:'var(--accent)',label:'SENT',ink:'var(--ink)', icon:'send'},
    pending:{bg:'var(--warn)',label:'OWES',ink:'#fff', icon:'alert-circle'},
  };
  const m = map[status] || map.pending;
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 8px',borderRadius:3,background:m.bg,color:m.ink,border:'1.5px solid var(--ink)',fontFamily:'var(--mono)',fontSize:10,fontWeight:700,letterSpacing:'.1em'}}>
      <Icon name={m.icon} size={11} strokeWidth={2.5}/>
      {m.label}
    </span>
  );
}

function KindBadge({kind, invert}){
  const map = {
    dropin:{label:'DROP-IN', cls:'chip gold'},
    league:{label:'LEAGUE', cls: invert?'chip outline':'chip'},
    tournament:{label:'TOURNAMENT', cls:'chip outline'},
  };
  const m = map[kind] || map.dropin;
  return <span className={m.cls} style={invert?{color:'var(--paper)', borderColor:'var(--paper)'}:{}}>{m.label}</span>;
}

function Header({page, onNav}){
  const [open, setOpen] = React.useState(false);
  const items = [
    {id:'browse', label:'Browse'},
    {id:'host', label:'Host'},
    {id:'roster', label:'My games'},
    {id:'admin', label:'Admin'},
  ];
  return (
    <header style={{borderBottom:'2px solid var(--ink)', background:'var(--bg)', position:'sticky', top:0, zIndex:50}}>
      <div style={{maxWidth:1280, margin:'0 auto', padding:'12px 18px', display:'flex',alignItems:'center',justifyContent:'space-between',gap:14}}>
        <button className="focusable" onClick={()=>{onNav('landing'); setOpen(false);}} style={{appearance:'none',border:0,background:'transparent',cursor:'pointer',padding:0}}>
          <Logo size={16}/>
        </button>
        <nav className="hide-mobile" style={{display:'flex',alignItems:'center',gap:4}}>
          {items.map(it=>(
            <button key={it.id} className="focusable" onClick={()=>onNav(it.id)}
              style={{
                appearance:'none', border:0, background:page===it.id?'var(--ink)':'transparent', color:page===it.id?'var(--paper)':'var(--ink)',
                padding:'9px 14px', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'var(--ui)', whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'.04em'
              }}>
              {it.label}
            </button>
          ))}
        </nav>
        <div className="hide-mobile" style={{display:'flex',alignItems:'center',gap:8}}>
          <button className="btn sm ghost">Sign in</button>
          <button className="btn sm accent" onClick={()=>onNav('browse')}>Find a game</button>
        </div>
        {/* Mobile hamburger */}
        <button onClick={()=>setOpen(o=>!o)} aria-label="Menu"
          style={{display:'none',appearance:'none',border:'2px solid var(--ink)',background:open?'var(--ink)':'var(--accent)',color:open?'var(--accent)':'var(--ink)',width:42,height:42,borderRadius:6,cursor:'pointer',boxShadow:'2px 2px 0 var(--ink)',padding:0,fontSize:18,fontWeight:900}}
          className="show-mobile"><Icon name={open?'x':'menu'} size={20} strokeWidth={2.5}/></button>
        <style>{`@media (max-width:880px){ .show-mobile{display:flex !important;align-items:center;justify-content:center} }`}</style>
      </div>
      {open && (
        <div className="show-mobile" style={{display:'none',borderTop:'2px solid var(--ink)', background:'var(--paper)', padding:'14px 18px'}}>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {items.map(it=>(
              <button key={it.id} onClick={()=>{onNav(it.id);setOpen(false);}}
                style={{appearance:'none',border:'2px solid var(--ink)',padding:'12px 14px',borderRadius:6,fontFamily:'var(--ui)',fontWeight:700,fontSize:14,textAlign:'left',background:page===it.id?'var(--ink)':'var(--paper)',color:page===it.id?'var(--paper)':'var(--ink)',textTransform:'uppercase',letterSpacing:'.04em',cursor:'pointer'}}>
                {it.label}
              </button>
            ))}
            <button className="btn lg accent" onClick={()=>{onNav('browse');setOpen(false);}} style={{marginTop:6}}>Find a game <Icon name="arrow-right" size={16}/></button>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer(){
  return (
    <footer style={{borderTop:'2px solid var(--ink)', background:'var(--ink)', color:'var(--paper)', marginTop:60, position:'relative', overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,opacity:.04,pointerEvents:'none'}}>
        <CourtSVG stroke="var(--paper)" strokeOpacity={1} style={{width:'100%',height:'100%'}}/>
      </div>
      <div style={{maxWidth:1280, margin:'0 auto', padding:'48px 18px 24px', position:'relative'}}>
        <div className="display" style={{fontSize:'clamp(64px, 14vw, 200px)', lineHeight:.85, marginBottom:32, color:'var(--accent)', letterSpacing:'-.04em'}}>
          6IX&nbsp;BACK<span style={{color:'var(--paper)'}}>.</span>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:24}} className="grid grid-3">
          <div>
            <p style={{maxWidth:340, color:'rgba(251,248,241,.7)', fontSize:14, lineHeight:1.55, margin:'0 0 12px'}}>
              Toronto's volleyball switchboard. Drop-ins, leagues, tournaments. Built by players, paid by Interac.
            </p>
            <div className="mono" style={{fontSize:11, letterSpacing:'.12em', color:'var(--accent)'}}>EST. 2026 · TKARONTO</div>
          </div>
          <FootCol title="Play" items={['Drop-ins','Leagues','Tournaments','Skill levels']}/>
          <FootCol title="Host" items={['Create a game','Run a league','Run a tournament','Host playbook']}/>
          <FootCol title="About" items={['Code of conduct','Refunds','Contact','@6ixback']}/>
        </div>
      </div>
      <div style={{borderTop:'1px solid rgba(251,248,241,.2)', padding:'14px 18px', maxWidth:1280, margin:'0 auto', display:'flex',justifyContent:'space-between',color:'rgba(251,248,241,.5)',fontSize:11, flexWrap:'wrap', gap:8}} className="mono">
        <span>© 2026 6IX BACK VOLLEYBALL CO. · CREATED BY EDMEL RICAHUERTA</span>
        <span>INTERAC® E-TRANSFER ONLY · NO CARD FEES EVER</span>
      </div>
    </footer>
  );
}

function SupportBlock(){
  const [copied, setCopied] = React.useState(false);
  const email = 'exricahuerta@gmail.com';
  const message = 'Supporting 6IX BACK → keep it going! 🏐';
  const copy = (txt) => { navigator.clipboard.writeText(txt); setCopied(true); setTimeout(()=>setCopied(false), 1600); };
  return (
    <section style={{borderTop:'2px solid var(--ink)', borderBottom:'2px solid var(--ink)', background:'var(--bg)', position:'relative', overflow:'hidden'}}>
      <div style={{position:'absolute', inset:0, opacity:.3, pointerEvents:'none'}}>
        <CourtSVG stroke="var(--ink)" strokeOpacity={.3} style={{width:'100%', height:'100%'}}/>
      </div>
      <div style={{maxWidth:1280, margin:'0 auto', padding:'48px 18px', position:'relative', display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:32, alignItems:'center'}} className="grid grid-2">
        <div>
          <div className="mono" style={{fontSize:11, letterSpacing:'.16em', color:'var(--ink-2)', fontWeight:700, marginBottom:10, display:'inline-flex', alignItems:'center', gap:6}}><Icon name="heart" size={12}/> SUPPORT THE PLATFORM</div>
          <div className="display" style={{fontSize:'clamp(34px, 6vw, 64px)', lineHeight:.92, letterSpacing:'-.04em', color:'var(--ink)', marginBottom:12}}>
            Send <span className="scribble">$5</span> to keep<br/>6IX BACK <span className="serif-display" style={{fontStyle:'italic', textTransform:'lowercase'}}>on the court.</span>
          </div>
          <p style={{margin:0, color:'var(--ink-2)', fontSize:15, lineHeight:1.55, maxWidth:480}}>
            Built and run solo by <strong style={{color:'var(--ink)'}}>Edmel Ricahuerta</strong>. No ads, no fees, no investors → just Toronto volleyball. If the schedule helped you find a game, throw $5 by Interac.
          </p>
        </div>
        <div className="card" style={{padding:0, overflow:'hidden', background:'var(--paper)', boxShadow:'5px 5px 0 var(--ink)'}}>
          <div style={{padding:'12px 16px', background:'var(--accent)', borderBottom:'2px solid var(--ink)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span className="mono" style={{fontSize:10.5, letterSpacing:'.14em', fontWeight:700}}>INTERAC E-TRANSFER</span>
            <span className="display" style={{fontSize:22, letterSpacing:'-.02em'}}>$5</span>
          </div>
          <div style={{padding:'14px 16px'}}>
            <div className="mono" style={{fontSize:9.5, letterSpacing:'.14em', color:'var(--ink-3)', fontWeight:700, marginBottom:4}}>SEND TO</div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:10}}>
              <span className="mono" style={{fontSize:13, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis'}}>{email}</span>
              <button onClick={()=>copy(email)} className="btn xs"><Icon name={copied?'check':'copy'} size={12}/>{copied?'Copied':'Copy'}</button>
            </div>
            <div className="mono" style={{fontSize:9.5, letterSpacing:'.14em', color:'var(--ink-3)', fontWeight:700, marginBottom:4}}>MESSAGE</div>
            <div style={{fontSize:12.5, color:'var(--ink-2)', marginBottom:10, lineHeight:1.45}}>{message}</div>
            <button onClick={()=>copy(message)} className="btn sm" style={{width:'100%'}}><Icon name="heart" size={13}/> Copy support message</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FootCol({title, items}){
  return (
    <div>
      <div className="condensed" style={{color:'var(--accent)', fontSize:13, fontWeight:700, marginBottom:12}}>{title}</div>
      <ul style={{listStyle:'none',padding:0,margin:0, display:'flex',flexDirection:'column',gap:8, fontSize:13, color:'rgba(251,248,241,.85)'}}>
        {items.map(i=><li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}

// Mobile-first big day stamp
function DayStamp({iso, size='md', invert}){
  const d = window.dayBig(iso);
  const sizes = {sm:{n:24,m:9,p:'8px'}, md:{n:36,m:10,p:'10px'}, lg:{n:54,m:11,p:'14px'}};
  const s = sizes[size];
  return (
    <div style={{textAlign:'center', padding:s.p, border:'2px solid '+(invert?'var(--paper)':'var(--ink)'), borderRadius:6, background:invert?'transparent':'var(--paper)', color:invert?'var(--paper)':'var(--ink)', flexShrink:0, minWidth: size==='lg'?96:size==='md'?72:60}}>
      <div className="mono" style={{fontSize:s.m, letterSpacing:'.12em', fontWeight:700}}>{d.dow}</div>
      <div className="display" style={{fontSize:s.n, lineHeight:.85, margin:'2px 0'}}>{d.num}</div>
      <div className="mono" style={{fontSize:s.m, letterSpacing:'.12em', fontWeight:700}}>{d.mon}</div>
    </div>
  );
}

Object.assign(window, { Logo, SkillDots, CourtSVG, VolleyballMark, MikasaBall, StatusDot, KindBadge, Header, Footer, DayStamp, SupportBlock });
