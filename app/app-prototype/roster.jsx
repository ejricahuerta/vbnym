// Host roster + Interac payment tracking dashboard

function Roster({onNav}){
  const [game, setGame] = React.useState('d1');
  const [roster, setRoster] = React.useState(ROSTER);
  const [filter, setFilter] = React.useState('all');

  const ev = ALL_EVENTS.find(e=>e.id===game) || DROPINS[0];
  const totals = roster.reduce((acc,p)=>{ acc[p.paid]=(acc[p.paid]||0)+1; return acc; }, {});
  const collected = roster.filter(p=>p.paid==='received').length * (ev.price||15);
  const expected = roster.length * (ev.price||15);
  const filtered = filter==='all'?roster:roster.filter(p=>p.paid===filter);

  const setPaid = (id, status) => setRoster(rs => rs.map(p => p.id===id?{...p, paid:status}:p));

  return (
    <div>
      <section style={{borderBottom:'2px solid var(--ink)', background:'var(--ink)', color:'var(--paper)'}}>
        <div style={{maxWidth:1280, margin:'0 auto', padding:'40px 18px'}}>
          <div className="label" style={{marginBottom:10, color:'rgba(251,248,241,.5)'}}>Host dashboard</div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:20, flexWrap:'wrap', marginBottom:32}}>
            <h1 className="display" style={{fontSize:'clamp(40px, 7vw, 76px)', margin:0, letterSpacing:'-.03em'}}>My <span className="serif-display" style={{fontStyle:'italic', textTransform:'lowercase', color:'var(--accent)'}}>roster.</span></h1>
            <div style={{minWidth:240}}>
              <Select value={game} onValueChange={setGame}>
                <SelectTrigger data-tone="dark" style={{height:42}}><SelectValue/></SelectTrigger>
                <SelectContent>
                  {[...DROPINS, ...LEAGUES, ...TOURNAMENTS].map(g=><SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14}} className="grid grid-4">
            <Stat label="Signed up" value={`${roster.length}/${ev.capacity||18}`} accent/>
            <Stat label="Paid" value={totals.received||0} sub={`$${collected} collected`}/>
            <Stat label="Sent" value={totals.sent||0} sub="Confirm in your bank"/>
            <Stat label="Owing" value={totals.pending||0} sub={`$${expected-collected} outstanding`}/>
          </div>
        </div>
      </section>

      <section style={{maxWidth:1280, margin:'0 auto', padding:'28px 18px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:12}}>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            {[
              {id:'all', l:'All', n: roster.length},
              {id:'received', l:'Paid', n: totals.received||0},
              {id:'sent', l:'Sent', n: totals.sent||0},
              {id:'pending', l:'Owing', n: totals.pending||0},
            ].map(t=>(
              <button key={t.id} onClick={()=>setFilter(t.id)} className="focusable"
                style={{
                  appearance:'none', cursor:'pointer', fontFamily:'var(--ui)', fontWeight:700, fontSize:12.5,
                  padding:'8px 12px', borderRadius:6, border:'2px solid var(--ink)',
                  background: filter===t.id?'var(--ink)':'transparent', color: filter===t.id?'var(--paper)':'var(--ink)',
                  textTransform:'uppercase', letterSpacing:'.04em',
                }}>{t.l} <span style={{opacity:.6, fontWeight:500}}>{t.n}</span></button>
            ))}
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <button className="btn sm ghost"><Icon name="clipboard" size={13}/> Copy roster</button>
            <button className="btn sm ghost"><Icon name="send" size={13}/> Message all</button>
            <button className="btn sm"><Icon name="user-plus" size={13}/> Add player</button>
          </div>
        </div>

        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div className="hide-mobile" style={{display:'grid', gridTemplateColumns:'40px 2fr 1.6fr 1fr 1fr 200px', padding:'12px 18px', background:'var(--bg)', borderBottom:'2px solid var(--ink)', fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-2)'}} className="mono">
            <div>#</div><div>Player</div><div>Email</div><div>Reference</div><div>Status</div><div style={{textAlign:'right'}}>Mark as</div>
          </div>
          {filtered.map((p, i) => (
            <div key={p.id} className="roster-row" style={{display:'grid', gridTemplateColumns:'40px 2fr 1.6fr 1fr 1fr 200px', alignItems:'center', padding:'12px 18px', borderBottom: i===filtered.length-1?'none':'1px dashed var(--ink-3)', gap:10}}>
              <div className="mono" style={{fontSize:12, color:'var(--ink-3)', fontWeight:700}}>{String(i+1).padStart(2,'0')}</div>
              <div style={{display:'flex', alignItems:'center', gap:10, minWidth:0}}>
                <div style={{width:32, height:32, borderRadius:'50%', background:'var(--accent)', border:'2px solid var(--ink)', display:'grid', placeItems:'center', fontWeight:900, fontSize:11, fontFamily:'var(--display)', flexShrink:0}}>{p.name.split(' ').map(n=>n[0]).join('')}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.name}</div>
                  <div className="mono" style={{fontSize:10.5, color:'var(--ink-3)', letterSpacing:'.06em', fontWeight:600}}>signed {p.signedAt}</div>
                </div>
              </div>
              <div className="mono" style={{fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.email}</div>
              <div className="mono" style={{fontSize:12, fontWeight:700, letterSpacing:'.06em'}}>{p.ref}</div>
              <div><StatusDot status={p.paid}/></div>
              <div style={{display:'flex', gap:4, justifyContent:'flex-end'}}>
                <button onClick={()=>setPaid(p.id, 'received')} title="Mark paid"
                  className="btn xs" style={{padding:'0 10px', background: p.paid==='received'?'var(--ok)':'var(--ink)', borderColor: p.paid==='received'?'var(--ok)':'var(--ink)', color:'var(--paper)'}}><Icon name="check" size={13} strokeWidth={3}/></button>
                <button onClick={()=>setPaid(p.id, 'sent')} title="Mark sent"
                  className="btn xs ghost" style={{padding:'0 10px', background: p.paid==='sent'?'var(--accent)':'transparent'}}><Icon name="send" size={13}/></button>
                <button onClick={()=>setPaid(p.id, 'pending')} title="Mark owing"
                  className="btn xs ghost" style={{padding:'0 10px', background: p.paid==='pending'?'var(--warn)':'transparent', color: p.paid==='pending'?'var(--paper)':'var(--ink)', borderColor: p.paid==='pending'?'var(--warn)':'var(--ink)'}}><Icon name="alert-circle" size={13}/></button>
                <button className="btn xs ghost" style={{padding:'0 10px'}}><Icon name="more-horizontal" size={13}/></button>
              </div>
            </div>
          ))}
          <style>{`@media (max-width: 900px){ .roster-row { grid-template-columns: 1fr auto !important; gap: 8px !important; } .roster-row > *:nth-child(1), .roster-row > *:nth-child(3), .roster-row > *:nth-child(4) { display: none; } .roster-row > *:nth-child(5) { grid-column: 1 / 2; } .roster-row > *:nth-child(6) { grid-column: 2 / 3; } }`}</style>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:24}} className="grid grid-2">
          <div className="card">
            <div className="label">Auto-reminder template</div>
            <p style={{margin:'4px 0 14px', fontSize:14, lineHeight:1.55, color:'var(--ink-2)'}}>
              "Hey [NAME] → quick reminder to send ${ev.price||15} to <strong>marcus.k@protonmail.com</strong> for {ev.title}. Reference [REF]. See you at {ev.venue.name} on {formatDay(ev.start||ev.startDate||ev.date)}!"
            </p>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              <button className="btn sm">Send to {totals.pending||0} owing</button>
              <button className="btn sm ghost">Edit template</button>
            </div>
          </div>
          <div className="card dark">
            <div className="label" style={{color:'rgba(251,248,241,.5)'}}>This week's intake</div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:8, flexWrap:'wrap', gap:12}}>
              <div>
                <div className="display" style={{fontSize:'clamp(38px, 6vw, 56px)', color:'var(--accent)', lineHeight:.95, letterSpacing:'-.03em'}}>${collected}</div>
                <div className="mono" style={{fontSize:11, color:'rgba(251,248,241,.5)', marginTop:4, letterSpacing:'.12em', fontWeight:700}}>OF ${expected} EXPECTED</div>
              </div>
              <div style={{textAlign:'right', fontSize:13, color:'rgba(251,248,241,.7)'}}>
                <div className="mono" style={{fontSize:10, letterSpacing:'.12em', fontWeight:700}}>LAST RECEIVED</div>
                <div style={{fontWeight:800, color:'var(--paper)', marginTop:2}}>Nadia P. · 12h ago</div>
              </div>
            </div>
            <div style={{height:10, borderRadius:0, background:'rgba(251,248,241,.15)', overflow:'hidden', marginTop:14, border:'1px solid rgba(251,248,241,.3)'}}>
              <div style={{height:'100%', width:`${(collected/expected)*100}%`, background:'var(--accent)'}}/>
            </div>
          </div>
        </div>
      </section>

      <Footer/>
    </div>
  );
}

function Stat({label, value, sub, accent}){
  return (
    <div style={{borderTop:'3px solid '+(accent?'var(--accent)':'var(--paper)'), paddingTop:12}}>
      <div className="mono" style={{fontSize:10.5, letterSpacing:'.12em', color:'rgba(251,248,241,.55)', marginBottom:6, fontWeight:700}}>{label.toUpperCase()}</div>
      <div className="display" style={{fontSize:'clamp(30px, 4.5vw, 44px)', lineHeight:.9, color: accent?'var(--accent)':'var(--paper)', letterSpacing:'-.03em'}}>{value}</div>
      {sub && <div className="mono" style={{fontSize:10.5, color:'rgba(251,248,241,.55)', marginTop:6, letterSpacing:'.06em', fontWeight:600}}>{sub}</div>}
    </div>
  );
}

window.Roster = Roster;
